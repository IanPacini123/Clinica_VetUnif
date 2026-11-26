<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { saudeSchema, erroSchema, type Saude } from '@clinica/shared'

const saude = ref<Saude | null>(null)
const erro = ref<string | null>(null)

onMounted(async () => {
    try {
        const resposta = await fetch('/api/health')
        const corpo = await resposta.json().catch(() => null)

        if (resposta.ok) {
            saude.value = saudeSchema.parse(corpo)
        } else {
            const resultado = erroSchema.safeParse(corpo)
            erro.value = resultado.success 
            ? resultado.data.mensagem 
            : 'Não foi possivel falar com a API.'
        }
    } catch (e) {
        console.error(e)
        erro.value =  'Não foi possivel falar com a API.'
    }
})
</script>

<template>
    <main class="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <div class="w-full max-w-sm rounded-lg bg-white p-8 shadow text-center">
            <h1 class="mb-4 text-2xl font-bold"> Clinica veterinaria VetUnif</h1>
            <p v-if="saude" class="text-green-700">API ok / banco ok</p>
            <p v-else-if="erro" class="text-red-700">{{ erro }} </p>
            <p v-else class="text-gray-500">Verificando.....</p>
        </div>
    </main>
</template>

