<script setup lang="ts">
useApiEventSource()
import "./worker/main"
</script>
<template>
  <v-no-ssr>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </v-no-ssr>
</template>
