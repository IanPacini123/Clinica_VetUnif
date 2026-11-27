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

// A api manda esta mensagem no 409; o web compara para oferecer o link.
export const CPF_DE_TUTOR_INATIVO =
    'Este CPF pertence a um tutor inativo. Um administrador pode reativá-lo.'

export const buscaSchema = z.object({
    busca: z.string().trim().optional(),
    pagina: z.coerce.number().int().min(1).default(1),
    // stringbool: "false" vira false (o z.coerce.boolean daria true).
    inativos: z.stringbool().default(false),
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

export const idSchema = z.object({
    id: z.coerce.number().int().positive(),
})

export function camposDoErro(erro: z.ZodError): Record<string, string> {
    const campos: Record<string, string> = {}
    for (const issue of erro.issues) {
        const campo = issue.path.join('.')
        campos[campo] ??= issue.message
    }
    return campos
}

export const especieSchema = z.enum(
    ['CACHORRO', 'GATO', 'AVE', 'ROEDOR', 'OUTRO'],
    { error: 'Selecione a espécie.' },
)
export type Especie = z.infer<typeof especieSchema>

export const sexoSchema = z.enum(['MACHO', 'FEMEA'], { error: 'Selecione o sexo.' })
export type Sexo = z.infer<typeof sexoSchema>

// Data de hoje no fuso de quem executa, no formato AAAA-MM-DD.
export function hojeLocal(): string {
    const d = new Date()
    const mes = String(d.getMonth() + 1).padStart(2, '0')
    const dia = String(d.getDate()).padStart(2, '0')
    return `${d.getFullYear()}-${mes}-${dia}`
}

const vazioViraNull = (v: unknown) => {
    if (typeof v !== 'string') return v
    const limpo = v.trim()
    return limpo === '' ? null : limpo
}

export const animalEntradaSchema = z.object({
    nome: z.string({ error: 'Informe o nome.' }).trim().min(1, 'Informe o nome.'),
    especie: especieSchema,
    raca: z.preprocess(vazioViraNull, z.string().nullable().optional()),
    sexo: sexoSchema,
    dataNascimento: z.preprocess(
        vazioViraNull,
        z.iso.date('Data inválida.')
            .refine((d) => d <= hojeLocal(), 'A data de nascimento não pode ser futura.')
            .nullable()
            .optional(),
    ),
    tutorId: z.number({ error: 'Selecione o tutor.' }).int().positive('Selecione o tutor.'),
})
export type AnimalEntrada = z.infer<typeof animalEntradaSchema>

export const animalSchema = z.object({
    id: z.number(),
    nome: z.string(),
    especie: especieSchema,
    raca: z.string().nullable(),
    sexo: sexoSchema,
    dataNascimento: z.iso.date().nullable(),
    ativo: z.boolean(),
    tutor: tutorSchema,
})
export type Animal = z.infer<typeof animalSchema>

export const listaAnimaisSchema = z.object({
    itens: z.array(animalSchema),
    total: z.number(),
    pagina: z.number(),
    porPagina: z.number(),
})
export type ListaAnimais = z.infer<typeof listaAnimaisSchema>

export const animaisSchema = z.array(animalSchema)

// ---- Usuário ----

const senhaSchema = z.string({ error: 'Informe a senha.' })
    .min(8, 'A senha precisa ter pelo menos 8 caracteres.')

const usuarioCampos = z.object({
    nome: z.string({ error: 'Informe o nome.' })
        .trim()
        .min(3, 'O nome precisa ter pelo menos 3 caracteres.'),
    perfil: z.enum(perfilSchema.options, { error: 'Selecione o perfil.' }),
    crmv: z.preprocess(vazioViraNull, z.string().nullable().optional()),
})

type CamposCrmv = { perfil: Perfil; crmv?: string | null | undefined }
const temCrmvSeVeterinario = (d: CamposCrmv) =>
    d.perfil !== 'VETERINARIO' || !!d.crmv
const ERRO_CRMV = {
    message: 'Informe o CRMV do veterinário.',
    path: ['crmv'],
}

// Edição: o nome de usuário fica de fora, porque não muda.
export const usuarioEdicaoSchema = usuarioCampos
    .refine(temCrmvSeVeterinario, ERRO_CRMV)
export type UsuarioEdicao = z.infer<typeof usuarioEdicaoSchema>

export const usuarioEntradaSchema = usuarioCampos
    .extend({
        nomeUsuario: z.string({ error: 'Informe o nome de usuário.' })
            .trim()
            .min(3, 'O nome de usuário precisa ter de 3 a 30 caracteres.')
            .max(30, 'O nome de usuário precisa ter de 3 a 30 caracteres.')
            .regex(/^[a-z0-9.]+$/, 'Use só letras minúsculas, números e ponto.'),
        senha: senhaSchema,
    })
    .refine(temCrmvSeVeterinario, ERRO_CRMV)
export type UsuarioEntrada = z.infer<typeof usuarioEntradaSchema>

export const novaSenhaSchema = z.object({ senha: senhaSchema })
export type NovaSenha = z.infer<typeof novaSenhaSchema>

export const usuarioSchema = z.object({
    id: z.number(),
    nome: z.string(),
    nomeUsuario: z.string(),
    perfil: perfilSchema,
    crmv: z.string().nullable(),
    ativo: z.boolean(),
})
export type Usuario = z.infer<typeof usuarioSchema>

export const listaUsuariosSchema = z.object({
    itens: z.array(usuarioSchema),
    total: z.number(),
    pagina: z.number(),
    porPagina: z.number(),
})
export type ListaUsuarios = z.infer<typeof listaUsuariosSchema>

// ---- Atendimento ----

export const statusAtendimentoSchema = z.enum([
    'AGUARDANDO',
    'EM_ATENDIMENTO',
    'FINALIZADO',
    'CANCELADO',
])
export type StatusAtendimento = z.infer<typeof statusAtendimentoSchema>

// Em aberto = na Fila. Um Animal tem no máximo um (índice parcial no banco).
export const STATUS_EM_ABERTO: StatusAtendimento[] = ['AGUARDANDO', 'EM_ATENDIMENTO']

// Base sem o refine, para o .extend da Chegada (ver usuarioCampos).
const prioridadeQueixaCampos = z.object({
    prioridade: z.boolean().default(false),
    queixa: z.preprocess(vazioViraNull, z.string().nullable().optional()),
})

type CamposQueixa = { prioridade: boolean; queixa?: string | null | undefined }
const temQueixaSePrioridade = (d: CamposQueixa) => !d.prioridade || !!d.queixa
const ERRO_QUEIXA = {
    message: 'Informe a queixa do paciente prioritário.',
    path: ['queixa'],
}

// Edição enquanto o Atendimento está AGUARDANDO.
export const prioridadeQueixaSchema = prioridadeQueixaCampos
    .refine(temQueixaSePrioridade, ERRO_QUEIXA)
export type PrioridadeQueixa = z.infer<typeof prioridadeQueixaSchema>

export const chegadaSchema = prioridadeQueixaCampos
    .extend({
        animalId: z.number({ error: 'Selecione o animal.' })
            .int()
            .positive('Selecione o animal.'),
    })
    .refine(temQueixaSePrioridade, ERRO_QUEIXA)
export type Chegada = z.infer<typeof chegadaSchema>

export const atendimentoSchema = z.object({
    id: z.number(),
    status: statusAtendimentoSchema,
    prioridade: z.boolean(),
    queixa: z.string().nullable(),
    dataChegada: z.iso.datetime(),
    dataInicio: z.iso.datetime().nullable(),
    dataFim: z.iso.datetime().nullable(),
    animal: animalSchema,
    veterinario: z.object({ id: z.number(), nome: z.string() }).nullable(),
    peso: z.number().nullable(),
    anamnese: z.string().nullable(),
    diagnostico: z.string().nullable(),
    conduta: z.string().nullable(),
})
export type Atendimento = z.infer<typeof atendimentoSchema>

export const atendimentosSchema = z.array(atendimentoSchema)

const textoOpcional = z.preprocess(vazioViraNull, z.string().nullable().optional())

// Salvar: tudo opcional, para o VETERINARIO gravar e continuar depois.
// O peso vem como número ou "" (input type="number" vazio).
export const dadosClinicosSchema = z.object({
    peso: z.preprocess(
        vazioViraNull,
        z.number({ error: 'Peso inválido.' })
            .positive('O peso precisa ser maior que zero.')
            .max(999.99, 'O peso máximo é 999,99 kg.')
            .nullable()
            .optional(),
    ),
    anamnese: textoOpcional,
    diagnostico: textoOpcional,
    conduta: textoOpcional,
})
export type DadosClinicos = z.infer<typeof dadosClinicosSchema>

// Finalizar: os mesmos campos, com diagnóstico e conduta obrigatórios.
export const finalizacaoSchema = dadosClinicosSchema.extend({
    diagnostico: z.preprocess(
        vazioViraNull,
        z.string({ error: 'Informe o diagnóstico.' }),
    ),
    conduta: z.preprocess(
        vazioViraNull,
        z.string({ error: 'Informe a conduta.' }),
    ),
})
export type Finalizacao = z.infer<typeof finalizacaoSchema>
