import type * as Runtime from "effect/Runtime"
import type * as Fiber from "effect/Fiber"
import type { RT } from "./runtime"

declare module "effect/Effect" {
  export interface Effect<R, E, A> {
    get runPromise(this: Effect.Effect<RT, E, A>): Promise<A>
    get runSync(this: Effect.Effect<RT, E, A>): A
    runFork<E, A>(
      this: Effect.Effect<RT, E, A>,
      options?: Runtime.RunForkOptions,
    ): Fiber.RuntimeFiber<E, A>
  }
}
