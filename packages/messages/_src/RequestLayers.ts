import { RequestContext } from "@effect-ts-app/boilerplate-infra/lib/RequestContext"
import { LiveContextMap } from "@effect-ts-app/boilerplate-infra/services/Store"
import { makeChild, WinstonInstance } from "@effect-ts-app/infra/logger/Winston"

function getRequestPars(pars: RequestContext) {
  return {
    request: pars,
    requestId: pars.id,
    requestLocale: pars.locale,
    requestName: pars.name
  }
}

export const RequestLayers = (pars: RequestContext) =>
  RequestContext.Live(pars) + LiveContextMap + Layer.fromEffect(WinstonInstance)(makeChild(getRequestPars(pars)))
