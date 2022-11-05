import { defineNuxtPlugin } from "#imports"
import { createVuetify } from "vuetify"
import { aliases, mdi } from "vuetify/iconsets/mdi-svg"

import * as components from "vuetify/components"
import * as directives from "vuetify/directives"

export default defineNuxtPlugin(nuxtApp => {
  const vuetify = createVuetify({
    components,
    directives,
    icons: {
      defaultSet: "mdi",
      aliases,
      sets: {
        mdi
      }
    },
    display: {
      thresholds: {
        xs: 340,
        sm: 540,
        md: 800,
        lg: 1280
      }
    }
  })

  nuxtApp.vueApp.use(vuetify)
})
