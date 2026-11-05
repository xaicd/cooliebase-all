/**
 * src/lib/base-path.ts
 *
 * CoolieBase 蓝图底座 —— 全局 BasePath 契约与资源路径解析源头守卫
 *
 * 核心目标与防线：
 * 1. 【严防根路径裸奔】：保证所有 fetch/<a>/<img> 资源的相对路径统一经过 basePath 包装；
 * 2. 【双端一致性】：兼容服务端 SSR (process.env.NEXT_PUBLIC_BASE_PATH / BASE_PATH) 与客户端浏览器路径识别；
 * 3. 【防重复斜杠】：对 //、/、空路径等边界输入进行规范化清洗。
 */

export function getBasePath(): string {
  const envPath =
    typeof process !== "undefined"
      ? (process.env.NEXT_PUBLIC_BASE_PATH || process.env.BASE_PATH || process.env.PREVIEW_BASE_PATH || "")
      : "";
  if (envPath && envPath !== "/") {
    return "/" + envPath.replace(/^\/+/, "").replace(/\/+$/, "");
  }
  return "";
}

/**
 * 将相对根路径补齐当前项目的 basePath 前缀
 * @example
 * withBasePath("/2c") => "/cosmetics-mall-cb/2c"
 * withBasePath("/api/v1/meta") => "/cosmetics-mall-cb/api/v1/meta"
 * withBasePath("https://example.com/logo.png") => "https://example.com/logo.png"
 */
export function withBasePath(targetPath: string): string {
  if (!targetPath) return getBasePath() || "/";
  // 外部绝对 URL 或相对锚点不做前缀补充
  if (/^(https?:|\/\/|mailto:|tel:|#)/i.test(targetPath)) {
    return targetPath;
  }

  const base = getBasePath();
  if (!base) {
    return targetPath.startsWith("/") ? targetPath : "/" + targetPath;
  }

  // 若已经是带了 basePath 前缀的路径，不重复添加
  if (targetPath === base || targetPath.startsWith(base + "/")) {
    return targetPath;
  }

  const cleanPath = targetPath.startsWith("/") ? targetPath : "/" + targetPath;
  return `${base}${cleanPath}`;
}
