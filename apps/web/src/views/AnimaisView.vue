<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { listaAnimaisSchema, type ListaAnimais } from '@clinica/shared'
import { api, ErroApi } from '../api'
import { NOME_ESPECIE, NOME_SEXO } from '../formatos'
import { podeAcessar } from '../sessao/session'
import { PODE_CRIAR_E_INATIVAR } from '../perfis'

const route = useRoute()
const router = useRouter()

const textoBusca = ref('')
const lista = ref<ListaAnimais | null>(null)
const carregando = ref(false)
const erro = ref<string | null>(null)

const totalPaginas = computed(() => {
    if (!lista.value) return 1
    return Math.max(1, Math.ceil(lista.value.total / lista.value.porPagina))
})

function textoDaQuery(valor: unknown): string {
    return typeof valor === 'string' ? valor : ''
}

async function carregar() {
    if (route.name !== 'animais') return

    const busca = textoDaQuery(route.query.busca)
    const pagina = Math.max(1, Number(textoDaQuery(route.query.pagina)) || 1)
    textoBusca.value = busca

    const params = new URLSearchParams({ pagina: String(pagina) })
    if (busca) params.set('busca', busca)

    carregando.value = true
    erro.value = null
    try {
        lista.value = await api(`/api/animais?${params}`, listaAnimaisSchema)
    } catch (e) {
        console.error(e)
        erro.value = e instanceof ErroApi ? e.message : 'Erro inesperado.'
    } finally {
        carregando.value = false
    }
}

watch(() => route.query, carregar, { immediate: true })

function buscar() {
    const busca = textoBusca.value.trim()
    router.push({ query: busca ? { busca } : {} })
}

function irParaPagina(pagina: number) {
    router.push({ query: { ...route.query, pagina: String(pagina) } })
}
</script>

<template>
    <section class="space-y-4">
        <div class="flex items-center justify-between gap-2">
            <h1 class="text-2xl font-bold">Animais</h1>
            <RouterLink
                v-if="podeAcessar(PODE_CRIAR_E_INATIVAR)"
                :to="{ name: 'animal-novo' }"
                class="rounded bg-blue-700 px-4 py-2 font-semibold text-white"
            >
                Novo animal
            </RouterLink>
        </div>

        <form class="flex gap-2" @submit.prevent="buscar">
            <input
                v-model="textoBusca"
                type="search"
                placeholder="Buscar por nome do animal ou do tutor"
                class="min-w-0 flex-1 rounded border bg-white px-3 py-2"
            />
            <button class="rounded bg-blue-700 px-4 py-2 font-semibold text-white">
                Buscar
            </button>
        </form>

        <p v-if="erro" role="alert" class="text-sm text-red-700">{{ erro }}</p>
        <p v-else-if="carregando && !lista" class="text-gray-600">Carregando...</p>

        <template v-else-if="lista">
            <p v-if="lista.itens.length === 0" class="text-gray-600">
                Nenhum animal encontrado.
            </p>

            <div v-else class="overflow-hidden rounded-lg bg-white shadow">
                <table class="w-full text-left text-sm">
                    <thead class="bg-gray-50 text-gray-600">
                        <tr>
                            <th class="px-4 py-2">Nome</th>
                            <th class="px-4 py-2">Espécie</th>
                            <th class="hidden px-4 py-2 md:table-cell">Sexo</th>
                            <th class="px-4 py-2">Tutor</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="animal in lista.itens" :key="animal.id" class="border-t">
                            <td class="px-4 py-2 font-medium">
                                <RouterLink
                                    :to="{ name: 'animal-detalhe', params: { id: animal.id } }"
                                    class="text-blue-700 hover:underline"
                                >
                                    {{ animal.nome }}
                                </RouterLink>
                            </td>
                            <td class="px-4 py-2">{{ NOME_ESPECIE[animal.especie] }}</td>
                            <td class="hidden px-4 py-2 md:table-cell">
                                {{ NOME_SEXO[animal.sexo] }}
                            </td>
                            <td class="px-4 py-2">
                                <RouterLink
                                    :to="{ name: 'tutor-detalhe', params: { id: animal.tutor.id } }"
                                    class="hover:underline"
                                >
                                    {{ animal.tutor.nome }}
                                </RouterLink>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <nav class="flex items-center justify-between gap-2 text-sm">
                <button
                    :disabled="lista.pagina <= 1"
                    class="rounded border bg-white px-3 py-1 disabled:opacity-50"
                    @click="irParaPagina(lista.pagina - 1)"
                >
                    Anterior
                </button>
                <span class="text-gray-600">
                    Página {{ lista.pagina }} de {{ totalPaginas }} · {{ lista.total }} animal(is)
                </span>
                <button
                    :disabled="lista.pagina >= totalPaginas"
                    class="rounded border bg-white px-3 py-1 disabled:opacity-50"
                    @click="irParaPagina(lista.pagina + 1)"
                >
                    Próxima
                </button>
            </nav>
        </template>
    </section>
</template>
