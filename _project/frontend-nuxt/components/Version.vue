<template>
  <v-btn class="text-red" @click="reload()" v-if="!versionMatch"
    >trans(fe.version.button)</v-btn
  >
</template>

<script lang="ts" setup>
import alertAdd from "~~/composables/customAlert"
import { versionMatch } from "~~/plugins/runtime"

const customAlert = alertAdd

function reload() {
  window.location.reload()
}

async function onMismatch() {
  const chooseValue = await customAlert(
    {
      title: trans("fe.version.alert.title"),
      body: trans("fe.version.alert.body"),
    },
    {
      name: trans("fe.version.alert.yes"),
      color: "green",
      returnValue: true,
    },
    {
      name: trans("fe.version.alert.no"),
      color: "red",
      returnValue: false,
    }
  )

  chooseValue && reload()
}

onMounted(() => {
  if (!versionMatch.value) {
    void onMismatch()
  }
})

watch(versionMatch, equal => {
  if (!equal) {
    void onMismatch()
  }
})
</script>