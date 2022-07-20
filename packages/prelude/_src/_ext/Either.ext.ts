import { encaseEither as encaseEitherInEffect } from "@effect-ts-app/core/Effect"
import { encaseEither as encaseEitherInSync } from "@effect-ts-app/core/Sync"

/**
 * @tsplus getter ets/Either encaseInSync
 */
export const encaseEitherSync = encaseEitherInSync

/**
 * @tsplus getter ets/Either encaseInEffect
 */
export const encaseEitherEffect = encaseEitherInEffect
