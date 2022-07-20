import { addDays, subDays } from "date-fns"

declare global {
  /**
   * @tsplus type Date
   */
  interface Date {}
}

/**
 * @tsplus fluent Date addDays
 */
export const DateAddDays: (date: Date, amount: number) => Date = addDays
/**
 * @tsplus fluent Date subDays
 */
export const DateSubDays: (date: Date, amount: number) => Date = subDays
