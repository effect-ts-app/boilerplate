import type { Repository } from "@effect-app/infra/services/Repository"
import type { PersistenceModelType } from "@effect-app/infra/services/Store"
import { Effect } from "effect"

import * as Repo from "@effect-app/infra/services/Repository"

/**
 * @tsplus fluent Repository updateWithEffect
 */
export function itemUpdateWithEffect<
  R,
  E,
  T extends { id: string },
  PM extends PersistenceModelType<string>,
  Evt,
  ItemType extends string
>(
  repo: Repository<T, PM, Evt, ItemType>,
  id: T["id"],
  mod: (item: T) => Effect.Effect<T, E, R>
) {
  return Repo.get(repo, id).andThen(mod).andThen(Repo.save(repo))
}

/**
 * @tsplus fluent Repository update
 */
export function itemUpdate<
  T extends { id: string },
  PM extends PersistenceModelType<string>,
  Evt,
  ItemType extends string
>(
  repo: Repository<T, PM, Evt, ItemType>,
  id: T["id"],
  mod: (item: T) => T
) {
  return itemUpdateWithEffect(
    repo,
    id,
    (item) => Effect.sync(() => mod(item))
  )
}
