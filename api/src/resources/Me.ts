// codegen:start {preset: barrel, import: star, include: ./Me/*.ts, nodir: false, modulegen: true }
import * as get from "./Me/Get.js"

type Id<T> = T
/* eslint-disable @typescript-eslint/no-empty-object-type */

export interface Get extends Id<typeof get> {}
export const Get: Get = get
// codegen:end

// codegen:start {preset: meta, sourcePrefix: src/resources/}
export const meta = { moduleName: "Me" }
// codegen:end
