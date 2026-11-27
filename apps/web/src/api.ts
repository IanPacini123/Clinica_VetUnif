import { erroSchema } from "@clinica/shared";
import { token, encerrarSessao } from "./sessao/session";
import { router } from "./router";

export class ErroApi extends Error {
    status: number
    constructor( status: number, mensagem: string  ) {
        super(mensagem)
        this.status = status
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
        const erro = erroSchema.safeParse(body)
        throw new ErroApi(response.status, erro.success ? erro.data.mensagem : `Erro inesperado.`)
    }

    return schema.parse(body)
}
