import { makeSSE } from "@effect-app/infra/api/middlewares"
import { Events } from "api/services.js"
import { Stream } from "effect-app"
import { ClientEvents } from "resources.js"

export const events = makeSSE(Stream.flatten(Events.stream), ClientEvents)
