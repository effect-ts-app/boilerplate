import Toast from "vue-toastification"

// Import the CSS or use your own!
import "vue-toastification/dist/index.css"

export default defineNuxtPlugin(nuxtApp => {
  nuxtApp.vueApp.use("default" in Toast ? (Toast as any).default : Toast, {})
})
