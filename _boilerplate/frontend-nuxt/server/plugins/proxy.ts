import * as cookie from "cookie"

import httpProxy from "http-proxy" // make sure to use package redirect to "http-proxy-node16" for fixing closing event: https://github.com/http-party/node-http-proxy/pull/1559

export default defineNitroPlugin(nitroApp => {
  const config = useRuntimeConfig()
  const apiProxy = httpProxy.createProxyServer({
    changeOrigin: true, // don't forget this, or you're going to chase your tail for hours
    target: config.apiRoot,
  })

  apiProxy.on("proxyReq", (proxyReq, _req, res, _options) => {
    proxyReq.path = proxyReq.path.replace("/api", "")
    const cookieHeader = proxyReq.getHeader("Cookie")
    if (!cookieHeader || typeof cookieHeader !== "string") return

    const cookies = cookie.parse(cookieHeader)
    const userId = cookies["user-id"]
    if (userId) {
      proxyReq.setHeader("x-user", JSON.stringify({ sub: userId }))
    }
    res.setHeader("x-fe-version", config.public.feVersion)
  })

  nitroApp.h3App.stack.unshift({
    route: "/api",
    handler: fromNodeMiddleware((req, res, _) => {
      apiProxy.web(req, res)
    }),
  })
})
