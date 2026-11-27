<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { animaisSchema, tutorSchema, type Animal, type Tutor } from '@clinica/shared'
import { api, ErroApi, SEM_CONTEUDO } from '../api'
import { formatarCpf, formatarTelefone, NOME_ESPECIE } from '../formatos'
import { podeAcessar } from '../sessao/session'
import { PODE_CRIAR_E_INATIVAR, PODE_VER_INATIVOS } from '../perfis'
import SeloInativo from '../components/SeloInativo.vue'

const route = useRoute()
const router = useRouter()

const id = computed(() => {
    return typeof route.params.id === 'string' ? Number(route.params.id) : null
})

const tutor = ref<Tutor | null>(null)
const animais = ref<Animal[]>([])
const erro = ref<string | null>(null)
const carregando = ref(false)
const confirmando = ref(false)
const inativando = ref(false)
const reativando = ref(false)

function mensagemDe(e: unknown): string {
    console.error(e)
    return e instanceof ErroApi ? e.message : 'Erro inesperado.'
}

async function carregar() {
    if (route.name !== 'tutor-detalhe') return

    tutor.value = null
    animais.value = []
    erro.value = null
    confirmando.value = false
    if (id.value === null) return

    carregando.value = true
    try {
        const [dados, lista] = await Promise.all([
            api(`/api/tutores/${id.value}`, tutorSchema),
            api(`/api/tutores/${id.value}/animais`, animaisSchema),
        ])
        tutor.value = dados
        animais.value = lista
    } catch (e) {
        erro.value = mensagemDe(e)
    } finally {
        carregando.value = false
    }
}

watch(id, carregar, { immediate: true })

async function inativar() {
    if (!tutor.value) return

    inativando.value = true
    erro.value = null
    try {
        await api(`/api/tutores/${tutor.value.id}`, SEM_CONTEUDO, { method: 'DELETE' })
        await router.push({ name: 'tutores' })
    } catch (e) {
        erro.value = mensagemDe(e)
        confirmando.value = false
    } finally {
        inativando.value = false
    }
}

// Reativar não apaga nada, então não pede confirmação.
async function reativar() {
    if (!tutor.value) return

    reativando.value = true
    erro.value = null
    try {
        tutor.value = await api(`/api/tutores/${tutor.value.id}/reativar`, tutorSchema, {
            method: 'POST',
        })
    } catch (e) {
        erro.value = mensagemDe(e)
    } finally {
        reativando.value = false
    }
}
</script>

<template>
    <section class="max-w-xl space-y-4">
        <RouterLink :to="{ name: 'tutores' }" class="text-sm text-blue-700 hover:underline">
            ← Tutores
        </RouterLink>

        <p v-if="carregando" class="text-gray-600">Carregando...</p>
        <p v-if="erro" role="alert" class="text-sm text-red-700">{{ erro }}</p>

        <template v-if="tutor">
            <h1 class="text-2xl font-bold">
                {{ tutor.nome }}
                <SeloInativo v-if="!tutor.ativo" />
            </h1>

            <dl class="grid gap-4 rounded-lg bg-white p-4 shadow sm:grid-cols-2 md:p-6">
                <div>
                    <dt class="text-sm text-gray-500">CPF</dt>
                    <dd>{{ formatarCpf(tutor.cpf) }}</dd>
                </div>
                <div>
                    <dt class="text-sm text-gray-500">Telefone</dt>
                    <dd>{{ formatarTelefone(tutor.telefone) }}</dd>
                </div>
                <div class="sm:col-span-2">
                    <dt class="text-sm text-gray-500">E-mail</dt>
                    <dd class="break-all">{{ tutor.email ?? '—' }}</dd>
                </div>
            </dl>

            <div class="space-y-3 rounded-lg bg-white p-4 shadow md:p-6">
                <div class="flex items-center justify-between gap-2">
                    <h2 class="font-semibold">Animais</h2>
                    <RouterLink
                        v-if="tutor.ativo && podeAcessar(PODE_CRIAR_E_INATIVAR)"
                        :to="{ name: 'animal-novo', query: { tutor: tutor.id } }"
                        class="rounded bg-blue-700 px-3 py-1 text-sm font-semibold text-white"
                    >
                        Adicionar animal
                    </RouterLink>
                </div>
                <p v-if="animais.length === 0" class="text-sm text-gray-600">
                    Nenhum animal ativo.
                </p>
                <ul v-else class="divide-y">
                    <li
                        v-for="animal in animais"
                        :key="animal.id"
                        class="py-2"
                        :class="{ 'text-gray-500': !animal.ativo }"
                    >
                        <RouterLink
                            :to="{ name: 'animal-detalhe', params: { id: animal.id } }"
                            class="font-medium text-blue-700 hover:underline"
                        >
                            {{ animal.nome }}
                        </RouterLink>
                        <span class="text-sm text-gray-600">
                            · {{ NOME_ESPECIE[animal.especie] }}
                        </span>
                        <SeloInativo v-if="!animal.ativo" />
                    </li>
                </ul>
            </div>

            <div
                v-if="!tutor.ativo"
                class="flex flex-col gap-3 rounded-lg border bg-gray-50 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
                <p class="text-gray-700">
                    Este tutor está inativo e não aparece nas listagens.
                </p>
                <button
                    v-if="podeAcessar(PODE_VER_INATIVOS)"
                    :disabled="reativando"
                    class="rounded bg-green-700 px-4 py-2 font-semibold text-white disabled:opacity-60"
                    @click="reativar"
                >
                    {{ reativando ? 'Reativando...' : 'Reativar' }}
                </button>
            </div>

            <div
                v-else-if="confirmando"
                role="alertdialog"
                aria-labelledby="confirmar-inativacao"
                class="space-y-3 rounded-lg border border-red-300 bg-red-50 p-4"
            >
                <p id="confirmar-inativacao">
                    Inativar <strong>{{ tutor.nome }}</strong>? O tutor sai das listagens,
                    mas o cadastro é mantido.
                </p>
                <div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                    <button
                        :disabled="inativando"
                        class="rounded border bg-white px-4 py-2 hover:bg-gray-100"
                        @click="confirmando = false"
                    >
                        Cancelar
                    </button>
                    <button
                        :disabled="inativando"
                        class="rounded bg-red-700 px-4 py-2 font-semibold text-white disabled:opacity-60"
                        @click="inativar"
                    >
                        {{ inativando ? 'Inativando...' : 'Confirmar inativação' }}
                    </button>
                </div>
            </div>

            <div v-else class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                    v-if="podeAcessar(PODE_CRIAR_E_INATIVAR)"
                    class="rounded border border-red-600 bg-white px-4 py-2 text-red-700 hover:bg-red-50"
                    @click="confirmando = true"
                >
                    Inativar
                </button>
                <RouterLink
                    :to="{ name: 'tutor-editar', params: { id: tutor.id } }"
                    class="rounded bg-blue-700 px-4 py-2 text-center font-semibold text-white"
                >
                    Editar
                </RouterLink>
            </div>
        </template>
    </section>
</template>
