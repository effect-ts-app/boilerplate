import * as cookie from "cookie"
import process from "process"

// https://v3.nuxtjs.org/api/configuration/nuxt.config
export default defineNuxtConfig({
  css: ["vuetify/lib/styles/main.sass"],
  build: {
    transpile: ["vuetify"]
      // workaround for commonjs/esm module prod issue
      // https://github.com/nuxt/framework/issues/7698
      .concat(process.env.NODE_ENV === "production" ? ["vue-toastification"] : [])
  },
  runtimeConfig: {
    basicAuthCredentials: ""
  },
  modules: [
    "@vueuse/nuxt"
  ],
  vite: {
    // plugins: [tsPlugin({ exclude: ["plugin"] })],
    server: {
      proxy: {
        "/api": {
          target: "http://127.0.0.1:3651",
          rewrite: (path: string) => path.replace(/^\/api/, ""),
          changeOrigin: true,
          secure: false,
          configure: p =>
            p.on("proxyReq", (req, res) => {
              const cookieHeader = req.getHeader("Cookie")
              if (!cookieHeader || (typeof cookieHeader !== "string")) return

              const cookies = cookie.parse(cookieHeader)
              const userId = cookies["user-id"]
              if (userId) {
                req.setHeader("x-user", JSON.stringify({ sub: userId }))
              }
            })
        }
      }
    }
  }
})
