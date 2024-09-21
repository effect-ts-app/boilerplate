import { makeClientRouter } from "effect-app/client/router"
import type { Role } from "models/User.js"

export type RequestConfig = { allowAnonymous?: true; allowedRoles?: readonly Role[] }

export const Req = makeClientRouter<RequestConfig>()
