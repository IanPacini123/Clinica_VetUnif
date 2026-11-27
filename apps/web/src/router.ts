import { createRouter, createWebHistory } from "vue-router";
import { usuarioSessaoSchema } from "@clinica/shared";
import { token, usuario } from "./sessao/session";
import { api } from "./api";

declare module 'vue-router' {
    interface RouteMeta {
        publica?: boolean
    }
}

export const router = createRouter({
    history: createWebHistory(),
    routes: [
        { path: '/login', name: 'login', component: () => import ('./views/LoginView.vue'), meta: { publica: true } },
        { path: '/', name: 'recepcao', component: () => import('./views/RecepcaoView.vue') },
        { path: '/:caminho(.*)*', redirect: '/' },
    ],
})

router.beforeEach( async (destino) => {
    if ( destino.meta.publica ) {
        return token.value ? { name: 'recepcao' } : true
    }
    if ( !token.value) return { name: 'login' }

    if ( !usuario.value ) {
        try {
            usuario.value = await api('/api/sessao', usuarioSessaoSchema)
        } catch {
            return { name: 'login' }
        }
    }
    return true
})
