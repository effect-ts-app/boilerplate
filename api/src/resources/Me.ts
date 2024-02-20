// codegen:start {preset: barrel, include: ./Me/*.ts, export: { as: 'PascalCase' }, nodir: false }
export * as Get from "./Me/Get"
// codegen:end

// codegen:start {preset: meta, sourcePrefix: src/resources/}
export const meta = { moduleName: "Me" }
// codegen:end
