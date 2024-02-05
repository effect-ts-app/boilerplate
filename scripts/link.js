import pj from '../package.json'  assert { type: 'json' };

pj.resolutions = {
  ...pj.resolutions,
  "@effect-app/core": "file:../effect-app/libs/packages/core",
  "@effect-app/eslint-codegen-model": "file:../effect-app/libs/packages/eslint-codegen-model",
  "@effect-app/prelude": "file:../effect-app/libs/packages/prelude",
  "@effect-app/fluent-extensions": "file:../effect-app/libs/packages/fluent-extensions",
  "@effect-app/infra": "file:../effect-app/libs/packages/infra",
  "@effect-app/infra-adapters": "file:../effect-app/libs/packages/infra-adapters",
  "@effect-app/schema": "file:../effect-app/libs/packages/schema",
  "@effect-app/vue": "file:../effect-app/libs/packages/vue"
}

import fs from "fs"
import cp from "child_process"

fs.writeFileSync("./package.json", JSON.stringify(pj, null, 2))

cp.execSync("pnpm i", { stdio: "inherit" })