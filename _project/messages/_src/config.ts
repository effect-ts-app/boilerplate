import dotenv from "dotenv"
import { Config as C, S, Secret } from "effect-app"

const envFile = "./.env.local"

const { error } = dotenv.config({ path: envFile })
if (error) {
  console.log("did not load .env.local")
} else {
  console.log("loading env from: " + envFile)
}

const FROM = {
  name: S.NonEmptyString255("@effect-app/boilerplate"),
  email: S.Email("noreply@example.com")
}

const serviceName = "effect-app-boilerplate"

export const envConfig = C.string("env").pipe(C.withDefault("local-dev"))

export const SendgridConfig = C.all({
  realMail: C.boolean("realMail").pipe(C.withDefault(false)),
  apiKey: C.secret("sendgridApiKey").pipe(C.withDefault(
    Secret.fromString("")
  )),
  defaultFrom: C.succeed(FROM),
  subjectPrefix: envConfig.pipe(C.map((env) => env === "prod" ? "" : `[${serviceName}] [${env}] `))
})

export const BaseConfig = C.all({
  apiVersion: C.string("apiVersion").pipe(C.withDefault("local-dev")),
  serviceName: C.succeed(serviceName),
  env: envConfig,
  sendgrid: SendgridConfig,
  sentry: C.all({
    dsn: C
      .secret("dsn")
      .pipe(
        C.nested("sentry"),
        C.withDefault(
          Secret.fromString(
            "???"
          )
        )
      )
  })
  //  log: C.string("LOG").
})
type ConfigA<Cfg> = Cfg extends C.Config<infer A> ? A : never
export interface BaseConfig extends ConfigA<typeof BaseConfig> {}

export const SB_PREFIX = "Endpoint=sb://"
