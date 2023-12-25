import { S } from "@effect-app/prelude/schema"

@useClassFeaturesForSchema
export class BogusEvent extends ExtendedClass<BogusEvent.From, BogusEvent>()({
  _tag: literal("BogusEvent"),
  id: StringId.withDefault(),
  at: S.Date.withDefault()
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
