/* eslint-disable @typescript-eslint/ban-types */
import { Tagged } from "@effect-ts/core/Case"

export { matchTag } from "@effect-ts/core/Utils"

export class Initial extends Tagged("Initial")<{}> {}

export class Loading extends Tagged("Loading")<{}> {}

export class Refreshing<E, A> extends Tagged("Refreshing")<{
  readonly current: Either<E, A>
  readonly previous: Maybe<A>
}> {
  static succeed<A, E = never>(a: A) {
    return new Refreshing<E, A>({ current: Either.right(a), previous: Maybe.none })
  }
  static fail<E, A = never>(e: E, previous?: A) {
    return new Refreshing<E, A>({
      current: Either.left(e),
      previous: previous === undefined ? Maybe.none : Maybe.some(previous)
    })
  }
  static fromDone<E, A>(d: Done<E, A>) {
    return new Refreshing(d)
  }
}

export class Done<E, A> extends Tagged("Done")<{
  readonly current: Either<E, A>
  readonly previous: Maybe<A>
}> {
  static succeed<A, E = never>(this: void, a: A) {
    return new Done<E, A>({ current: Either.right(a), previous: Maybe.none })
  }
  static fail<E, A = never>(this: void, e: E, previous?: A) {
    return new Done<E, A>({
      current: Either.left(e),
      previous: previous === undefined ? Maybe.none : Maybe.some(previous)
    })
  }

  static refresh<E, A>(d: Done<E, A>) {
    return new Refreshing(d)
  }
}

export type QueryResult<E, A> = Initial | Loading | Refreshing<E, A> | Done<E, A>

type Result<E, A> = Omit<Done<E, A>, "current"> | Omit<Refreshing<E, A>, "current">

export function isSuccess<E, A>(
  qr: QueryResult<E, A>
): qr is Result<E, A> & { current: Either.Right<A> } {
  return (qr._tag === "Done" || qr._tag === "Refreshing") && qr.current._tag === "Right"
}

export function isFailed<E, A>(
  qr: QueryResult<E, A>
): qr is Result<E, A> & { current: Either.Left<E> } {
  return (qr._tag === "Done" || qr._tag === "Refreshing") && qr.current._tag === "Left"
}

export type ResultTuple<Result> = readonly [result: Result, refresh: () => void]
export type QueryResultTuple<E, A> = ResultTuple<QueryResult<E, A>>

export const { fail, succeed } = Done

export function queryResult<R, E, A>(
  self: Effect<R, E, A>
): Effect<R, never, QueryResult<E, A>> {
  return pipe(self, Effect.fold(fail, succeed))
}
