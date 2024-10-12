import { makeClient, makeMutation, makeQuery } from "@effect-app/vue"

import { useToast } from "vue-toastification"
import { useIntl } from "./intl"
import { runtime, type RT } from "~/plugins/runtime"
import type { Runtime } from "effect-app"

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
} from "@effect-app/vue/makeClient"

// sue me
const rt = computed(() => runtime.value?.runtime as Runtime.Runtime<RT>)
export const useSafeQuery = makeQuery(rt)
export const useSafeMutation = makeMutation(rt)

export const {
  makeUseAndHandleMutation,
  useAndHandleMutation,
  useSafeMutationWithState,
} = makeClient(useIntl, useToast, useSafeMutation)
