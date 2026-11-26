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
