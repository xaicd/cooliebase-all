import { mkdtemp, readFile } from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import { deleteLocalFile, putLocalFile, resolveFileStorageDir } from "../file-storage"

describe("local file storage", () => {
  const previous = process.env.FILE_STORAGE_DIR

  afterEach(() => {
    if (previous === undefined) delete process.env.FILE_STORAGE_DIR
    else process.env.FILE_STORAGE_DIR = previous
  })

  it("writes and deletes objects under the configured directory", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "cooliebase-files-"))
    process.env.FILE_STORAGE_DIR = dir
    expect(resolveFileStorageDir()).toBe(path.resolve(dir))
    const stored = await putLocalFile({ key: "2026/08/demo.txt", bytes: Buffer.from("hello") })
    expect(stored.size).toBe(5)
    expect(await readFile(path.join(dir, stored.path), "utf8")).toBe("hello")
    await deleteLocalFile(stored.path)
  })

  it("rejects path traversal", async () => {
    await expect(putLocalFile({ key: "../secret.txt", bytes: Buffer.from("x") })).rejects.toThrow("文件路径不合法")
  })
})
