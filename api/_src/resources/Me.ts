// codegen:start {preset: barrel, include: ./Me/*.ts, export: { as: 'PascalCase' }, nodir: false }
export * as Get from "./Me/Get.js"
// codegen:end

// codegen:start {preset: meta}
export const meta = { moduleName: "Me" }
// codegen:end
