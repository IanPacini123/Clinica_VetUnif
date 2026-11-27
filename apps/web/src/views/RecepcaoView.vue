<script setup lang="ts">
    import { usuario } from '../sessao/session'
</script>

<template>
    <main class="p-8">
        <h1 class="text-2xl font-bold">Recepção</h1>
        <p class="text-gray-600">Olá, {{ usuario?.nome }} ({{ usuario?.perfil }}). Nenhum paciente na fila.</p>
    </main>
</template>
