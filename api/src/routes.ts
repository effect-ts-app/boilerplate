import { matchAll } from "./lib/matchFor.js"
import * as Controllers from "./Usecases.js"

export const router = matchAll(Controllers)
