/**
 * Plugin Worker 运行时。
 *
 * 进程模型：**一插件一 worker 进程**，host↔worker 走 stdio 逐行 JSON-RPC。
 * 这是 Plugin 与 Platform Module 的根本分野 —— 插件代码不跑在宿主进程里，
 * 因此单个插件崩溃/挂死不会带走核心服务（失败隔离）。
 *
 * 本文件只做进程与协议；不解释业务语义。
 */
import { type ChildProcessWithoutNullStreams, spawn } from "node:child_process"
import { existsSync } from "node:fs"

import {
  decodeMessages,
  encodeMessage,
  WORKER_LIMITS,
  type JsonRpcMessage,
  type WorkerHealthResult,
  type WorkerInitializeInput,
} from "./worker-protocol"

type Pending = {
  resolve: (value: unknown) => void
  reject: (error: Error) => void
  timer: ReturnType<typeof setTimeout>
  method: string
}

export class PluginWorker {
  private child?: ChildProcessWithoutNullStreams
  private buffer = ""
  private stderrTail = ""
  private nextId = 1
  private readonly pending = new Map<number, Pending>()
  private exitReason: string | null = null
  // 注意: 不能写成 `typeof WORKER_LIMITS` —— 那是 as const 字面量类型,
  // 会让 request() 的默认参数被推成字面量 15000, 于是传别的时限就报类型错。
  // 这里把各字段放宽为 number。
  private readonly limits: Record<keyof typeof WORKER_LIMITS, number>

  constructor(
    readonly pluginKey: string,
    private readonly workerPath: string,
    private readonly cwd: string,
    limits: Partial<typeof WORKER_LIMITS> = {},
  ) {
    // 时限可注入：停机限期本就该可按插件配置；测试也需要用短时限
    // 才能覆盖"阶梯升级"这条路径，而不必让整个测试套件等满 15 秒。
    this.limits = { ...WORKER_LIMITS, ...limits }
  }

  get diagnostics(): { pid: number | undefined; exitReason: string | null; stderrTail: string } {
    return { pid: this.child?.pid, exitReason: this.exitReason, stderrTail: this.stderrTail }
  }

  get running(): boolean {
    return Boolean(this.child) && this.exitReason === null
  }

  /** 启动进程并完成 initialize。任一环节失败都抛出，由调用方标记该插件 error。 */
  async start(initialize: WorkerInitializeInput): Promise<void> {
    if (!existsSync(this.workerPath)) {
      throw new Error(`worker 入口不存在: ${this.workerPath}`)
    }

    this.child = spawn(process.execPath, [this.workerPath], {
      cwd: this.cwd,
      stdio: ["pipe", "pipe", "pipe"],
      env: { ...process.env, COOLIEBASE_PLUGIN_KEY: this.pluginKey },
    }) as ChildProcessWithoutNullStreams

    this.child.stdout.setEncoding("utf8")
    this.child.stderr.setEncoding("utf8")
    this.child.stdout.on("data", (chunk: string) => this.consume(chunk))
    this.child.stderr.on("data", (chunk: string) => {
      // 有界保留尾部：诊断需要它，但不能无界增长
      this.stderrTail = `${this.stderrTail}${chunk}`.slice(-this.limits.stderrTailChars)
    })
    this.child.on("error", (error) => this.failAll(new Error(`worker 进程错误: ${error.message}`)))
    this.child.on("exit", (code, signal) => {
      this.exitReason = `exit code=${code ?? "null"} signal=${signal ?? "none"}`
      this.failAll(new Error(`worker 进程已退出 (${this.exitReason})`))
    })

    // initialize 必须成功，否则这个 worker 不合格
    await this.request("initialize", initialize, this.limits.initializeTimeoutMs)
  }

  /** health()。 */
  async health(): Promise<WorkerHealthResult> {
    const result = (await this.request("health", undefined)) as WorkerHealthResult | undefined
    if (!result || typeof result.status !== "string") {
      throw new Error("health() 返回形状不合法：缺少 status")
    }
    return result
  }

  /** 通用 RPC。超时即拒绝 —— 一个不响应的 worker 绝不能挂住宿主。 */
  async request(method: string, params: unknown, timeoutMs = this.limits.requestTimeoutMs): Promise<unknown> {
    if (!this.child || this.exitReason !== null) {
      throw new Error(`worker 不可用 (${this.exitReason ?? "未启动"})`)
    }
    const id = this.nextId++
    const payload = encodeMessage({ jsonrpc: "2.0", id, method, params })

    return new Promise<unknown>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id)
        reject(new Error(`worker 未在 ${timeoutMs}ms 内响应 ${method}()`))
      }, timeoutMs)
      this.pending.set(id, { resolve, reject, timer, method })
      this.child!.stdin.write(payload, (error) => {
        if (error) {
          const entry = this.pending.get(id)
          if (entry) {
            clearTimeout(entry.timer)
            this.pending.delete(id)
            reject(new Error(`写入 worker stdin 失败: ${error.message}`))
          }
        }
      })
    })
  }

  /**
   * 停机阶梯：
   *   1. shutdown()
   *   2. 等 worker 自行退出（gracefulShutdownMs）
   *   3. 未退出 → SIGTERM，再等 sigtermGraceMs
   *   4. 仍未退出 → SIGKILL
   * 无论走到哪一步都不抛 —— 停机路径不该再产生新的失败面。
   */
  async stop(): Promise<void> {
    const child = this.child
    if (!child || this.exitReason !== null) return

    try {
      await this.request("shutdown", undefined, this.limits.gracefulShutdownMs)
    } catch {
      // shutdown 未响应不是错误：下面的阶梯会接手
    }

    if (await this.waitForExit(this.limits.gracefulShutdownMs)) return

    child.kill("SIGTERM")
    if (await this.waitForExit(this.limits.sigtermGraceMs)) return

    child.kill("SIGKILL")
    await this.waitForExit(this.limits.sigtermGraceMs)
  }

  private waitForExit(timeoutMs: number): Promise<boolean> {
    if (!this.child || this.exitReason !== null) return Promise.resolve(true)
    return new Promise((resolve) => {
      const timer = setTimeout(() => resolve(false), timeoutMs)
      this.child!.once("exit", () => {
        clearTimeout(timer)
        resolve(true)
      })
    })
  }

  private consume(chunk: string): void {
    const { messages, rest } = decodeMessages(this.buffer + chunk)
    this.buffer = rest
    for (const message of messages) this.settle(message)
  }

  private settle(message: JsonRpcMessage): void {
    const entry = this.pending.get(message.id)
    if (!entry) return
    clearTimeout(entry.timer)
    this.pending.delete(message.id)
    if ("error" in message && message.error) {
      entry.reject(new Error(`worker ${entry.method}() 失败: ${message.error.message}`))
      return
    }
    entry.resolve((message as { result?: unknown }).result)
  }

  private failAll(error: Error): void {
    for (const [, entry] of this.pending) {
      clearTimeout(entry.timer)
      entry.reject(error)
    }
    this.pending.clear()
  }
}

/**
 * 多插件 worker 池。失败隔离在**这里**体现：单个 worker 的任何异常只影响它自己，
 * 不遍历、不连带其它 worker（do not drop other plugins or core services）。
 */
export class PluginWorkerManager {
  private readonly workers = new Map<string, PluginWorker>()

  get(pluginKey: string): PluginWorker | undefined {
    return this.workers.get(pluginKey)
  }

  /** 启动（或替换）某插件的 worker。失败时清理该插件自己的句柄后抛出。 */
  async start(pluginKey: string, workerPath: string, cwd: string, initialize: WorkerInitializeInput): Promise<PluginWorker> {
    await this.stop(pluginKey)
    const worker = new PluginWorker(pluginKey, workerPath, cwd)
    try {
      await worker.start(initialize)
    } catch (error) {
      await worker.stop()
      throw error
    }
    this.workers.set(pluginKey, worker)
    return worker
  }

  async stop(pluginKey: string): Promise<void> {
    const worker = this.workers.get(pluginKey)
    if (!worker) return
    this.workers.delete(pluginKey)
    await worker.stop()
  }

  async stopAll(): Promise<void> {
    for (const key of [...this.workers.keys()]) await this.stop(key)
  }

  list(): string[] {
    return [...this.workers.keys()]
  }
}

export const pluginWorkerManager = new PluginWorkerManager()
