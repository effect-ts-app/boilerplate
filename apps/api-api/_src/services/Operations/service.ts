import type { Operation, OperationId, OperationProgress } from "@effect-app-boilerplate/client/Views"

export const OperationsId = Symbol("OperationsId")
export interface Operations extends ServiceTagged<typeof OperationsId> {
  register: Effect<Scope, never, OperationId>
  update: (id: OperationId, progress: OperationProgress) => Effect<never, never, void>
  find: (id: OperationId) => Effect<never, never, Opt<Operation>>
  cleanup: Effect<never, never, void>
}

/**
 * @tsplus type Operations.Ops
 */
export interface OperationsOps extends Tag<Operations> {}

export const Operations: OperationsOps = Tag<Operations>()

/**
 * @tsplus getter effect/io/Effect forkOperation
 */
export function forkOperation<R, E, A>(self: Effect<R, E, A>) {
  return Operations.accessWithEffect(
    Operations =>
      Scope.make()
        .flatMap(scope =>
          Operations.register.extend(scope)
            .tap(() => self.use(scope).forkDaemonReportRequestUnexpected)
        )
  )
}

/**
 * @tsplus getter function forkOperation
 */
export function forkOperationFunction<R, E, A, Inp>(fnc: (inp: Inp) => Effect<R, E, A>) {
  return (inp: Inp) => fnc(inp).forkOperation
}
