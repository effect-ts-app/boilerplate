import type { Role } from "models/User"

import { Req as Req_ } from "@effect-app/schema/REST"

export type RequestConfig = { allowAnonymous?: true; allowedRoles?: readonly Role[] }

export type AllowAnonymous<A> = A extends { allowAnonymous: true } ? true : false

export function Req<C extends RequestConfig>(config?: C) {
  return Req_(config)
}
