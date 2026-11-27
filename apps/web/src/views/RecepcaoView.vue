<script setup lang="ts">
    import { usuario } from '../sessao/session'
</script>

<template>
    <section>
        <h1 class="text-2xl font-bold">Recepção</h1>
        <p class="text-gray-600">Olá, {{ usuario?.nome }} ({{ usuario?.perfil }}). Nenhum paciente na fila.</p>
    </section>
</template>
