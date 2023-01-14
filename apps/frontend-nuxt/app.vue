<script setup lang="ts">
import { unsafe } from "@effect-ts-app/schema"
import { ClientEvents } from "@effect-ts-app/boilerplate-client"

const parseEvent = unsafe(ClientEvents.Parser)
onMountedWithCleanup(() => {
  const source = new EventSource("/api/events")

  const listener = (message: MessageEvent<any>) => {
    console.log("Got", message)
    const evt = parseEvent(JSON.parse(message.data))
    bus.emit("serverEvents", evt)
  }
  source.addEventListener("message", listener)

  return () => {
    console.log("$closing source")
    source.removeEventListener("message", listener)
    source.close()
  }
})
</script>
<template>
  <v-no-ssr>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </v-no-ssr>
</template>
