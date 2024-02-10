import process from "process"

// https://v3.nuxtjs.org/api/configuration/nuxt.config
export default defineNuxtConfig({
  typescript: {
    tsConfig: { compilerOptions: { moduleResolution: "bundler" } },
  },
  sourcemap: {
    server: true,
    client: true,
  },
  build: {
    transpile: ["vuetify", "../../boilerplate/_project/schema"]
      // workaround for commonjs/esm module prod issue
      // https://github.com/nuxt/framework/issues/7698
      .concat(
        process.env.NODE_ENV === "production" ? ["vue-toastification"] : [],
      ),
  },
  runtimeConfig: {
    basicAuthCredentials: "",
    apiRoot: "http://127.0.0.1:3610",
    public: {
      baseUrl: "http://localhost:4000",
      feVersion: "-1",
      env: process.env.ENV ?? "local-dev",
    },
  },
  modules: ["@vueuse/nuxt"],
  // app doesn't need SSR, but also it causes problems with linking schema package.
  ssr: false,
  vite: {
    build: {
      sourcemap: true,
    },
    optimizeDeps: {
      include: [
        "@effect-app/vue/form",
        "@mdi/js",
        "@unhead/vue",

        "effect-app/utils",
        "@effect-app/vue/routeParams",
      ],
    },
    plugins: process.env.CI
      ? [
          // sentryVitePlugin({
          //   org: "???",
          //   project: "effect-app-boilerplate-api",
          //   authToken: "???",
          //   sourcemaps: {
          //     assets: "./.nuxt/dist/**",
          //   },
          //   debug: true,
          // }),
        ]
      : [],
  },
})
