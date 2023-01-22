import { BaseConfig } from "@effect-app-boilerplate/messages/config"

const STORAGE_VERSION = "1"

const StorageConfig = Config.struct({
  url: Config.secretURL("url").withDefault(ConfigSecretURL.fromString("mem://")),
  dbName: BaseConfig.map(({ env, serviceName }) =>
    `${serviceName}${env === "prod" ? "" : env === "demo" ? "-demo" : "-dev"}`
  ),
  prefix: Config.string("prefix").orElse(() =>
    BaseConfig.map(({ env }) => (env === "prod" ? "" : `${env}_v${STORAGE_VERSION}_`))
  )
}).nested("storage")

export const ApiConfig = Config.struct({
  host: Config.string("host").withDefault("0.0.0.0"),
  port: Config.integer("port").withDefault(3610),

  fakeData: Config.string("fakeData").withDefault(""),
  fakeUsers: Config.string("fakeUsers").withDefault("sample"),

  storage: StorageConfig
})

type ConfigA<Cfg> = Cfg extends Config.Variance<infer A> ? A : never

export interface ApiConfig extends ConfigA<typeof ApiConfig> {}

export interface ApiMainConfig extends ApiConfig, BaseConfig {}

export * from "@effect-app-boilerplate/messages/config"
