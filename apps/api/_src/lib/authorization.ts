// import { UserSVC } from "@/services.js"
// import { configM } from "@/services/Config.js"
import type { RequestHandler } from "@effect-ts-app/infra/express/schema/requestHandler"
import * as Ex from "@effect-ts/express"
import type express from "express"
import { expressjwt } from "express-jwt"
import jwtAuthz from "express-jwt-authz"
import jwksRsa from "jwks-rsa"

// Authorization middleware. When used, the
// Access Token must exist and be verified against
// the Auth0 JSON Web Key Set
export const checkJwt = (audience: string, issuer: string) =>
  expressjwt({
    // Dynamically provide a signing key
    // based on the kid in the header and
    // the signing keys provided by the JWKS endpoint.
    secret: jwksRsa.expressJwtSecret({
      cache: true,
      rateLimit: true,
      jwksRequestsPerMinute: 5,
      jwksUri: `${issuer}/.well-known/jwks.json`
    }),

    // Validate the audience and the issuer.
    audience,
    issuer: [issuer + "/"],
    algorithms: ["RS256"]
  })

const demandScopes = jwtAuthz([])

// export const auth = configM(
//   (cfg) =>
//     cfg.AUTH_DISABLED
//       ? Effect.unit
//       : Ex.use(Ex.classic(checkJwt)) > Ex.use(Ex.classic(demandScopes)) // TODO
// )
export const scopes = Ex.classic(demandScopes)

export interface Login {
  fake: void
}
function LoginLayer(_req: express.Request, _res: express.Response) {
  return Layer.fromRawFunction(() => ({ fake: undefined } as Login))
  // return LoggedInUserContextLive["<+<"](
  //   Layer.fromEffect(UserSVC.UserProfile)(
  //     configM(cfg => {
  //       const handleJwt = Ex.classic(
  //         checkJwt(cfg.AUTH0_AUDIENCE, cfg.AUTH0_ISSUER_BASE_URL)
  //       )
  //       return (
  //         cfg.AUTH_DISABLED
  //           ? Effect(null)
  //           : // eslint-disable-next-line @typescript-eslint/no-empty-function
  //             handleJwt(req, res, () => scopes(req, res, () => {}))
  //       ).zipRight(
  //         cfg.AUTH_DISABLED
  //           ? UserSVC.makeUserProfileFromUserHeader(req.headers["x-user"])
  //           : UserSVC.makeUserProfileFromAuthorizationHeader(
  //             req.headers["authorization"]
  //           )
  //       )
  //     })
  //   ).mapError(() => new NotLoggedInError())
  // )
}

export function demandLoggedIn<
  R,
  PathA,
  CookieA,
  QueryA,
  BodyA,
  HeaderA,
  ReqA extends PathA & QueryA & BodyA,
  ResA,
  ResE
>(
  handler: RequestHandler<R, PathA, CookieA, QueryA, BodyA, HeaderA, ReqA, ResA, ResE>
) {
  return {
    handler,
    handle: LoginLayer
  }
}
