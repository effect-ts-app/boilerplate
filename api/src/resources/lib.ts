// codegen:start {preset: barrel, include: ./lib/*.ts, exclude: ./lib/schema.ts}
export * from "./lib/client.js"
export * from "./lib/req.js"
// codegen:end

export * as S from "./lib/schema.js"

export { clientFor2 as clientFor } from "effect-app/client/clientFor2"
