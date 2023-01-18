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
      <v-btn
        @click="
          createPost({
            title: S.NonEmptyString255('empty'),
            body: S.NonEmptyString2k('A body'),
          })
        "
      >
        Create new post
      </v-btn>
    </div>
  </div>
</template>