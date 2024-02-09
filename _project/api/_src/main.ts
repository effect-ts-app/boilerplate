import "@effect-app/fluent-extensions"
import { runMain } from "@effect-app-boilerplate/messages/basicRuntime"

/* eslint-disable @typescript-eslint/no-explicit-any */
import { api, devApi } from "@effect-app-boilerplate/api/api"
import { setFaker } from "@effect-app/prelude/faker"
import { faker } from "@faker-js/faker"
import { Layer } from "effect"
import { MergedConfig } from "./config.js"
import { TracingLive } from "./observability.js"

setFaker(faker)

const logConfig = MergedConfig.andThen((cfg) => console.debug(`Config: ${JSON.stringify(cfg, undefined, 2)}`))

const program = devApi
  .provide(api)
  .provide(logConfig.pipe(Layer.scopedDiscard))
  .provide(TracingLive)

// NOTE: all dependencies should have been provided, for us to be able to run the program.
// if you get a type error here on the R argument, you haven't provided that dependency yet, or not at the appropriate time / location
runMain(program.launch)
