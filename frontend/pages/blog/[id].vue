<script setup lang="ts">
import { BlogRsc } from "resources"
import type { ClientEvents } from "resources"
import { BlogPostId } from "models/Blog"
import { useSafeQuery } from "@effect-app/vue"
import { Effect } from "effect-app"
import { clientFor } from "effect-app/client"
import { bus } from "../../composables/bus"
import {
  useAndHandleMutation,
  refreshAndWaitForOperation,
} from "../../composables/client"
import { onMountedWithCleanup } from "../../composables/onMountedWithCleanup"
import { useRouteParams } from "../../composables/useRouteParams"

const { id } = useRouteParams({ id: BlogPostId })

const blogClient = clientFor(BlogRsc)
const [r, , reloadPost] = useSafeQuery(blogClient.findPost, {
  id,
})

const bogusOutput = ref<ClientEvents>()

onMountedWithCleanup(() => {
  const callback = (_: ClientEvents) => {
    bogusOutput.value = _
  }
  bus.on("serverEvents", callback)
  return () => {
    bus.off("serverEvents", callback)
  }
})

const progress = ref("")
const [publishing, publish] = useAndHandleMutation(
  {
    ...blogClient.publishPost,
    handler: refreshAndWaitForOperation(
      blogClient.publishPost.handler,
      Effect.promise(() => reloadPost()),
      op => {
        progress.value = `${op.progress?.completed}/${op.progress?.total}`
      },
    ),
  },
  "Publish Blog Post",
)
</script>

<template>
  <div v-if="bogusOutput">
    The latest bogus event is: {{ bogusOutput.id }} at {{ bogusOutput.at }}
  </div>
  <QueryResult :result="r" v-slot="{ latest, refreshing }">
    <Delayed v-if="refreshing"><v-progress-circular /></Delayed>
    <div>
      <v-btn @click="publish({ id })" :disabled="publishing.loading">
        Publish to all blog sites
        {{ publishing.loading ? `(${progress})` : "" }}
      </v-btn>
      <div>Title: {{ latest.title }}</div>
      <div>Body: {{ latest.body }}</div>
      by {{ latest.author.displayName }}
    </div>
  </QueryResult>
</template>