import { makeAllDSL, makeOneDSL } from "@effect-ts-app/boilerplate-infra/services/Repository"
import type { User } from "@effect-ts-app/boilerplate-types/User"

export const Users$ = makeAllDSL<User, never>()
export const User$ = makeOneDSL<User, never>()
