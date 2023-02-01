<script setup lang="ts">
import { unsafe } from "@effect-app/schema"
import { ClientEvents } from "@effect-app-boilerplate/resources"
import { serverEventHub } from "./composables/bus"
import { onMountedWithCleanup } from "./composables/onMountedWithCleanup"
import { runtime } from "./plugins/runtime"

const parseEvent = unsafe(ClientEvents.Parser)
onMountedWithCleanup(() => {
  const source = new EventSource("/api/events")

  const listener = (message: MessageEvent<any>) => {
    console.log("Got", message)
    const evt = parseEvent(JSON.parse(message.data))
    runtime.value!.runSync(serverEventHub.offer(evt))
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
