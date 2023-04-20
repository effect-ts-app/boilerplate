import { ContextMap } from "@effect-app/infra/services/Store"

export const BasicRequestEnv = Effect.gen(function*($) {
  const rc = Context.make(ContextMap, yield* $(ContextMap.Make))

  return rc
})

/**
 * @tsplus fluent effect/io/Effect setupNamedRequest
 */
export function setupReq2<R, E, A>(self: Effect<R, E, A>, name: string) {
  return self
    .provideSomeContextEffect(BasicRequestEnv)
    .setupRequestFromWith(name)
}
