<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usuario, encerrarSessao, podeAcessar } from '../sessao/session'
import { telas } from '../router'
import { NOME_PERFIL } from '../perfis'

const route = useRoute()
const router = useRouter()
const menuAberto = ref(false)

const telasVisiveis = computed(() => telas.filter((tela) => podeAcessar(tela.meta?.perfis)))

watch(() => route.fullPath, () => {
    menuAberto.value = false
})

async function sair() {
    encerrarSessao()
    await router.push({ name: 'login' })
}
</script>

<template>
    <div class="min-h-screen bg-gray-100 md:flex">
        <div v-if="menuAberto" class="fixed inset-0 z-20 bg-black/40 md:hidden" @click="menuAberto = false"></div>

        <aside :class="[
            'fixed inset-y-0 left-0 z-30 w-60 bg-blue-900 text-white transition-transform md:static md:translate-x-0',
            menuAberto ? 'translate-x-0' : '-translate-x-full',
        ]">
            <div class="p-4 text-lg font-bold">Clínica VetUnif</div>
            <nav class="flex flex-col">
                <RouterLink v-for="tela in telasVisiveis" :key="tela.path" :to="tela.path"
                            class="px-4 py-3 hover:bg-blue-800" exact-active-class="bg-blue-800 font-semibold">
                    {{ tela.meta?.titulo }}
                </RouterLink>
            </nav>
        </aside>

        <div class="flex min-w-0 flex-1 flex-col">
            <header class="flex items-center gap-3 bg-white px-4 py-3 shadow">
                <button class="rounded px-2 py-1 text-2xl md:hidden" @click="menuAberto = !menuAberto"
                        aria-label="Abrir menu" :aria-expanded="menuAberto">☰</button>

                <div class="ml-auto text-right text-sm">
                    <p class="font-semibold">{{ usuario?.nome }}</p>
                    <p class="text-gray-500">{{ usuario ? NOME_PERFIL[usuario.perfil] : '' }}</p>
                </div>
                <button class="rounded border px-3 py-1 text-sm hover:bg-gray-100" @click="sair">Sair</button>
            </header>

            <main class="flex-1 p-4 md:p-8">
                <RouterView />
            </main>
        </div>
    </div>
</template>
