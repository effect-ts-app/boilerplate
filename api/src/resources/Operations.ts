// codegen:start {preset: barrel, include: ./Operations/*.ts, export: { as: 'PascalCase' }, nodir: false }
export * as Find from "./Operations/Find"
// codegen:end

// codegen:start {preset: meta, sourcePrefix: src/resources/}
export const meta = { moduleName: "Operations" }
// codegen:end
