<template>
  <template v-if="result._tag !== 'Initial' && result._tag !== 'Loading'">
    <slot
      v-if="getLatest(result)"
      :latest="getLatest(result)!"
      :refreshing="isRefreshing(result)"
      :latest-error="
        result.current._tag === 'Left' ? result.current.left : null
      "
    />
    <slot
      name="error"
      :error="result.current.left"
      v-else-if="result.current._tag === 'Left'"
    >
      <div>
        {{
            Match.value(result.current.left as SupportedErrors | FetchError | ResError).pipe(
            Match.tags({
              NotFoundError: () => "Nicht gefunden",
              NotLoggedInError: () => "Sie mussen eingelogt sein",
              UnauthorizedError: () =>
                "Sie sind nicht berechtigt, diese Aktion auszuführen",
            }),
            Match.orElse(
              () =>
                "Es ist ein Fehler aufgetreten. Wir wurden benachrichtigt und werden das Problem in Kürze beheben. Versuchen Sie es erneut.",
            )
            )
        }}
        <div v-if="config.public.env === 'local-dev'">
          dev details: {{ result.current.left }}
        </div>
      </div>
    </slot>
  </template>
  <Delayed v-else><v-progress-circular /></Delayed>
</template>
<script setup lang="ts" generic="E extends SupportedErrors | FetchError | ResError,A">
import { isRefreshing } from "effect-app/client"
import type {
  FetchError,
  ResError,
  Done,
  QueryResult,
  Refreshing,
  SupportedErrors,
} from "effect-app/client"
import { Option, Match } from "@/utils/prelude"
import Delayed from "./Delayed.vue"

defineProps<{ result: QueryResult<E, A> }>()
const config = useRuntimeConfig()

const getLatest = (result: Refreshing<E, A> | Done<E, A>): A | null =>
  result.current._tag === "Right"
    ? result.current.right
    : Option.getOrNull(result.previous)
</script>