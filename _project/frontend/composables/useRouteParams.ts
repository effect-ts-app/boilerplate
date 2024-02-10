/* eslint-disable @typescript-eslint/no-explicit-any */
import { typedKeysOf } from "effect-app/utils"
import {
  parseRouteParams,
  parseRouteParamsOption,
} from "@effect-app/vue/routeParams"
import type { S } from "~~/utils/prelude"
import { Option } from "~~/utils/prelude"

export const useRouteParams = <NER extends Record<string, S.Schema<any>>>(
  t: NER, // enforce non empty
) => {
  const r = useRoute()
  const result = parseRouteParams({ ...r.query, ...r.params }, t)
  return result
}

export const useRouteParamsOption = <NER extends Record<string, S.Schema<any>>>(
  t: NER, // enforce non empty
) => {
  const r = useRoute()
  const result = parseRouteParamsOption({ ...r.query, ...r.params }, t)
  type Result = typeof result
  return typedKeysOf(result).reduce(
    (prev, cur) => {
      prev[cur] = result[cur].value
      return prev
    },
    {} as Record<keyof Result, unknown>,
  ) as unknown as {
    [K in keyof Result]: Result[K] extends Option<infer A>
      ? A | undefined
      : never
  }
}
