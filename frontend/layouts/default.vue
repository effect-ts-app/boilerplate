<script setup lang="ts">
import { onMounted } from "vue"
import { useRouter } from "vue-router"
import { VueQueryDevtools } from "@tanstack/vue-query-devtools"
import { Result } from "~/composables/client"
import { GetMe } from "resources/Me"
import { apiClient } from "resources/lib"
import { flow, Effect } from "effect-app"
import { RpcResolver } from "@effect/rpc"
import { HttpRpcResolver } from "@effect/rpc-http"
import type { RpcRouter } from "@effect/rpc/RpcRouter"

// TODO: just build this into a new clientFor for now..
const resolver = flow(
  HttpRpcResolver.make<RpcRouter<GetMe, never>>,
  RpcResolver.toClient,
)
const meClient = apiClient.pipe(Effect.andThen(resolver))
const [userResult, currentUser, getCurrentUser] = useSafeQuery({
  mapPath: GetMe._tag,
  name: GetMe._tag,
  handler: meClient.pipe(
    Effect.andThen(cl => cl(new GetMe())),
    Effect.andThen(_ => ({ body: _, headers: {}, status: 200 })),
  ),
})

const appConfig = {
  title: "@effect-app/boilerplate",
}

useHead({
  title: appConfig.title,
})

const router = useRouter()

onMounted(() => {
  if (getUserId()) {
    void getCurrentUser()
  }
})
</script>

<template>
  <v-app>
    <v-app-bar app>
      <v-app-bar-title>
        <NuxtLink :to="{ name: 'index' }">Home</NuxtLink>
      </v-app-bar-title>

      <div>{{ router.currentRoute.value.name }}</div>
      &nbsp;
      <div v-if="Result.isInitial(userResult)">Loading...</div>
      <div v-else>
        <span v-if="currentUser">{{ currentUser.displayName }}</span>
        <span v-else>
          <a href="/login/No3o_xbwEh8z2gSbcantz">Login</a>
        </span>
      </div>
    </v-app-bar>
    <v-main>
      <slot />
    </v-main>

    <v-footer app>
      <!-- -->
    </v-footer>
    <VueQueryDevtools />
  </v-app>
</template>