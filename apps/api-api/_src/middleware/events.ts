import { ClientEvents } from "@effect-ts-app/boilerplate-client"
import * as Ex from "@effect-ts-app/infra/express/index"
import { Events } from "../services/Events.js"

export const events = Ex.get("/events", (req, res) =>
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

    // keep the connection open by sending a comment
    const keepAlive = setInterval(function() {
      try {
        writeAndLogError(":keep-alive\n\n")
      } catch (err) {
        console.error("keepAlive Error", err)
        throw err
      }
    }, 20_000)

    // If client closes connection, stop sending events
    // req.on("error", err => console.log("$$$ req error", err))

    const { subscribe } = $(Events.access)
    console.log("$ start listening to events")
    const f = $(
      subscribe.flatMap(_ =>
        _.take().flatMap(_ =>
          Effect(() => {
            writeAndLogError(
              `id: ${_.id}\ndata: ${JSON.stringify(ClientEvents.Encoder(_))}\n\n`
            )
          })
        ).forever
      )
        .scoped
        .fork
    )

    // TODO: Auto-reconnect every X minutes, to make sure we don't keep any streams open?

    $(
      Effect.async<never, never, void>(cb => {
        res.on("close", () => {
          console.log("client dropped me res CLOSE")
          clearTimeout(keepAlive)
          cb(Effect(void 0 as void))
          res.end()
        })
      }).zipRight(f.interrupt)
    )

    $(f.join)
    console.log("$ stop listening to events")
  }))
