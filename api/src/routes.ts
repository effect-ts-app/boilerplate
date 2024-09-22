import { matchAll } from "./lib/routing.js"
import * as Controllers from "./Usecases.js"

export const router = matchAll(Controllers)
