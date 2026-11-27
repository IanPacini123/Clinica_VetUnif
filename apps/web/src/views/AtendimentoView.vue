<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
    atendimentoSchema,
    camposDoErro,
    dadosClinicosSchema,
    finalizacaoSchema,
    type Atendimento,
} from '@clinica/shared'
import { api, ErroApi } from '../api'
import {
    formatarData,
    formatarHora,
    formatarTelefone,
    NOME_ESPECIE,
    NOME_SEXO,
} from '../formatos'
import { usuario } from '../sessao/session'
import CampoAreaTexto from '../components/CampoAreaTexto.vue'

const route = useRoute()
const router = useRouter()

const id = computed(() => {
    return typeof route.params.id === 'string' ? Number(route.params.id) : null
})

const atendimento = ref<Atendimento | null>(null)
const erro = ref<string | null>(null)
const carregando = ref(false)

// O input type="number" devolve um número, ou "" quando está vazio.
const form = reactive({
    peso: '' as number | '',
    anamnese: '',
    diagnostico: '',
    conduta: '',
})
const erros = ref<Record<string, string>>({})
const enviando = ref(false)
const salvoEm = ref<string | null>(null)
const confirmando = ref<'finalizar' | 'devolver' | null>(null)

// Só o VETERINARIO responsável preenche; nos outros casos, só leitura.
const editavel = computed(() => {
    const a = atendimento.value
    return a?.status === 'EM_ATENDIMENTO' && a.veterinario?.id === usuario.value?.id
})

function mensagemDe(e: unknown): string {
    console.error(e)
    return e instanceof ErroApi ? e.message : 'Erro inesperado.'
}

function mostrarErro(e: unknown) {
    erro.value = mensagemDe(e)
    if (e instanceof ErroApi) erros.value = e.campos
}

function preencherForm(a: Atendimento) {
    form.peso = a.peso ?? ''
    form.anamnese = a.anamnese ?? ''
    form.diagnostico = a.diagnostico ?? ''
    form.conduta = a.conduta ?? ''
}

async function carregar() {
    if (route.name !== 'atendimento') return

    atendimento.value = null
    erro.value = null
    erros.value = {}
    salvoEm.value = null
    confirmando.value = null
    if (id.value === null) return

    carregando.value = true
    try {
        atendimento.value = await api(`/api/atendimentos/${id.value}`, atendimentoSchema)
        preencherForm(atendimento.value)
    } catch (e) {
        erro.value = mensagemDe(e)
    } finally {
        carregando.value = false
    }
}

watch(id, carregar, { immediate: true })

async function salvar() {
    erros.value = {}
    erro.value = null
    confirmando.value = null

    const dados = dadosClinicosSchema.safeParse(form)
    if (!dados.success) {
        erros.value = camposDoErro(dados.error)
        return
    }

    enviando.value = true
    try {
        atendimento.value = await api(
            `/api/atendimentos/${id.value}/dados-clinicos`,
            atendimentoSchema,
            { method: 'PUT', body: JSON.stringify(dados.data) },
        )
        salvoEm.value = new Date().toISOString()
    } catch (e) {
        mostrarErro(e)
    } finally {
        enviando.value = false
    }
}

// Confere diagnóstico e conduta antes de abrir a confirmação.
function pedirFinalizacao() {
    erros.value = {}
    erro.value = null

    const dados = finalizacaoSchema.safeParse(form)
    if (!dados.success) {
        erros.value = camposDoErro(dados.error)
        return
    }
    confirmando.value = 'finalizar'
}

async function finalizar() {
    const dados = finalizacaoSchema.safeParse(form)
    if (!dados.success) {
        erros.value = camposDoErro(dados.error)
        confirmando.value = null
        return
    }

    erro.value = null
    enviando.value = true
    try {
        // Depois de finalizado, a tela passa para só leitura.
        atendimento.value = await api(
            `/api/atendimentos/${id.value}/finalizar`,
            atendimentoSchema,
            { method: 'POST', body: JSON.stringify(dados.data) },
        )
    } catch (e) {
        mostrarErro(e)
    } finally {
        confirmando.value = null
        enviando.value = false
    }
}

async function devolver() {
    erro.value = null
    enviando.value = true
    try {
        await api(`/api/atendimentos/${id.value}/devolver`, atendimentoSchema, {
            method: 'POST',
        })
        await router.push({ name: 'recepcao' })
    } catch (e) {
        mostrarErro(e)
        confirmando.value = null
    } finally {
        enviando.value = false
    }
}
</script>

<template>
    <section class="max-w-2xl space-y-4">
        <RouterLink :to="{ name: 'recepcao' }" class="text-sm text-blue-700 hover:underline">
            ← Recepção
        </RouterLink>

        <p v-if="carregando" class="text-gray-600">Carregando...</p>
        <p v-if="erro" role="alert" class="text-sm text-red-700">{{ erro }}</p>

        <template v-if="atendimento">
            <h1 class="flex flex-wrap items-center gap-2 text-2xl font-bold">
                Atendimento de {{ atendimento.animal.nome }}
                <span
                    v-if="atendimento.prioridade"
                    class="rounded bg-red-700 px-2 py-0.5 text-xs font-semibold text-white"
                >
                    Prioridade
                </span>
            </h1>

            <dl class="grid gap-4 rounded-lg bg-white p-4 shadow sm:grid-cols-2 md:p-6">
                <div>
                    <dt class="text-sm text-gray-500">Animal</dt>
                    <dd>
                        <RouterLink
                            :to="{ name: 'animal-detalhe', params: { id: atendimento.animal.id } }"
                            class="text-blue-700 hover:underline"
                        >
                            {{ atendimento.animal.nome }}
                        </RouterLink>
                        <span class="text-gray-600">
                            · {{ NOME_ESPECIE[atendimento.animal.especie] }}
                            · {{ NOME_SEXO[atendimento.animal.sexo] }}
                        </span>
                    </dd>
                </div>
                <div>
                    <dt class="text-sm text-gray-500">Raça e nascimento</dt>
                    <dd>
                        {{ atendimento.animal.raca ?? '—' }}
                        ·
                        {{
                            atendimento.animal.dataNascimento
                                ? formatarData(atendimento.animal.dataNascimento)
                                : '—'
                        }}
                    </dd>
                </div>
                <div>
                    <dt class="text-sm text-gray-500">Tutor</dt>
                    <dd>
                        <RouterLink
                            :to="{ name: 'tutor-detalhe', params: { id: atendimento.animal.tutor.id } }"
                            class="text-blue-700 hover:underline"
                        >
                            {{ atendimento.animal.tutor.nome }}
                        </RouterLink>
                        <span class="text-gray-600">
                            · {{ formatarTelefone(atendimento.animal.tutor.telefone) }}
                        </span>
                    </dd>
                </div>
                <div>
                    <dt class="text-sm text-gray-500">Chegada</dt>
                    <dd>
                        {{ formatarHora(atendimento.dataChegada) }}
                        <span v-if="atendimento.dataInicio" class="text-gray-600">
                            · início às {{ formatarHora(atendimento.dataInicio) }}
                        </span>
                    </dd>
                </div>
                <div class="sm:col-span-2">
                    <dt class="text-sm text-gray-500">Queixa</dt>
                    <dd class="break-words">{{ atendimento.queixa ?? '—' }}</dd>
                </div>
            </dl>

            <!-- Formulário do VETERINARIO responsável -->
            <template v-if="editavel">
                <form
                    novalidate
                    class="space-y-4 rounded-lg bg-white p-4 shadow md:p-6"
                    @submit.prevent="salvar"
                >
                    <div>
                        <label for="peso" class="text-sm text-gray-700">Peso (kg)</label>
                        <input
                            id="peso"
                            v-model="form.peso"
                            type="number"
                            step="0.01"
                            min="0"
                            inputmode="decimal"
                            :aria-invalid="erros.peso ? true : undefined"
                            :aria-describedby="erros.peso ? 'peso-erro' : undefined"
                            :class="[
                                'mt-1 w-full rounded border bg-white px-3 py-2 sm:w-40',
                                erros.peso ? 'border-red-600' : '',
                            ]"
                        />
                        <p v-if="erros.peso" id="peso-erro" class="mt-1 text-sm text-red-700">
                            {{ erros.peso }}
                        </p>
                    </div>
                    <CampoAreaTexto
                        v-model="form.anamnese"
                        rotulo="Anamnese / observações"
                        rows="4"
                        :erro="erros.anamnese"
                    />
                    <CampoAreaTexto
                        v-model="form.diagnostico"
                        rotulo="Diagnóstico (obrigatório para finalizar)"
                        rows="3"
                        :erro="erros.diagnostico"
                    />
                    <CampoAreaTexto
                        v-model="form.conduta"
                        rotulo="Conduta (obrigatória para finalizar)"
                        rows="3"
                        :erro="erros.conduta"
                    />

                    <p v-if="salvoEm" class="text-sm text-green-800">
                        Salvo às {{ formatarHora(salvoEm) }}.
                    </p>

                    <div
                        v-if="!confirmando"
                        class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"
                    >
                        <button
                            type="button"
                            :disabled="enviando"
                            class="rounded border border-gray-400 bg-white px-4 py-2 hover:bg-gray-100"
                            @click="confirmando = 'devolver'"
                        >
                            Devolver à fila
                        </button>
                        <button
                            :disabled="enviando"
                            class="rounded border border-blue-700 bg-white px-4 py-2 font-semibold text-blue-700 hover:bg-blue-50 disabled:opacity-60"
                        >
                            {{ enviando ? 'Salvando...' : 'Salvar' }}
                        </button>
                        <button
                            type="button"
                            :disabled="enviando"
                            class="rounded bg-green-700 px-4 py-2 font-semibold text-white disabled:opacity-60"
                            @click="pedirFinalizacao"
                        >
                            Finalizar
                        </button>
                    </div>
                </form>

                <div
                    v-if="confirmando === 'finalizar'"
                    role="alertdialog"
                    aria-labelledby="confirmar-finalizacao"
                    class="space-y-3 rounded-lg border border-green-300 bg-green-50 p-4"
                >
                    <p id="confirmar-finalizacao">
                        Finalizar o atendimento de <strong>{{ atendimento.animal.nome }}</strong>?
                        Depois de finalizado, ele não pode mais ser alterado.
                    </p>
                    <div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                        <button
                            :disabled="enviando"
                            class="rounded border bg-white px-4 py-2 hover:bg-gray-100"
                            @click="confirmando = null"
                        >
                            Voltar
                        </button>
                        <button
                            :disabled="enviando"
                            class="rounded bg-green-700 px-4 py-2 font-semibold text-white disabled:opacity-60"
                            @click="finalizar"
                        >
                            {{ enviando ? 'Finalizando...' : 'Confirmar finalização' }}
                        </button>
                    </div>
                </div>

                <div
                    v-if="confirmando === 'devolver'"
                    role="alertdialog"
                    aria-labelledby="confirmar-devolucao"
                    class="space-y-3 rounded-lg border border-gray-300 bg-gray-50 p-4"
                >
                    <p id="confirmar-devolucao">
                        Devolver <strong>{{ atendimento.animal.nome }}</strong> à fila?
                        O que já foi salvo fica no atendimento; o que não foi salvo se perde.
                    </p>
                    <div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                        <button
                            :disabled="enviando"
                            class="rounded border bg-white px-4 py-2 hover:bg-gray-100"
                            @click="confirmando = null"
                        >
                            Voltar
                        </button>
                        <button
                            :disabled="enviando"
                            class="rounded bg-gray-700 px-4 py-2 font-semibold text-white disabled:opacity-60"
                            @click="devolver"
                        >
                            {{ enviando ? 'Devolvendo...' : 'Confirmar devolução' }}
                        </button>
                    </div>
                </div>
            </template>

            <!-- Só leitura: finalizado, cancelado ou com outro VETERINARIO -->
            <template v-else>
                <p class="rounded-lg border bg-gray-50 p-4 text-gray-700">
                    <template v-if="atendimento.status === 'FINALIZADO'">
                        Atendimento finalizado
                        <span v-if="atendimento.dataFim">
                            às {{ formatarHora(atendimento.dataFim) }}
                        </span>
                        <span v-if="atendimento.veterinario">
                            por Dr(a). {{ atendimento.veterinario.nome }}
                        </span>.
                    </template>
                    <template v-else-if="atendimento.status === 'EM_ATENDIMENTO'">
                        Este paciente está em atendimento
                        <span v-if="atendimento.veterinario">
                            com Dr(a). {{ atendimento.veterinario.nome }}
                        </span>.
                    </template>
                    <template v-else-if="atendimento.status === 'AGUARDANDO'">
                        Este paciente está aguardando na fila.
                    </template>
                    <template v-else>Atendimento cancelado.</template>
                </p>

                <dl class="grid gap-4 rounded-lg bg-white p-4 shadow md:p-6">
                    <div>
                        <dt class="text-sm text-gray-500">Peso</dt>
                        <dd>
                            {{
                                atendimento.peso === null
                                    ? '—'
                                    : `${atendimento.peso.toLocaleString('pt-BR')} kg`
                            }}
                        </dd>
                    </div>
                    <div>
                        <dt class="text-sm text-gray-500">Anamnese / observações</dt>
                        <dd class="whitespace-pre-line break-words">{{ atendimento.anamnese ?? '—' }}</dd>
                    </div>
                    <div>
                        <dt class="text-sm text-gray-500">Diagnóstico</dt>
                        <dd class="whitespace-pre-line break-words">{{ atendimento.diagnostico ?? '—' }}</dd>
                    </div>
                    <div>
                        <dt class="text-sm text-gray-500">Conduta</dt>
                        <dd class="whitespace-pre-line break-words">{{ atendimento.conduta ?? '—' }}</dd>
                    </div>
                </dl>
            </template>
        </template>
    </section>
</template>
