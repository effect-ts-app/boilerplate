import cp from "child_process"
import util from "util"
import { tempFile } from "../lib/fileUtil.js"

import { isTruthy } from "@effect-ts-app/core/utils"
import fs from "fs"
import os from "os"
import path from "path"
import { Logger, logger } from "../lib/logger.js"
import type { PrinterId } from "./CUPS/service.js"
import { CUPS } from "./CUPS/service.js"

export * from "./CUPS/service.js"

/**
 * @tsplus static CUPS.Ops Live
 */
export function LiveCUPS(cupsServer?: URL) {
  return Layer.fromEffect(CUPS)(makeCUPS(cupsServer))
}

function makeCUPS(cupsServer?: URL) {
  return Effect.gen(function*($) {
    const logger = yield* $(Logger)
    const loggerL = Layer.fromValue(Logger, logger)
    function print_(buffer: ArrayBuffer, printerId: PrinterId) {
      const print = printBuffer({
        id: printerId,
        url: cupsServer
      })
      return print(buffer)
        .provideSomeLayer(loggerL)
    }
    return {
      print: print_,
      getAvailablePrinters: getAvailablePrinters(cupsServer?.host).provideSomeLayer(loggerL)
    }
  })
}

const exec_ = util.promisify(cp.exec)
const exec = (command: string) =>
  logger.debug(`Executing: ${command}`)
    > Effect.tryPromise(() => exec_(command))
      .tap(r => (logger.debug(`Executed result: ${JSON.stringify(r, undefined, 2)}`)))
type PrinterConfig = { url?: URL; id: string }

function printFile(printer?: PrinterConfig) {
  return (filePath: string) => printFile_(filePath, printer)
}

function printFile_(filePath: string, printer?: PrinterConfig) {
  return exec(["lp", ...buildPrintArgs(filePath, printer)].join(" "))
}

function* buildPrintArgs(filePath: string, printer?: PrinterConfig) {
  if (printer) {
    if (printer.url) {
      yield `-h ${printer.url.host}`
      if (printer.url.username) {
        yield `-U ${printer.url.username}`
      }
    }
    yield `-d "${printer.id}"`
  }
  yield `"${filePath}"`
}

const tempDirName = StringId.make()

export const prepareTempDir = Effect.sync(() => {
  // TODO
  try {
    fs.mkdirSync(path.join(os.tmpdir(), tempDirName))
  } catch (err) {
    if (`${err}`.includes("EEXIST")) {
      return
    }
    throw err
  }
})

const makeTempFile = tempFile(tempDirName)
const makePrintJobTempFile = makeTempFile("print-job")

function printBuffer(printer: PrinterConfig) {
  return (buffer: ArrayBuffer) =>
    makePrintJobTempFile(Buffer.from(buffer))
      .flatMapScoped(printFile(printer))
}

function getAvailablePrinters(host?: string) {
  return Do($ => {
    const { stdout } = $(exec(["lpstat", ...buildListArgs({ host }), "-s"].join(" ")))
    return [...stdout.matchAll(/device for (\w+):/g)]
      .map(_ => _[1])
      .filter(isTruthy)
      .map(ReasonableString)
  })
}

function* buildListArgs(config?: { host?: string }) {
  if (config?.host) {
    yield `-h ${config.host}`
  }
}
