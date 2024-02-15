// codegen:start {preset: barrel, include: ./Users/*.ts, export: { as: 'PascalCase' }, nodir: false }
export * as Index from "./Users/Index.js"
// codegen:end

// codegen:start {preset: meta}
export const meta = { moduleName: "Users" }
// codegen:end
