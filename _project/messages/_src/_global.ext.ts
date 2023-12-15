import { isBefore, startOfDay, subHours, subMinutes } from "date-fns"
import "./basicRuntime.js"

/**
 * @tsplus getter Date startOfDay
 */
export const Date_startOfDay = startOfDay

/**
 * @tsplus fluent Date isBefore
 */
export const Date_isBefore = isBefore

/**
 * @tsplus fluent Date subHours
 */
export const Date_subHours = subHours

/**
 * @tsplus fluent Date subMinutes
 */
export const DateSubMinutes: (date: Date, amount: number) => Date = subMinutes
