<script setup lang="ts">
import { BlogRsc } from "@effect-app-boilerplate/resources"
import { BlogPostId } from "@effect-app-boilerplate/models/Blog"

const { id } = useRouteParams({ id: BlogPostId })

const blogClient = clientFor(BlogRsc)
const [, latestPost] = useSafeQueryWithArg(blogClient.findPost, { id })
</script>

<template>
  <div v-if="latestPost">
    <div>Title: {{ latestPost.title }}</div>
    <div>Body: {{ latestPost.body }}</div>
  </div>
</template>