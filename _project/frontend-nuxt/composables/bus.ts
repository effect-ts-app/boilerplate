import type { ClientEvents } from "@effect-app-boilerplate/resources"
import * as Hub from "@effect/io/Hub"

export const serverEventHub = Effect.runSync(Hub.unbounded<ClientEvents>())
