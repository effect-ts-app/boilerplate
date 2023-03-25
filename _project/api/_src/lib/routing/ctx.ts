import type { RequestContext } from "@effect-app/infra/RequestContext"
import type { UserProfileScheme } from "api/services.js"

export interface CTX {
  context: RequestContext
  // TODO: user only defined in Context when allowAnonymous = false
  user: UserProfileScheme
}
