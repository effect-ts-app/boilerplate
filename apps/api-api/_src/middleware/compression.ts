import * as Ex from "@effect-app/infra-adapters/express/index"
import c from "express-compression"

export function compression(options?: any) {
  return Ex.classic(c(options))
}
