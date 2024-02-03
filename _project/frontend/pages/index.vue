<script setup lang="ts">
import { HelloWorldRsc } from "@effect-app-boilerplate/resources"
import { buildFormFromSchema } from "@effect-app/vue/form"
import { S } from "~/utils/prelude"

const helloWorldClient = clientFor(HelloWorldRsc)
const schema = S.struct({
  title: S.NonEmptyString255,
  name: S.NonEmptyString2k,
  age: S.NonNegativeInt,
  email: S.Email,
})

const state = ref<S.Schema.From<typeof schema>>({
  title: "",
  name: "",
  age: 0,
  email: "",
})

const form = buildFormFromSchema(schema, state, v =>
  Promise.resolve(confirm("submitting: " + JSON.stringify(v))),
)

const [result, latestSuccess, execute] = useSafeQuery(
  helloWorldClient.get,
  () => ({
    echo: "Echo me at: " + new Date().getTime(),
  }),
)

onMounted(() => {
  const t = setInterval(() => execute().catch(console.error), 2000)
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
