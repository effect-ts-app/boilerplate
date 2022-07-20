import type {
  ApiSelfType,
  DefaultSchema,
  NonEmptyString,
  Parser,
  SchemaDefaultSchema,
  SchemaUPI,
  Utils
} from "@effect-ts-app/schema"
import {
  annotate,
  brand,
  EParserFor,
  extendWithUtils,
  extendWithUtilsAnd,
  leafE,
  makeAnnotation,
  makeUuid,
  mapConstructorError,
  mapParserError,
  MNModel,
  named,
  nonEmpty,
  nonEmptyStringFromString,
  parseUuidE,
  refine
} from "@effect-ts-app/schema"
import type { Refinement } from "@effect-ts/core/Function"
import type * as FC from "fast-check"
import validator from "validator"
import { curriedMagix } from "../utils.js"

import type { Chunk } from "@effect-ts-app/prelude"
import type {
  ConstructorInputFromApi,
  GetProvidedProps,
  ParsedShapeOfCustom,
  ReasonableStringBrand,
  UnionBrand
} from "./_schema.js"
import {
  Arbitrary,
  arbitrary,
  Email as Email_,
  fakerArb,
  fromString,
  makeConstrainedFromString,
  prop,
  ReasonableString,
  string
} from "./_schema.js"

import { pipe } from "@effect-ts-app/core/Function"
import { Equal } from "@effect-ts-app/prelude"

/**
 * A string that is at least 3 character long and a maximum of 50.
 */
export interface ShortStringBrand extends ReasonableStringBrand {
  readonly ShortString: unique symbol
}

/**
 * A string that is at least 3 character long and a maximum of 50.
 */
export type ShortString = string & ShortStringBrand

/**
 * A string that is at least 3 character long and a maximum of 50.
 */
export const shortStringFromString = pipe(
  makeConstrainedFromString<ShortString>(3, 50),
  arbitrary(FC =>
    FC.lorem({ mode: "words", maxCount: 2 })
      .filter(x => x.length < 50 && x.length >= 3)
      .map(x => x as ShortString)
  ),
  // arbitrary removes brand benefit
  brand<ShortString>()
)

/**
 * A string that is at least 3 character long and a maximum of 50.
 */
export const ShortString = extendWithUtils(
  pipe(string[">>>"](shortStringFromString), brand<ShortString>())
)

/**
 * A string that is at least 3 character long and a maximum of 255.
 */
export interface ReasonableString3Brand extends ReasonableStringBrand {
  readonly ReasonableString3: unique symbol
}

/**
 * A string that is at least 3 character long and a maximum of 255.
 */
export type ReasonableString3 = string & ReasonableString3Brand

/**
 * A string that is at least 3 character long and a maximum of 255.
 */
export const reasonableString3FromString = pipe(
  makeConstrainedFromString<ReasonableString3>(3, 255),
  arbitrary(FC =>
    FC.lorem({ mode: "words", maxCount: 2 })
      .filter(x => x.length < 255 && x.length >= 3)
      .map(x => x as ReasonableString3)
  ),
  // arbitrary removes brand benefit
  brand<ReasonableString3>()
)

/**
 * A string that is at least 3 character long and a maximum of 255.
 */
export const ReasonableString3 = extendWithUtils(
  pipe(string[">>>"](reasonableString3FromString), brand<ReasonableString3>())
)

export const FirstName = ReasonableString["|>"](
  arbitrary(FC =>
    // eslint-disable-next-line @typescript-eslint/unbound-method
    fakerArb(faker => faker.name.firstName)(FC).map(x => x as ReasonableString)
  )
)
export type FirstName = ParsedShapeOfCustom<typeof FirstName>

export const DisplayName = FirstName
export type DisplayName = ParsedShapeOfCustom<typeof DisplayName>

export const LastName = ReasonableString["|>"](
  arbitrary(FC =>
    // eslint-disable-next-line @typescript-eslint/unbound-method
    fakerArb(faker => faker.name.lastName)(FC).map(x => x as ReasonableString)
  )
)
export type LastName = ParsedShapeOfCustom<typeof LastName>

export class FullName extends MNModel<
  FullName,
  FullName.ConstructorInput,
  FullName.Encoded,
  FullName.Props
>("FullName")({
  firstName: prop(FirstName),
  lastName: prop(LastName)
}) {
  static render(this: void, fn: FullName) {
    return `${fn.firstName} ${fn.lastName}` as ReasonableString
  }

  static create(this: void, firstName: FirstName, lastName: LastName) {
    return new FullName({ firstName, lastName })
  }
}
// @ts-expect-error bla
// eslint-disable-next-line unused-imports/no-unused-vars
type FullNameConstructor = typeof FullName

/**
 * @tsplus static FullName.Encoded.Ops create
 */
export function createFullName(firstName: string, lastName: string) {
  return { firstName, lastName }
}

/**
 * A string that is at least 6 characters long and a maximum of 50.
 */
export interface StringIdBrand extends ReasonableStringBrand {
  readonly StringId: unique symbol
}

/**
 * A string that is at least 6 characters long and a maximum of 50.
 */
export type StringId = string & StringIdBrand

const MIN_LENGTH = 6
const MAX_LENGTH = 50
export const stringIdFromString = pipe(
  makeConstrainedFromString<StringId>(MIN_LENGTH, MAX_LENGTH),
  arbitrary(FC =>
    // FC.base64String({ minLength: MIN_LENGTH, maxLength: MAX_LENGTH }).map(
    //   (x) => x.replace(/\+/g, ".").replace(/\//g, "_").replace(/=/g, "-") as StringId
    // )
    FC.uuid().map(x => x as StringId)
  ),
  // arbitrary removes the benefit of Brand,
  brand<StringId>()
)

/**
 * A string that is at least 6 characters long and a maximum of 50.
 */
export interface StringIdSchema extends
  SchemaDefaultSchema<
    unknown,
    StringId,
    string,
    string,
    ApiSelfType<StringId>
  >
{}
const StringIdSchema: StringIdSchema = string[">>>"](stringIdFromString)["|>"](
  brand<StringId>()
)
export const StringId = extendWithUtilsAnd(StringIdSchema, () => ({
  make(this: void): StringId {
    return makeUuid() as unknown as StringId
  }
}))

const stringIdArb = Arbitrary.for(StringId)

export const prefixedStringIdUnsafe = (prefix: string) => StringId(prefix + StringId.make())

export const prefixedStringIdUnsafeThunk = (prefix: string) => () => prefixedStringIdUnsafe(prefix)

export interface PrefixedStringIdSchema<
  Brand extends StringId,
  Prefix extends string,
  Separator extends string
> extends
  SchemaWithUtils<
    SchemaDefaultSchema<unknown, Brand, string, string, ApiSelfType<StringId>>
  >,
  PrefixedStringUtils<Brand, Prefix, Separator>
{}

export type SchemaWithUtils<Schema extends SchemaUPI> = Schema & Utils<Schema>

export function prefixedStringId<Brand extends StringId>() {
  return <Prefix extends string, Separator extends string = "-">(
    prefix: Prefix,
    name: string,
    separator?: Separator
  ): PrefixedStringIdSchema<Brand, Prefix, Separator> => {
    type FullPrefix = `${Prefix}${Separator}`
    // type PrefixedId = `${FullPrefix}${string}`

    const pref = `${prefix}${separator ?? "-"}` as FullPrefix
    const refinement = (x: StringId): x is Brand => x.startsWith(pref)
    const fromString = pipe(
      stringIdFromString,
      refine(refinement, n => leafE(parseUuidE(n))),
      arbitrary(FC =>
        stringIdArb(FC).map(
          x => (pref + x.substring(0, MAX_LENGTH - pref.length)) as Brand
        )
      )
    )

    const schema = string[">>>"](fromString)["|>"](named(name))["|>"](brand<Brand>())

    return extendWithUtilsAnd(
      schema,
      (ex): PrefixedStringUtils<Brand, Prefix, Separator> => ({
        EParser: EParserFor(ex),
        create: () => (pref + StringId.make()) as Brand,
        /**
         * Automatically adds the prefix.
         */
        unsafeFrom: (str: string) => ex(pref + str),
        /**
         * Must provide a literal string starting with prefix.
         */
        prefixSafe: <REST extends string>(str: `${Prefix}${Separator}${REST}`) => ex(str),
        is: refinement,
        prefix,
        eq: Equal.string as Equal<Brand>
      })
    )
  }
}

export interface PrefixedStringUtils<
  Brand extends StringId,
  Prefix extends string,
  Separator extends string
> {
  readonly EParser: Parser.Parser<string, any, Brand>
  readonly create: () => Brand
  readonly unsafeFrom: (str: string) => Brand
  prefixSafe: <REST extends string>(str: `${Prefix}${Separator}${REST}`) => Brand
  readonly is: (x: StringId) => x is Brand
  readonly prefix: Prefix
  eq: Equal<Brand>
}

export interface UrlBrand {
  readonly Url: unique symbol
}

export type Url = NonEmptyString & UrlBrand
// eslint-disable-next-line @typescript-eslint/ban-types
export const UrlFromStringIdentifier = makeAnnotation<{}>()

const isUrl: Refinement<string, Url> = (s: string): s is Url => {
  return validator.default.isURL(s, { require_tld: false })
}

// eslint-disable-next-line @typescript-eslint/ban-types
export const UrlFromString: DefaultSchema<string, Url, string, string, {}> = pipe(
  fromString,
  arbitrary(FC => FC.webUrl()),
  nonEmpty,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any,@typescript-eslint/no-unsafe-return,@typescript-eslint/no-unsafe-member-access
  mapParserError(_ => ((_ as any).errors as Chunk<any>).unsafeHead().error),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any,@typescript-eslint/no-unsafe-return,@typescript-eslint/no-unsafe-member-access
  mapConstructorError(_ => ((_ as any).errors as Chunk<any>).unsafeHead().error),
  refine(isUrl, n => leafE(parseUuidE(n))),
  brand<Url>(),
  annotate(UrlFromStringIdentifier, {})
)
// eslint-disable-next-line @typescript-eslint/ban-types
export const UrlIdentifier = makeAnnotation<{}>()

export const Url = extendWithUtils(
  pipe(
    string[">>>"](UrlFromString),
    // eslint-disable-next-line @typescript-eslint/unbound-method
    arbitrary(FC => fakerArb(faker => faker.internet.url)(FC) as FC.Arbitrary<Url>),
    brand<Url>(),
    annotate(UrlIdentifier, {})
  )
)

export const avatarUrl = pipe(string[">>>"](nonEmptyStringFromString))
  ["|>"](
    arbitrary(
      // eslint-disable-next-line @typescript-eslint/unbound-method
      FC => fakerArb(faker => faker.internet.avatar)(FC) as FC.Arbitrary<Url>
    )
  )
  ["|>"](brand<avatarUrl>())

export type avatarUrl = NonEmptyString & UnionBrand

export const customUrlFromString = (pool: readonly Url[]) =>
  pipe(
    UrlFromString,
    arbitrary(FC => FC.oneof(...pool.map(FC.constant))),
    brand<Url>()
  )

export const customUrl = (pool: readonly Url[]) => pipe(string[">>>"](customUrlFromString(pool)), brand<Url>())

// for now be less restrictive about the PhoneNumber
const PhoneNumber_ = StringId
export const PhoneNumber = PhoneNumber_["|>"](
  arbitrary(FC =>
    // eslint-disable-next-line @typescript-eslint/unbound-method
    fakerArb(faker => faker.phone.phoneNumber)(FC).map(x => x as StringId)
  )
)["|>"](brand<PhoneNumber>())

export type PhoneNumber = StringId & UnionBrand

const endsWith = curriedMagix(
  (e: Email) => (s: string) => e.toLowerCase().endsWith(s.toLowerCase())
)
const Email__ = Object.assign(
  extendWithUtils(
    Email_["|>"](
      arbitrary(FC =>
        // eslint-disable-next-line @typescript-eslint/unbound-method
        fakerArb(faker => faker.internet.email)(FC).map(x => x as Email)
      )
    )["|>"](brand<Email>())
  ),
  {
    eq: { equals: (a: Email, b: Email) => a.toLowerCase() === b.toLowerCase() },
    endsWith,
    toDomain: (email: Email) => ReasonableString(email.split("@")[1]),
    isDomain: curriedMagix(
      (e: Email) => (domain: string) => endsWith._("@" + domain, e)
    ),
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    toDisplayName: (e: Email) => e.split("@")[0]
  }
)
type EmailSchema__ = typeof Email__
export interface EmailSchema extends EmailSchema__ {}
export const Email: EmailSchema = Email__
export type Email = ParsedShapeOfCustom<typeof Email_> & {
  split: (separator: "@") => [ReasonableString, ReasonableString]
}

// codegen:start {preset: model}
//
/* eslint-disable */
export interface FullName {
  readonly firstName: ReasonableString
  readonly lastName: ReasonableString
}
export namespace FullName {
  /**
   * @tsplus type FullName.Encoded
   */
  export interface Encoded {
    readonly firstName: string
    readonly lastName: string
  }
  export const Encoded: EncodedOps = { $: {} }
  /**
   * @tsplus type FullName.Encoded.Aspects
   */
  export interface EncodedAspects {}
  /**
   * @tsplus type FullName.Encoded.Ops
   */
  export interface EncodedOps { $: EncodedAspects }
  export interface ConstructorInput
    extends ConstructorInputFromApi<typeof FullName> {}
  export interface Props extends GetProvidedProps<typeof FullName> {}
}
/* eslint-enable */
//
// codegen:end
