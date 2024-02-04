import { S } from "@effect-app/prelude"
import type { Schema } from "@effect-app/prelude/schema"
import { ExtendedTaggedClass, FromClass, StringId, union, useClassFeaturesForSchema } from "@effect-app/prelude/schema"

@useClassFeaturesForSchema
export class BogusEvent extends ExtendedTaggedClass<BogusEvent.From, BogusEvent>()("BogusEvent", {
  id: StringId.withDefault(),
  at: S.defaultDate(S.Date)
}) {}

export const ClientEvents = union(BogusEvent)
export type ClientEvents = Schema.To<typeof ClientEvents>

// codegen:start {preset: model}
//
/* eslint-disable */
export namespace BogusEvent {
  /**
   * @tsplus type BogusEvent.From
   * @tsplus companion BogusEvent.From/Ops
   */
  export class From extends FromClass<typeof BogusEvent>() {}
}
/* eslint-enable */
//
// codegen:end
//
