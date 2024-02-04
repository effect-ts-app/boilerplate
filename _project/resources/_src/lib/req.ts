import { Req as Req_ } from "@effect-app/schema/REST"
import type { RequestConfig } from "./configure.js"

export function Req<C extends RequestConfig>(config?: C) {
  return Req_(config)
}
