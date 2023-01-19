import * as Ex from "@effect-app/infra-adapters/express/index"
import bodyParser_ from "body-parser"

const bodyParser = {
  json: bodyParser_.json.bind(bodyParser_),
  urlencoded: bodyParser_.urlencoded.bind(bodyParser_)
}
export function urlEncoded(options?: bodyParser_.OptionsUrlencoded) {
  return Ex.classic(bodyParser.urlencoded(options))
}

export function json(options?: bodyParser_.OptionsJson) {
  return Ex.classic(bodyParser.json(options))
}
