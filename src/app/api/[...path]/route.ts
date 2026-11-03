/**
 * API 未命中统一 404（JSON 契约）—— 层B 交付物反 SPA 兜底假阳性闸。
 *
 * 背景（SOP §6-3 / helloworld9 惨痛教训）：
 *   未命中 /api/* 时 Next 的默认 404 页回 **HTML**（text/html），探针/自动化
 *   健康检查若只看 body 形态就会被"看着像 200 的 SPA 通配兜底"骗过；反之
 *   契约要求「404 必须是 JSON」，否则客户端按 JSON 解析会炸。
 *
 * 为什么放在底座（而不是单个交付工作区）：
 *   层B 交付物是 degit 出来的副本 —— 只改副本不回流，下次孵化照旧复现，
 *   等于缺陷随交付物流转。故契约落在底座源头，所有派生项目自动继承。
 *
 * 判据要点：
 *   - 状态码必须是 404（**不是** 200 兜底）；
 *   - content-type 必须是 application/json；
 *   - body 形状与平台其他 404 保持一致（{ code, error, path }）。
 */
import { NextResponse } from "next/server";

// 该 catch-all 只兜 /api/* 未命中的路径；具体业务路由优先级更高（Next 路由匹配规则）。
export const dynamic = "force-dynamic";

function notFound(path: string): NextResponse {
  return NextResponse.json(
    {
      code: 404,
      error: `API route not found: /api/${path}`,
      path: `/api/${path}`,
    },
    { status: 404, headers: { "content-type": "application/json" } },
  );
}

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ path?: string[] }> },
): Promise<NextResponse> {
  const { path } = await ctx.params;
  return notFound((path ?? []).join("/"));
}

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ path?: string[] }> },
): Promise<NextResponse> {
  const { path } = await ctx.params;
  return notFound((path ?? []).join("/"));
}

export async function PUT(
  _req: Request,
  ctx: { params: Promise<{ path?: string[] }> },
): Promise<NextResponse> {
  const { path } = await ctx.params;
  return notFound((path ?? []).join("/"));
}

export async function PATCH(
  _req: Request,
  ctx: { params: Promise<{ path?: string[] }> },
): Promise<NextResponse> {
  const { path } = await ctx.params;
  return notFound((path ?? []).join("/"));
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ path?: string[] }> },
): Promise<NextResponse> {
  const { path } = await ctx.params;
  return notFound((path ?? []).join("/"));
}
