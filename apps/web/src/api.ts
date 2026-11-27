import { erroSchema, type Erro } from "@clinica/shared";
import { token, encerrarSessao } from "./sessao/session";
import { router } from "./router";

export class ErroApi extends Error {
    status: number
    campos: Record<string, string>
    constructor( status: number, mensagem: string, campos: Record<string, string> = {} ) {
        super(mensagem)
        this.status = status
        this.campos = campos
    }
}

type Validador<T> = { parse(dados: unknown): T }

export async function api<T>(caminho: string, schema: Validador<T>, opcoes: RequestInit = {}): Promise<T> {
    const headers = new Headers(opcoes.headers)
    if ( token.value ) headers.set( `Authorization`, `Bearer ${token.value}` )
    if ( opcoes.body ) headers.set( `Content-Type`, `application/json` )

    let response: Response
    try {
        response = await fetch(caminho, { ...opcoes, headers })
    } catch (e) {
        console.error(e)
        throw new ErroApi(0, `Não foi possivel comunicar com a API.`)
    }

    const body = await response.json().catch(() => null)

    if ( !response.ok ) {
        if ( response.status === 401 && caminho !== `/api/login` ) {
            encerrarSessao()
            router.replace({ name: `login` })
        }
        const resultado = erroSchema.safeParse(body)
        const erro: Erro = resultado.success ? resultado.data : { mensagem: `Erro inesperado.` }
        throw new ErroApi(response.status, erro.mensagem, erro.campos)
    }

    return schema.parse(body)
}
