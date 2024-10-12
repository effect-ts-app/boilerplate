import { makeClient } from "@effect-app/vue"

import { useToast } from "vue-toastification"
import { useIntl } from "./intl"

export { useToast } from "vue-toastification"

export { clientFor } from "resources/lib"
export {
  useSafeMutation,
  useSafeQuery,
  Result,
  type MutationResult,
  makeContext,
} from "@effect-app/vue"
export {
  pauseWhileProcessing,
  useIntervalPauseWhileProcessing,
  withSuccess,
  withSuccessE,
  composeQueries,
  SuppressErrors,
  useSafeMutationWithState,
  mapHandler,
} from "@effect-app/vue/makeClient"

export const { makeUseAndHandleMutation, useAndHandleMutation } = makeClient(
  useIntl,
  useToast,
)
