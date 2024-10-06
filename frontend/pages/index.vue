<script setup lang="ts">
import { useSafeQuery } from "@effect-app/vue"
import { buildFormFromSchema } from "@effect-app/vue/form"
import { RpcResolver } from "@effect/rpc"
import { HttpRpcResolver } from "@effect/rpc-http"
import type { RpcRouter } from "@effect/rpc/RpcRouter"
import { Effect, flow, S } from "effect-app"
import { GetHelloWorld } from "resources/HelloWorld"
import { apiClient } from "resources/lib"

const schema = S.Struct({
  title: S.NonEmptyString255,
  name: S.NonEmptyString2k,
  age: S.NonNegativeInt,
  email: S.Email,
})

const state = ref<S.Schema.Encoded<typeof schema>>({
  title: "",
  name: "",
  age: 0,
  email: "",
})

const form = buildFormFromSchema(schema, state, v =>
  Promise.resolve(confirm("submitting: " + JSON.stringify(v))),
)

const makeReq = () => ({
  echo: "Echo me at: " + new Date().getTime(),
})

const req = ref(makeReq())

// TODO: just build this into a new clientFor for now..
const resolver = flow(
  HttpRpcResolver.make<RpcRouter<GetHelloWorld, never>>,
  RpcResolver.toClient,
)
const helloWorldClient = apiClient.pipe(Effect.andThen(resolver))
const [result] = useSafeQuery({
  mapPath: GetHelloWorld._tag,
  name: GetHelloWorld._tag,
  handler: helloWorldClient.pipe(
    Effect.andThen(cl => cl(new GetHelloWorld(req.value))), // TODO: watch computed
    Effect.andThen(_ => ({ body: _, headers: {}, status: 200 })),
  ),
})

// onMounted(() => {
//   setInterval(() => {
//     // Fallback to the default focus check
//     focusManager.setFocused(false)

//     // Override the default focus state
//     focusManager.setFocused(true)
//   }, 2000)
// })

onMounted(() => {
  const t = setInterval(() => (req.value = makeReq()), 5000)
  return () => clearInterval(t)
})
</script>

<template>
  <div>
    Hi world!
    <v-form @submit.prevent="form.submit">
      <template v-for="(field, name) in form.fields" :key="name">
        <!-- TODO: field.type text, or via length, or is multiLine -->
        <!-- <TextArea
          v-if="field.type === 'text' && name === 'name'"
          rows="2"
          :label="name"
          placeholder="name, or company and next line: name"
          v-model="state[name]"
          :field="field"
        /> -->
        <TextField
          :label="name"
          :placeholder="name"
          v-model="state[name]"
          :field="field"
        />
      </template>
    </v-form>

    <QueryResult :result="result" v-slot="{ latest, refreshing }">
      <Delayed v-if="refreshing"><v-progress-circular /></Delayed>
      <div>
        <pre v-html="JSON.stringify(latest, undefined, 2)" />
      </div>
    </QueryResult>
  </div>
</template>
