import type { EmailMsgOptionalFrom } from "@effect-ts-app/boilerplate-infra/services/Emailer"

export interface SendMailRequest {
  readonly _tag: "SendMailRequest"
  readonly msg: EmailMsgOptionalFrom
}

export function SendMailRequest(msg: EmailMsgOptionalFrom): SendMailRequest {
  return { _tag: "SendMailRequest", msg }
}
