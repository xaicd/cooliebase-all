import { createSSRApp } from "vue"
import App from "./App.vue"

export function createApp() {
  const app = createSSRApp(App)
  return { app }
}

if (typeof document !== "undefined" && document.getElementById("app")) {
  createApp().app.mount("#app")
}
