// const config = useRuntimeConfig()
// const baseURL = config.metisBaseUrl

// export default defineEventHandler(async event => {
//   const method = useMethod(event)
//   const params = useQuery(event)
//   const body = method === "GET" ? undefined : await useBody(event)

//   return await $fetch(event.req.url, {
//     headers: {
//       "Content-Type": "application/json"
//     },
//     baseURL,
//     method,
//     params,
//     body
//   })
// })

import * as cookie from "cookie"
import httpProxy from "http-proxy"

const proxy = httpProxy.createProxyServer({
  target: process.env.API_ROOT || "http://127.0.0.1:3651", // change to your backend api url
  changeOrigin: true
})

proxy.on("proxyReq", (proxyReq, req, res, options) => {
  proxyReq.path = proxyReq.path.replace("/api", "")

  const cookieHeader = proxyReq.getHeader("Cookie")
  if (!cookieHeader || (typeof cookieHeader !== "string")) return

  const cookies = cookie.parse(cookieHeader)
  const userId = cookies["user-id"]
  if (userId) {
    proxyReq.setHeader("x-user", JSON.stringify({ sub: userId }))
  }
})

export default defineEventHandler(event => {
  return new Promise(resolve => {
    const options = {}

    // eslint-disable-next-line @typescript-eslint/unbound-method
    const origEnd = event.res.end as any
    event.res.end = function() {
      resolve(null)
      return origEnd.call(event.res)
    }

    proxy.web(event.req, event.res, options) // proxy.web() works asynchronously
  })
})
