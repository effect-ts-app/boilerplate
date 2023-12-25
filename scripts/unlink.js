import pj from '../package.json'  assert { type: 'json' };

pj.resolutions = Object.entries(pj.resolutions).reduce((acc, [k, v]) => {
  if (k.startsWith("@effect-app/")) { return acc }
  acc[k] = v
  return acc
}, {})

import fs from "fs"
import cp from "child_process"

fs.writeFileSync("./package.json", JSON.stringify(pj, null, 2))

cp.execSync("pnpm i", { stdio: "inherit" })