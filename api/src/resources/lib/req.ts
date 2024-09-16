import type {
  BodyRequest,
  IfPathPropsProvided,
  PathParams,
  QueryRequest,
  SupportedMethods
} from "@effect-app/schema/REST"
import { Req as Req_ } from "@effect-app/schema/REST"
import { S } from "effect-app"
import type { Role } from "models/User.js"
import type { C } from "vite-node/dist/index-CCsqCcr7.js"

export type RequestConfig = { allowAnonymous?: true; allowedRoles?: readonly Role[] }

export type AllowAnonymous<A> = A extends { allowAnonymous: true } ? true : false

type BuildRequest<
  Fields extends S.Struct.Fields,
  Path extends `/${string}`,
  Method extends SupportedMethods,
  M,
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  Config extends object = {}
> = IfPathPropsProvided<
  Path,
  Fields,
  Method extends "GET" | "DELETE" ?
      & QueryRequest<
        M,
        Pick<Fields, PathParams<Path>>,
        Omit<Fields, PathParams<Path>>,
        undefined,
        Fields,
        Path
      >
      & Config
    :
      & BodyRequest<
        M,
        Pick<Fields, PathParams<Path>>,
        Omit<Fields, PathParams<Path>>,
        undefined,
        undefined,
        Fields,
        Path
      >
      & Config
>

export function Req<M>(): {
  <Fields extends S.Struct.Fields, C extends RequestConfig & { success: S.Schema.Any }>(
    fields: Fields,
    config: C
  ):
    & BuildRequest<
      Fields,
      "/",
      "AUTO",
      M,
      C & {
        Response: C["success"]
      }
    >
    & {
      Request: BuildRequest<
        Fields,
        "/",
        "AUTO",
        M,
        C
      >
    }
  <Fields extends S.Struct.Fields, C extends RequestConfig>(
    fields: Fields,
    config: C
  ):
    & BuildRequest<
      Fields,
      "/",
      "AUTO",
      M,
      C & {
        Response: S.Void
      }
    >
    & {
      Request: BuildRequest<
        Fields,
        "/",
        "AUTO",
        M,
        C
      >
    }
  <Fields extends S.Struct.Fields>(
    fields: Fields
  ):
    & BuildRequest<
      Fields,
      "/",
      "AUTO",
      M,
      {
        Response: S.Void
      }
    >
    & {
      Request: BuildRequest<
        Fields,
        "/",
        "AUTO",
        M,
        C
      >
    }
} {
  return <Fields extends S.Struct.Fields, C extends RequestConfig & { success: S.Schema.Any }>(
    fields: Fields,
    config?: C
  ) => {
    const req = config?.success
      ? Req_<C>({ ...config, Response: config.success })<M>()<Fields>(fields)
      : Req_({ ...config, success: S.Void })<M>()<Fields>(fields)
    const req2 = Object.assign(req, { Request: req }) // bwc
    return req2
  }
}
