<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
    camposDoErro,
    usuarioEdicaoSchema,
    usuarioEntradaSchema,
    usuarioSchema,
} from '@clinica/shared'
import { api, ErroApi } from '../api'
import { NOME_PERFIL } from '../perfis'
import { usuario } from '../sessao/session'
import CampoTexto from '../components/CampoTexto.vue'
import CampoSelecao from '../components/CampoSelecao.vue'

const route = useRoute()
const router = useRouter()

const id = computed(() => {
    return typeof route.params.id === 'string' ? Number(route.params.id) : null
})

const voltarPara = computed(() => {
    if (id.value === null) return { name: 'usuarios' }
    return { name: 'usuario-detalhe', params: { id: id.value } }
})

// A api recusa (409) que o ADMIN mude o próprio perfil; a tela já trava o campo.
const editandoASiMesmo = computed(() => {
    return id.value !== null && id.value === usuario.value?.id
})

const VAZIO = { nome: '', nomeUsuario: '', perfil: '', crmv: '', senha: '' }
const form = reactive({ ...VAZIO })
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
    if (route.name !== 'usuario-novo' && route.name !== 'usuario-editar') return

    Object.assign(form, VAZIO)
    erros.value = {}
    erroGeral.value = null
    if (id.value === null) return

    carregando.value = true
    try {
        const dados = await api(`/api/usuarios/${id.value}`, usuarioSchema)
        form.nome = dados.nome
        form.nomeUsuario = dados.nomeUsuario
        form.perfil = dados.perfil
        form.crmv = dados.crmv ?? ''
    } catch (e) {
        mostrarErro(e)
    } finally {
        carregando.value = false
    }
}

watch(id, carregar, { immediate: true })

// Na edição, o schema descarta o nomeUsuario e a senha do form.
function validar() {
    const schema = id.value === null ? usuarioEntradaSchema : usuarioEdicaoSchema
    return schema.safeParse(form)
}

async function salvar() {
    erros.value = {}
    erroGeral.value = null

    const dados = validar()
    if (!dados.success) {
        erros.value = camposDoErro(dados.error)
        return
    }

    enviando.value = true
    try {
        const caminho = id.value === null ? '/api/usuarios' : `/api/usuarios/${id.value}`
        const salvo = await api(caminho, usuarioSchema, {
            method: id.value === null ? 'POST' : 'PUT',
            body: JSON.stringify(dados.data),
        })
        await router.push({ name: 'usuario-detalhe', params: { id: salvo.id } })
    } catch (e) {
        mostrarErro(e)
    } finally {
        enviando.value = false
    }
}
</script>

<template>
    <section class="max-w-xl space-y-4">
        <h1 class="text-2xl font-bold">
            {{ id === null ? 'Novo usuário' : 'Editar usuário' }}
        </h1>

        <p v-if="carregando" class="text-gray-600">Carregando...</p>

        <form
            v-else
            novalidate
            class="space-y-4 rounded-lg bg-white p-4 shadow md:p-6"
            @submit.prevent="salvar"
        >
            <CampoTexto v-model="form.nome" rotulo="Nome" :erro="erros.nome" autocomplete="off" />

            <CampoTexto
                v-if="id === null"
                v-model="form.nomeUsuario"
                rotulo="Nome de usuário"
                :erro="erros.nomeUsuario"
                autocomplete="off"
                autocapitalize="none"
                spellcheck="false"
                placeholder="ex.: maria.silva"
            />
            <div v-else>
                <p class="text-sm text-gray-700">Nome de usuário</p>
                <p class="mt-1 break-all font-medium">{{ form.nomeUsuario }}</p>
                <p class="text-sm text-gray-500">O nome de usuário não pode ser alterado.</p>
            </div>

            <div>
                <CampoSelecao
                    v-model="form.perfil"
                    rotulo="Perfil"
                    :opcoes="NOME_PERFIL"
                    :erro="erros.perfil"
                    :disabled="editandoASiMesmo"
                />
                <p v-if="editandoASiMesmo" class="mt-1 text-sm text-gray-500">
                    Você não pode mudar o seu próprio perfil.
                </p>
            </div>

            <CampoTexto
                v-if="form.perfil === 'VETERINARIO'"
                v-model="form.crmv"
                rotulo="CRMV"
                :erro="erros.crmv"
                autocomplete="off"
            />

            <CampoTexto
                v-if="id === null"
                v-model="form.senha"
                rotulo="Senha"
                :erro="erros.senha"
                type="password"
                autocomplete="new-password"
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
    </section>
</template>
