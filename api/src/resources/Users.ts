// codegen:start {preset: barrel, include: ./Users/*.ts, export: { as: 'PascalCase' }, nodir: false }
export * as Index from "./Users/Index"
// codegen:end

// codegen:start {preset: meta, sourcePrefix: src/resources/}
export const meta = { moduleName: "Users" }
// codegen:end
