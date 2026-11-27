import { createRouter, createWebHistory, type RouteRecordRaw } from "vue-router";
import { usuarioSessaoSchema, type Perfil } from "@clinica/shared";
import { token, usuario, podeAcessar } from "./sessao/session";
import { api } from "./api";

declare module 'vue-router' {
    interface RouteMeta {
        publica?: boolean
        titulo?: string
        perfis?: Perfil[]
    }
}

export const telas: RouteRecordRaw[] = [
    { path: '/', name: 'recepcao', component: () => import('./views/RecepcaoView.vue'), meta: { titulo: 'Recepção' } },
    { path: '/tutores', name: 'tutores', component: () => import('./views/TutoresView.vue'), meta: { titulo: 'Tutores' } },
    { path: '/animais', name: 'animais', component: () => import('./views/AnimaisView.vue'), meta: { titulo: 'Animais' } },
    { path: '/usuarios', name: 'usuarios', component: () => import('./views/UsuariosView.vue'), meta: { titulo: 'Usuários', perfis: ['ADMIN'] } },
]

export const router = createRouter({
    history: createWebHistory(),
    routes: [
        { path: '/login', name: 'login', component: () => import('./views/LoginView.vue'), meta: { publica: true } },
        { path: '/', component: () => import('./components/AppLayout.vue'), children: telas },
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

    if ( !podeAcessar(destino.meta.perfis) ) return { name: 'recepcao' }
    return true
})
