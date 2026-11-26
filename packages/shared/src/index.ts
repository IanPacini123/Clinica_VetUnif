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
