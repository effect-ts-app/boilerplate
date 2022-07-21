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
  <div class="about">
    <h1>This is an about page</h1>
    <div v-if="result._tag === 'Initial' || result._tag === 'Loading'">Loading...</div>
    <div v-else>
      <pre v-if="latestSuccess" v-html="JSON.stringify(latestSuccess, undefined, 2)" />
      <pre v-if="result.current._tag === 'Left'" v-html="JSON.stringify(result.current.left, undefined, 2)" />
      <div v-if="result._tag === 'Refreshing'">Refreshing...</div>
    </div>
  </div>
</template>

<style>
@media (min-width: 1024px) {
  .about {
    min-height: 100vh;
    display: flex;
    align-items: center;
  }
}
</style>
