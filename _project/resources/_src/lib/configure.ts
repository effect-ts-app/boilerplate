import type { Role } from "@effect-app-boilerplate/models/User"

export type RequestConfig = { allowAnonymous?: true; allowedRoles?: readonly Role[] }

export const cfg = <C extends RequestConfig>(props: C) => props

export type AllowAnonymous<A> = A extends { allowAnonymous: true } ? true : false
