<script setup lang="ts">
import { BlogRsc } from "@effect-app-boilerplate/resources"

const blogClient = clientFor(BlogRsc)

const [, createPost] = useMutation(blogClient.createPost)
const [, latestPosts] = useSafeQuery(blogClient.getPosts)
</script>

<template>
  <div>
    Here's a Post List

    <ul v-if="latestPosts">
      <li v-for="post in latestPosts.items" :key="post.id">
        {{ post.title }}
      </li>
    </ul>

    <div>
      a new Title and a new body
      <button
        @click="
          createPost({
            title: MO.ReasonableString('empty'),
            body: MO.LongString('A body'),
          })
        "
      >
        Create new post
      </button>
    </div>
  </div>
</template>