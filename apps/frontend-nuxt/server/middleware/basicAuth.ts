import type { IncomingMessage } from "http"

export default defineEventHandler(event => {
  const config = useRuntimeConfig()
  const base64Credentials = event.req.headers?.authorization?.split(" ")?.[1]

  const { originalUrl } = event.req as IncomingMessageExtended

  let allow = !config.basicAuthCredentials || originalUrl?.startsWith("/api/") ||
    originalUrl === "/api" || false
  if (!allow && base64Credentials) {
    const credentials = Buffer.from(base64Credentials, "base64").toString("ascii")

    const [username, password] = credentials.split(":")
    const [requiredUserName, requiredPassword] = config.basicAuthCredentials.split(":")

    allow = username === requiredUserName && password === requiredPassword
  }

  if (!allow) {
    event.res.statusCode = 401
    event.res.setHeader("WWW-Authenticate", "Basic realm=\"boilerplate\"")
    event.res.end("Unauthorized")
  }
})

interface IncomingMessageExtended extends IncomingMessage {
  originalUrl?: string
}
