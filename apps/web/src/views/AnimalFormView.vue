<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
    animalEntradaSchema,
    animalSchema,
    camposDoErro,
    hojeLocal,
    tutorSchema,
    type Tutor,
} from '@clinica/shared'
import { api, ErroApi } from '../api'
import { NOME_ESPECIE, NOME_SEXO } from '../formatos'
import CampoTexto from '../components/CampoTexto.vue'
import CampoSelecao from '../components/CampoSelecao.vue'
import SeletorTutor from '../components/SeletorTutor.vue'

const route = useRoute()
const router = useRouter()

const id = computed(() => {
    return typeof route.params.id === 'string' ? Number(route.params.id) : null
})

// "Adicionar animal" no detalhe do tutor abre /animais/novo?tutor=ID.
const tutorDaUrl = computed(() => {
    const valor = route.query.tutor
    return typeof valor === 'string' && /^\d+$/.test(valor) ? Number(valor) : null
})

const voltarPara = computed(() => {
    if (id.value !== null) return { name: 'animal-detalhe', params: { id: id.value } }
    if (tutorDaUrl.value !== null) {
        return { name: 'tutor-detalhe', params: { id: tutorDaUrl.value } }
    }
    return { name: 'animais' }
})

const VAZIO = { nome: '', especie: '', raca: '', sexo: '', dataNascimento: '' }
const form = reactive({ ...VAZIO })
const tutor = ref<Tutor | null>(null)
const erros = ref<Record<string, string>>({})
const erroGeral = ref<string | null>(null)
const carregando = ref(false)
const enviando = ref(false)

function mostrarErro(e: unknown) {
    console.error(e)
    if (e instanceof ErroApi) {
        erroGeral.value = e.message
        erros.value = e.campos
    } else {
        erroGeral.value = 'Erro inesperado.'
    }
}

async function carregar() {
    // Ao sair para o detalhe, o id muda antes de a tela desmontar.
    if (route.name !== 'animal-novo' && route.name !== 'animal-editar') return

    Object.assign(form, VAZIO)
    tutor.value = null
    erros.value = {}
    erroGeral.value = null

    carregando.value = true
    try {
        if (id.value !== null) {
            const animal = await api(`/api/animais/${id.value}`, animalSchema)
            form.nome = animal.nome
            form.especie = animal.especie
            form.raca = animal.raca ?? ''
            form.sexo = animal.sexo
            form.dataNascimento = animal.dataNascimento ?? ''
            tutor.value = animal.tutor
        } else if (tutorDaUrl.value !== null) {
            tutor.value = await api(`/api/tutores/${tutorDaUrl.value}`, tutorSchema)
        }
    } catch (e) {
        mostrarErro(e)
    } finally {
        carregando.value = false
    }
}

watch([id, tutorDaUrl], carregar, { immediate: true })

async function salvar() {
    erros.value = {}
    erroGeral.value = null

    const dados = animalEntradaSchema.safeParse({ ...form, tutorId: tutor.value?.id ?? null })
    if (!dados.success) {
        erros.value = camposDoErro(dados.error)
        return
    }

    enviando.value = true
    try {
        const caminho = id.value === null ? '/api/animais' : `/api/animais/${id.value}`
        const salvo = await api(caminho, animalSchema, {
            method: id.value === null ? 'POST' : 'PUT',
            body: JSON.stringify(dados.data),
        })
        await router.push({ name: 'animal-detalhe', params: { id: salvo.id } })
    } catch (e) {
        mostrarErro(e)
    } finally {
        enviando.value = false
    }
}
</script>

<template>
    <section class="max-w-xl space-y-4">
        <h1 class="text-2xl font-bold">{{ id === null ? 'Novo animal' : 'Editar animal' }}</h1>

        <p v-if="carregando" class="text-gray-600">Carregando...</p>

        <template v-else>
            <SeletorTutor v-model="tutor" :erro="erros.tutorId" />

            <form
                novalidate
                class="space-y-4 rounded-lg bg-white p-4 shadow md:p-6"
                @submit.prevent="salvar"
            >
                <h2 class="font-semibold">Dados do animal</h2>

                <CampoTexto v-model="form.nome" rotulo="Nome" :erro="erros.nome" />
                <div class="grid gap-4 sm:grid-cols-2">
                    <CampoSelecao
                        v-model="form.especie"
                        rotulo="Espécie"
                        :opcoes="NOME_ESPECIE"
                        :erro="erros.especie"
                    />
                    <CampoSelecao
                        v-model="form.sexo"
                        rotulo="Sexo"
                        :opcoes="NOME_SEXO"
                        :erro="erros.sexo"
                    />
                </div>
                <CampoTexto v-model="form.raca" rotulo="Raça (opcional)" :erro="erros.raca" />
                <CampoTexto
                    v-model="form.dataNascimento"
                    rotulo="Data de nascimento (opcional)"
                    :erro="erros.dataNascimento"
                    type="date"
                    :max="hojeLocal()"
                />

                <p v-if="erroGeral" role="alert" class="text-sm text-red-700">{{ erroGeral }}</p>

                <div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                    <RouterLink
                        :to="voltarPara"
                        class="rounded border px-4 py-2 text-center hover:bg-gray-100"
                    >
                        Cancelar
                    </RouterLink>
                    <button
                        :disabled="enviando"
                        class="rounded bg-blue-700 px-4 py-2 font-semibold text-white disabled:opacity-60"
                    >
                        {{ enviando ? 'Salvando...' : 'Salvar' }}
                    </button>
                </div>
            </form>
        </template>
    </section>
</template>
