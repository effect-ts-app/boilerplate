// import {
//   ConsoleSpanExporter,
//   SimpleSpanProcessor,
// } from "@opentelemetry/tracing"
// import { CollectorTraceExporter } from "@opentelemetry/exporter-collector"
// import { WebTracerProvider } from "@opentelemetry/web"
// import { ZoneContextManager } from "@opentelemetry/context-zone"
// import { B3Propagator } from "@opentelemetry/propagator-b3"

// const provider = new WebTracerProvider()

// // Configure a span processor and exporter for the tracer
// provider.addSpanProcessor(new SimpleSpanProcessor(new ConsoleSpanExporter()))
// provider.addSpanProcessor(new SimpleSpanProcessor(new CollectorTraceExporter())) // url is optional and can be omitted - default is http://localhost:55681/v1/trace

// provider.register({
//   contextManager: new ZoneContextManager(),
//   propagator: new B3Propagator(),
// })
import { layer } from "@effect/opentelemetry/WebSdk"
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http"
import { SimpleSpanProcessor } from "@opentelemetry/sdk-trace-base"
import type * as Resources from "@opentelemetry/resources"

export const WebSdkLive = (resource: {
  readonly serviceName: string
  readonly serviceVersion?: string | undefined
  readonly attributes?: Resources.ResourceAttributes | undefined
}) =>
  layer(() => ({
    resource,
    spanProcessor: new SimpleSpanProcessor(
      new OTLPTraceExporter({
        headers: {}, // magic here !!!

        url: "/api/traces",
      }),
    ),
  }))

// registerInstrumentations({
//   instrumentations: [
//     new FetchInstrumentation({
//      // client is running on port 1234
//       ignoreUrls: [/localhost:1234\/sockjs-node/],
//       propagateTraceHeaderCorsUrls: ['http://localhost:7777'],
//       clearTimingResources: true,
//     }),
//   ],
// });

// const webTracer = provider.getTracer('tracer-web');
// const singleSpan = webTracer.startSpan(`fetch-span-start`);

// context.with(setSpan(context.active(), singleSpan), () => {
//   // ping an endpoint
//   fetch('http://localhost:7777/hello', {
//     method: 'GET',
//     headers: {
//       'Accept': 'application/json',
//       'Content-Type': 'application/json',
//     },
//   });
//     singleSpan.end();
// });
