import { makeClient, makeMutation, makeQuery } from "@effect-app/vue"

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
export const useSafeQuery = makeQuery(rt)
export const useSafeMutation = makeMutation(rt)

export const {
  makeUseAndHandleMutation,
  useAndHandleMutation,
  useSafeMutationWithState,
} = makeClient(useIntl, useToast, useSafeMutation)
