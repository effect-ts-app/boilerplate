import { setupRequestContext } from "@effect-app/infra/api/setupRequest"
import { reportError } from "@effect-app/infra/errorReporter"
import { Duration, Effect, pipe, S, Schedule, Stream } from "effect-app"
import { HttpHeaders, HttpServerResponse } from "effect-app/http"
import { ClientEvents } from "resources.js"
import { Events } from "../services/Events.js"

// Tell the client to retry every 10 seconds if connectivity is lost
const setRetry = Stream.succeed("retry: 10000")
const keepAlive = Stream.schedule(Effect.succeed(":keep-alive"), Schedule.fixed(Duration.seconds(15)))

export const events = Effect
  .gen(function*() {
    yield Effect.logInfo("$ start listening to events")

    const enc = new TextEncoder()

    const events = yield* Events.stream
    const eventStream = Stream.map(
      events,
      (_) => `id: ${_.evt.id}\ndata: ${JSON.stringify(S.encodeSync(ClientEvents)(_.evt))}`
    )

    const stream = pipe(setRetry, Stream.merge(keepAlive), Stream.merge(eventStream))

    const ctx = yield* Effect.context<never>()
    const res = HttpServerResponse.stream(
      stream
        .pipe(
          Stream.map((_) => enc.encode(_ + "\n\n")),
          Stream.tapErrorCause(reportError("Request")),
          Stream.provideContext(ctx)
        ),
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
  .pipe(Effect.tapErrorCause(reportError("Request")), (_) => setupRequestContext(_, "events"))
