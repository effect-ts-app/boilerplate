<script setup lang="ts">
import { BlogRsc } from "@effect-app-boilerplate/resources"
import type { ClientEvents } from "@effect-app-boilerplate/resources"
import { BlogPostId } from "@effect-app-boilerplate/models/Blog"

const { id } = useRouteParams({ id: BlogPostId })

const blogClient = clientFor(BlogRsc)
const [, latestPost, reloadPost] = useSafeQueryWithArg(blogClient.findPost, {
  id,
})

const bogusOutput = ref<ClientEvents>()

onMountedWithCleanup(() => {
  const callback = (_: ClientEvents) => {
    bogusOutput.value = _
  }
  const f = runtime().runFork(
    pipe(
      Effect.never(),
      Effect.provideSomeLayer(
        Layer.scopedDiscard(
          pipe(
            serverEventHub.subscribe(),
            Effect.flatMap(subscription =>
              pipe(
                subscription.take(),
                Effect.flatMap(v => Effect.sync(() => callback(v))),
                Effect.forever
              )
            )
          )
        )
      )
    )
  )

  return () => {
    runtime().runFork(Fiber.interrupt(f))
  }
})

const progress = ref("")
const [publishing, publish] = useAndHandleMutation(
  refreshAndWaitForOperation(
    blogClient.publishPost,
    Effect.promise(() => reloadPost()),
    op => {
      progress.value = `${op.progress?.completed}/${op.progress?.total}`
    }
  ),
  "Publish Blog Post"
)
</script>

<template>
  <div v-if="bogusOutput">
    The latest bogus event is: {{ bogusOutput.id }} at {{ bogusOutput.at }}
  </div>
  <div v-if="latestPost">
    <v-btn @click="publish({ id })" :disabled="publishing.loading">
      Publish to all blog sites {{ publishing.loading ? `(${progress})` : "" }}
    </v-btn>
    <div>Title: {{ latestPost.title }}</div>
    <div>Body: {{ latestPost.body }}</div>
  </div>
</template>