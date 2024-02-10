import * as HttpRouter from "@effect/platform/Http/Router"

export * as HttpNode from "@effect/platform-node/Http/Server"
export * as NodeContext from "@effect/platform-node/NodeContext"
export * as HttpClientNode from "@effect/platform-node/NodeHttpClient"
export * as HttpBody from "@effect/platform/Http/Body"
export * as HttpHeaders from "@effect/platform/Http/Headers"
export * as HttpMiddleware from "@effect/platform/Http/Middleware"
export * as HttpRouter from "@effect/platform/Http/Router"
export * as HttpServer from "@effect/platform/Http/Server"
export * as HttpServerRequest from "@effect/platform/Http/ServerRequest"
export * as HttpServerResponse from "@effect/platform/Http/ServerResponse"

export const fromArray: <Routes extends readonly HttpRouter.Route<any, any>[]>(
  routes: Routes
) => HttpRouter.Router<
  Routes[number] extends HttpRouter.Route<infer R, any> ? R : never,
  Routes[number] extends HttpRouter.Route<any, infer E> ? E : never
> = HttpRouter.fromIterable
