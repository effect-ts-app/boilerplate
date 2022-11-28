<script setup lang="ts">
import { MeRsc } from "@effect-ts-app/boilerplate-demo-client"
import { isAfter } from "date-fns"

const meClient = clientFor(MeRsc)
const [userResult, currentUser, getCurrentUser] = useSafeQuery(meClient.get.mapPath, meClient.get)


const appConfig = {
  title: "@effect-ts-app/boilerplate"
}

useHead({
  title: appConfig.title
})

const router = useRouter()

onMounted(() => {
  if (getUserId()) {
    getCurrentUser()
  }
})
</script>

<template>
  <v-app>
    <v-app-bar app>
      <v-app-bar-title>
        <NuxtLink :to="{ name: 'index' }"><img :alt="appConfig.title" src="/img/logo.png" width="110"></NuxtLink>
      </v-app-bar-title>

      <div>{{ router.currentRoute.value.name }}</div>
      &nbsp;
      <div v-if="isInitializing(userResult)">Loading...</div>
      <div v-else>
        <span v-if="currentUser">{{ currentUser.name.firstName }} {{ currentUser?.name?.lastName }}</span>
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