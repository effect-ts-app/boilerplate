/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable unused-imports/no-unused-vars */
import { HttpHeaders, HttpMiddleware, HttpServerRequest, HttpServerResponse } from "api/lib/http"
import { Config, Effect } from "effect-app"
import {
  auth,
  InsufficientScopeError,
  InvalidRequestError,
  InvalidTokenError,
  UnauthorizedError
} from "express-oauth2-jwt-bearer"

// // Authorization middleware. When used, the Access Token must
// // exist and be verified against the Auth0 JSON Web Key Set.

export const Auth0Config = Config.all({
  audience: Config.string("audience").pipe(Config.nested("auth0"), Config.withDefault("http://localhost:3610")),
  issuer: Config.string("issuer").pipe(
    Config.nested("auth0"),
    Config.withDefault("https://effect-app-boilerplate-dev.eu.auth0.com")
  )
})

// type Errors = InsufficientScopeError | InvalidRequestError | InvalidTokenError | UnauthorizedError

export const checkJWTI = (config: Effect.Success<typeof Auth0Config>) => {
  const mw = auth({
    audience: config.audience,
    issuer: config.issuer + "/",
    jwksUri: `${config.issuer}/.well-known/jwks.json`
  })
  return Effect.gen(function*($) {
    const req = yield* $(HttpServerRequest.ServerRequest)

    return yield* $(
      Effect.async<void, InsufficientScopeError | InvalidRequestError | InvalidTokenError | UnauthorizedError>(
        (cb) => {
          const next = (err?: unknown) => {
            if (!err) return cb(Effect.unit)
            if (
              err instanceof InsufficientScopeError
              || err instanceof InvalidRequestError
              || err instanceof InvalidTokenError
              || err instanceof UnauthorizedError
            ) {
              return cb(Effect.fail(err))
            }
            return Effect.die(err)
          }
          const r = { headers: req.headers, query: {}, body: {}, is: () => false } // is("urlencoded")
          try {
            mw(r as any, {} as any, next)
          } catch (e) {
            return cb(Effect.die(e))
          }
        }
      )
    )
  })
}

export const checkJwt = (config: Effect.Success<typeof Auth0Config>) => {
  const check = checkJWTI(config)
  return HttpMiddleware.make((app) =>
    Effect.gen(function*($) {
      const response = yield* $(Effect.catchAll(check, (e) =>
        Effect.succeed(
          HttpServerResponse.unsafeJson({ message: e.message }, {
            status: e.status,
            headers: HttpHeaders.fromInput(e.headers)
          })
        )))
      if (response) {
        return response
      }
      return yield* $(app)
    })
  )
}

// const checkScopes = requiredScopes('read:messages');

// app.get('/api/private-scoped', checkJwt, checkScopes, function(req, res) {
//   res.json({
//     message: 'Hello from a private endpoint! You need to be authenticated and have a scope of read:messages to see this.'
//   });
// });
