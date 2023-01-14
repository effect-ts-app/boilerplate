import * as Ex from "@effect-ts-app/infra/express/index"
import c from "express-compression"

export function compression(options?: any) {
  return Ex.classic(c(options))
}
