import { BaseConfig } from "@effect-app-boilerplate/messages/config"

const STORAGE_VERSION = "1"

const StorageConfig = Config.struct({
  url: Config.secretURL("STORAGE_URL").withDefault(ConfigSecretURL.fromString("mem://")),
  dbName: BaseConfig.map(({ env, serviceName }) =>
    `${serviceName}${env === "prod" ? "" : env === "demo" ? "-demo" : "-dev"}`
  ),
  prefix: Config.string("STORAGE_PREFIX").orElse(() =>
    BaseConfig.map(({ env }) => (env === "prod" ? "" : `${env}_v${STORAGE_VERSION}_`))
  )
})

export const ApiConfig = Config.struct({
  host: Config.string("HOST").withDefault("0.0.0.0"),
  port: Config.integer("PORT").withDefault(3610),

  fakeData: Config.string("FAKE_DATA").withDefault(""),
  fakeUsers: Config.string("FAKE_USERS").withDefault("sample"),

  storage: StorageConfig
})

type ConfigA<Cfg> = Cfg extends Config.Variance<infer A> ? A : never

export interface ApiConfig extends ConfigA<typeof ApiConfig> {}

export interface ApiMainConfig extends ApiConfig, BaseConfig {}

export * from "@effect-app-boilerplate/messages/config"
