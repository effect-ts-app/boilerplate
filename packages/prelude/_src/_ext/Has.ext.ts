import type { Tag } from "@effect-ts-app/core/Prelude"

import { Effect } from "../index.js"

/**
 * @tsplus getter ets/Tag get
 */
export function get<T>(self: Tag<T>) {
  return Effect.accessService(self)(_ => _)
}

/**
 * @tsplus getter ets/Tag get2
 */
export function get2<T>(_: Tag<T>) {
  return Effect.access((env: Has<T>) => env)
}

/**
 * @tsplus getter ets/Tag access
 */
export function access<T>(self: Tag<T>) {
  return Effect.accessService(self)
}

/**
 * @tsplus getter ets/Tag accessM
 */
export function accessM<T>(self: Tag<T>) {
  return Effect.accessServiceM(self)
}

/**
 * @tsplus fluent ets/Tag accessM_
 */
export function accessM_<T, R, E, A>(self: Tag<T>, f: (x: T) => Effect<R, E, A>) {
  return Effect.accessServiceM(self)(f)
}

/**
 * @tsplus fluent ets/Tag access_
 */
export function access_<T, B>(self: Tag<T>, f: (x: T) => B) {
  return Effect.accessService(self)(f)
}
