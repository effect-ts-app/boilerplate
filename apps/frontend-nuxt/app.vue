<script setup lang="ts">
import { makeRun } from "@effect-ts-app/boilerplate-vue/client";
import { helloWorldClient } from "@effect-ts-app/boilerplate-client/HelloWorld";
import { onMounted } from "vue";

const [result, latestSuccess, execute] = makeRun(helloWorldClient.get);

onMounted(() => {
  const t = setInterval(() => execute().catch(console.error), 2000)
  return () => clearInterval(t)
});
</script>

<template>
  <div>
    <div v-if="result._tag === 'Initial' || result._tag === 'Loading'">Loading...</div>
    <div v-else>
      <pre v-if="latestSuccess" v-html="JSON.stringify(latestSuccess, undefined, 2)" />
      <pre v-if="result.current._tag === 'Left'" v-html="JSON.stringify(result.current.left, undefined, 2)" />
      <div v-if="result._tag === 'Refreshing'">Refreshing...</div>
    </div>
    <NuxtWelcome />
  </div>
</template>
