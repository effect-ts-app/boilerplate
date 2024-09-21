import { makeRouter } from "@effect-app/infra/router"
import type { UserProfile } from "api/services.js"
import { type CTX, handleRequestEnv } from "./RequestEnv.js"

type CTXMap = { allowAnonymous: ["userProfile", UserProfile, false] }

export const { matchAll, matchFor } = makeRouter<CTX, CTXMap>(handleRequestEnv)
