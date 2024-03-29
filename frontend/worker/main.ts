import * as BrowserWorker from "@effect/platform-browser/BrowserWorker"
import * as EffectWorker from "@effect/platform/Worker"
import { Chunk, Effect, Option, Stream } from "effect"
import { Schedule } from "effect-app"
import type { WorkerMessage } from "resources/fixtures/schema.js"
import { GetPersonById, GetSpan, GetUserById, InitialMessage, Person, User } from "resources/fixtures/schema.js"
Effect.gen(function*($) {
  const pool = yield* $(EffectWorker.makePoolSerialized<WorkerMessage>({
    size: 1,
    initialMessage: () => new InitialMessage({ name: "custom", data: new Uint8Array([1, 2, 3]) })
  }))

  yield* $(Effect.gen(function* ($) {
    let user = yield* $(pool.executeEffect(new GetUserById({ id: 123 })))
    user = yield* $(
      pool.executeEffect(new GetUserById({ id: 123 })).pipe(
        Effect.tap(() => Effect.log("bla")),
        Effect.withLogSpan("foo")
      )
    )
    // assert.deepStrictEqual(user, new User({ id: 123, name: "custom" }))
    const people = yield* $(pool.execute(new GetPersonById({ id: 123 })), Stream.runCollect)
  }).pipe(Effect.delay("2 seconds"), Effect.forever))

  // assert.deepStrictEqual(Chunk.toReadonlyArray(people), [
  //   new Person({ id: 123, name: "test", data: new Uint8Array([1, 2, 3]) }),
  //   new Person({ id: 123, name: "ing", data: new Uint8Array([4, 5, 6]) })
  // ])
}).pipe(
  Effect.scoped,
  Effect.provide(
    BrowserWorker.layer(() => new globalThis.Worker(new URL("resources/fixtures/serializedWorker.js", import.meta.url), { type: "module"}))
  ),
  Effect.runPromise
).then(console.log, console.error)