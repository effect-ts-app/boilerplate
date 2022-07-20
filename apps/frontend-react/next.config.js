// @ts-check

if (require("fs").existsSync("./styles")) {
  require("fs").copyFileSync("./src/styles/globals.css", "./styles/globals.css")
}

const isBundled = !require("fs").existsSync("../../packages/types")
const withTM = isBundled
  ? (a) => a
  : require("next-transpile-modules")([
      "@effect-ts-app/boilerplate-prelude",
      "@effect-ts-app/boilerplate-types",
      "@effect-ts-app/boilerplate-client",
    ])

const CI = !!process.env.CI
const POLYFILL = !CI && process.env.NODE_ENV !== "production"
if (POLYFILL) {
  // means you have to run `yarn build` in prelude...
  require("@effect-ts-app/boilerplate-prelude/_ext/Prelude.polyfill")
  require("@effect-ts-app/core/fluent/polyfill/browser")
}

// @ts-ignore
const withPolyfill = POLYFILL
  ? require("next-with-polyfill")(["@effect-ts-app/boilerplate-prelude/_ext/Prelude.polyfill", "@effect-ts-app/core/fluent/polyfill/browser"])
  : (a) => a
// @ts-ignore
const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
})

// This file sets a custom webpack configuration to use your Next.js app
// with Sentry.
// https://nextjs.org/docs/api-reference/next.config.js/introduction
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

const { withSentryConfig } = require("@sentry/nextjs")

const SentryWebpackPluginOptions = {
  // Additional config options for the Sentry Webpack plugin. Keep in mind that
  // the following options are set automatically, and overriding them is not
  // recommended:
  //   release, url, org, project, authToken, configFile, stripPrefix,
  //   urlPrefix, include, ignore

  silent: true, // Suppresses all logs
  // For all available options, see:
  // https://github.com/getsentry/sentry-webpack-plugin#options.
}

const PROVIDED_AUTH_DISABLED = process.env.AUTH_DISABLED || "false"
const BASIC_AUTH_CREDENTIALS = process.env.BASIC_AUTH_CREDENTIALS
const AUTH_DISABLED = PROVIDED_AUTH_DISABLED === "true"

const serverRuntimeConfig = {
  BASIC_AUTH_CREDENTIALS,
  API_ROOT: process.env.API_ROOT || "http://localhost:3540",
}

const publicRuntimeConfig = {
  ENV: process.env.ENV || "local-dev",
  AUTH_DISABLED,

  SENTRY_DSN:
    process.env.SENTRY_DSN ??
    process.env.NEXT_PUBLIC_SENTRY_DSN,

  // burned into the Docker image
  FE_VERSION: process.env.FE_VERSION ?? "default",
}

console.log("Configuring nextJS, config: ", {
  serverRuntimeConfig,
  publicRuntimeConfig,
})

/**
 * @type {import("next/dist/server/config").NextConfig}
 **/
const nextConfig = {
  reactStrictMode: false,
  serverRuntimeConfig,
  publicRuntimeConfig,

  webpack(config, options) {
    //console.log("$$ webpack\n " + JSON.stringify(config, undefined, 2))
    // We need tsconfig paths to point to /src in tsconfig.json for development - in conjunction with Project References.
    // but Next should find them in /dist instead.
    //if (CI) {
      config.resolve.plugins = config.resolve.plugins.map((p) => {
        if (!p.paths) {
          return p
        }
        //const before = p.paths
        p.paths = Object.entries(p.paths).reduce((prev, [key, value]) => {
          prev[key] = value.map((s) =>
            key.includes("@/*")
              ? CI ? s.replace("/src", "") : s
              : s.endsWith("*")
              ? s.replace("_src/*", "dist/*")
              : s.replace("/_src", "/dist")
          )
          return prev
        }, {})

        //console.log("$$ paths", before, "after", p.paths)
        return p
      })
    //}

    // // also minimize the server bundle
    // if (config.name === "server" && config.mode === "production") {
    //   config.optimization.minimize = true
    // }

    return config
  },
  typescript: {
    // in Local dev, causes errors because paths /src is not part of the typescript project (would have to be /dist instead)
    // on the CI we adapt the tsconfig accordingly however.
    ignoreBuildErrors: true,
  },
  eslint: {
    // we are running the eslint from within the build step ourselves
    ignoreDuringBuilds: true,
  },
  // @ts-ignore
  images: {
    domains: [
      "localhost",
    ],
  },
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: "/api/naked-proxy/:path*",
          destination: `${serverRuntimeConfig.API_ROOT}/:path*`, // Proxy to Backend
        },
      ],
      afterFiles: [],
      fallback: [],
    }
  },
  i18n: {
    locales: ["en-US", "de-DE"],
    defaultLocale: "en-US",
    localeDetection: false,
  },
}


module.exports = withSentryConfig(
  withPolyfill(withBundleAnalyzer(withTM(nextConfig))),
  SentryWebpackPluginOptions
)
