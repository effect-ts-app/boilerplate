import { ClientEvents } from "@effect-app-boilerplate/resources"
import * as Ex from "@effect-app/infra-adapters/express"
import { reportRequestError } from "@effect-app/infra/api/reportError"
import { Events } from "../services/Events.js"

export const events = Ex.get(
  "/events",
  (req, res) =>
    Do($ => {
      req.socket.setTimeout(0)
      req.socket.setNoDelay(true)
      req.socket.setKeepAlive(true)
      res.statusCode = 200
      res.setHeader("Content-Type", "text/event-stream")
      res.setHeader("Cache-Control", "no-cache")
      res.setHeader("X-Accel-Buffering", "no")
      if (req.httpVersion !== "2.0") {
        res.setHeader("Connection", "keep-alive")
      }

      function writeAndLogError(data: string) {
        try {
          if (!res.write(data)) {
            console.error("write error")
          }
        } catch (err) {
          console.error("write error", err)
          throw err
        }
      }

      // Tell the client to retry every 10 seconds if connectivity is lost
      writeAndLogError("retry: 10000\n\n")

      // If client closes connection, stop sending events
      // req.on("error", err => console.log("$$$ req error", err))

      const namespace = req.headers["x-store-id"]
        ? Array.isArray(req.headers["x-store-id"]) ? req.headers["x-store-id"][0]! : req.headers["x-store-id"]
        : "primary"

      $(Effect.logInfo("$ start listening to events"))
      $(
        Effect.sync(() => {
          try {
            // console.log("keep alive")
            // writeAndLogError("id: keep-alive\ndata: \"keep-alive\"\n\n")
            writeAndLogError(":keep-alive\n\n")
          } catch (err) {
            console.error("keepAlive Error", err)
            throw err
          }
        })
          .schedule(Schedule.fixed(Duration.seconds(15)))
          .forkScoped
      )

      $(
        Events.flatMap(({ stream }) =>
          stream
            .filter(_ => _.namespace === namespace)
            .runForEach(_ =>
              Effect(
                writeAndLogError(
                  `id: ${_.evt.id}\ndata: ${JSON.stringify(ClientEvents.Encoder(_.evt))}\n\n`
                )
              )
            )
            .forkScoped
        )
      )
      $(Effect.async<never, never, void>(cb => {
        res.on("close", () => {
          console.log("client dropped me res CLOSE")
          cb(Effect(void 0 as void))
          res.end()
        })
      }))
    }).scoped
      .tapBothInclAbort(() => Effect.logDebug("$ stop listening to events"), () =>
        Effect.logInfo("$ stop listening to events"))
      .tapErrorCause(reportRequestError)
      .setupNamedRequest("events")
)
