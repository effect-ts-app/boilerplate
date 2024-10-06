import { RpcRouter } from "@effect/rpc"
import { Operations } from "api/services.js"
import { Effect, Option } from "effect-app"
import { FindOperation } from "resources/Operations.js"
import { RPC } from "./lib/routing.js"

export default RpcRouter.make(
  RPC.effect(FindOperation, ({ id }) =>
    Effect.andThen(
      Operations.find(id),
      Option.getOrNull
    ))
)
