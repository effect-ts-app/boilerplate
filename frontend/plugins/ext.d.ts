import type * as Runtime from "effect/Runtime"
import type * as Fiber from "effect/Fiber"
import type { RT } from "./runtime"

declare module "effect/Effect" {
  export interface Effect<R, E, A> {
    runPromise<A, E>(this: Effect<A, E, RT>): Promise<A>
    runSync<A, E>(this: Effect<A, E, RT>): A
    runFork<E, A>(
      this: Effect<RT, E, A>,
      options?: Runtime.RunForkOptions,
    ): Fiber.RuntimeFiber<E, A>
  }
}
