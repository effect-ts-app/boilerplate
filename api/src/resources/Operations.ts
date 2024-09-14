// codegen:start {preset: barrel, import: star, include: ./Operations/*.ts, nodir: false, modulegen: true }
import * as find from "./Operations/Find.js"

type Id<T> = T
/* eslint-disable @typescript-eslint/no-empty-object-type */

export interface Find extends Id<typeof find> {}
export const Find: Find = find
// codegen:end

// codegen:start {preset: meta, sourcePrefix: src/resources/}
export const meta = { moduleName: "Operations" }
// codegen:end
