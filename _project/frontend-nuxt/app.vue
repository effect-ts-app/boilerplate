<script setup lang="ts">
import { useApiEventSource } from "./composables/eventsource"

useApiEventSource()
</script>
<template>
  <v-no-ssr>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </v-no-ssr>
</template>
