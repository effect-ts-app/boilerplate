@useClassFeaturesForSchema
export class BogusEvent
  extends ExtendedClass<BogusEvent, BogusEvent.ConstructorInput, BogusEvent.From, BogusEvent.Fields>()({
    _tag: literal("BogusEvent"),
    id: StringId.withDefault,
    at: date.withDefault
  })
{}

export const ClientEvents = smartClassUnion({ BogusEvent })
export type ClientEvents = To<typeof ClientEvents>

// codegen:start {preset: model}
//
/* eslint-disable */
export namespace BogusEvent {
  /**
   * @tsplus type BogusEvent.From
   * @tsplus companion BogusEvent.From/Ops
   */
  export class From extends FromClass<typeof BogusEvent>() {}
  export interface ConstructorInput
    extends ConstructorInputApi<typeof BogusEvent> {}
  export interface Fields extends FieldsClass<typeof BogusEvent> {}
}
/* eslint-enable */
//
// codegen:end
//
