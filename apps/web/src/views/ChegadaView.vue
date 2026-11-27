<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
    animalSchema,
    atendimentoSchema,
    camposDoErro,
    chegadaSchema,
    listaAnimaisSchema,
    type Animal,
    type ListaAnimais,
} from '@clinica/shared'
import { api, ErroApi } from '../api'
import { NOME_ESPECIE } from '../formatos'

const route = useRoute()
const router = useRouter()

// O cadastro de Animal volta para cá com /chegada?animal=ID.
const animalDaUrl = computed(() => {
    const valor = route.query.animal
    return typeof valor === 'string' && /^\d+$/.test(valor) ? Number(valor) : null
})

const animal = ref<Animal | null>(null)
const textoBusca = ref('')
const resultado = ref<ListaAnimais | null>(null)
const buscando = ref(false)
const erroBusca = ref<string | null>(null)

const form = reactive({ prioridade: false, queixa: '' })
const erros = ref<Record<string, string>>({})
const erroGeral = ref<string | null>(null)
const carregando = ref(false)
const enviando = ref(false)

function mensagemDe(e: unknown): string {
    console.error(e)
    return e instanceof ErroApi ? e.message : 'Erro inesperado.'
}

async function carregar() {
    if (route.name !== 'chegada') return

    animal.value = null
    erros.value = {}
    erroGeral.value = null
    if (animalDaUrl.value === null) return

    carregando.value = true
    try {
        animal.value = await api(`/api/animais/${animalDaUrl.value}`, animalSchema)
    } catch (e) {
        erroGeral.value = mensagemDe(e)
    } finally {
        carregando.value = false
    }
}

watch(animalDaUrl, carregar, { immediate: true })

async function buscar() {
    const busca = textoBusca.value.trim()
    const params = new URLSearchParams({ pagina: '1' })
    if (busca) params.set('busca', busca)

    buscando.value = true
    erroBusca.value = null
    try {
        resultado.value = await api(`/api/animais?${params}`, listaAnimaisSchema)
    } catch (e) {
        erroBusca.value = mensagemDe(e)
    } finally {
        buscando.value = false
    }
}

function selecionar(escolhido: Animal) {
    animal.value = escolhido
    erros.value = {}
    erroGeral.value = null
}

function trocar() {
    animal.value = null
    // Tira o ?animal= da URL, para o F5 não trazer o anterior de volta.
    if (animalDaUrl.value !== null) router.replace({ name: 'chegada' })
}

async function registrar() {
    erros.value = {}
    erroGeral.value = null

    const dados = chegadaSchema.safeParse({ ...form, animalId: animal.value?.id ?? null })
    if (!dados.success) {
        erros.value = camposDoErro(dados.error)
        return
    }

    enviando.value = true
    try {
        await api('/api/atendimentos', atendimentoSchema, {
            method: 'POST',
            body: JSON.stringify(dados.data),
        })
        await router.push({ name: 'recepcao' })
    } catch (e) {
        erroGeral.value = mensagemDe(e)
        if (e instanceof ErroApi) erros.value = e.campos
    } finally {
        enviando.value = false
    }
}
</script>

<template>
    <section class="max-w-xl space-y-4">
        <RouterLink :to="{ name: 'recepcao' }" class="text-sm text-blue-700 hover:underline">
            ← Recepção
        </RouterLink>
        <h1 class="text-2xl font-bold">Registrar chegada</h1>

        <p v-if="carregando" class="text-gray-600">Carregando...</p>

        <template v-else>
            <!-- Fora do <form> da Chegada: a busca tem o próprio form. -->
            <div class="space-y-3 rounded-lg bg-white p-4 shadow md:p-6">
                <h2 class="font-semibold">Animal</h2>

                <div
                    v-if="animal"
                    class="flex flex-col gap-2 rounded border bg-gray-50 p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                    <div class="min-w-0">
                        <p class="font-medium">
                            {{ animal.nome }}
                            <span class="text-sm font-normal text-gray-600">
                                · {{ NOME_ESPECIE[animal.especie] }}
                            </span>
                        </p>
                        <p class="text-sm text-gray-600">Tutor: {{ animal.tutor.nome }}</p>
                    </div>
                    <button
                        type="button"
                        class="rounded border bg-white px-3 py-1 text-sm hover:bg-gray-100"
                        @click="trocar"
                    >
                        Trocar animal
                    </button>
                </div>

                <template v-else>
                    <form class="flex gap-2" @submit.prevent="buscar">
                        <input
                            v-model="textoBusca"
                            type="search"
                            aria-label="Buscar animal"
                            placeholder="Nome do animal ou do tutor"
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
                            Nenhum animal encontrado.
                        </p>
                        <ul v-else class="max-h-64 divide-y overflow-y-auto rounded border">
                            <li
                                v-for="item in resultado.itens"
                                :key="item.id"
                                class="flex items-center justify-between gap-2 px-3 py-2"
                            >
                                <div class="min-w-0">
                                    <p class="truncate font-medium">
                                        {{ item.nome }}
                                        <span class="text-sm font-normal text-gray-600">
                                            · {{ NOME_ESPECIE[item.especie] }}
                                        </span>
                                    </p>
                                    <p class="truncate text-sm text-gray-600">
                                        Tutor: {{ item.tutor.nome }}
                                    </p>
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

                    <RouterLink
                        :to="{ name: 'animal-novo', query: { chegada: '1' } }"
                        class="inline-block text-sm text-blue-700 hover:underline"
                    >
                        + Cadastrar novo animal
                    </RouterLink>
                </template>

                <p v-if="erros.animalId" role="alert" class="text-sm text-red-700">
                    {{ erros.animalId }}
                </p>
            </div>

            <form
                novalidate
                class="space-y-4 rounded-lg bg-white p-4 shadow md:p-6"
                @submit.prevent="registrar"
            >
                <label class="flex items-center gap-2">
                    <input v-model="form.prioridade" type="checkbox" class="h-4 w-4" />
                    Prioridade
                </label>
                <div>
                    <label for="queixa" class="text-sm text-gray-700">
                        Queixa {{ form.prioridade ? '' : '(opcional)' }}
                    </label>
                    <textarea
                        id="queixa"
                        v-model="form.queixa"
                        rows="3"
                        :aria-invalid="erros.queixa ? true : undefined"
                        :aria-describedby="erros.queixa ? 'queixa-erro' : undefined"
                        :class="[
                            'mt-1 w-full rounded border bg-white px-3 py-2',
                            erros.queixa ? 'border-red-600' : '',
                        ]"
                    ></textarea>
                    <p v-if="erros.queixa" id="queixa-erro" class="mt-1 text-sm text-red-700">
                        {{ erros.queixa }}
                    </p>
                </div>

                <p v-if="erroGeral" role="alert" class="text-sm text-red-700">{{ erroGeral }}</p>

                <div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                    <RouterLink
                        :to="{ name: 'recepcao' }"
                        class="rounded border px-4 py-2 text-center hover:bg-gray-100"
                    >
                        Cancelar
                    </RouterLink>
                    <button
                        :disabled="enviando"
                        class="rounded bg-blue-700 px-4 py-2 font-semibold text-white disabled:opacity-60"
                    >
                        {{ enviando ? 'Registrando...' : 'Registrar chegada' }}
                    </button>
                </div>
            </form>
        </template>
    </section>
</template>
