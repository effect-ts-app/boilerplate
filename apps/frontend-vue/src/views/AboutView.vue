<script setup lang="ts">
import { onMounted } from "vue";
import { helloWorldClient } from "@effect-ts-app/boilerplate-client/HelloWorld";
import { makeRun } from "@/lib/client.js";

const { data, loading, error, execute } = makeRun(helloWorldClient.get);

onMounted(() => {
  execute().catch(console.error);
});
</script>

<template>
  <div class="about">
    <h1>This is an about page</h1>
    <div v-if="loading">Loading...</div>
    <pre v-if="data" v-html="JSON.stringify(data, undefined, 2)"></pre>
    <pre v-if="error" v-html="JSON.stringify(error, undefined, 2)"></pre>
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
