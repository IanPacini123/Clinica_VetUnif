<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { animalSchema, type Animal } from '@clinica/shared'
import { api, ErroApi, SEM_CONTEUDO } from '../api'
import { formatarData, formatarTelefone, NOME_ESPECIE, NOME_SEXO } from '../formatos'
import { podeAcessar } from '../sessao/session'
import { PODE_CRIAR_E_INATIVAR } from '../perfis'

const route = useRoute()
const router = useRouter()

const id = computed(() => {
    return typeof route.params.id === 'string' ? Number(route.params.id) : null
})

const animal = ref<Animal | null>(null)
const erro = ref<string | null>(null)
const carregando = ref(false)
const confirmando = ref(false)
const inativando = ref(false)

function mensagemDe(e: unknown): string {
    console.error(e)
    return e instanceof ErroApi ? e.message : 'Erro inesperado.'
}

async function carregar() {
    if (route.name !== 'animal-detalhe') return

    animal.value = null
    erro.value = null
    confirmando.value = false
    if (id.value === null) return

    carregando.value = true
    try {
        animal.value = await api(`/api/animais/${id.value}`, animalSchema)
    } catch (e) {
        erro.value = mensagemDe(e)
    } finally {
        carregando.value = false
    }
}

watch(id, carregar, { immediate: true })

async function inativar() {
    if (!animal.value) return

    inativando.value = true
    erro.value = null
    try {
        await api(`/api/animais/${animal.value.id}`, SEM_CONTEUDO, { method: 'DELETE' })
        await router.push({ name: 'animais' })
    } catch (e) {
        erro.value = mensagemDe(e)
        confirmando.value = false
    } finally {
        inativando.value = false
    }
}
</script>

<template>
    <section class="max-w-xl space-y-4">
        <RouterLink :to="{ name: 'animais' }" class="text-sm text-blue-700 hover:underline">
            ← Animais
        </RouterLink>

        <p v-if="carregando" class="text-gray-600">Carregando...</p>
        <p v-if="erro" role="alert" class="text-sm text-red-700">{{ erro }}</p>

        <template v-if="animal">
            <h1 class="text-2xl font-bold">{{ animal.nome }}</h1>

            <dl class="grid gap-4 rounded-lg bg-white p-4 shadow sm:grid-cols-2 md:p-6">
                <div>
                    <dt class="text-sm text-gray-500">Espécie</dt>
                    <dd>{{ NOME_ESPECIE[animal.especie] }}</dd>
                </div>
                <div>
                    <dt class="text-sm text-gray-500">Sexo</dt>
                    <dd>{{ NOME_SEXO[animal.sexo] }}</dd>
                </div>
                <div>
                    <dt class="text-sm text-gray-500">Raça</dt>
                    <dd>{{ animal.raca ?? '—' }}</dd>
                </div>
                <div>
                    <dt class="text-sm text-gray-500">Data de nascimento</dt>
                    <dd>{{ animal.dataNascimento ? formatarData(animal.dataNascimento) : '—' }}</dd>
                </div>
                <div class="sm:col-span-2">
                    <dt class="text-sm text-gray-500">Tutor</dt>
                    <dd>
                        <RouterLink
                            :to="{ name: 'tutor-detalhe', params: { id: animal.tutor.id } }"
                            class="text-blue-700 hover:underline"
                        >
                            {{ animal.tutor.nome }}
                        </RouterLink>
                        <span class="text-gray-600">
                            · {{ formatarTelefone(animal.tutor.telefone) }}
                        </span>
                    </dd>
                </div>
            </dl>

            <div
                v-if="confirmando"
                role="alertdialog"
                aria-labelledby="confirmar-inativacao"
                class="space-y-3 rounded-lg border border-red-300 bg-red-50 p-4"
            >
                <p id="confirmar-inativacao">
                    Inativar <strong>{{ animal.nome }}</strong>? O animal sai das listagens,
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
                    :to="{ name: 'animal-editar', params: { id: animal.id } }"
                    class="rounded bg-blue-700 px-4 py-2 text-center font-semibold text-white"
                >
                    Editar
                </RouterLink>
            </div>
        </template>
    </section>
</template>
