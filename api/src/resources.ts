import "./resources/lib/operations.js"
import type {} from "@effect/platform/Http/Client"

export { ClientEvents } from "./resources/Events.js"

// codegen:start {preset: barrel, include: ./Usecases/*.ts, exclude: [./Usecases/*Controllers.ts, ./resources/_global*.ts, ./resources/index.ts, ./resources/lib.ts, ./resources/integrationEvents.ts, ./resources/Messages.ts, ./resources/Views.ts, ./resources/errors.ts, ./resources/Events.ts], export: { as: 'PascalCase', postfix: 'Rsc' }}
export * as BlogRsc from "./Usecases/Blog.js"
export * as HelloWorldRsc from "./Usecases/HelloWorld.js"
export * as MeRsc from "./Usecases/Me.js"
export * as MessagesRsc from "./Usecases/Messages.js"
export * as OperationsRsc from "./Usecases/Operations.js"
export * as UsersRsc from "./Usecases/Users.js"
// codegen:end
