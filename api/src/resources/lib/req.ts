import { makeClientRouter } from "effect-app/client/router"
import type { Role } from "models/User.js"

export type RequestConfig = {
  /** Disable authentication requirement */
  allowAnonymous?: true
  /** Control the roles that are required to access the resource */
  allowRoles?: readonly Role[]
}

export const Req = makeClientRouter<RequestConfig>()
