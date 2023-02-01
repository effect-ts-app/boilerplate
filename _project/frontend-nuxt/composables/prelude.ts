import * as MO from "@effect-app/prelude/schema"
import * as These from "@effect-app/schema/custom/These"
import * as Effect from "@effect/io/Effect"
import * as Layer from "@effect/io/Layer"
import * as Either from "@fp-ts/core/Either"
import * as Option from "@effect-app/core/Option"
import * as Tag from "@fp-ts/data/Context"
import * as Order from "@effect-app/core/Order"
import * as Chunk from "@effect-app/core/Chunk"
import * as ROArray from "@effect-app/core/Array"
import * as Fiber from "@effect/io/Fiber"
import * as Hub from "@effect/io/Hub"
import * as Queue from "@effect/io/Queue"
import type {
  NonEmptyArray,
  NonEmptyReadonlyArray,
} from "@fp-ts/core/ReadonlyArray"

import { runtime as rt } from "~~/plugins/runtime"

export const runtime = () => rt.value!

export { flow, pipe } from "@effect-app/prelude/Function"
// Must export explicity for auto import to work
export {
  Chunk,
  Effect,
  Either,
  Fiber,
  Hub,
  Queue,
  Layer,
  Option,
  MO,
  Order,
  ROArray,
  These,
  Tag,
}
export type { NonEmptyArray, NonEmptyReadonlyArray }
