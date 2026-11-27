import { createRouter, createWebHistory, type RouteRecordRaw } from "vue-router";
import { usuarioSessaoSchema, type Perfil } from "@clinica/shared";
import { token, usuario, podeAcessar } from "./sessao/session";
import { api } from "./api";
import { PODE_CRIAR_E_INATIVAR, PODE_GERIR_USUARIOS, PODE_REGISTRAR_CHEGADA } from "./perfis";

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
    { path: '/usuarios', name: 'usuarios', component: () => import('./views/UsuariosView.vue'), meta: { titulo: 'Usuários', perfis: PODE_GERIR_USUARIOS } },
]

const outrasTelas: RouteRecordRaw[] = [
    {
        path: '/chegada',
        name: 'chegada',
        component: () => import('./views/ChegadaView.vue'),
        meta: { perfis: PODE_REGISTRAR_CHEGADA },
    },
    {
        path: '/tutores/novo',
        name: 'tutor-novo',
        component: () => import('./views/TutorFormView.vue'),
        meta: { perfis: PODE_CRIAR_E_INATIVAR },
    },
    {
        path: '/tutores/:id/editar',
        name: 'tutor-editar',
        component: () => import('./views/TutorFormView.vue'),
    },
    {
        path: '/tutores/:id',
        name: 'tutor-detalhe',
        component: () => import('./views/TutorDetalheView.vue'),
    },
    {
        path: '/animais/novo',
        name: 'animal-novo',
        component: () => import('./views/AnimalFormView.vue'),
        meta: { perfis: PODE_CRIAR_E_INATIVAR },
    },
    {
        path: '/animais/:id/editar',
        name: 'animal-editar',
        component: () => import('./views/AnimalFormView.vue'),
    },
    {
        path: '/animais/:id',
        name: 'animal-detalhe',
        component: () => import('./views/AnimalDetalheView.vue'),
    },
    {
        path: '/usuarios/novo',
        name: 'usuario-novo',
        component: () => import('./views/UsuarioFormView.vue'),
        meta: { perfis: PODE_GERIR_USUARIOS },
    },
    {
        path: '/usuarios/:id/editar',
        name: 'usuario-editar',
        component: () => import('./views/UsuarioFormView.vue'),
        meta: { perfis: PODE_GERIR_USUARIOS },
    },
    {
        path: '/usuarios/:id',
        name: 'usuario-detalhe',
        component: () => import('./views/UsuarioDetalheView.vue'),
        meta: { perfis: PODE_GERIR_USUARIOS },
    },
]

export const router = createRouter({
    history: createWebHistory(),
    routes: [
        { path: '/login', name: 'login', component: () => import('./views/LoginView.vue'), meta: { publica: true } },
        { path: '/', component: () => import('./components/AppLayout.vue'), children: [...telas, ...outrasTelas] },
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
