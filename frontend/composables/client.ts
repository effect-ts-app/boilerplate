import { makeQuery2 } from "@effect-app/vue/query2"
import { makeClient2 } from "@effect-app/vue/makeClient2"
import { makeMutation2 } from "@effect-app/vue/mutate2"
import { useToast } from "vue-toastification"
import { useIntl } from "./intl"
import { runtime } from "~/plugins/runtime"

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
export const useSafeQuery = makeQuery2(rt)
export const useSafeMutation = makeMutation2()

export const {
  makeUseAndHandleMutation,
  useAndHandleMutation,
  useSafeMutationWithState,
} = makeClient2(useIntl, useToast, useSafeMutation)
