import { makeClient2 } from "@effect-app/vue/makeClient2"
import { useToast } from "vue-toastification"
import { useIntl } from "./intl"
import { runtime, type RT } from "~/plugins/runtime"
import type { Effect } from "effect-app"

export { useToast } from "vue-toastification"

export { clientFor } from "resources/lib"
export { Result, type MutationResult, makeContext } from "@effect-app/vue"
export {
  pauseWhileProcessing,
  useIntervalPauseWhileProcessing,
  withSuccess,
  withSuccessE,
  composeQueries,
  SuppressErrors,
  mapHandler,
} from "@effect-app/vue"

const rt = computed(() => runtime.value?.runtime)

export const run = <A, E>(
  effect: Effect.Effect<A, E, RT>,
  options?:
    | {
        readonly signal?: AbortSignal
      }
    | undefined,
) => runtime.value!.runPromise(effect, options)

export const {
  buildFormFromSchema,
  makeUseAndHandleMutation,
  useAndHandleMutation,
  useSafeMutation,
  useSafeMutationWithState,
  useSafeQuery,
} = makeClient2(useIntl, useToast, rt)
