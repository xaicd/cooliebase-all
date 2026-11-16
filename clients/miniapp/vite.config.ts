import path from "node:path"
import { defineConfig, loadEnv } from "vite"
import vue from "@vitejs/plugin-vue"

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "")
  const rawBase = (env.VITE_BASE_PATH || env.BASE_PATH || "").trim()
  const normalizedBase =
    !rawBase || rawBase === "/" ? "./" : `/${rawBase.replace(/^\/+|\/+$/g, "")}/miniapp/`

  return {
    base: normalizedBase,
    plugins: [vue()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"),
      },
    },
    build: {
      outDir: "dist",
      emptyOutDir: true,
      target: "es2020",
    },
  }
})
