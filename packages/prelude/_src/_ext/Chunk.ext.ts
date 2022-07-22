import type { Ord, ROArray } from "@effect-ts-app/core/Prelude"
import { Chunk } from "@effect-ts-app/core/Prelude"

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
