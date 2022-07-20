/* eslint-disable @typescript-eslint/ban-types */
import { flow, pipe, tuple } from "../Function.js"

import { spread } from "../utils.js"

import {
  Cause,
  Chunk,
  Effect,
  EffectMaybe,
  Either,
  Equal,
  Exit,
  Fnc,
  Has,
  Layer,
  Lens,
  Managed,
  Maybe,
  NonEmptyArray,
  NonEmptySet,
  Ord,
  Queue,
  Record,
  Ref,
  ROArray,
  ROMap,
  ROSet,
  Schedule,
  Schema,
  Semaphore,
  Sync,
  SyncMaybe,
  Tuple,
  Utils,
  XPure
} from "../index.js"

Object.assign(global, {
  flow,
  pipe,
  tuple,
  spread,
  ROArray,
  Cause,
  Chunk,
  Effect,
  EffectMaybe,
  Either,
  Equal,
  Exit,
  Fnc,
  Has,
  Layer,
  Lens,
  Managed,
  ROMap,
  NonEmptyArray,
  NonEmptySet,
  Maybe,
  Ord,
  Queue,
  Record,
  Ref,
  Schedule,
  Schema,
  Semaphore,
  ROSet,
  Sync,
  SyncMaybe,
  Tuple,
  Utils,
  XPure
})

Object.defineProperty(Object.prototype, "$entries", {
  get() {
    return Object.entries(this as {})
  },
  enumerable: false
})

Object.defineProperty(Object.prototype, "$values", {
  get() {
    return Object.values(this as {})
  },
  enumerable: false
})

Object.defineProperty(Object.prototype, "$keys", {
  get() {
    return Object.keys(this as {})
  },
  enumerable: false
})
