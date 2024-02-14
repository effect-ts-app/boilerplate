import "./lib/operations.js"
import type {} from "@effect/platform/Http/Client"

export { ClientEvents } from "./Events.js"

// codegen:start {preset: barrel, include: ./*.ts, exclude: [./_global*.ts, ./index.ts, ./lib.ts, ./Views.ts, ./errors.ts, ./Events.ts], export: { as: 'PascalCase', postfix: 'Rsc' }}
export * as BlogRsc from "./Blog.js"
export * as HelloWorldRsc from "./HelloWorld.js"
export * as MeRsc from "./Me.js"
export * as OperationsRsc from "./Operations.js"
export * as UsersRsc from "./Users.js"
// codegen:end
