import { ref } from "vue";
import type { UsuarioSessao } from "@clinica/shared";

const CHAVE_TOKEN = `token`

export const token = ref<string | null>(localStorage.getItem(CHAVE_TOKEN))
export const usuario = ref<UsuarioSessao | null>(null)

export function salvarSessao(novoToken: string, novoUsuario: UsuarioSessao) {
    localStorage.setItem(CHAVE_TOKEN, novoToken)
    token.value = novoToken
    usuario.value = novoUsuario
}

export function encerrarSessao() {
    localStorage.removeItem(CHAVE_TOKEN)
    token.value = null
    usuario.value = null
}

