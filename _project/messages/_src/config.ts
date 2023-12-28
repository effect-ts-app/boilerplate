import dotenv from "dotenv"

const envFile = "./.env.local"

const { error } = dotenv.config({ path: envFile })
if (error) {
  console.log("did not load .env.local")
} else {
  console.log("loading env from: " + envFile)
}

const FROM = {
  name: NonEmptyString255("@effect-app/boilerplate"),
  email: Email("noreply@example.com")
}

const serviceName = "effect-app-boilerplate"

export const envConfig = Config.string("env").withDefault("local-dev")

export const SendgridConfig = Config.all({
  realMail: Config.boolean("realMail").withDefault(false),
  apiKey: Config.secret("sendgridApiKey").withDefault(
    Secret.fromString("")
  ),
  defaultFrom: Config(FROM),
  subjectPrefix: envConfig.map((env) => env === "prod" ? "" : `[${serviceName}] [${env}] `)
})

export const BaseConfig = Config.all({
  apiVersion: Config.string("apiVersion").withDefault("local-dev"),
  serviceName: Config(serviceName),
  env: envConfig,
  sendgrid: SendgridConfig,
  sentry: Config.all({
    dsn: Config
      .secret("dsn")
      .nested("sentry")
      .withDefault(
        Secret.fromString(
          "???"
        )
      )
  })
  //  log: Config.string("LOG").
})
type ConfigA<Cfg> = Cfg extends Config.Variance<infer A> ? A : never
export interface BaseConfig extends ConfigA<typeof BaseConfig> {}

export const SB_PREFIX = "Endpoint=sb://"
