import { RequestContext } from "@effect-app/infra/RequestContext"
import { RequestId } from "@effect-app/prelude/ids"
import { HttpMiddleware, HttpServerRequest } from "api/lib/http.js"

export const RequestContextMiddleware = HttpMiddleware.make((app) =>
  Effect.gen(function*($) {
    const req = yield* $(HttpServerRequest)

    const currentSpan = yield* $(Effect.currentSpan.orDie)
    const parent = currentSpan?.parent ? currentSpan.parent.value : undefined
    const start = new Date()
    const supported = ["en", "de"] as const
    const desiredLocale = req.headers["x-locale"]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const locale = desiredLocale && supported.includes(desiredLocale as any)
      ? (desiredLocale as typeof supported[number])
      : ("en" as const)

    const requestId = req.headers["request-id"]
    const rootId = parent?.spanId
      ? RequestId(parent.spanId)
      : requestId
      ? RequestId.parseSync(requestId)
      : RequestId.make()

    const storeId = req.headers["x-store-id"]
    const namespace = NonEmptyString255((storeId && (Array.isArray(storeId) ? storeId[0] : storeId)) || "primary")

    const requestContext = new RequestContext({
      id: currentSpan?.spanId ? RequestId(currentSpan.spanId) : RequestId.make(),
      rootId,
      name: NonEmptyString255(req.originalUrl), // set more detailed elsewhere
      locale,
      createdAt: start,
      namespace
      // ...(context.operation.parentId
      //   ? {
      //     parent: new RequestContextParent({
      //       id: RequestId(context.operation.parentId),
      //       locale,
      //       name: NonEmptyString255("API Request")
      //     })
      //   }
      //   : {})
    })
    const res = yield* $(app.setupRequestContext(requestContext))

    // TODO: how to set also on errors?
    return res.setHeaders({ "request-id": requestContext.rootId, "Content-Language": requestContext.locale })
  })
)
