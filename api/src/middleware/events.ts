import { setupRequestContext } from "@effect-app/infra/api/setupRequest"
import { reportError } from "@effect-app/infra/errorReporter"
import { HttpHeaders, HttpServerResponse } from "api/lib/http"
import { Duration, Effect, S, Schedule, Stream } from "effect-app"
import { ClientEvents } from "resources"
import { Events } from "../services/Events"

export const events = Effect
  .gen(function*($) {
    yield* $(Effect.logInfo("$ start listening to events"))

    const enc = new TextEncoder()

    // Tell the client to retry every 10 seconds if connectivity is lost
    const setRetry = Stream.succeed("retry: 10000")
    const keepAlive = Stream.schedule(Effect.succeed(":keep-alive"), Schedule.fixed(Duration.seconds(15)))
    const events = yield* $(Events.andThen(({ stream }) => stream))

    const stream = setRetry
      .pipe(
        Stream.merge(keepAlive),
        Stream.merge(
          events.pipe(Stream.map((_) => `id: ${_.evt.id}\ndata: ${JSON.stringify(S.encodeSync(ClientEvents)(_.evt))}`))
        ),
        Stream.map((_) => enc.encode(_ + "\n\n"))
      )

    const ctx = yield* $(Effect.context<never>())
    const res = HttpServerResponse.stream(
      stream
        .pipe(
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
