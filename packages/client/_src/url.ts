import type { ParsedShapeOfCustom, ReqRes, SchemaAny } from "@effect-ts-app/boilerplate-prelude/schema"
import { EParserFor, Parser } from "@effect-ts-app/boilerplate-prelude/schema"
import { typedKeysOf } from "@effect-ts-app/boilerplate-prelude/utils"

import { Path } from "path-parser"
import type { ParsedUrlQuery } from "querystring"

function makePath<Path extends string, NER extends Record<string, SchemaAny>>(
  path: Path,
  schema: NER
) {
  const p = new Path(path)

  const parse = (currentPath: string) => p.partialTest(currentPath) ?? {}
  return {
    path,
    schema,
    build: (
      params: {
        [K in keyof NER]: ParsedShapeOfCustom<NER[K]>
      }
    ) => p.build(params),
    parse,
    parseParams: (currentPath: string) => parseRouteParams(parse(currentPath), schema)
  }
}

class Wrapper<NER extends Record<string, SchemaAny>> {
  wrapped(path: string, schema: NER) {
    return makePath(path, schema)
  }
}

export interface UrlPath<NER extends Record<string, SchemaAny>> extends ReturnType<Wrapper<NER>["wrapped"]> {}

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
        ? Maybe(x.effect.right.tuple[0])
        : Maybe.none
      : Maybe.none)
  return dec
}

export const parseMaybeUnknown = <E, A>(t: ReqRes<E, A>) => {
  const dec = flow(Parser.for(t), x =>
    x.effect._tag === "Right"
      ? x.effect.right.tuple[1]._tag === "None"
        ? Maybe(x.effect.right.tuple[0])
        : Maybe.none
      : Maybe.none)
  return dec
}

export const parseRouteParams = <NER extends Record<string, SchemaAny>>(
  query: Record<string, any>,
  t: NER // enforce non empty
): {
  [K in keyof NER]: Maybe<ParsedShapeOfCustom<NER[K]>>
} => {
  return typedKeysOf(t).reduce(
    (prev, cur) => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      prev[cur] = getQueryParamO(query, cur as string).flatMap(parseMaybe(t[cur]!))

      return prev
    },
    {} as {
      [K in keyof NER]: Maybe<ParsedShapeOfCustom<NER[K]>>
    }
  )
}
