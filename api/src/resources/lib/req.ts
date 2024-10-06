import { NotLoggedInError, UnauthorizedError } from "@effect-app/infra/errors"
import { Duration, Effect, HashMap, Layer, Option, Request as EffectRequest } from "effect-app"
import { ApiConfig } from "effect-app/client"
import { HttpClient, HttpClientRequest } from "effect-app/http"
import type { UserProfileId } from "effect-app/ids"
import type { Role } from "models/User.js"
import type { ContextMapCustom, ContextMapInverted } from "./DynamicMiddleware.js"
import { makeRpcClient } from "./DynamicMiddleware.js"

// TODO: this shouldn't be in client area but api area
type UserProfile = {
  id: UserProfileId
  roles: Role[]
}
export type CTXMap = {
  allowAnonymous: ContextMapInverted<"userProfile", UserProfile, typeof NotLoggedInError>
  // TODO: not boolean but `string[]`
  requireRoles: ContextMapCustom<"", void, typeof UnauthorizedError, Array<string>>
}

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

export const apiClient = Effect.gen(function*() {
  const client = yield* HttpClient.HttpClient
  const config = yield* ApiConfig.Tag
  return client.pipe(
    HttpClient.mapRequest(HttpClientRequest.prependUrl(config.apiUrl + "/rpc")),
    HttpClient.mapRequest(
      HttpClientRequest.setHeaders(config.headers.pipe(Option.getOrElse(() => HashMap.empty())))
    )
  )
})

export const RequestCacheLayers = Layer.mergeAll(
  Layer.setRequestCache(
    EffectRequest.makeCache({ capacity: 500, timeToLive: Duration.hours(8) })
  ),
  Layer.setRequestCaching(true),
  Layer.setRequestBatching(true)
)
