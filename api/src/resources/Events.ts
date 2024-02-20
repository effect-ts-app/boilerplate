import type { Schema } from "effect-app/schema"
import { S } from "resources/lib"

export class BogusEvent extends S.ExtendedTaggedClass<BogusEvent, BogusEvent.From>()("BogusEvent", {
  id: S.StringId.withDefault,
  at: S.Date.withDefault
}) {}

export const ClientEvents = S.union(BogusEvent)
export type ClientEvents = Schema.To<typeof ClientEvents>

// codegen:start {preset: model}
//
/* eslint-disable */
export namespace BogusEvent {
  export class From extends S.FromClass<typeof BogusEvent>() {}
}
/* eslint-enable */
//
// codegen:end
//
