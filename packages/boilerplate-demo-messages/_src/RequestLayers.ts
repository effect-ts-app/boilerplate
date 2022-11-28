import { RequestContext } from "@effect-ts-app/boilerplate-infra/lib/RequestContext"
import { LiveContextMap } from "@effect-ts-app/boilerplate-infra/services/Store"

export const RequestLayers = (pars: RequestContext) => RequestContext.Live(pars) + LiveContextMap
