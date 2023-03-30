<template>
  <v-text-field
    v-bind="$props"
    :model-value="convertIn(props.modelValue, field.type)"
    @update:model-value="value => convertOut(value, updateValue, field.type)"
    :required="field.metadata.required"
    :rules="field.rules"
  />
</template>
<script lang="ts" setup>
import type { FieldInfo } from "@effect-app/vue/form"
import { VTextField } from "vuetify/components"

export interface Props
  extends Omit<
    InstanceType<typeof VTextField>["$props"],
    "modelValue" | "update:modelValue"
  > {
  field: FieldInfo<any, any>
  modelValue: string | null
}

const props = defineProps<Props>()
const emit = defineEmits(["update:modelValue"])

function updateValue(value: unknown | null) {
  emit("update:modelValue", value)
}
</script>