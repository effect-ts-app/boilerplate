import crypto from "crypto"
import type EventEmitter from "events"
import type { BaseEncodingOptions, Mode, OpenMode } from "fs"
import fs from "fs/promises"
import type internal from "stream"

import os from "os"
import path from "path"

export function readFile(fileName: string) {
  return Effect.tryPromise(() => fs.readFile(fileName))
}

export function tempFile(
  folder: string
) {
  return (prefix: string) => (data: Data, options?: Options) => tempFile_(folder, prefix, data, options)
}

type Data =
  | string
  | NodeJS.ArrayBufferView
  | Iterable<string | NodeJS.ArrayBufferView>
  | AsyncIterable<string | NodeJS.ArrayBufferView>
  | internal.Stream

type Options =
  | BufferEncoding
  | (BaseEncodingOptions & {
    mode?: Mode | undefined
    flag?: OpenMode | undefined
  } & EventEmitter.Abortable)
  | null
  | undefined
export function tempFile_(
  folder: string,
  prefix: string,
  data: Data,
  options?: Options
) {
  return Effect.sync(() => path.join(os.tmpdir(), folder, `${prefix}-` + crypto.randomUUID()))
    .flatMap(fp =>
      Effect.acquireRelease(
        Effect.tryPromise(() => fs.writeFile(fp, data, options))
          .map(_ => fp),
        p => Effect.promise(() => fs.unlink(p))
      )
    )
}
