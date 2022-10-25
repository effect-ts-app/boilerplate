import { flow, pipe } from "@effect-ts-app/boilerplate-prelude/Function"
import type { ParsedShapeOfCustom, ReqRes, SchemaAny } from "@effect-ts-app/boilerplate-prelude/schema"
import { EParserFor, Parser, unsafe } from "@effect-ts-app/boilerplate-prelude/schema"
import { typedKeysOf } from "@effect-ts-app/boilerplate-prelude/utils"
import * as Maybe from "@tsplus/stdlib/data/Maybe"
import type { ParsedUrlQuery } from "querystring"

export const useRouteParams = <
  NER extends Record<string, SchemaAny>
>(
  t: NER // enforce non empty
) => {
  const r = useRoute()
  const result = parseRouteParams(r.params, t)
  return result
}

export const useRouteParamsOption = <
  NER extends Record<string, SchemaAny>
>(
  t: NER // enforce non empty
) => {
  const r = useRoute()
  const result = parseRouteParamsOption(r.params, t)
  type Result = typeof result
  return typedKeysOf(result).reduce((prev, cur) => {
    prev[cur] = Maybe.toUndefined(result[cur])
    return prev
  }, {} as Record<keyof Result, any>) as unknown as {
    [K in keyof Result]: Result[K] extends Maybe.Maybe<infer A> ? A | undefined : never
  }
}

export function getQueryParam(search: ParsedUrlQuery, param: string) {
  const v = search[param]
  if (Array.isArray(v)) {
    return v[0]
  }
  return v ?? null
}

export const getQueryParamO = flow(getQueryParam, Maybe.fromNullable)

export const parseMaybe = <E, A>(t: ReqRes<E, A>) => {
  const dec = flow(EParserFor(t), x =>
    x.effect._tag === "Right"
      ? x.effect.right.tuple[1]._tag === "None"
        ? Maybe.some(x.effect.right.tuple[0])
        : Maybe.none
      : Maybe.none)
  return dec
}

export const parseMaybeUnknown = <E, A>(t: ReqRes<E, A>) => {
  const dec = flow(Parser.for(t), x =>
    x.effect._tag === "Right"
      ? x.effect.right.tuple[1]._tag === "None"
        ? Maybe.some(x.effect.right.tuple[0])
        : Maybe.none
      : Maybe.none)
  return dec
}

export function parseRouteParamsOption<NER extends Record<string, SchemaAny>>(
  query: Record<string, any>,
  t: NER // enforce non empty
): {
  [K in keyof NER]: Maybe.Maybe<ParsedShapeOfCustom<NER[K]>>
} {
  return typedKeysOf(t).reduce(
    (prev, cur) => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      prev[cur] = pipe(getQueryParamO(query, cur as string), Maybe.flatMap(parseMaybe(t[cur]!)))

      return prev
    },
    {} as {
      [K in keyof NER]: Maybe.Maybe<ParsedShapeOfCustom<NER[K]>>
    }
  )
}

export function parseRouteParams<NER extends Record<string, SchemaAny>>(
  query: Record<string, any>,
  t: NER // enforce non empty
): {
  [K in keyof NER]: ParsedShapeOfCustom<NER[K]>
} {
  return typedKeysOf(t).reduce(
    (prev, cur) => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      prev[cur] = unsafe(EParserFor(t[cur]))(query[cur as any])

      return prev
    },
    {} as {
      [K in keyof NER]: ParsedShapeOfCustom<NER[K]>
    }
  )
}
