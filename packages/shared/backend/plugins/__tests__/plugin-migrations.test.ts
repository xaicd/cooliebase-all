import { describe, expect, it } from "vitest"

import { assertMigrationSqlSafe, isTrustedPlugin, pluginSchemaName } from "../plugin-migrations"

describe("插件自带迁移：安全护栏", () => {
  it("schema 名对插件 key 做安全归一（只留 [a-z0-9_]）", () => {
    expect(pluginSchemaName("cooliebase.hello-world")).toBe("plugin_cooliebase_hello_world")
    expect(pluginSchemaName("Vendor/Evil;DROP")).toBe("plugin_vendor_evil_drop")
    // 长度收紧，避免超出 Postgres 标识符上限
    expect(pluginSchemaName("a".repeat(200)).length).toBeLessThanOrEqual(60)
  })

  it("允许普通的建表/写数据语句（未限定 schema，会落在插件自己的 schema 里）", () => {
    expect(() =>
      assertMigrationSqlSafe("CREATE TABLE IF NOT EXISTS t (id TEXT PRIMARY KEY);\nINSERT INTO t (id) VALUES ('1');"),
    ).not.toThrow()
  })

  it.each([
    ["DROP SCHEMA public", /DROP SCHEMA/],
    ["SET search_path TO public", /search_path/],
    ["SELECT * FROM public.system_user", /public schema/],
    ["DROP TABLE public.system_user", /public schema/],
    ["GRANT ALL ON t TO someone", /GRANT/],
    ["CREATE EXTENSION pgcrypto", /扩展/],
    ["ALTER SYSTEM SET fsync = off", /ALTER SYSTEM/],
    ["COPY t FROM PROGRAM 'curl evil'", /COPY/],
    ["DELETE FROM pg_catalog.pg_class", /系统目录/],
  ])("拒绝越界语句: %s", (sql, _reason) => {
    expect(() => assertMigrationSqlSafe(sql)).toThrow(/插件迁移被拒绝/)
  })

  it("注释里出现的敏感字样不误报（只检查可执行 SQL）", () => {
    expect(() =>
      assertMigrationSqlSafe("-- 不要写 public.xxx，也别说 DROP SCHEMA\nCREATE TABLE t (id TEXT);"),
    ).not.toThrow()
    expect(() =>
      assertMigrationSqlSafe("/* 说明: GRANT 是禁止的 */\nCREATE TABLE t (id TEXT);"),
    ).not.toThrow()
    // 但真语句仍然拦得住
    expect(() => assertMigrationSqlSafe("CREATE TABLE t (id TEXT);\nDROP SCHEMA public;")).toThrow()
  })

  it("信任只认运营配置，manifest 不能自封", () => {
    expect(isTrustedPlugin("vendor.a", { COOLIEBASE_TRUSTED_PLUGIN_KEYS: "vendor.a,vendor.b" } as never)).toBe(true)
    expect(isTrustedPlugin("vendor.c", { COOLIEBASE_TRUSTED_PLUGIN_KEYS: "vendor.a,vendor.b" } as never)).toBe(false)
    expect(isTrustedPlugin("vendor.a", {} as never)).toBe(false)
  })
})
