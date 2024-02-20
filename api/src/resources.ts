import "./resources/lib/operations"
import type {} from "@effect/platform/Http/Client"

export { ClientEvents } from "./resources/Events"

// codegen:start {preset: barrel, include: ./resources/*.ts, exclude: [./resources/_global*.ts, ./resources/index.ts, ./resources/lib.ts, ./resources/integrationEvents.ts, ./resources/Messages.ts, ./resources/Views.ts, ./resources/errors.ts, ./resources/Events.ts], export: { as: 'PascalCase', postfix: 'Rsc' }}
export * as BlogRsc from "./resources/Blog"
export * as HelloWorldRsc from "./resources/HelloWorld"
export * as MeRsc from "./resources/Me"
export * as OperationsRsc from "./resources/Operations"
export * as UsersRsc from "./resources/Users"
// codegen:end
