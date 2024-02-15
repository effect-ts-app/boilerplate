import type { ClientEvents } from "@effect-app-boilerplate/api/resources"

import mitt from "mitt"

type Events = {
  serverEvents: ClientEvents
}

export const bus = mitt<Events>()
