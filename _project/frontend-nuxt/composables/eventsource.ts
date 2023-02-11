import { unsafe } from "@effect-app/schema"
import { ClientEvents } from "@macs-scanner/resources"
import ReconnectingEventSource from "reconnecting-eventsource"

const parseEvent = unsafe(ClientEvents.Parser)

function listener(message: MessageEvent<any>) {
  const evt = parseEvent(JSON.parse(message.data))
  bus.emit("serverEvents", evt)
}

function makeSource() {
  const src = new ReconnectingEventSource("/api/events")
  src.addEventListener("message", listener)
  return src
}

export function useApiEventSource() {
  onMountedWithCleanup(() => {
    const source = makeSource()

    return () => {
      console.log("$closing source")
      source.removeEventListener("message", listener)
      source.close()
    }
  })
}
