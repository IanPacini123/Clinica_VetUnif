<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { camposDoErro, novaSenhaSchema, usuarioSchema, type Usuario } from '@clinica/shared'
import { api, ErroApi, SEM_CONTEUDO } from '../api'
import { NOME_PERFIL } from '../perfis'
import { usuario as usuarioLogado } from '../sessao/session'
import CampoTexto from '../components/CampoTexto.vue'
import SeloInativo from '../components/SeloInativo.vue'

const route = useRoute()
const router = useRouter()

const id = computed(() => {
    return typeof route.params.id === 'string' ? Number(route.params.id) : null
})

const usuario = ref<Usuario | null>(null)
const erro = ref<string | null>(null)
const carregando = ref(false)
const confirmando = ref(false)
const inativando = ref(false)
const reativando = ref(false)

// O ADMIN não inativa a si mesmo (a api responde 409); o botão nem aparece.
const ehOProprio = computed(() => usuario.value?.id === usuarioLogado.value?.id)

const trocandoSenha = ref(false)
const novaSenha = ref('')
const erroSenha = ref<string | undefined>(undefined)
const salvandoSenha = ref(false)
const senhaSalva = ref(false)

function mensagemDe(e: unknown): string {
    console.error(e)
    return e instanceof ErroApi ? e.message : 'Erro inesperado.'
}

function fecharSenha() {
    trocandoSenha.value = false
    novaSenha.value = ''
    erroSenha.value = undefined
}

async function carregar() {
    if (route.name !== 'usuario-detalhe') return

    usuario.value = null
    erro.value = null
    confirmando.value = false
    senhaSalva.value = false
    fecharSenha()
    if (id.value === null) return

    carregando.value = true
    try {
        usuario.value = await api(`/api/usuarios/${id.value}`, usuarioSchema)
    } catch (e) {
        erro.value = mensagemDe(e)
    } finally {
        carregando.value = false
    }
}

watch(id, carregar, { immediate: true })

async function inativar() {
    if (!usuario.value) return

    inativando.value = true
    erro.value = null
    try {
        await api(`/api/usuarios/${usuario.value.id}`, SEM_CONTEUDO, { method: 'DELETE' })
        await router.push({ name: 'usuarios' })
    } catch (e) {
        erro.value = mensagemDe(e)
        confirmando.value = false
    } finally {
        inativando.value = false
    }
}

// Reativar não apaga nada, então não pede confirmação.
async function reativar() {
    if (!usuario.value) return

    reativando.value = true
    erro.value = null
    try {
        usuario.value = await api(`/api/usuarios/${usuario.value.id}/reativar`, usuarioSchema, {
            method: 'POST',
        })
    } catch (e) {
        erro.value = mensagemDe(e)
    } finally {
        reativando.value = false
    }
}

async function salvarSenha() {
    if (!usuario.value) return

    erroSenha.value = undefined
    senhaSalva.value = false
    const dados = novaSenhaSchema.safeParse({ senha: novaSenha.value })
    if (!dados.success) {
        erroSenha.value = camposDoErro(dados.error).senha
        return
    }

    salvandoSenha.value = true
    try {
        await api(`/api/usuarios/${usuario.value.id}/senha`, SEM_CONTEUDO, {
            method: 'PUT',
            body: JSON.stringify(dados.data),
        })
        fecharSenha()
        senhaSalva.value = true
    } catch (e) {
        erroSenha.value = e instanceof ErroApi ? e.campos.senha ?? e.message : mensagemDe(e)
    } finally {
        salvandoSenha.value = false
    }
}
</script>

<template>
    <section class="max-w-xl space-y-4">
        <RouterLink :to="{ name: 'usuarios' }" class="text-sm text-blue-700 hover:underline">
            ← Usuários
        </RouterLink>

        <p v-if="carregando" class="text-gray-600">Carregando...</p>
        <p v-if="erro" role="alert" class="text-sm text-red-700">{{ erro }}</p>

        <template v-if="usuario">
            <h1 class="text-2xl font-bold">
                {{ usuario.nome }}
                <SeloInativo v-if="!usuario.ativo" />
            </h1>

            <dl class="grid gap-4 rounded-lg bg-white p-4 shadow sm:grid-cols-2 md:p-6">
                <div>
                    <dt class="text-sm text-gray-500">Nome de usuário</dt>
                    <dd class="break-all">{{ usuario.nomeUsuario }}</dd>
                </div>
                <div>
                    <dt class="text-sm text-gray-500">Perfil</dt>
                    <dd>{{ NOME_PERFIL[usuario.perfil] }}</dd>
                </div>
                <div v-if="usuario.perfil === 'VETERINARIO'">
                    <dt class="text-sm text-gray-500">CRMV</dt>
                    <dd>{{ usuario.crmv ?? '—' }}</dd>
                </div>
            </dl>

            <div
                v-if="!usuario.ativo"
                class="flex flex-col gap-3 rounded-lg border bg-gray-50 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
                <p class="text-gray-700">
                    Este usuário está inativo e não consegue entrar no sistema.
                </p>
                <button
                    :disabled="reativando"
                    class="rounded bg-green-700 px-4 py-2 font-semibold text-white disabled:opacity-60"
                    @click="reativar"
                >
                    {{ reativando ? 'Reativando...' : 'Reativar' }}
                </button>
            </div>

            <template v-else>
                <div class="space-y-3 rounded-lg bg-white p-4 shadow md:p-6">
                    <div class="flex items-center justify-between gap-2">
                        <h2 class="font-semibold">Senha</h2>
                        <button
                            v-if="!trocandoSenha"
                            class="rounded border px-3 py-1 text-sm hover:bg-gray-100"
                            @click="trocandoSenha = true; senhaSalva = false"
                        >
                            Definir nova senha
                        </button>
                    </div>
                    <p v-if="senhaSalva" role="status" class="text-sm text-green-700">
                        Nova senha definida.
                    </p>

                    <form
                        v-if="trocandoSenha"
                        novalidate
                        class="space-y-3"
                        @submit.prevent="salvarSenha"
                    >
                        <!-- O campo oculto diz ao gerenciador de senhas de quem é a senha. -->
                        <input
                            type="text"
                            :value="usuario.nomeUsuario"
                            autocomplete="username"
                            class="hidden"
                            readonly
                        />
                        <CampoTexto
                            v-model="novaSenha"
                            rotulo="Nova senha"
                            :erro="erroSenha"
                            type="password"
                            autocomplete="new-password"
                        />
                        <div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                            <button
                                type="button"
                                :disabled="salvandoSenha"
                                class="rounded border px-4 py-2 hover:bg-gray-100"
                                @click="fecharSenha"
                            >
                                Cancelar
                            </button>
                            <button
                                :disabled="salvandoSenha"
                                class="rounded bg-blue-700 px-4 py-2 font-semibold text-white disabled:opacity-60"
                            >
                                {{ salvandoSenha ? 'Salvando...' : 'Salvar senha' }}
                            </button>
                        </div>
                    </form>
                </div>

                <div
                    v-if="confirmando"
                    role="alertdialog"
                    aria-labelledby="confirmar-inativacao"
                    class="space-y-3 rounded-lg border border-red-300 bg-red-50 p-4"
                >
                    <p id="confirmar-inativacao">
                        Inativar <strong>{{ usuario.nome }}</strong>? O usuário não consegue
                        mais entrar, mas o cadastro é mantido.
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
                        v-if="!ehOProprio"
                        class="rounded border border-red-600 bg-white px-4 py-2 text-red-700 hover:bg-red-50"
                        @click="confirmando = true"
                    >
                        Inativar
                    </button>
                    <RouterLink
                        :to="{ name: 'usuario-editar', params: { id: usuario.id } }"
                        class="rounded bg-blue-700 px-4 py-2 text-center font-semibold text-white"
                    >
                        Editar
                    </RouterLink>
                </div>
            </template>
        </template>
    </section>
</template>
