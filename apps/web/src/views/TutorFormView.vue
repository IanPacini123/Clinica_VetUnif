<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
    camposDoErro,
    CPF_DE_TUTOR_INATIVO,
    tutorEntradaSchema,
    tutorSchema,
} from '@clinica/shared'
import { api, ErroApi } from '../api'
import { formatarCpf, formatarTelefone } from '../formatos'
import { podeAcessar } from '../sessao/session'
import { PODE_VER_INATIVOS } from '../perfis'
import CampoTexto from '../components/CampoTexto.vue'

const route = useRoute()
const router = useRouter()

const id = computed(() => {
    return typeof route.params.id === 'string' ? Number(route.params.id) : null
})

const voltarPara = computed(() => {
    if (id.value === null) return { name: 'tutores' }
    return { name: 'tutor-detalhe', params: { id: id.value } }
})

const form = reactive({ nome: '', cpf: '', telefone: '', email: '' })
const erros = ref<Record<string, string>>({})
const erroGeral = ref<string | null>(null)
const carregando = ref(false)
const enviando = ref(false)

// Para o ADMIN, o 409 de CPF de um tutor inativo leva à lista com os inativos.
const buscaDoInativo = computed(() => {
    if (erros.value.cpf !== CPF_DE_TUTOR_INATIVO) return null
    if (!podeAcessar(PODE_VER_INATIVOS)) return null
    const busca = form.cpf.replace(/\D/g, '')
    return { name: 'tutores', query: { busca, inativos: 'true' } }
})

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
    Object.assign(form, { nome: '', cpf: '', telefone: '', email: '' })
    erros.value = {}
    erroGeral.value = null
    if (id.value === null) return

    carregando.value = true
    try {
        const tutor = await api(`/api/tutores/${id.value}`, tutorSchema)
        form.nome = tutor.nome
        form.cpf = formatarCpf(tutor.cpf)
        form.telefone = formatarTelefone(tutor.telefone)
        form.email = tutor.email ?? ''
    } catch (e) {
        mostrarErro(e)
    } finally {
        carregando.value = false
    }
}

watch(id, carregar, { immediate: true })

async function salvar() {
    erros.value = {}
    erroGeral.value = null

    const dados = tutorEntradaSchema.safeParse(form)
    if (!dados.success) {
        erros.value = camposDoErro(dados.error)
        return
    }

    enviando.value = true
    try {
        const caminho = id.value === null ? '/api/tutores' : `/api/tutores/${id.value}`
        const salvo = await api(caminho, tutorSchema, {
            method: id.value === null ? 'POST' : 'PUT',
            body: JSON.stringify(dados.data),
        })
        await router.push({ name: 'tutor-detalhe', params: { id: salvo.id } })
    } catch (e) {
        mostrarErro(e)
    } finally {
        enviando.value = false
    }
}
</script>

<template>
    <section class="max-w-xl space-y-4">
        <h1 class="text-2xl font-bold">{{ id === null ? 'Novo tutor' : 'Editar tutor' }}</h1>

        <p v-if="carregando" class="text-gray-600">Carregando...</p>

        <form
            v-else
            novalidate
            class="space-y-4 rounded-lg bg-white p-4 shadow md:p-6"
            @submit.prevent="salvar"
        >
            <CampoTexto v-model="form.nome" rotulo="Nome" :erro="erros.nome" autocomplete="name" />
            <CampoTexto
                v-model="form.cpf"
                rotulo="CPF"
                :erro="erros.cpf"
                inputmode="numeric"
                placeholder="000.000.000-00"
            />
            <CampoTexto
                v-model="form.telefone"
                rotulo="Telefone"
                :erro="erros.telefone"
                type="tel"
                placeholder="(00) 00000-0000"
            />
            <CampoTexto
                v-model="form.email"
                rotulo="E-mail (opcional)"
                :erro="erros.email"
                type="email"
            />

            <p v-if="erroGeral" role="alert" class="text-sm text-red-700">{{ erroGeral }}</p>
            <RouterLink
                v-if="buscaDoInativo"
                :to="buscaDoInativo"
                class="block text-sm text-blue-700 hover:underline"
            >
                Ver o tutor inativo para reativá-lo
            </RouterLink>

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
    </section>
</template>
