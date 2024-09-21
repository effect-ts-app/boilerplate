import type { Role } from "models/User.js"
import { makeClientRouter } from "./clientRouter.js"

export type RequestConfig = { allowAnonymous?: true; allowedRoles?: readonly Role[] }

export type AllowAnonymous<A> = A extends { allowAnonymous: true } ? true : false

export const Req = makeClientRouter<RequestConfig>()
