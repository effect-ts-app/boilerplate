import { basicRuntime } from "@effect-app-boilerplate/messages"
import * as ConfigProvider from "@effect/io/Config/Provider"
import { constantCase } from "change-case"
import { describe, expect, it } from "vitest"
import { ApiConfig } from "./config.js"

describe("nested", () => {
  it("default should work", () => {
    process.env["STORAGE_URL"] = "test5://"
    process.env["FAKE_DATA"] = "test1"
    process.env["HOST"] = "test2"
    const cfg = basicRuntime.runtime.runSync(ApiConfig.config)

    expect(cfg.fakeData)
      .toStrictEqual("test1")
    expect(cfg.storage.url.value)
      .toStrictEqual("test5://")
    expect(cfg.host)
      .toStrictEqual("test2")
  })

  it("customshould work", () => {
    const a = ConfigProvider.contramapPath(
      ConfigProvider.fromEnv({
        pathDelim: "__",
        seqDelim: ","
      }),
      constantCase
    )
    process.env["STORAGE__URL"] = "test5://"
    process.env["FAKE_DATA"] = "test1"
    process.env["HOST"] = "test2"
    const cfg = a.load(ApiConfig).runSync

    expect(cfg.fakeData)
      .toStrictEqual("test1")
    expect(cfg.storage.url.value)
      .toStrictEqual("test5://")
    expect(cfg.host)
      .toStrictEqual("test2")
  })
})
