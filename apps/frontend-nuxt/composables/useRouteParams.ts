import type { SchemaAny } from "@effect-ts-app/boilerplate-prelude/schema"
import { typedKeysOf } from "@effect-ts-app/boilerplate-prelude/utils"
import {
  parseRouteParams,
  parseRouteParamsOption,
} from "@effect-ts-app/boilerplate-vue/routeParams"
import * as Opt from "@fp-ts/data/Option"

export const useRouteParams = <NER extends Record<string, SchemaAny>>(
  t: NER // enforce non empty
) => {
  const r = useRoute()
  const result = parseRouteParams(r.params, t)
  return result
}

export const useRouteParamsOption = <NER extends Record<string, SchemaAny>>(
  t: NER // enforce non empty
) => {
  const r = useRoute()
  const result = parseRouteParamsOption(r.params, t)
  type Result = typeof result
  return typedKeysOf(result).reduce((prev, cur) => {
    prev[cur] = Opt.getOrUndefined(result[cur])
    return prev
  }, {} as Record<keyof Result, any>) as unknown as {
    [K in keyof Result]: Result[K] extends Opt.Option<infer A>
      ? A | undefined
      : never
  }
}
export * from "@effect-ts-app/boilerplate-vue/routeParams"
