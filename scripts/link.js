import pj from '../package.json'  assert { type: 'json' };

pj.resolutions = {
  ...pj.resolutions,
  "@effect-app/core": "file:../libs/packages/core",
  "@effect-app/eslint-codegen-model": "file:../libs/packages/eslint-codegen-model",
  "effect-app": "file:../libs/packages/prelude",
  "@effect-app/fluent-extensions": "file:../libs/packages/fluent-extensions",
  "@effect-app/infra": "file:../libs/packages/infra",
  "@effect-app/infra-adapters": "file:../libs/packages/infra-adapters",
  "@effect-app/schema": "file:../libs/packages/schema",
  "@effect-app/vue": "file:../libs/packages/vue"
}

import fs from "fs"
import cp from "child_process"

fs.writeFileSync("./package.json", JSON.stringify(pj, null, 2))

cp.execSync("pnpm i", { stdio: "inherit" })