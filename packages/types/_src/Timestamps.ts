export class Timestamps
  extends MNModel<Timestamps, Timestamps.ConstructorInput, Timestamps.Encoded, Timestamps.Props>()({
    createdAt: prop(date),
    updatedAt: prop(date)
  })
{}

/** @ignore @internal @deprecated */
export type TimestampsConstructor = typeof Timestamps

function makeTimestamps() {
  const createdAt = new Date()
  return new Timestamps({
    createdAt,
    updatedAt: createdAt
  })
}

export const TimestampsProp = defaultProp(Timestamps, makeTimestamps)

export const TimestampProps = {
  timestamps: TimestampsProp
}

export interface HasTimestamps {
  timestamps: Timestamps
}

const lHasTimestamps = Lens.id<HasTimestamps>()
const lUpdatedAt = lHasTimestamps
  .prop("timestamps")
  .prop("updatedAt")

// TODO: Consider if we manage the timestamps manually, or update them at time of persistence commit.
/**
 * @tsplus fluent Configurator markUpdated
 */
export function markUpdated<T extends HasTimestamps>(t: T): T {
  return (lUpdatedAt as unknown as Lens<T, Date>).set_(t, new Date())
}

/**
 * @tsplus fluent Configurator modifyAndMarkUpdated
 */
export function modifyAndMarkUpdated<T extends HasTimestamps>(t: T, mod: (t: T) => T): T {
  return markUpdated(mod(t))
}

// codegen:start {preset: model}
//
/* eslint-disable */
export interface Timestamps {
  readonly createdAt: Date
  readonly updatedAt: Date
}
export namespace Timestamps {
  /**
   * @tsplus type Timestamps.Encoded
   */
  export interface Encoded {
    readonly createdAt: string
    readonly updatedAt: string
  }
  export const Encoded: EncodedOps = { $: {} }
  /**
   * @tsplus type Timestamps.Encoded/Aspects
   */
  export interface EncodedAspects {}
  /**
   * @tsplus type Timestamps.Encoded/Ops
   */
  export interface EncodedOps { $: EncodedAspects }
  export interface ConstructorInput
    extends ConstructorInputFromApi<typeof Timestamps> {}
  export interface Props extends GetProvidedProps<typeof Timestamps> {}
}
/* eslint-enable */
//
// codegen:end
