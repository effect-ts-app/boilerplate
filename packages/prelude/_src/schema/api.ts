import { PositiveNumber } from "./overrides.js"

// codegen:start {preset: barrel, include: ./api/*.ts}
export * from "./api/date.js"
// codegen:end

// TODO: true decimal
export const PositiveDecimal = PositiveNumber
export type PositiveDecimal = PositiveNumber
