import { NotLoggedInError, UnauthorizedError } from "@effect-app/infra/errors"
import { type CTXMap } from "api/lib/routing.js"
import type { Role } from "models/User.js"
import { makeRpcClient } from "./DynamicMiddleware.js"

export type RequestConfig = {
  /** Disable authentication requirement */
  allowAnonymous?: true
  /** Control the roles that are required to access the resource */
  allowRoles?: readonly Role[]
}

export const { TaggedRequest: Req } = makeRpcClient<RequestConfig, CTXMap>({
  allowAnonymous: NotLoggedInError,
  requireRoles: UnauthorizedError
})
