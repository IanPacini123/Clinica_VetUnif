<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { tutorSchema, type Tutor } from '@clinica/shared'
import { api, ErroApi, SEM_CONTEUDO } from '../api'
import { formatarCpf, formatarTelefone } from '../formatos'
import { podeAcessar } from '../sessao/session'
import { PODE_CRIAR_E_INATIVAR } from '../perfis'

const route = useRoute()
const router = useRouter()

const id = computed(() => {
    return typeof route.params.id === 'string' ? Number(route.params.id) : null
})

const tutor = ref<Tutor | null>(null)
const erro = ref<string | null>(null)
const carregando = ref(false)
const confirmando = ref(false)
const inativando = ref(false)

function mensagemDe(e: unknown): string {
    console.error(e)
    return e instanceof ErroApi ? e.message : 'Erro inesperado.'
}

async function carregar() {
    tutor.value = null
    erro.value = null
    confirmando.value = false
    if (id.value === null) return

    carregando.value = true
    try {
        tutor.value = await api(`/api/tutores/${id.value}`, tutorSchema)
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
</script>

<template>
    <section class="max-w-xl space-y-4">
        <RouterLink :to="{ name: 'tutores' }" class="text-sm text-blue-700 hover:underline">
            ← Tutores
        </RouterLink>

        <p v-if="carregando" class="text-gray-600">Carregando...</p>
        <p v-if="erro" role="alert" class="text-sm text-red-700">{{ erro }}</p>

        <template v-if="tutor">
            <h1 class="text-2xl font-bold">{{ tutor.nome }}</h1>

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

            <div
                v-if="confirmando"
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
