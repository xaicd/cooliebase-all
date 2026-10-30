/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    // 本仓 UI 的**大头在 packages/**（domains/plugins/shared 的 frontend 层），
    // src/app 只是薄挂载点。只扫 ./src 会漏掉大量只在 packages 里用到的工具类
    // （实测 text-cyan-400 / rounded-2xl / backdrop-blur-xl / lg:grid-cols-12 全未生成），
    // 交付物因此大面积掉样式。
    "./packages/**/frontend/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
