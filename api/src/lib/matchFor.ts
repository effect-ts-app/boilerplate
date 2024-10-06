/* eslint-disable @typescript-eslint/no-explicit-any */
import type { EffectUnunified } from "@effect-app/core/Effect"
import { typedKeysOf } from "@effect-app/core/utils"
import type { Compute } from "@effect-app/core/utils"
import type { _E, _R } from "@effect-app/infra/api/routing"
import type { S } from "effect-app"
import { Effect, Predicate, Request } from "effect-app"
import type {} from "@effect/schema/ParseResult"
import { type Rpc, RpcRouter } from "@effect/rpc"
import { RPC } from "./routing.js"

// export type RouteMatch<
//   R,
//   M,
//   // TODO: specific errors
//   // Err extends SupportedErrors | S.ParseResult.ParseError,
//   PR = never
// > // RErr = never,
//  = Rpc.Rpc<never, Exclude<Exclude<R, EnforceNonEmptyRecord<M>>, PR>>

export interface Hint<Err extends string> {
  Err: Err
}

type HandleVoid<Expected, Actual, Result> = [Expected] extends [void]
  ? [Actual] extends [void] ? Result : Hint<"You're returning non void for a void Response, please fix">
  : Result

type AnyRequestModule = S.Schema.Any & { success?: S.Schema.Any; failure?: S.Schema.Any }

type GetSuccess<T> = T extends { success: S.Schema.Any } ? T["success"] : typeof S.Void

type GetSuccessShape<Action extends { success?: S.Schema.Any }, RT extends "d" | "raw"> = RT extends "raw"
  ? S.Schema.Encoded<GetSuccess<Action>>
  : S.Schema.Type<GetSuccess<Action>>
type GetFailure<T extends { failure?: S.Schema.Any }> = T["failure"] extends never ? typeof S.Never : T["failure"]

export interface Handler<Action extends AnyRequestModule, RT extends "raw" | "d", A, E, R, Context> {
  new(): {}
  _tag: RT
  handler: (
    req: S.Schema.Type<Action>,
    ctx: Context
  ) => Effect<
    A,
    E,
    R
  >
}

// Separate "raw" vs "d" to verify A (Encoded for "raw" vs Type for "d")
type AHandler<Action extends AnyRequestModule> =
  | Handler<
    Action,
    "raw",
    S.Schema.Encoded<GetSuccess<Action>>,
    S.Schema.Type<GetFailure<Action>>,
    any,
    any
  >
  | Handler<
    Action,
    "d",
    S.Schema.Type<GetSuccess<Action>>,
    S.Schema.Type<GetFailure<Action>>,
    any,
    any
  >

// type GetRouteContext<T> =
//   & CTX
//   // inverted
//   & {
//     [
//       key in keyof CTXMap as CTXMap[key][3] extends true ? never
//         : key extends keyof T ? T[key] extends true ? CTXMap[key][0] : never
//         : never
//     ]?: CTXMap[key][1]
//   }
//   & {
//     [
//       key in keyof CTXMap as CTXMap[key][3] extends true ? never
//         : key extends keyof T ? T[key] extends false ? CTXMap[key][0] : never
//         : CTXMap[key][0]
//     ]: CTXMap[key][1]
//   }
//   // normal
//   & {
//     [
//       key in keyof CTXMap as CTXMap[key][3] extends false ? never
//         : key extends keyof T ? T[key] extends true ? CTXMap[key][0] : never
//         : never
//     ]: CTXMap[key][1]
//   }
//   & {
//     [
//       key in keyof CTXMap as CTXMap[key][3] extends false ? never
//         : key extends keyof T ? T[key] extends false ? CTXMap[key][0] : never
//         : CTXMap[key][0]
//     ]?: CTXMap[key][1]
//   }

export function matchFor<Rsc extends Record<string, any>>(
  rsc: Rsc
) {
  type Filtered = {
    [K in keyof Rsc as Rsc[K] extends S.TaggedRequestClass<any, any, any, any, any> ? K : never]: Rsc[K] extends
      S.TaggedRequestClass<any, any, any, any, any> ? Rsc[K]
      : never
  }
  const filtered = typedKeysOf(rsc).reduce((acc, cur) => {
    if (Predicate.isObject(rsc[cur]) && rsc[cur][Request.RequestTypeId]) {
      acc[cur as keyof Filtered] = rsc[cur]
    }
    return acc
  }, {} as Filtered)

  const matchWithServices = <Key extends keyof Filtered>(action: Key) => {
    return <
      SVC extends Record<
        string,
        Effect<any, any, any>
      >,
      R2,
      E,
      A
    >(
      services: SVC,
      f: (
        req: S.Schema.Type<Rsc[Key]>,
        ctx: any
        // ctx: Compute<
        //   LowerServices<EffectDeps<SVC>> & never // ,
        //   "flat"
        // >
      ) => Effect<A, E, R2>
    ) =>
    (req: any) =>
      // Effect.andThen(allLower(services), (svc2) =>
      // ...ctx, ...svc2,
      f(req, { Response: rsc[action].success })
  }

  type MatchWithServicesNew<RT extends "raw" | "d", Key extends keyof Rsc> = {
    <R2, E, A>(
      f: Effect<A, E, R2>
    ): HandleVoid<
      GetSuccessShape<Rsc[Key], RT>,
      A,
      Handler<
        Rsc[Key],
        RT,
        A,
        E,
        R2,
        never //
      >
    >

    <R2, E, A>(
      f: (
        req: S.Schema.Type<Rsc[Key]>,
        ctx: Pick<Rsc[Key], "Response">
      ) => Effect<A, E, R2>
    ): HandleVoid<
      GetSuccessShape<Rsc[Key], RT>,
      A,
      Handler<
        Rsc[Key],
        RT,
        A,
        E,
        R2,
        never //
      >
    >

    <
      SVC extends Record<
        string,
        EffectUnunified<any, any, any>
      >,
      R2,
      E,
      A
    >(
      services: SVC,
      f: (
        req: S.Schema.Type<Rsc[Key]>,
        ctx: Compute<
          // LowerServices<EffectDeps<SVC>> & Pick<Rsc[Key], "success">,
          { Response: Rsc[Key] },
          "flat"
        >
      ) => Effect<A, E, R2>
    ): HandleVoid<
      GetSuccessShape<Rsc[Key], RT>,
      A,
      Handler<
        Rsc[Key],
        RT,
        A,
        E,
        R2,
        never //
      >
    >
  }

  type Keys = keyof Filtered

  const controllers = <
    THandlers extends {
      // import to keep them separate via | for type checking!!
      [K in Keys]: AHandler<Rsc[K]>
    }
  >(
    controllers: THandlers
  ) => {
    const handlers = typedKeysOf(filtered).reduce(
      (acc, cur) => {
        if (cur === "meta") return acc
        const m = (rsc as any).meta as { moduleName: string }
        if (!m) throw new Error("Resource has no meta specified") // TODO: do something with moduleName+cur etc.
        ;(acc as any)[cur] = controllers[cur as keyof typeof controllers] /*handle(
          rsc[cur],
          m.moduleName + "." + (cur as string)
        )(controllers[cur as keyof typeof controllers] as any)*/

        return acc
      },
      {} as {
        [K in Keys]: {
          h: (
            r: S.Schema.Type<Rsc[K]>
          ) => Effect<
            S.Schema.Type<GetSuccess<Rsc[K]>>,
            _E<ReturnType<THandlers[K]["handler"]>>,
            _R<ReturnType<THandlers[K]["handler"]>>
          >
          Request: Rsc[K]
        }
      }
    )

    const mapped = typedKeysOf(handlers).reduce((acc, cur) => {
      const handler = handlers[cur]
      const req = handler.Request

      // class Request extends (req as any) {
      //   static path = "/" + handler.name + (req.path === "/" ? "" : req.path)
      //   static method = req.method === "AUTO"
      //     ? REST.determineMethod(handler.name.split(".")[1]!, req)
      //     : req.method
      // }
      // if (req.method === "AUTO") {
      //   Object.assign(Request, {
      //     [Request.method === "GET" || Request.method === "DELETE" ? "Query" : "Body"]: req.Auto
      //   })
      // }
      // Object.assign(handler, { Request })
      acc[cur] = RPC.effect(req, handler.h as any) // TODO
      return acc
    }, {} as any) as {
      [K in Keys]: Rpc.Rpc<
        Rsc[K],
        _R<ReturnType<THandlers[K]["handler"]>>
      >
    }

    type _RRoute<T extends Rpc.Rpc<any, any>> = [T] extends [
      Rpc.Rpc<any, infer R>
    ] ? R
      : never

    type _ReqRoute<T extends Rpc.Rpc<any, any>> = [T] extends [
      Rpc.Rpc<infer Req, any>
    ] ? Req
      : never

    return RpcRouter.make(...Object.values(mapped)) as RpcRouter.RpcRouter<
      _ReqRoute<typeof mapped[keyof typeof mapped]>,
      _RRoute<typeof mapped[keyof typeof mapped]>
    >
  }

  const r = {
    controllers,
    ...typedKeysOf(filtered).reduce(
      (prev, cur) => {
        ;(prev as any)[cur] = (svcOrFnOrEffect: any, fnOrNone: any) => {
          const stack = new Error().stack?.split("\n").slice(2).join("\n")
          return Effect.isEffect(svcOrFnOrEffect)
            ? class {
              static stack = stack
              static _tag = "d"
              static handler = () => svcOrFnOrEffect
            }
            : typeof svcOrFnOrEffect === "function"
            ? class {
              static stack = stack
              static _tag = "d"
              static handler = (req: any, ctx: any) => svcOrFnOrEffect(req, { ...ctx, Response: rsc[cur].Response })
            }
            : class {
              static stack = stack
              static _tag = "d"
              static handler = matchWithServices(cur)(svcOrFnOrEffect, fnOrNone)
            }
        }
        ;(prev as any)[(cur as any) + "Raw"] = (svcOrFnOrEffect: any, fnOrNone: any) => {
          const stack = new Error().stack?.split("\n").slice(2).join("\n")
          return Effect.isEffect(svcOrFnOrEffect)
            ? class {
              static stack = stack
              static _tag = "raw"
              static handler = () => svcOrFnOrEffect
            }
            : typeof svcOrFnOrEffect === "function"
            ? class {
              static stack = stack
              static _tag = "raw"
              static handler = (req: any, ctx: any) => svcOrFnOrEffect(req, { ...ctx, Response: rsc[cur].Response })
            }
            : class {
              static stack = stack
              static _tag = "raw"
              static handler = matchWithServices(cur)(svcOrFnOrEffect, fnOrNone)
            }
        }
        return prev
      },
      {} as
        & {
          // use Rsc as Key over using Keys, so that the Go To on X.Action remain in tact in Controllers files
          /**
           * Requires the Type shape
           */
          [Key in keyof Filtered]: MatchWithServicesNew<"d", Key>
        }
        & {
          // use Rsc as Key over using Keys, so that the Go To on X.Action remain in tact in Controllers files
          /**
           * Requires the Encoded shape (e.g directly undecoded from DB, so that we don't do multiple Decode/Encode)
           */
          [Key in keyof Filtered as Key extends string ? `${Key}Raw` : never]: MatchWithServicesNew<"raw", Key>
        }
    )
  }
  return r
}
