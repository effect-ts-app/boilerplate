import { describe, expect, it } from "vitest"

import { basicRuntime } from "@effect-app-boilerplate/messages"
import { camelCase, constantCase } from "change-case"
import { ApiConfig } from "./config.js"

describe("nested", () => {
  it("default should work", () => {
    process.env["STORAGE_URL"] = "test5://"
    process.env["FAKE_DATA"] = "test1"
    process.env["HOST"] = "test2"
    const cfg = basicRuntime.runtime.unsafeRunSync(ApiConfig.config)

    expect(cfg.fakeData)
      .toStrictEqual("test1")
    expect(cfg.storage.url.value)
      .toStrictEqual("test5://")
    expect(cfg.host)
      .toStrictEqual("test2")
  })

  it("customshould work", () => {
    const a = ConfigProvider.fromEnv({
      pathDelim: "__",
      seqDelim: ",",
      conversion: constantCase,
      reverseConversion: camelCase
    })
    process.env["STORAGE__URL"] = "test5://"
    process.env["FAKE_DATA"] = "test1"
    process.env["HOST"] = "test2"
    const cfg = a.load(ApiConfig).unsafeRunSync

    expect(cfg.fakeData)
      .toStrictEqual("test1")
    expect(cfg.storage.url.value)
      .toStrictEqual("test5://")
    expect(cfg.host)
      .toStrictEqual("test2")
  })
})
