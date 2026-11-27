<script setup lang="ts">
import { onMounted, onUnmounted, reactive, ref } from 'vue'
import {
    atendimentoSchema,
    camposDoErro,
    filaSchema,
    prioridadeQueixaSchema,
    type Atendimento,
} from '@clinica/shared'
import { api, ErroApi } from '../api'
import { formatarHora, NOME_ESPECIE } from '../formatos'
import { podeAcessar, usuario } from '../sessao/session'
import { PODE_REGISTRAR_CHEGADA } from '../perfis'

// A Fila atualiza sozinha (polling, sem WebSocket) e pelo botão.
const INTERVALO_MS = 10_000

const fila = ref<Atendimento[]>([])
const carregou = ref(false)
const carregando = ref(false)
const erro = ref<string | null>(null)
const atualizadoEm = ref<Date | null>(null)

// Edição e cancelamento guardam o id: o polling troca os objetos da lista,
// mas o que a atendente digitou continua aqui.
const editandoId = ref<number | null>(null)
const edicao = reactive({ prioridade: false, queixa: '' })
const errosEdicao = ref<Record<string, string>>({})
const cancelandoId = ref<number | null>(null)
const enviando = ref(false)
const erroAcao = ref<string | null>(null)

function mensagemDe(e: unknown): string {
    console.error(e)
    return e instanceof ErroApi ? e.message : 'Erro inesperado.'
}

async function carregar() {
    if (carregando.value) return

    carregando.value = true
    try {
        fila.value = await api('/api/fila', filaSchema)
        atualizadoEm.value = new Date()
        erro.value = null
        carregou.value = true

        // Se o atendimento saiu da Fila ou foi pego, fecha o painel aberto.
        const aguardando = (id: number | null) =>
            fila.value.some((a) => a.id === id && a.status === 'AGUARDANDO')
        if (!aguardando(editandoId.value)) editandoId.value = null
        if (!aguardando(cancelandoId.value)) cancelandoId.value = null
    } catch (e) {
        erro.value = mensagemDe(e)
    } finally {
        carregando.value = false
    }
}

let timer: ReturnType<typeof setInterval> | undefined
onMounted(() => {
    carregar()
    timer = setInterval(carregar, INTERVALO_MS)
})
onUnmounted(() => clearInterval(timer))

function minutosDeEspera(atendimento: Atendimento): number {
    const agora = atualizadoEm.value?.getTime() ?? Date.now()
    const chegada = new Date(atendimento.dataChegada).getTime()
    return Math.max(0, Math.floor((agora - chegada) / 60_000))
}

function abrirEdicao(atendimento: Atendimento) {
    edicao.prioridade = atendimento.prioridade
    edicao.queixa = atendimento.queixa ?? ''
    errosEdicao.value = {}
    erroAcao.value = null
    cancelandoId.value = null
    editandoId.value = atendimento.id
}

function abrirCancelamento(atendimento: Atendimento) {
    erroAcao.value = null
    editandoId.value = null
    cancelandoId.value = atendimento.id
}

function fecharPaineis() {
    editandoId.value = null
    cancelandoId.value = null
    erroAcao.value = null
}

async function salvarEdicao() {
    errosEdicao.value = {}
    erroAcao.value = null

    const dados = prioridadeQueixaSchema.safeParse(edicao)
    if (!dados.success) {
        errosEdicao.value = camposDoErro(dados.error)
        return
    }

    enviando.value = true
    try {
        await api(`/api/atendimentos/${editandoId.value}`, atendimentoSchema, {
            method: 'PUT',
            body: JSON.stringify(dados.data),
        })
        editandoId.value = null
        await carregar()
    } catch (e) {
        erroAcao.value = mensagemDe(e)
        if (e instanceof ErroApi) errosEdicao.value = e.campos
    } finally {
        enviando.value = false
    }
}

async function confirmarCancelamento() {
    erroAcao.value = null
    enviando.value = true
    try {
        await api(`/api/atendimentos/${cancelandoId.value}/cancelar`, atendimentoSchema, {
            method: 'POST',
        })
        cancelandoId.value = null
        await carregar()
    } catch (e) {
        erroAcao.value = mensagemDe(e)
    } finally {
        enviando.value = false
    }
}
</script>

<template>
    <section class="space-y-4">
        <div class="flex flex-wrap items-center justify-between gap-2">
            <div>
                <h1 class="text-2xl font-bold">Recepção</h1>
                <p class="text-gray-600">Olá, {{ usuario?.nome }}.</p>
            </div>
            <RouterLink
                v-if="podeAcessar(PODE_REGISTRAR_CHEGADA)"
                :to="{ name: 'chegada' }"
                class="rounded bg-blue-700 px-4 py-2 font-semibold text-white"
            >
                Registrar chegada
            </RouterLink>
        </div>

        <div class="flex flex-wrap items-center justify-between gap-2">
            <h2 class="text-lg font-semibold">
                Fila
                <span class="text-gray-500">({{ fila.length }})</span>
            </h2>
            <div class="flex items-center gap-3 text-sm text-gray-600">
                <span v-if="atualizadoEm">
                    Atualizada às {{ formatarHora(atualizadoEm.toISOString()) }}
                </span>
                <button
                    :disabled="carregando"
                    class="rounded border bg-white px-3 py-1 hover:bg-gray-100 disabled:opacity-60"
                    @click="carregar"
                >
                    {{ carregando ? 'Atualizando...' : 'Atualizar' }}
                </button>
            </div>
        </div>

        <p v-if="erro" role="alert" class="text-sm text-red-700">{{ erro }}</p>

        <p v-if="!carregou && !erro" class="text-gray-600">Carregando...</p>
        <p v-else-if="carregou && fila.length === 0" class="rounded-lg bg-white p-4 text-gray-600 shadow">
            Nenhum paciente na fila.
        </p>

        <ul v-else class="space-y-3">
            <li
                v-for="atendimento in fila"
                :key="atendimento.id"
                :class="[
                    'space-y-3 rounded-lg border-l-4 p-4 shadow',
                    atendimento.prioridade
                        ? 'border-red-600 bg-red-50'
                        : 'border-blue-600 bg-white',
                ]"
            >
                <div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div class="min-w-0 space-y-1">
                        <p class="flex flex-wrap items-center gap-2">
                            <RouterLink
                                :to="{ name: 'animal-detalhe', params: { id: atendimento.animal.id } }"
                                class="text-lg font-semibold text-blue-700 hover:underline"
                            >
                                {{ atendimento.animal.nome }}
                            </RouterLink>
                            <span class="text-sm text-gray-600">
                                {{ NOME_ESPECIE[atendimento.animal.especie] }}
                            </span>
                            <span
                                v-if="atendimento.prioridade"
                                class="rounded bg-red-700 px-2 py-0.5 text-xs font-semibold text-white"
                            >
                                Prioridade
                            </span>
                        </p>
                        <p class="text-sm text-gray-600">
                            Tutor: {{ atendimento.animal.tutor.nome }}
                        </p>
                        <p v-if="atendimento.queixa" class="break-words">
                            <span class="text-sm text-gray-500">Queixa:</span>
                            {{ atendimento.queixa }}
                        </p>
                    </div>

                    <div class="shrink-0 text-sm sm:text-right">
                        <p
                            v-if="atendimento.status === 'EM_ATENDIMENTO'"
                            class="font-semibold text-green-800"
                        >
                            Em atendimento
                            <span v-if="atendimento.veterinario" class="block font-normal">
                                com Dr(a). {{ atendimento.veterinario.nome }}
                            </span>
                        </p>
                        <p v-else class="font-semibold text-gray-700">Aguardando</p>
                        <p class="text-gray-600">
                            Chegou às {{ formatarHora(atendimento.dataChegada) }}
                            ({{ minutosDeEspera(atendimento) }} min)
                        </p>
                    </div>
                </div>

                <!-- Painel de edição de Prioridade e Queixa -->
                <form
                    v-if="editandoId === atendimento.id"
                    novalidate
                    class="space-y-3 rounded border bg-white p-3"
                    @submit.prevent="salvarEdicao"
                >
                    <label class="flex items-center gap-2">
                        <input v-model="edicao.prioridade" type="checkbox" class="h-4 w-4" />
                        Prioridade
                    </label>
                    <div>
                        <label :for="`queixa-${atendimento.id}`" class="text-sm text-gray-700">
                            Queixa {{ edicao.prioridade ? '' : '(opcional)' }}
                        </label>
                        <textarea
                            :id="`queixa-${atendimento.id}`"
                            v-model="edicao.queixa"
                            rows="2"
                            :aria-invalid="errosEdicao.queixa ? true : undefined"
                            :class="[
                                'mt-1 w-full rounded border bg-white px-3 py-2',
                                errosEdicao.queixa ? 'border-red-600' : '',
                            ]"
                        ></textarea>
                        <p v-if="errosEdicao.queixa" class="mt-1 text-sm text-red-700">
                            {{ errosEdicao.queixa }}
                        </p>
                    </div>
                    <p v-if="erroAcao" role="alert" class="text-sm text-red-700">{{ erroAcao }}</p>
                    <div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                        <button
                            type="button"
                            :disabled="enviando"
                            class="rounded border px-4 py-2 hover:bg-gray-100"
                            @click="fecharPaineis"
                        >
                            Voltar
                        </button>
                        <button
                            :disabled="enviando"
                            class="rounded bg-blue-700 px-4 py-2 font-semibold text-white disabled:opacity-60"
                        >
                            {{ enviando ? 'Salvando...' : 'Salvar' }}
                        </button>
                    </div>
                </form>

                <!-- Confirmação do cancelamento, dentro da página -->
                <div
                    v-else-if="cancelandoId === atendimento.id"
                    role="alertdialog"
                    :aria-labelledby="`cancelar-${atendimento.id}`"
                    class="space-y-3 rounded border border-red-300 bg-white p-3"
                >
                    <p :id="`cancelar-${atendimento.id}`">
                        Cancelar o atendimento de <strong>{{ atendimento.animal.nome }}</strong>?
                        Ele sai da fila, e o registro fica no histórico como cancelado.
                    </p>
                    <p v-if="erroAcao" role="alert" class="text-sm text-red-700">{{ erroAcao }}</p>
                    <div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                        <button
                            :disabled="enviando"
                            class="rounded border bg-white px-4 py-2 hover:bg-gray-100"
                            @click="fecharPaineis"
                        >
                            Voltar
                        </button>
                        <button
                            :disabled="enviando"
                            class="rounded bg-red-700 px-4 py-2 font-semibold text-white disabled:opacity-60"
                            @click="confirmarCancelamento"
                        >
                            {{ enviando ? 'Cancelando...' : 'Confirmar cancelamento' }}
                        </button>
                    </div>
                </div>

                <div
                    v-else-if="atendimento.status === 'AGUARDANDO' && podeAcessar(PODE_REGISTRAR_CHEGADA)"
                    class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"
                >
                    <button
                        class="rounded border border-red-600 bg-white px-3 py-1 text-sm text-red-700 hover:bg-red-50"
                        @click="abrirCancelamento(atendimento)"
                    >
                        Cancelar atendimento
                    </button>
                    <button
                        class="rounded border bg-white px-3 py-1 text-sm hover:bg-gray-100"
                        @click="abrirEdicao(atendimento)"
                    >
                        Editar prioridade e queixa
                    </button>
                </div>
            </li>
        </ul>
    </section>
</template>
