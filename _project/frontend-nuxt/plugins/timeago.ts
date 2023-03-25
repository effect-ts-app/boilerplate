import timeago from "vue-timeago3"

export default defineNuxtPlugin(nuxtApp => {
  nuxtApp.vueApp.use(timeago)
})
