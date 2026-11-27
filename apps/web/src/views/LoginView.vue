<script setup lang="ts">
    import { ref } from "vue"
    import { useRouter } from "vue-router"
    import { loginSchema, respostaLoginSchema } from "@clinica/shared"
    import { api, ErroApi } from "../api"
    import { salvarSessao } from "../sessao/session"

    const router = useRouter()
    const nomeUsuario = ref('')
    const senha = ref('')
    const erro = ref<string | null>(null)
    const enviando = ref(false)

    async function entrar() {
        erro.value = null
        const dados = loginSchema.safeParse({ nomeUsuario: nomeUsuario.value, senha: senha.value })
        if ( !dados.success ) {
            erro.value = dados.error.issues[0]?.message ?? 'Dados inválidos.'
            return
        }

        enviando.value = true
        try {
            const response = await api('/api/login', respostaLoginSchema, {
            method: 'POST',
            body: JSON.stringify(dados.data),
            })
            salvarSessao(response.token, response.usuario)
            await router.push({ name: 'recepcao' })
        } catch (e) {
            console.error(e)
            erro.value = e instanceof ErroApi ? e.message : 'Erro inesperado.'
        } finally {
            enviando.value = false
        }
    }
</script>

<template>
    <main class="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <form @submit.prevent="entrar" class="w-full max-w-sm space-y-4 rounded-lg bg-white p-8 shadow">
            <h1 class="text-center text-2xl font-bold"> Clinica VetUnif </h1>
            
            <label class="block">
                <span class="text-sm text-gray-700"> Usuário </span>

                <input v-model="nomeUsuario" autocomplete="username" autofocus class="mt-1 w-full rounded border px-3 py-2"/>
            </label>

            <label class="block">
                <span class="text-sm text-gray-700"> Senha </span>
                
                <input v-model="senha" type="password" autocomplete="current-password" class="mt-1 w-full rounded border px-3 py-2" />
            </label>

            <p v-if="erro" role="alert" class="text-sm text-red-700"> {{ erro }} </p>

            <button :disabled="enviando" class="w-full rounded bg-blue-700 py-2 font-semibold text-white disabled:opacity-60">
                {{ enviando ? 'Entrando...' : 'Entrar' }}
            </button>
        </form>
    </main>
</template>
