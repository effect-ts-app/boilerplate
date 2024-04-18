import * as Cause from "effect/Cause"
import * as S from "effect-app/schema"
import * as HttpClient from "@effect/platform/Http/Client"
import * as ClientRequest from "@effect/platform/Http/ClientRequest"
import * as Duration from "effect/Duration"
import type { NonEmptyReadonlyArray } from "effect-app"
import { Effect, Either, Option } from "effect-app"
import type { NonEmptyArray } from "@effect-app/core/Array"
import * as Layer from "effect/Layer"
import * as HashMap from "effect/HashMap"
import * as Match from "effect/Match"
import * as Tag from "effect/Context"
import * as PubSub from "effect/PubSub"
import * as Order from "effect/Order"
import * as Chunk from "@effect-app/core/Chunk"
import * as Stream from "effect/Stream"

// export "from" so that it's not used for auto imports (as it collides with global Array and breaks validation)
export { Array } from "effect-app"

export { flow, pipe } from "@effect-app/core/Function"
// Must export explicity for auto import to work
export {
  Cause,
  Chunk,
  Duration,
  Effect,
  Either,
  Layer,
  HttpClient,
  HashMap,
  ClientRequest,
  Match,
  Option,
  S,
  Order,
  PubSub,
  Stream,
  Tag,
}
export type { NonEmptyArray, NonEmptyReadonlyArray }
