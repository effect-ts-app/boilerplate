<script setup lang="ts">
import { BlogRsc } from "@effect-app-boilerplate/resources"

const blogClient = clientFor(BlogRsc)

const [, createPost_] = useMutation(blogClient.createPost)
const [r, , reloadPosts] = useSafeQuery(blogClient.getPosts)

const createPost = flow(createPost_, _ => _.then(_ => reloadPosts()))
</script>

<template>
  <div>
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
    Here's a Post List
    <QueryResult :result="r" v-slot="{ latest, refreshing }">
      <Delayed v-if="refreshing"><v-progress-circular /></Delayed>
      <ul>
        <li v-for="post in latest.items" :key="post.id">
          <nuxt-link :to="{ name: 'blog-id', params: { id: post.id } }">
            {{ post.title }}
          </nuxt-link>
          by {{ post.author.displayName }}
        </li>
      </ul>
    </QueryResult>
  </div>
</template>