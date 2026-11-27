<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { listaUsuariosSchema, type ListaUsuarios } from '@clinica/shared'
import { api, ErroApi } from '../api'
import { NOME_PERFIL } from '../perfis'
import SeloInativo from '../components/SeloInativo.vue'

const route = useRoute()
const router = useRouter()

const textoBusca = ref('')
const mostrarInativos = ref(false)
const lista = ref<ListaUsuarios | null>(null)
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
    if (route.name !== 'usuarios') return

    const busca = textoDaQuery(route.query.busca)
    const pagina = Math.max(1, Number(textoDaQuery(route.query.pagina)) || 1)
    // A tela inteira é só do ADMIN, então o filtro não precisa de outra checagem.
    const inativos = route.query.inativos === 'true'
    textoBusca.value = busca
    mostrarInativos.value = inativos

    const params = new URLSearchParams({ pagina: String(pagina) })
    if (busca) params.set('busca', busca)
    if (inativos) params.set('inativos', 'true')

    carregando.value = true
    erro.value = null
    try {
        lista.value = await api(`/api/usuarios?${params}`, listaUsuariosSchema)
    } catch (e) {
        console.error(e)
        erro.value = e instanceof ErroApi ? e.message : 'Erro inesperado.'
    } finally {
        carregando.value = false
    }
}

watch(() => route.query, carregar, { immediate: true })

// Uma busca nova ou a troca do filtro volta para a página 1.
function buscar() {
    const busca = textoBusca.value.trim()
    const query: Record<string, string> = {}
    if (busca) query.busca = busca
    if (mostrarInativos.value) query.inativos = 'true'
    router.push({ query })
}

function irParaPagina(pagina: number) {
    router.push({ query: { ...route.query, pagina: String(pagina) } })
}
</script>

<template>
    <section class="space-y-4">
        <div class="flex items-center justify-between gap-2">
            <h1 class="text-2xl font-bold">Usuários</h1>
            <RouterLink
                :to="{ name: 'usuario-novo' }"
                class="rounded bg-blue-700 px-4 py-2 font-semibold text-white"
            >
                Novo usuário
            </RouterLink>
        </div>

        <form class="flex gap-2" @submit.prevent="buscar">
            <input
                v-model="textoBusca"
                type="search"
                placeholder="Buscar por nome ou usuário"
                class="min-w-0 flex-1 rounded border bg-white px-3 py-2"
            />
            <button class="rounded bg-blue-700 px-4 py-2 font-semibold text-white">
                Buscar
            </button>
        </form>

        <label class="flex w-fit items-center gap-2 text-sm">
            <input v-model="mostrarInativos" type="checkbox" @change="buscar" />
            Mostrar inativos
        </label>

        <p v-if="erro" role="alert" class="text-sm text-red-700">{{ erro }}</p>
        <p v-else-if="carregando && !lista" class="text-gray-600">Carregando...</p>

        <template v-else-if="lista">
            <p v-if="lista.itens.length === 0" class="text-gray-600">
                Nenhum usuário encontrado.
            </p>

            <div v-else class="overflow-hidden rounded-lg bg-white shadow">
                <table class="w-full text-left text-sm">
                    <thead class="bg-gray-50 text-gray-600">
                        <tr>
                            <th class="px-4 py-2">Nome</th>
                            <th class="px-4 py-2">Usuário</th>
                            <th class="hidden px-4 py-2 md:table-cell">Perfil</th>
                            <th class="hidden px-4 py-2 lg:table-cell">CRMV</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr
                            v-for="item in lista.itens"
                            :key="item.id"
                            class="border-t"
                            :class="{ 'bg-gray-100 text-gray-500': !item.ativo }"
                        >
                            <td class="px-4 py-2 font-medium">
                                <RouterLink
                                    :to="{ name: 'usuario-detalhe', params: { id: item.id } }"
                                    class="text-blue-700 hover:underline"
                                >
                                    {{ item.nome }}
                                </RouterLink>
                                <SeloInativo v-if="!item.ativo" />
                            </td>
                            <td class="break-all px-4 py-2">{{ item.nomeUsuario }}</td>
                            <td class="hidden whitespace-nowrap px-4 py-2 md:table-cell">
                                {{ NOME_PERFIL[item.perfil] }}
                            </td>
                            <td class="hidden px-4 py-2 lg:table-cell">
                                {{ item.crmv ?? '—' }}
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
                    Página {{ lista.pagina }} de {{ totalPaginas }} · {{ lista.total }} usuário(s)
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
