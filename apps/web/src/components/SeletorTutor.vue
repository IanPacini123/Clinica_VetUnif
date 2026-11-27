<script setup lang="ts">
import { reactive, ref } from 'vue'
import {
    camposDoErro,
    listaTutoresSchema,
    tutorEntradaSchema,
    tutorSchema,
    type ListaTutores,
    type Tutor,
} from '@clinica/shared'
import { api, ErroApi } from '../api'
import { formatarCpf, formatarTelefone } from '../formatos'
import { podeAcessar } from '../sessao/session'
import { PODE_CRIAR_E_INATIVAR } from '../perfis'
import CampoTexto from './CampoTexto.vue'

// Seção do cadastro de Animal: busca um tutor existente ou cadastra um novo.
// Fica fora do <form> do animal, porque HTML não aceita form dentro de form.
const tutor = defineModel<Tutor | null>({ required: true })
defineProps<{ erro?: string | undefined }>()

const modo = ref<'buscar' | 'cadastrar'>('buscar')

const textoBusca = ref('')
const resultado = ref<ListaTutores | null>(null)
const buscando = ref(false)
const erroBusca = ref<string | null>(null)

const novo = reactive({ nome: '', cpf: '', telefone: '', email: '' })
const errosNovo = ref<Record<string, string>>({})
const erroNovo = ref<string | null>(null)
const salvando = ref(false)

function mensagemDe(e: unknown): string {
    console.error(e)
    return e instanceof ErroApi ? e.message : 'Erro inesperado.'
}

async function buscar() {
    const busca = textoBusca.value.trim()
    const params = new URLSearchParams({ pagina: '1' })
    if (busca) params.set('busca', busca)

    buscando.value = true
    erroBusca.value = null
    try {
        resultado.value = await api(`/api/tutores?${params}`, listaTutoresSchema)
    } catch (e) {
        erroBusca.value = mensagemDe(e)
    } finally {
        buscando.value = false
    }
}

function selecionar(escolhido: Tutor) {
    tutor.value = escolhido
}

function trocar() {
    tutor.value = null
    modo.value = 'buscar'
}

function abrirCadastro() {
    Object.assign(novo, { nome: '', cpf: '', telefone: '', email: '' })
    errosNovo.value = {}
    erroNovo.value = null
    modo.value = 'cadastrar'
}

async function cadastrar() {
    errosNovo.value = {}
    erroNovo.value = null

    const dados = tutorEntradaSchema.safeParse(novo)
    if (!dados.success) {
        errosNovo.value = camposDoErro(dados.error)
        return
    }

    salvando.value = true
    try {
        tutor.value = await api('/api/tutores', tutorSchema, {
            method: 'POST',
            body: JSON.stringify(dados.data),
        })
        modo.value = 'buscar'
    } catch (e) {
        erroNovo.value = mensagemDe(e)
        if (e instanceof ErroApi) errosNovo.value = e.campos
    } finally {
        salvando.value = false
    }
}
</script>

<template>
    <div class="space-y-3 rounded-lg bg-white p-4 shadow md:p-6">
        <h2 class="font-semibold">Tutor</h2>

        <div
            v-if="tutor"
            class="flex flex-col gap-2 rounded border bg-gray-50 p-3 sm:flex-row sm:items-center sm:justify-between"
        >
            <div>
                <p class="font-medium">{{ tutor.nome }}</p>
                <p class="text-sm text-gray-600">
                    CPF {{ formatarCpf(tutor.cpf) }} · {{ formatarTelefone(tutor.telefone) }}
                </p>
            </div>
            <button
                type="button"
                class="rounded border bg-white px-3 py-1 text-sm hover:bg-gray-100"
                @click="trocar"
            >
                Trocar tutor
            </button>
        </div>

        <template v-else-if="modo === 'buscar'">
            <form class="flex gap-2" @submit.prevent="buscar">
                <input
                    v-model="textoBusca"
                    type="search"
                    aria-label="Buscar tutor"
                    placeholder="Buscar tutor por nome ou CPF"
                    class="min-w-0 flex-1 rounded border bg-white px-3 py-2"
                />
                <button
                    :disabled="buscando"
                    class="rounded bg-blue-700 px-4 py-2 font-semibold text-white disabled:opacity-60"
                >
                    Buscar
                </button>
            </form>

            <p v-if="erroBusca" role="alert" class="text-sm text-red-700">{{ erroBusca }}</p>

            <template v-else-if="resultado">
                <p v-if="resultado.itens.length === 0" class="text-sm text-gray-600">
                    Nenhum tutor encontrado.
                </p>
                <ul v-else class="max-h-64 divide-y overflow-y-auto rounded border">
                    <li
                        v-for="item in resultado.itens"
                        :key="item.id"
                        class="flex items-center justify-between gap-2 px-3 py-2"
                    >
                        <div class="min-w-0">
                            <p class="truncate font-medium">{{ item.nome }}</p>
                            <p class="text-sm text-gray-600">{{ formatarCpf(item.cpf) }}</p>
                        </div>
                        <button
                            type="button"
                            class="shrink-0 rounded border px-3 py-1 text-sm hover:bg-gray-100"
                            @click="selecionar(item)"
                        >
                            Selecionar
                        </button>
                    </li>
                </ul>
                <p
                    v-if="resultado.total > resultado.itens.length"
                    class="text-sm text-gray-600"
                >
                    Mostrando {{ resultado.itens.length }} de {{ resultado.total }}.
                    Refine a busca.
                </p>
            </template>

            <button
                v-if="podeAcessar(PODE_CRIAR_E_INATIVAR)"
                type="button"
                class="text-sm text-blue-700 hover:underline"
                @click="abrirCadastro"
            >
                + Cadastrar novo tutor
            </button>
        </template>

        <form v-else novalidate class="space-y-4" @submit.prevent="cadastrar">
            <CampoTexto v-model="novo.nome" rotulo="Nome" :erro="errosNovo.nome" />
            <CampoTexto
                v-model="novo.cpf"
                rotulo="CPF"
                :erro="errosNovo.cpf"
                inputmode="numeric"
                placeholder="000.000.000-00"
            />
            <CampoTexto
                v-model="novo.telefone"
                rotulo="Telefone"
                :erro="errosNovo.telefone"
                type="tel"
                placeholder="(00) 00000-0000"
            />
            <CampoTexto
                v-model="novo.email"
                rotulo="E-mail (opcional)"
                :erro="errosNovo.email"
                type="email"
            />

            <p v-if="erroNovo" role="alert" class="text-sm text-red-700">{{ erroNovo }}</p>

            <div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                    type="button"
                    class="rounded border px-4 py-2 hover:bg-gray-100"
                    @click="modo = 'buscar'"
                >
                    Cancelar
                </button>
                <button
                    :disabled="salvando"
                    class="rounded bg-blue-700 px-4 py-2 font-semibold text-white disabled:opacity-60"
                >
                    {{ salvando ? 'Salvando...' : 'Salvar tutor' }}
                </button>
            </div>
        </form>

        <p v-if="erro" role="alert" class="text-sm text-red-700">{{ erro }}</p>
    </div>
</template>
