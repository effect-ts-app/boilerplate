import { RpcRouter } from "@effect/rpc"
import { RPC } from "api/lib/routing.js"
import { UserRepo } from "api/services.js"
import { GetMe } from "resources/Me.js"

export default RpcRouter.make(RPC.effect(GetMe, () => UserRepo.getCurrentUser))
