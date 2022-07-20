import { typedKeysOf } from "../utils.js"

declare global {
  /**
   * @tsplus type Date
   */
  interface Date {}

  // /**
  //  * @tsplus type Record
  //  */
  // interface Record<K, V> {}

  /**
   * @tsplus type Object
   */
  interface Object {}
}

/**
 * @tsplus getter Record $values
 * @tsplus getter Object $values
 */
export const RecordValues = Object.values

/**
 * @tsplus getter Record $keys
 * @tsplus getter Object $keys
 */
export const RecordKeys = typedKeysOf

/**
 * @tsplus getter Record $entries
 * @tsplus getter Object $entries
 */
export const RecordEntries: <T, TKey extends PropertyKey>(o: Record<TKey, T>) => [TKey, T][] = Object.entries
