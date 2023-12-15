import type { AllowAnonymous } from "@effect-app-boilerplate/resources/lib"
import type { RequestContext } from "@effect-app/infra/RequestContext"
import type { UserProfile } from "api/services.js"

export interface CTX {
  context: RequestContext
}

export type GetCTX<Req> =
  & CTX
  & (AllowAnonymous<Req> extends true ? {
      userProfile?: UserProfile
    }
    // eslint-disable-next-line @typescript-eslint/ban-types
    : { userProfile: UserProfile })

export type GetContext<Req> = AllowAnonymous<Req> extends true ? never
  // eslint-disable-next-line @typescript-eslint/ban-types
  : UserProfile
