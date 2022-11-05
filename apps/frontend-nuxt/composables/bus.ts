import type { ClientEvents } from "@effect-ts-app/boilerplate-client"
import mitt from "mitt"

type Events = {
  serverEvents: ClientEvents
}

export const bus = mitt<Events>()
