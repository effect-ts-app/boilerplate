export interface ApiConfig {
  apiUrl: string
  headers?: Record<string, string>
}

export const ApiConfig = Has.tag<ApiConfig>()

export const getConfig = Effect.accessServiceM(ApiConfig)

export const LiveApiConfig = (config: ApiConfig) => Layer.fromFunction(ApiConfig)(() => config)
