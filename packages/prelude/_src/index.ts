export * as Record from "@effect-ts-app/core/Object"
export * as Fnc from "./Function.js"
export * as Utils from "./utils.js"

export * from "./_ext/Prelude/XPure.js"

// we cannot export types colliding with namespaces from .ts files, only from .d.ts files with custom .js trick, applied in @effect-ts-app/prelude
// for app land, it may make sense to create an app/prelude?
export * from "@effect-ts-app/prelude"

export * as Schema from "@effect-ts-app/schema"

export { XPure } from "./_ext/Prelude/XPure.js"

export {
  Array as ROArray,
  EffectOption as EffectMaybe,
  Map as ROMap,
  Option as Maybe,
  Set as ROSet,
  SyncOption as SyncMaybe
} from "@effect-ts-app/prelude"
