<script setup lang="ts">
import { HelloWorldRsc } from "@effect-app-boilerplate/resources"

const helloWorldClient = clientFor(HelloWorldRsc)

// TODO
const [result, latestSuccess, execute] = useSafeQueryWithArg(
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
    <div>
      <div v-if="result._tag === 'Initial' || result._tag === 'Loading'">
        Loading...
      </div>
      <div v-else>
        <pre
          v-if="latestSuccess"
          v-html="JSON.stringify(latestSuccess, undefined, 2)"
        />
        <pre
          v-if="result.current._tag === 'Left'"
          v-html="JSON.stringify(result.current.left, undefined, 2)"
        />
        <div v-if="result._tag === 'Refreshing'">Refreshing...</div>
      </div>
    </div>
  </div>
</template>
