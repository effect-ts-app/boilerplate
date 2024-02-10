import { S } from "@effect-app-boilerplate/resources/lib"
import type { Schema } from "effect-app/schema"

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
  /**
   * @tsplus type BogusEvent.From
   * @tsplus companion BogusEvent.From/Ops
   */
  export class From extends S.FromClass<typeof BogusEvent>() {}
}
/* eslint-enable */
//
// codegen:end
//
