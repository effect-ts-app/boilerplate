/* eslint-disable import/no-duplicates */
/* eslint-disable unused-imports/no-unused-imports */

import "@effect-ts-app/boilerplate-types/_global"

import "@effect-ts-app/boilerplate-infra/ext"
import "@effect-ts-app/boilerplate-infra/lib/instrument"
import "@effect-ts-app/boilerplate-infra/lib/rateLimit"

// Required for tsplus with project references in vscode..
/**
 * @tsplus global
 */
import { Delete, Get, Patch, Post } from "@effect-ts-app/boilerplate-prelude/schema"

/**
 * @tsplus global
 */
import { logger } from "@effect-ts-app/boilerplate-infra/lib/logger"
