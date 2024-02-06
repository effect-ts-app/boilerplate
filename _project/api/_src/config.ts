import { BaseConfig } from "@effect-app-boilerplate/messages/config"

const STORAGE_VERSION = "1"

export const StorageConfig = Config.all({
  url: Config
    .secretURL("url")
    .withDefault(SecretURL.fromString("disk://.data"))
    .nested("storage"),
  dbName: BaseConfig.map(({ env, serviceName }) =>
    `${serviceName}${env === "prod" ? "" : env === "demo" ? "-demo" : "-dev"}`
  ),
  prefix: Config
    .string("prefix")
    .nested("storage")
    .orElse(() => BaseConfig.map(({ env }) => (env === "prod" ? "" : `${env}_v${STORAGE_VERSION}_`)))
})

export const AUTH_DISABLED = process.env["AUTH_DISABLED"] === "true"

export const RepoConfig = Config.all({
  fakeData: Config.string("fakeData").withDefault(""),
  fakeUsers: Config.string("fakeUsers").withDefault("sample")
})

const port = Config.integer("port").withDefault(3610)
export const ApiConfig = Config.all({
  host: Config.string("host").withDefault("0.0.0.0"),
  port,
  devPort: Config.integer("devPort").orElse(port.map((_) => _ + 1)),
  baseUrl: Config.string("baseUrl").withDefault("http://localhost:4000"),

  repo: RepoConfig,

  storage: StorageConfig
})

type ConfigA<Cfg> = Cfg extends Config.Variance<infer A> ? A : never

export interface ApiConfig extends ConfigA<typeof ApiConfig> {}

export interface ApiMainConfig extends ApiConfig, BaseConfig {}

export * from "@effect-app-boilerplate/messages/config"

export const MergedConfig = ApiConfig
  .andThen((apiConfig) => BaseConfig.andThen((baseConfig) => ({ ...baseConfig, ...apiConfig })))
  .cached
  .runSync
