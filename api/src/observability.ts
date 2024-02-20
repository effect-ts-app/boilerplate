/* eslint-disable @typescript-eslint/no-explicit-any */
import { dropUndefinedT } from "@effect-app/core/utils"
import * as Resource from "@effect/opentelemetry/Resource"
import * as Tracer from "@effect/opentelemetry/Tracer"
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node"
import { AsyncLocalStorageContextManager } from "@opentelemetry/context-async-hooks"
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http"
import opentelemetry from "@opentelemetry/sdk-node"
import type { Span } from "@opentelemetry/sdk-trace-node"
import { AlwaysOffSampler, BatchSpanProcessor, ConsoleSpanExporter } from "@opentelemetry/sdk-trace-node"
import * as Sentry from "@sentry/node"
import {
  getCurrentHub,
  SentryPropagator,
  SentrySampler,
  SentrySpanProcessor,
  setOpenTelemetryContextAsyncContextStrategy,
  setupEventContextTrace,
  setupGlobalHub,
  wrapContextManagerClass
} from "@sentry/opentelemetry"
import { Effect, Layer, Secret } from "effect-app"
import tcpPortUsed from "tcp-port-used"
import { BaseConfig } from "./config"

const appConfig = BaseConfig.runSync

class SentryFilteredSpanProcessor extends SentrySpanProcessor {
  override _shouldSendSpanToSentry(span: Span): boolean {
    return span.attributes["http.url"] !== "/.well-known/local/server-health"
  }
}

const NodeSdkLive = Effect
  .gen(function*($) {
    const isRemote = appConfig.env !== "local-dev"

    // TODO: use this on frontend trace proxy too
    const isTelemetryExporterRunning = !isRemote
      && (yield* $(Effect.promise<boolean>(() => tcpPortUsed.check(4318, "localhost"))))

    let props: Partial<opentelemetry.NodeSDKConfiguration> = dropUndefinedT({
      sampler: isTelemetryExporterRunning ? undefined : new AlwaysOffSampler(),
      spanProcessor: new BatchSpanProcessor(
        isTelemetryExporterRunning
          ? new OTLPTraceExporter({
            url: "http://localhost:4318/v1/traces"
          })
          : new ConsoleSpanExporter()
      )
    })

    if (isRemote) {
      setupGlobalHub()
    }

    Sentry.init(dropUndefinedT({
      dsn: Secret.value(appConfig.sentry.dsn),
      environment: appConfig.env,
      enabled: isRemote,
      release: appConfig.apiVersion,
      // Set tracesSampleRate to 1.0 to capture 100%
      // of transactions for performance monitoring.
      // We recommend adjusting this value in production
      tracesSampleRate: 1.0,
      // set the instrumenter to use OpenTelemetry instead of Sentry
      instrumenter: isRemote ? "otel" : undefined
    }))

    const resource = yield* $(Resource.Resource)

    if (isRemote) {
      const client = getCurrentHub().getClient()!
      setupEventContextTrace(client)

      // You can wrap whatever local storage context manager you want to use
      const SentryContextManager = wrapContextManagerClass(
        AsyncLocalStorageContextManager
      )

      props = {
        // Sentry config
        spanProcessor: new SentryFilteredSpanProcessor(),
        textMapPropagator: new SentryPropagator(),
        contextManager: new SentryContextManager(),
        sampler: new SentrySampler(client)
      }
    }

    const sdk = new opentelemetry.NodeSDK({
      traceExporter: new OTLPTraceExporter(),
      instrumentations: [getNodeAutoInstrumentations()],

      resource,

      ...props
    })

    // Ensure OpenTelemetry Context & Sentry Hub/Scope is synced
    setOpenTelemetryContextAsyncContextStrategy()

    yield* $(Effect.addFinalizer(() => Effect.promise(() => sdk.shutdown())))

    sdk.start()
  })
  .pipe(Layer.scopedDiscard)

export const TracingLive = Tracer.layerGlobal.pipe(
  Layer.provide(NodeSdkLive),
  Layer.provide(
    Resource.layer({
      serviceName: appConfig.serviceName,
      serviceVersion: appConfig.apiVersion
    })
  )
)
