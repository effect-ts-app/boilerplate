import { ClientEvents } from "@effect-app-boilerplate/resources"
import { HttpHeaders, HttpServerResponse } from "@effect-app/infra/api/http"
import { reportError } from "@effect-app/infra/errorReporter"
import { Events } from "../services/Events.js"

export const events = Effect
  .gen(function*($) {
    yield* $(Effect.logInfo("$ start listening to events"))

    const enc = new TextEncoder()

    // Tell the client to retry every 10 seconds if connectivity is lost
    const setRetry = Stream.succeed("retry: 10000")
    const keepAlive = Stream.schedule(Effect.succeed(":keep-alive"), Schedule.fixed(Duration.seconds(15)))
    const events = yield* $(Events.map(({ stream }) => stream))

    const stream = setRetry
      .merge(keepAlive)
      .merge(events.map((_) => `id: ${_.evt.id}\ndata: ${JSON.stringify(ClientEvents.encodeSync(_.evt))}`))
      .map((_) => enc.encode(_ + "\n\n"))

    const ctx = yield* $(Effect.context<never>())
    const res = HttpServerResponse.stream(
      stream
        .tapErrorCause(reportError("Request"))
        .provideContext(ctx),
      {
        contentType: "text/event-stream",
        headers: HttpHeaders.fromInput({
          "content-type": "text/event-stream",
          "cache-control": "no-cache",
          "x-accel-buffering": "no",
          "connection": "keep-alive" // if (req.httpVersion !== "2.0")
        })
      }
    )
    return res
  })
  .tapErrorCause(reportError("Request"))
  .setupRequestContext("events")
