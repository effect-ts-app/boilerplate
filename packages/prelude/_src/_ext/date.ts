import { addDays, subDays } from "date-fns"

declare global {
  /**
   * @tsplus type Date
   */
  interface Date { }
  

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
 * @tsplus fluent Date addDays
 */
export const DateAddDays: (date: Date, amount: number) => Date = addDays
/**
 * @tsplus fluent Date subDays
 */
export const DateSubDays: (date: Date, amount: number) => Date = subDays
