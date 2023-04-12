import { clientFor, type FetchResponse } from "@effect-app/prelude/client"
import * as OperationsRsc from "../Operations.js"
import type { Operation, OperationId } from "../Views.js"

const opsClient = clientFor(OperationsRsc)

export function refreshAndWaitAForOperationP<R, E>(
  act: Effect<R, E, FetchResponse<OperationId>>,
  refresh: () => Promise<void>,
  cb?: (op: Operation) => void
) {
  return refreshAndWaitAForOperation(act, Effect.promise(refresh), cb)
}

export function refreshAndWaitAForOperation<R2, E2, A2, R, E>(
  act: Effect<R, E, FetchResponse<OperationId>>,
  refresh: Effect<R2, E2, A2>,
  cb?: (op: Operation) => void
) {
  return waitForOperation(
    act
      .tap(() => refresh),
    cb
  )
    .tap(() => refresh)
}

export function refreshAndWaitForOperationP<Req, R, E>(
  act: (req: Req) => Effect<R, E, FetchResponse<OperationId>>,
  refresh: () => Promise<void>
) {
  return refreshAndWaitForOperation(act, Effect.promise(refresh))
}

export function refreshAndWaitForOperation<Req, R2, E2, A2, R, E>(
  act: (req: Req) => Effect<R, E, FetchResponse<OperationId>>,
  refresh: Effect<R2, E2, A2>,
  cb?: (op: Operation) => void
) {
  return (req: Req) =>
    waitForOperation(
      act(req)
        .tap(() => refresh),
      cb
    )
      .tap(() => refresh)
}

/**
 * @tsplus fluent effect/io/Effect waitForOperation
 */
export function waitForOperation<R, E>(self: Effect<R, E, FetchResponse<OperationId>>, cb?: (op: Operation) => void) {
  return self.flatMap((r) => _waitForOperation(r.body, cb))
}

/**
 * @tsplus static effect/io/Effect waitForOperation_
 */
export function waitForOperation_<Req, R, E>(self: (req: Req) => Effect<R, E, FetchResponse<OperationId>>) {
  return (req: Req) => self(req).flatMap((r) => _waitForOperation(r.body))
}

function _waitForOperation(id: OperationId, cb?: (op: Operation) => void) {
  return Effect.gen(function*($) {
    let r = yield* $(opsClient.find({ id }).map((_) => _.body))
    while (r) {
      if (cb) cb(r)
      if (r.result) return r.result
      yield* $(Effect.sleep(Duration.seconds(2)))
      r = yield* $(opsClient.find({ id }).map((_) => _.body))
    }
  })
}
