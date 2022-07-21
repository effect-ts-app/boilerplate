import { makeOpenApiSpecs } from "@effect-ts-app/infra/express/makeOpenApiSpecs"
import type { RouteDescriptorAny } from "@effect-ts-app/infra/express/schema/routing"
import * as Plutus from "@effect-ts-app/infra/Openapi/atlas-plutus"
import { writeTextFile } from "@effect-ts-app/infra/simpledb/fileutil"

import { typedValuesOf } from "@effect-ts-app/core/utils"
import { logger } from "./logger.js"

export function writeOpenapiDocs(rdescs: Record<string, Record<string, RouteDescriptorAny>>) {
  return makeOpenApiSpecs(
    typedValuesOf(rdescs).reduce((prev, cur) => prev.concat(typedValuesOf(cur)), [] as readonly RouteDescriptorAny[])
      .sortWith(Ord.contramap_(Ord.string, (a: RouteDescriptorAny) => a.path)),
    Plutus.info({
      title: "@effect-ts-app/boilerplate-api",
      version: "X",
      pageTitle: "@effect-ts-app/boilerplate-api"
    })
  )
    .map(_ => ({
      ..._,
      tags: [
        // add the tags here
      ]
    }))
    .flatMap(_ => writeTextFile("./openapi.json", JSON.stringify(_, undefined, 2)).orDie())
    .flatMap(() => logger.info("OpenAPI spec written to './openapi.json'"))
}
