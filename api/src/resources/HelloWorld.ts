// codegen:start {preset: barrel, import: star, include: ./HelloWorld/*.ts, nodir: false, modulegen: true }
import * as get from "./HelloWorld/Get.js"

type Id<T> = T
/* eslint-disable @typescript-eslint/no-empty-object-type */

export interface Get extends Id<typeof get> {}
export const Get: Get = get
// codegen:end

// codegen:start {preset: meta, sourcePrefix: src/resources/}
export const meta = { moduleName: "HelloWorld" }
// codegen:end
