import { Cause, Effect, Either, Layer, Tuple } from "@effect-ts-app/core/Prelude"

/**
 * Recovers from all errors.
 * @tsplus fluent ets/Layer catchAll
 */
export function catchAll_<R1, E, E1, Out1, R, Out>(
  self: Layer<R, E, Out>,
  handler: Layer<Tuple<[R1, E]>, E1, Out1>
): Layer<R & R1, E1, Out1 | Out> {
  return Layer.fold(self)(
    Layer.fromRawFunctionM(({ tuple: [r, cause] }: Tuple<[R1, Cause<E>]>) =>
      Either.fold_(
        Cause.failureOrCause(cause),
        e => Effect(Tuple.tuple(r, e)),
        c => Effect.halt(c)
      )
    )[">=>"](handler)
  )(Layer.fromRawEffect(Effect.environment<Out>()))
}

/**
 * Returns a layer with its error channel mapped using the specified
 * function.
 * @tsplus fluent ets/Layer mapError
 */
export function mapError_<E, E1, R, Out>(
  self: Layer<R, E, Out>,
  f: (e: E) => E1
): Layer<R, E1, Out> {
  return catchAll_(self, Layer.fromRawFunctionM((_: Tuple<[unknown, E]>) => Effect.fail(f(_.get(1)))))
}
