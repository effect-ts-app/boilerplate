// codegen:start {preset: barrel, include: ./HelloWorld/*.ts, export: { as: 'PascalCase' }, nodir: false }
export * as Get from "./HelloWorld/Get.js"
// codegen:end

// codegen:start {preset: meta, sourcePrefix: src/resources/}
export const meta = { moduleName: "HelloWorld" }
// codegen:end
