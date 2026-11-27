import { z } from 'zod'

export const saudeSchema = z.object({
    status: z.string(),
    dbConnection: z.string(),
})
export type Saude = z.infer<typeof saudeSchema>

export const erroSchema = z.object({
    mensagem: z.string(),
    campos: z.record(z.string(), z.string()).optional(),
})
export type Erro = z.infer<typeof erroSchema>

export const perfilSchema = z.enum(['ADMIN', 'ATENDENTE', 'VETERINARIO'])
export type Perfil = z.infer<typeof perfilSchema>

export const loginSchema = z.object({
    nomeUsuario: z.string().trim().min(1, 'Informe o usuário.'),
    senha: z.string().min(1, 'Informe a senha.'),
})
export type Login = z.infer<typeof loginSchema>

export const usuarioSessaoSchema = z.object({
    id: z.number(),
    nome: z.string(),
    nomeUsuario: z.string(),
    perfil: perfilSchema,
})
export type UsuarioSessao = z.infer<typeof usuarioSessaoSchema>

export const respostaLoginSchema = z.object({
    token: z.string(),
    usuario: usuarioSessaoSchema,
})
export type RespostaLogin = z.infer<typeof respostaLoginSchema>

function cpfValido(cpf: string): boolean {
    if (!/^\d{11}$/.test(cpf) || /^(\d)\1{10}$/.test(cpf)) return false

    const digito = (n: number) => {
        let soma = 0
        for (let i = 0; i < n; i++) soma += Number(cpf[i]) * (n + 1 - i)
        const resto = (soma * 10) % 11
        return resto === 10 ? 0 : resto
    }
    return digito(9) === Number(cpf[9]) && digito(10) === Number(cpf[10])
}

const soDigitos = (v: string) => v.replace(/\D/g, '')

export const tutorEntradaSchema = z.object({
    nome: z.string().trim().min(3, 'O nome precisa ter pelo menos 3 caracteres.'),
    cpf: z.string()
        .transform(soDigitos)
        .pipe(z.string().min(1, 'Informe o CPF.').refine(cpfValido, 'CPF inválido.')),
    telefone: z.string()
        .transform(soDigitos)
        .pipe(z.string().min(10, 'Informe o telefone com DDD.').max(11, 'Telefone inválido.')),
    email: z.preprocess(
        (v) => (typeof v === 'string' && v.trim() === '' ? null : typeof v === 'string' ? v.trim() : v),
        z.email('E-mail inválido.').nullable().optional(),
    ),
})
export type TutorEntrada = z.infer<typeof tutorEntradaSchema>

export const tutorSchema = z.object({
    id: z.number(),
    nome: z.string(),
    cpf: z.string(),
    telefone: z.string(),
    email: z.string().nullable(),
    ativo: z.boolean(),
})
export type Tutor = z.infer<typeof tutorSchema>

export const buscaSchema = z.object({
    busca: z.string().trim().optional(),
    pagina: z.coerce.number().int().min(1).default(1),
})
export type Busca = z.infer<typeof buscaSchema>

export const POR_PAGINA = 20

export const listaTutoresSchema = z.object({
    itens: z.array(tutorSchema),
    total: z.number(),
    pagina: z.number(),
    porPagina: z.number(),
})
export type ListaTutores = z.infer<typeof listaTutoresSchema>
