<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
    atendimentosSchema,
    type Atendimento,
    type StatusAtendimento,
} from '@clinica/shared'
import { api, ErroApi } from '../api'
import { formatarDataHora, formatarHora, NOME_STATUS } from '../formatos'

// Um <details> por Atendimento: abre no lugar e só para leitura.
// Na tela de Atendimento, o formulário não se perde.
const props = defineProps<{
    animalId: number
    // O Atendimento aberto na tela não se repete no Histórico.
    ocultarId?: number
}>()

const COR_STATUS: Record<StatusAtendimento, string> = {
    AGUARDANDO: 'bg-yellow-100 text-yellow-900',
    EM_ATENDIMENTO: 'bg-blue-100 text-blue-900',
    FINALIZADO: 'bg-green-100 text-green-900',
    CANCELADO: 'bg-gray-200 text-gray-700',
}

const atendimentos = ref<Atendimento[]>([])
const erro = ref<string | null>(null)
const carregando = ref(false)

const itens = computed(() => {
    return atendimentos.value.filter((a) => a.id !== props.ocultarId)
})

async function carregar() {
    atendimentos.value = []
    erro.value = null
    carregando.value = true
    try {
        atendimentos.value = await api(
            `/api/animais/${props.animalId}/atendimentos`,
            atendimentosSchema,
        )
    } catch (e) {
        console.error(e)
        erro.value = e instanceof ErroApi ? e.message : 'Erro inesperado.'
    } finally {
        carregando.value = false
    }
}

watch(() => props.animalId, carregar, { immediate: true })
</script>

<template>
    <p v-if="carregando" class="text-gray-600">Carregando...</p>
    <p v-else-if="erro" role="alert" class="text-sm text-red-700">{{ erro }}</p>
    <p v-else-if="itens.length === 0" class="text-gray-600">
        {{
            ocultarId === undefined
                ? 'Nenhum atendimento registrado.'
                : 'Nenhum atendimento anterior.'
        }}
    </p>

    <ul v-else class="space-y-2">
        <li v-for="a in itens" :key="a.id">
            <details class="group rounded-lg bg-white shadow">
                <summary
                    class="flex cursor-pointer flex-wrap items-center gap-x-3 gap-y-1 p-3 md:px-4 [&::-webkit-details-marker]:hidden"
                >
                    <span aria-hidden="true" class="transition group-open:rotate-90">▸</span>
                    <span class="font-semibold">{{ formatarDataHora(a.dataChegada) }}</span>
                    <span :class="['rounded px-2 py-0.5 text-xs font-semibold', COR_STATUS[a.status]]">
                        {{ NOME_STATUS[a.status] }}
                    </span>
                    <span class="text-gray-700">
                        {{ a.veterinario ? `Dr(a). ${a.veterinario.nome}` : 'Sem veterinário' }}
                    </span>
                    <span class="w-full truncate text-sm text-gray-600">
                        {{ a.diagnostico ?? 'Sem diagnóstico' }}
                    </span>
                </summary>

                <dl class="grid gap-3 border-t p-3 sm:grid-cols-2 md:px-4">
                    <div class="sm:col-span-2">
                        <dt class="text-sm text-gray-500">Queixa</dt>
                        <dd class="break-words">
                            <span
                                v-if="a.prioridade"
                                class="mr-1 rounded bg-red-700 px-2 py-0.5 text-xs font-semibold text-white"
                            >
                                Prioridade
                            </span>
                            {{ a.queixa ?? '—' }}
                        </dd>
                    </div>
                    <div>
                        <dt class="text-sm text-gray-500">Horários</dt>
                        <dd>
                            chegada {{ formatarHora(a.dataChegada) }}
                            <span v-if="a.dataInicio">
                                · início {{ formatarHora(a.dataInicio) }}
                            </span>
                            <span v-if="a.dataFim">
                                · fim {{ formatarHora(a.dataFim) }}
                            </span>
                        </dd>
                    </div>
                    <div>
                        <dt class="text-sm text-gray-500">Peso</dt>
                        <dd>
                            {{ a.peso === null ? '—' : `${a.peso.toLocaleString('pt-BR')} kg` }}
                        </dd>
                    </div>
                    <div class="sm:col-span-2">
                        <dt class="text-sm text-gray-500">Anamnese / observações</dt>
                        <dd class="whitespace-pre-line break-words">{{ a.anamnese ?? '—' }}</dd>
                    </div>
                    <div class="sm:col-span-2">
                        <dt class="text-sm text-gray-500">Diagnóstico</dt>
                        <dd class="whitespace-pre-line break-words">{{ a.diagnostico ?? '—' }}</dd>
                    </div>
                    <div class="sm:col-span-2">
                        <dt class="text-sm text-gray-500">Conduta</dt>
                        <dd class="whitespace-pre-line break-words">{{ a.conduta ?? '—' }}</dd>
                    </div>
                </dl>
            </details>
        </li>
    </ul>
</template>
