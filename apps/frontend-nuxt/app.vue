<script setup lang="ts">
import { makeRun } from "./lib/client";
import { helloWorldClient } from "@effect-ts-app/boilerplate-client/HelloWorld";
import { onMounted } from "vue";

const { data, loading, error, execute } = makeRun(helloWorldClient.get);

onMounted(() => {
  execute().catch(console.error);
});
</script>
<template>
  <div>
    <div v-if="loading">Loading...</div>
    <pre v-if="data" v-html="JSON.stringify(data, undefined, 2)"></pre>
    <pre v-if="error" v-html="JSON.stringify(error, undefined, 2)"></pre>
    <NuxtWelcome />
  </div>
</template>
