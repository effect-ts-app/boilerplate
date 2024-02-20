import { Duration, Effect } from "effect-app"
import { clientFor, type FetchResponse } from "effect-app/client"
import type { Operation, OperationId } from "effect-app/Operations"
import * as OperationsRsc from "../Operations"

const opsClient = clientFor(OperationsRsc)

export function refreshAndWaitAForOperationP<R, E>(
  act: Effect<FetchResponse<OperationId>, E, R>,
  refresh: () => Promise<void>,
  cb?: (op: Operation) => void
) {
  return refreshAndWaitAForOperation(act, Effect.promise(refresh), cb)
}

export function refreshAndWaitAForOperation<R2, E2, A2, R, E>(
  act: Effect<FetchResponse<OperationId>, E, R>,
  refresh: Effect<A2, E2, R2>,
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
  act: (req: Req) => Effect<FetchResponse<OperationId>, E, R>,
  refresh: () => Promise<void>
) {
  return refreshAndWaitForOperation(act, Effect.promise(refresh))
}

export function refreshAndWaitForOperation<Req, R2, E2, A2, R, E>(
  act: (req: Req) => Effect<FetchResponse<OperationId>, E, R>,
  refresh: Effect<A2, E2, R2>,
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

export function waitForOperation<R, E>(
  self: Effect<FetchResponse<OperationId>, E, R>,
  cb?: (op: Operation) => void
) {
  return self.andThen((r) => _waitForOperation(r.body, cb))
}

export function waitForOperation_<Req, R, E>(self: (req: Req) => Effect<FetchResponse<OperationId>, E, R>) {
  return (req: Req) => self(req).andThen((r) => _waitForOperation(r.body))
}

function _waitForOperation(id: OperationId, cb?: (op: Operation) => void) {
  return Effect.gen(function*($) {
    let r = yield* $(opsClient.Find.handler({ id }).andThen((_) => _.body))
    while (r) {
      if (cb) cb(r)
      if (r.result) return r.result
      yield* $(Effect.sleep(Duration.seconds(2)))
      r = yield* $(opsClient.Find.handler({ id }).andThen((_) => _.body))
    }
  })
}
