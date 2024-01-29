// codegen:start {preset: barrel, include: ./Operations/*.ts, export: { as: 'PascalCase' }, nodir: false }
export * as Find from "./Operations/Find.js"
// codegen:end

// codegen:start {preset: meta}
export const meta = { moduleName: "Operations" }
// codegen:end
