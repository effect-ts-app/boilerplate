// import { configM, UserSVC } from "@/services.js"
import { NotLoggedInError } from "@effect-ts-app/boilerplate-infra/errors"
import * as Ex from "@effect-ts-app/infra/express/index"
import type { RequestHandler } from "@effect-ts-app/infra/express/schema/requestHandler"
import type express from "express"
import { expressjwt } from "express-jwt"
import jwtAuthz from "express-jwt-authz"
import jwksRsa from "jwks-rsa"
import { CurrentUser, UserRepository } from "../services.js"
import { makeUserProfileFromUserHeader, UserProfile } from "../services/UserProfile.js"

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
    }) as jwksRsa.GetVerificationKey,

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

function LoginLayer(handler: { Request: any }) {
  return (req: express.Request, _res: express.Response) => {
    const p = makeUserProfileFromUserHeader(req.headers["x-user"])
      .map(Maybe.some)
    const r = handler.Request.allowAnonymous
      ? p.catchAll(() => Effect(Maybe.none))
      : p.mapError(() => new NotLoggedInError())
    return Layer.fromEffect(UserProfile)(
      // configM(cfg => {
      // const handleJwt = Ex.classic(
      //   checkJwt(cfg.AUTH0_AUDIENCE, cfg.AUTH0_ISSUER_BASE_URL)
      // )
      // return (
      //   cfg.AUTH_DISABLED
      //     ? Effect(null)
      //     : // eslint-disable-next-line @typescript-eslint/no-empty-function
      //       handleJwt(req, res, () => scopes(req, res, () => {}))
      // ).zipRight(
      //   cfg.AUTH_DISABLED
      r.map(_ => ({ get: _.encaseInEffect(() => new NotLoggedInError()) }))
    )
      > Layer.fromEffect(CurrentUser)(
        Effect.serviceWithEffect(UserRepository, _ => _.getCurrentUser).map(Maybe.some)
          .catchAll(() => Effect(Maybe.none))
          .map(_ => ({ get: _.encaseInEffect(() => new NotLoggedInError()) }))
      )
  }
}

export function handleLogin<
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
    handle: LoginLayer(handler)
  }
}
