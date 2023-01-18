<script setup lang="ts">
import { BlogRsc } from "@effect-app-boilerplate/resources"
import { BlogPostId } from "@effect-app-boilerplate/models/Blog"

const { id } = useRouteParams({ id: BlogPostId })

const blogClient = clientFor(BlogRsc)
const [, latestPost, reloadPost] = useSafeQuery(blogClient.findPost, {
  id,
})

const progress = ref("")
const [publishing, publish] = useAndHandleMutation(
  {
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
  <div v-if="latestPost">
    <v-btn @click="publish({ id })" :disabled="publishing.loading">
      Publish to all blog sites {{ publishing.loading ? `(${progress})` : "" }}
    </v-btn>
    <div>Title: {{ latestPost.title }}</div>
    <div>Body: {{ latestPost.body }}</div>
  </div>
</template>