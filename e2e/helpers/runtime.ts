import { Option } from "@effect-app/prelude"
// import { UsersRsc } from "@macs-configurator/resources"
import { makeHeadersHashMap, makeRuntime } from "./shared.js"

// const userClient = clientFor(UsersRsc)

const baseUrl = process.env["BASE_URL"] ?? "http://localhost:5500"

export async function makeRuntimes(namespace: string) {
  const { runtime: anonRuntime } = makeRuntime(
    {
      apiUrl: `${baseUrl}/api`,
      headers: Option.some(makeHeadersHashMap(namespace))
    }
  )

  // const users = await anonRuntime.runPromise(userClient.index).then(_ => _.body.users)

  // const managerId = users.find(_ => _.displayName === "Bobby" || _.displayName === "Alex")!.id
  // const { runtime: managerRuntime } = makeRuntime(
  //   {
  //     apiUrl: `${baseUrl}/api`,
  //     headers: Option.some(makeHeadersHashMap(namespace, managerId))
  //   }
  // )
  // const userId = users.find(_ => _.displayName === "Max" || _.displayName === "Abel")!.id
  // const { runtime: userRuntime } = makeRuntime(
  //   {
  //     apiUrl: `${baseUrl}/api`,
  //     headers: Option.some(makeHeadersHashMap(namespace, userId))
  //   }
  // )

  return {
    anonRuntime
    // managerRuntime,
    // userRuntime
  }
}
