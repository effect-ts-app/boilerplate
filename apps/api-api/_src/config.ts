import { ENV } from "@effect-ts-app/boilerplate-messages/config"

export function API() {
  const {
    FAKE_DATA = "",
    HOST = "0.0.0.0",
    PORT: PROVIDED_PORT = "3651",
    STORAGE_PREFIX: PROVIDED_STORAGE_PREFIX,
    STORAGE_URL = "mem://"
  } = process.env
  const PORT = parseInt(PROVIDED_PORT)

  const STORAGE_VERSION = "1"
  const STORAGE_PREFIX = PROVIDED_STORAGE_PREFIX ?? (ENV === "prod" ? "" : `${ENV}_v${STORAGE_VERSION}_`)

  return {
    FAKE_DATA,
    HOST,
    PORT,
    STORAGE_URL,
    STORAGE_PREFIX
  }
}

export * from "@effect-ts-app/boilerplate-messages/config"
