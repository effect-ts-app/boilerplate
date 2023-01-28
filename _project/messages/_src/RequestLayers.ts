import { RequestContext } from "@effect-app/infra/RequestContext"
import { ContextMap } from "@effect-app/infra/services/Store"

export const BasicRequestEnv = (pars: RequestContext) =>
  Effect.gen(function*($) {
    const rc = Context.make(RequestContext.Tag)(pars)

    return pipe(rc, Context.add(ContextMap)(yield* $(ContextMap.Make)))
  })

function makeInternalRequestContext(name: string) {
  const id = StringId.make()
  return new RequestContext({
    id,
    rootId: id,
    locale: "en",
    name: ReasonableString(name)
  })
}

/**
 * @tsplus fluent effect/io/Effect setupNamedRequest
 */
export function setupReq2<R, E, A>(self: Effect<R, E, A>, name: string) {
  return self.setupNamedRequest3(makeInternalRequestContext(name))
}

/**
 * @tsplus fluent effect/io/Effect setupNamedRequest3
 */
export function setupReq3<R, E, A>(self: Effect<R, E, A>, requestContext: RequestContext) {
  return self
    .setupRequestFrom
    .provideSomeContextEffect(BasicRequestEnv(requestContext))
}
