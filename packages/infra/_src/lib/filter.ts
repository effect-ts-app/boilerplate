import { Where } from "@effect-ts-app/boilerplate-infra/services/Store"
import type { FieldValues } from "./filter/types/fields.js"
import type { FieldPath, FieldPathValue } from "./filter/types/path/eager.js"

/**
 * the function defaults to "eq", but has additional properties for notEq, in and notIn
 */
export interface WhereFilter<TFieldValues extends FieldValues> extends ReturnType<typeof makeWhereFilter_<TFieldValues>> {}
export function makeWhereFilter<TFieldValues extends FieldValues>() {
  const f = makeWhereFilter_<TFieldValues>()
  return f as WhereFilter<TFieldValues>
}

function makeHelpers<TFieldValues extends FieldValues>() {
  const helpers = makeHelpers_<TFieldValues>()
  return helpers as WhereHelpers<TFieldValues>
}

export interface WhereHelpers<TFieldValues extends FieldValues> extends ReturnType<typeof makeHelpers_<TFieldValues>> {}

function makeHelpers_<TFieldValues extends FieldValues>() {
  type Paths = FieldPath<TFieldValues>
  type Value<TFieldName extends Paths> = FieldPathValue<TFieldValues, TFieldName>

  return {
    in<TFieldName extends Paths, V extends Value<TFieldName>>(
      this: void,
      path: TFieldName,
      value: readonly V[]
    ) {
      return { key: path, value, t: "in" as const }
    },
    notIn<TFieldName extends Paths, V extends Value<TFieldName>>(
      this: void,
      path: TFieldName,
      value: readonly V[]
    ) {
      return { key: path, value, t: "not-in" as const }
    },
    eq<TFieldName extends Paths, V extends Value<TFieldName>>(
      this: void,
      path: TFieldName,
      value: V
    ) {
      return { key: path, value, t: "eq" as const }
    },
    notEq<TFieldName extends Paths, V extends Value<TFieldName>>(
      this: void,
      path: TFieldName,
      value: V
    ) {
      return { key: path, value, t: "not-eq" as const }
    }
  } satisfies Record<string, (...args: any[]) => Where>
}

function makeWhereFilter_<TFieldValues extends FieldValues>() {
  const helpers = makeHelpers<TFieldValues>()
  const f = Object.assign(helpers.eq, helpers)
  return f
}



// export function makeFilter<TFieldValues extends FieldValues>() {
//   const f = makeFilter_<TFieldValues>()
//   return f as WhereFilterHelper<TFieldValues>
// }

// export interface WhereFilterHelper<TFieldValues extends FieldValues> extends ReturnType<typeof makeFilter_<TFieldValues>> {}

// function makeFilter_<TFieldValues extends FieldValues>() {
//   function eq<TFieldName extends FieldPath<TFieldValues>, V extends FieldPathValue<TFieldValues, TFieldName>>(
//     path: TFieldName,
//     value: V
//   ) {
//     return { key: path, value, t: "eq" as const }
//   }
//   const f = Object.assign(eq satisfies (...args: any[]) => Where, {
//     in<TFieldName extends FieldPath<TFieldValues>, V extends FieldPathValue<TFieldValues, TFieldName>>(
//       path: TFieldName,
//       value: readonly V[]
//     ) {
//       return { key: path, value, t: "in" as const }
//     },
//     notIn<TFieldName extends FieldPath<TFieldValues>, V extends FieldPathValue<TFieldValues, TFieldName>>(
//       path: TFieldName,
//       value: readonly V[]
//     ) {
//       return { key: path, value, t: "not-in" as const }
//     },
//     eq,
//     notEq<TFieldName extends FieldPath<TFieldValues>, V extends FieldPathValue<TFieldValues, TFieldName>>(
//       path: TFieldName,
//       value: V
//     ) {
//       return { key: path, value, t: "not-eq" as const }
//     }
//   } satisfies Record<string, (...args: any[]) => Where>)
//   return f
// }
