<script setup lang="ts">
import { useId } from 'vue'

defineOptions({ inheritAttrs: false })

const valor = defineModel<string>({ required: true })
defineProps<{
    rotulo: string
    opcoes: Record<string, string>
    erro?: string | undefined
}>()

const id = useId()
</script>

<template>
    <div>
        <label :for="id" class="text-sm text-gray-700">{{ rotulo }}</label>
        <select
            :id="id"
            v-model="valor"
            v-bind="$attrs"
            :aria-invalid="erro ? true : undefined"
            :aria-describedby="erro ? `${id}-erro` : undefined"
            :class="[
                'mt-1 w-full rounded border bg-white px-3 py-2',
                erro ? 'border-red-600' : '',
            ]"
        >
            <option value="" disabled>Selecione...</option>
            <option v-for="(texto, chave) in opcoes" :key="chave" :value="chave">
                {{ texto }}
            </option>
        </select>
        <p v-if="erro" :id="`${id}-erro`" class="mt-1 text-sm text-red-700">{{ erro }}</p>
    </div>
</template>
