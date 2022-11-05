import { Logger } from "@effect-ts-app/infra/logger/Logger"
import { Emailer } from "./service.js"

const makeFake = Logger.withEffect(logger =>
  logger.debug("FAKE Emailer Service enabled")
    .map((): Emailer => ({
      sendMail(msg) {
        return logger.debug(`Fake send mail ${JSON.stringify(msg, undefined, 2)}`)
      }
    }))
)

/**
 * @tsplus static Emailer.Ops Fake
 */
export const FakeSendgrid = Layer.fromEffect(Emailer)(makeFake)
