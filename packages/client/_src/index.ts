export { ClientEvents } from "./Events.js"

// codegen:start {preset: barrel, include: ./Resources/*.ts, export: { as: 'PascalCase', postfix: 'Rsc' }}
export * as HelloWorldRsc from "./Resources/HelloWorld.js"
export * as MeRsc from "./Resources/Me.js"
// codegen:end
