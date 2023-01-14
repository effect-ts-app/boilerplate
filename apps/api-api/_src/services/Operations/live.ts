import type { OperationProgress } from "@effect-ts-app/boilerplate-client/Views"
import { Failure, Operation, OperationId, Success } from "@effect-ts-app/boilerplate-client/Views"
import { RequestException } from "@effect-ts-app/boilerplate-infra/lib/api/reportError"
import { reportError } from "@effect-ts-app/boilerplate-infra/lib/errorReporter"
import { Operations } from "./service.js"

const reportAppError = reportError(cause => new RequestException(cause))

export const CleanupTag = Tag<never>()

/**
 * @tsplus static Operations.Ops Live
 */
export const Live = Effect.sync(() => {
  const ops = new Map<OperationId, Operation>()
  const makeOp = Effect.sync(() => OperationId.make())

  const cleanup = Effect.sync(() => {
    const before = new Date().subHours(1)
    ops.entries().toChunk.forEach(([id, op]) => {
      const lastChanged = Opt.fromNullable(op.updatedAt).getOrElse(() => op.createdAt)
      if (lastChanged < before) {
        ops.delete(id)
      }
    })
  })

  function addOp(id: OperationId) {
    return Effect.sync(() => {
      ops.set(id, new Operation({ id }))
    })
  }
  function findOp(id: OperationId) {
    return Effect.sync(() => Opt.fromNullable(ops.get(id)))
  }
  function finishOp(id: OperationId, exit: Exit<unknown, unknown>) {
    return findOp(id).flatMap(_ =>
      Effect.sync(() => {
        if (_.isNone()) {
          throw new Error("Not found")
        }
        ops.set(id, {
          ..._.value,
          updatedAt: new Date(),
          result: exit.isSuccess()
            ? new Success({})
            : new Failure({
              message: exit.cause.isInterrupted()
                ? LongString("Interrupted")
                : exit.cause.isDie()
                ? LongString("Unknown error")
                : exit.cause.failureOption.flatMap(_ =>
                  typeof _ === "object" && _ !== null && "message" in _ && LongString.Guard(_.message)
                    ? Opt.some(_.message)
                    : Opt.none
                )?.value ?? null
            })
        })
      })
    )
  }
  function update(id: OperationId, progress: OperationProgress) {
    return findOp(id).flatMap(_ =>
      Effect.sync(() => {
        if (_.isNone()) {
          throw new Error("Not found")
        }
        ops.set(id, { ..._.value, updatedAt: new Date(), progress })
      })
    )
  }
  return Operations.make({
    cleanup,
    register: makeOp
      .tap(id =>
        Effect.logAnnotateScoped("operationId", id)
          > addOp(id).acquireRelease(
            (_, exit) => finishOp(id, exit)
          )
      ),

    find: findOp,
    update
  })
}).toLayer(Operations)
  > CleanupTag.scoped(
    Operations.withEffect(_ => _.cleanup).exit.flatMap(_ => {
      if (_.isSuccess()) {
        return Effect.unit
      } else {
        return reportAppError(_.cause)
      }
    })
      .delay(DUR.minutes(1))
      .forever
      .forkScoped
      .map(_ => _ as never)
  )
