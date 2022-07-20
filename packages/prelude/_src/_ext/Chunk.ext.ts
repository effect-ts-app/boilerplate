import type { Ord, ROArray } from "@effect-ts-app/prelude"
import { Chunk } from "@effect-ts-app/prelude"

/**
 * @tsplus fluent ets/Chunk mapWithIndex
 */
export const mapWithIndex_ = Chunk.mapWithIndex_

/**
 * @tsplus fluent ets/Chunk sortByFIXME
 */
export const sortBy_ = Chunk.sortBy_ as <A>(
  as: Chunk<A>,
  ords: ROArray<Ord<A>>
) => Chunk<A>
