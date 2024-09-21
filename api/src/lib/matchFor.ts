import type { UserProfile } from "api/services.js"
import { type CTX, handleRequestEnv } from "./RequestEnv.js"
import { makeRouter } from "./router.js"

type CTXMap = { allowAnonymous: ["userProfile", UserProfile, false] }
// type GetCTX<T> =
//   & {
//     [key in keyof CTXMap as key extends keyof T ? T[key] extends true ? CTXMap[key][0] : never : never]: CTXMap[key][1]
//   }
//   & {
//     [key in keyof CTXMap as key extends keyof T ? T[key] extends false ? CTXMap[key][0] : never : CTXMap[key][0]]?:
//       CTXMap[key][1]
//   }

// type Values<T extends Record<any, any>> = T[keyof T]

// type GetContext<T> = Values<
//   {
//     [key in keyof CTXMap as key extends keyof T ? T[key] extends true ? CTXMap[key][0] : never : never]: CTXMap[key][1]
//   }
// >

// type Test = GetContext<typeof GetHelloWorld>
// type Test2 = GetContext<typeof GetMe>

export const { matchAll, matchFor } = makeRouter<CTX, CTXMap>(handleRequestEnv)
