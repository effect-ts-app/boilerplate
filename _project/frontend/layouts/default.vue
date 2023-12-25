<script setup lang="ts">
import { MeRsc } from "@effect-app-boilerplate/resources"
import { isInitializing } from "@effect-app/vue"
import { onMounted } from "vue"
import { useRouter } from "vue-router"

const meClient = clientFor(MeRsc)
// TODO
const [userResult, currentUser, getCurrentUser] = useSafeQueryWithArg(
  meClient.get,
  {},
)

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
      <div v-if="isInitializing(userResult)">Loading...</div>
      <div v-else>
        <span v-if="currentUser">{{ currentUser.displayName }}</span>
      </div>
    </v-app-bar>
    <v-main>
      <slot />
    </v-main>

    <v-footer app>
      <!-- -->
    </v-footer>
  </v-app>
</template>