import dotenv from "dotenv"

import { SendgridConfig } from "@effect-app/infra/services/Emailer"

const envFile = "./.env.local"

const { error } = dotenv.config({ path: envFile })
if (error) {
  console.log("did not load .env.local")
} else {
  console.log("loading env from: " + envFile)
}

const FROM = {
  name: ReasonableString("@effect-app/boilerplate"),
  email: Email("noreply@example.com")
}

const serviceName = "@effect-app/boilerplate"

const envConfig = Config.string("ENV").withDefault("local-dev")

const SendgridConfig = Config.struct({
  realMail: Config.bool("REAL_MAIL").withDefault(false),
  apiKey: Config.secret("SENDGRID_API_KEY").withDefault(
    ConfigSecret.fromString("")
  ),
  defaultFrom: Config(FROM),
  subjectPrefix: envConfig.map(env => `[${serviceName}] [${env}] `)
})

export const BaseConfig = Config.struct({
  apiVersion: Config.string("API_VERSION").withDefault("local-dev"),
  serviceName: Config(serviceName),
  env: envConfig,
  sendgrid: SendgridConfig
  //  log: Config.string("LOG").
})
type ConfigA<Cfg> = Cfg extends Config.Variance<infer A> ? A : never
export interface BaseConfig extends ConfigA<typeof BaseConfig> {}

export const SB_PREFIX = "Endpoint=sb://"
