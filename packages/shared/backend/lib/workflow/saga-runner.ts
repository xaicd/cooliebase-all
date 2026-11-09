/**
 * 轻量级 TypeScript 原生可逆 Saga / Workflow 补偿事务运行器（对标 MedusaJS v2 Workflows SDK）
 *
 * 核心语义：
 * - 每个 Step 声明正向执行函数 `run(ctx)` 与可选逆向冲正补偿函数 `compensate(output, ctx)`；
 * - 按声明顺序依次执行 `step.run`，每步完成后持久化内存/上下文检查点（Checkpoint）；
 * - 若第 k 步 `run` 抛出异常，自动按逆序（k-1 -> ... -> 0）依次执行已完成步骤的 `compensate`；
 * - 保证跨表/跨域长流程（如下单扣库存 -> 核销优惠券 -> 创建支付单 -> 触发通知）的最终一致性。
 */

export interface SagaStepCheckpoint<TOutput = unknown> {
  stepName: string
  status: "completed" | "failed" | "compensated"
  output?: TOutput
  startedAt: string
  finishedAt: string
  errorMessage?: string
}

export interface SagaExecutionContext<TInput = Record<string, unknown>> {
  workflowName: string
  input: TInput
  stepOutputs: Record<string, unknown>
  checkpoints: SagaStepCheckpoint[]
}

export interface SagaStepDefinition<TInput = Record<string, unknown>, TOutput = unknown> {
  name: string
  run: (ctx: SagaExecutionContext<TInput>) => Promise<TOutput> | TOutput
  compensate?: (output: TOutput, ctx: SagaExecutionContext<TInput>) => Promise<void> | void
}

export interface SagaExecutionResult<TInput = Record<string, unknown>> {
  workflowName: string
  status: "completed" | "compensated" | "compensation_failed"
  completedSteps: string[]
  compensatedSteps: string[]
  failedStep?: string
  error?: string
  compensationError?: string
  stepOutputs: Record<string, unknown>
  checkpoints: SagaStepCheckpoint[]
  input: TInput
}

export function defineSagaWorkflow<TInput = Record<string, unknown>>(
  workflowName: string,
  steps: Array<SagaStepDefinition<TInput, any>>,
) {
  return {
    workflowName,
    steps,
    async execute(input: TInput): Promise<SagaExecutionResult<TInput>> {
      const ctx: SagaExecutionContext<TInput> = {
        workflowName,
        input,
        stepOutputs: {},
        checkpoints: [],
      }

      const executed: Array<{ step: SagaStepDefinition<TInput, any>; output: unknown }> = []
      const completedSteps: string[] = []
      const compensatedSteps: string[] = []

      for (const step of steps) {
        const startedAt = new Date().toISOString()
        try {
          const output = await step.run(ctx)
          ctx.stepOutputs[step.name] = output
          executed.push({ step, output })
          completedSteps.push(step.name)
          ctx.checkpoints.push({
            stepName: step.name,
            status: "completed",
            output,
            startedAt,
            finishedAt: new Date().toISOString(),
          })
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : String(err)
          ctx.checkpoints.push({
            stepName: step.name,
            status: "failed",
            startedAt,
            finishedAt: new Date().toISOString(),
            errorMessage,
          })

          // 逆序执行补偿事务 (Reverse Compensation)
          for (let i = executed.length - 1; i >= 0; i -= 1) {
            const prev = executed[i]
            if (!prev.step.compensate) continue
            const compStart = new Date().toISOString()
            try {
              await prev.step.compensate(prev.output, ctx)
              compensatedSteps.push(prev.step.name)
              ctx.checkpoints.push({
                stepName: prev.step.name,
                status: "compensated",
                startedAt: compStart,
                finishedAt: new Date().toISOString(),
              })
            } catch (compErr) {
              return {
                workflowName,
                status: "compensation_failed",
                completedSteps,
                compensatedSteps,
                failedStep: step.name,
                error: errorMessage,
                compensationError: compErr instanceof Error ? compErr.message : String(compErr),
                stepOutputs: ctx.stepOutputs,
                checkpoints: ctx.checkpoints,
                input,
              }
            }
          }

          return {
            workflowName,
            status: "compensated",
            completedSteps,
            compensatedSteps,
            failedStep: step.name,
            error: errorMessage,
            stepOutputs: ctx.stepOutputs,
            checkpoints: ctx.checkpoints,
            input,
          }
        }
      }

      return {
        workflowName,
        status: "completed",
        completedSteps,
        compensatedSteps,
        stepOutputs: ctx.stepOutputs,
        checkpoints: ctx.checkpoints,
        input,
      }
    },
  }
}
