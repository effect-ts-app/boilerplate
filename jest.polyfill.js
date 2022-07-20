require("core-js/stable")
require("regenerator-runtime/runtime")

const COMPILED = !!process.env.TEST_COMPILED

if (!COMPILED) {
  require("@effect-ts-app/core/fluent/polyfill/node")
}
require("@effect-ts/system/Tracing/Enable")