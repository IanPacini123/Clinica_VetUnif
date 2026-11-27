import { prisma } from "./db.js"
import { gerarHash } from "./auth/senha.js"
import type { Perfil } from "@clinica/shared"

const senhaAdmin = process.env.ADMIN_SENHA

if (!senhaAdmin || senhaAdmin.length < 8) {
    throw new Error('ADMIN_SENHA nao fornecido ou com menos de 8 caracteres.')
}

// Senha publica: aparece no README.
const SENHA_DEMO = 'demo1234'

// CPF do primeiro Tutor de demonstracao. Se ele existe, a
// demonstracao ja foi criada e o seed nao cria de novo.
const CPF_MARCADOR = '31820465780'

const MINUTO = 60_000
const DIA = 24 * 60 * MINUTO

type NovoUsuario = {
    nomeUsuario: string
    nome: string
    perfil: Perfil
    crmv: string | null
    senha: string
}

async function garantirUsuario(dados: NovoUsuario) {
    const { senha, ...campos } = dados
    const usuario = await prisma.usuario.upsert({
        where: { nomeUsuario: campos.nomeUsuario },
        update: {},
        create: { ...campos, senhaHash: await gerarHash(senha) },
    })
    console.log(`Usuário "${usuario.nomeUsuario}" (id ${usuario.id}).`)
    return usuario
}

function minutosAtras(minutos: number): Date {
    return new Date(Date.now() - minutos * MINUTO)
}

// Chegada ha `dias` dias; inicio 15 min depois; fim 40 min depois.
function periodo(dias: number) {
    const chegada = Date.now() - dias * DIA
    return {
        dataChegada: new Date(chegada),
        dataInicio: new Date(chegada + 15 * MINUTO),
        dataFim: new Date(chegada + 40 * MINUTO),
    }
}

// Cancelado antes de o veterinario chamar: sem dataInicio.
function cancelado(dias: number) {
    const { dataChegada, dataFim } = periodo(dias)
    return { status: 'CANCELADO' as const, dataChegada, dataFim }
}

await garantirUsuario({
    nomeUsuario: 'admin',
    nome: 'Administrador',
    perfil: 'ADMIN',
    crmv: null,
    senha: senhaAdmin,
})

await garantirUsuario({
    nomeUsuario: 'atendente',
    nome: 'Beatriz Lima',
    perfil: 'ATENDENTE',
    crmv: null,
    senha: SENHA_DEMO,
})

const veterinario = await garantirUsuario({
    nomeUsuario: 'veterinario',
    nome: 'Paulo Mendes',
    perfil: 'VETERINARIO',
    crmv: 'CRMV-CE 01234',
    senha: SENHA_DEMO,
})

const finalizado = {
    status: 'FINALIZADO' as const,
    veterinarioId: veterinario.id,
}

const jaCriada = await prisma.tutor.findUnique({
    where: { cpf: CPF_MARCADOR },
})

if (jaCriada) {
    console.log('Demonstração já existe; nada a criar.')
} else {
    // Tudo ou nada: se um create falhar, nenhum fica gravado.
    await prisma.$transaction([
        prisma.tutor.create({
            data: {
                nome: 'Mariana Albuquerque',
                cpf: CPF_MARCADOR,
                telefone: '85987654321',
                email: 'mariana.albuquerque@exemplo.com',
                animais: {
                    create: [
                        {
                            nome: 'Thor',
                            especie: 'CACHORRO',
                            raca: 'Labrador',
                            sexo: 'MACHO',
                            dataNascimento: new Date('2019-03-10'),
                            atendimentos: {
                                create: [
                                    {
                                        ...finalizado,
                                        ...periodo(120),
                                        peso: 31.2,
                                        anamnese:
                                            'Vacinação anual. '
                                            + 'Tutora não relata queixas.',
                                        diagnostico: 'Animal saudável.',
                                        conduta:
                                            'Aplicadas as vacinas V10 '
                                            + 'e antirrábica. '
                                            + 'Retorno em 1 ano.',
                                    },
                                    {
                                        ...finalizado,
                                        ...periodo(15),
                                        queixa:
                                            'Mancando da pata '
                                            + 'traseira direita.',
                                        peso: 32,
                                        anamnese:
                                            'Claudicação há 3 dias, '
                                            + 'depois de correr no parque.',
                                        diagnostico:
                                            'Entorse leve no joelho direito.',
                                        conduta:
                                            'Anti-inflamatório por 5 dias '
                                            + 'e repouso.',
                                    },
                                    {
                                        dataChegada: minutosAtras(25),
                                        queixa: 'Retorno da entorse.',
                                    },
                                ],
                            },
                        },
                        {
                            nome: 'Mel',
                            especie: 'GATO',
                            sexo: 'FEMEA',
                            dataNascimento: new Date('2021-07-22'),
                            atendimentos: {
                                create: [
                                    {
                                        ...cancelado(40),
                                        queixa: 'Consulta de rotina.',
                                    },
                                ],
                            },
                        },
                    ],
                },
            },
        }),
        prisma.tutor.create({
            data: {
                nome: 'Carlos Eduardo Pinheiro',
                cpf: '47291503841',
                telefone: '8532345678',
                animais: {
                    create: [
                        {
                            nome: 'Bidu',
                            especie: 'CACHORRO',
                            raca: 'Poodle',
                            sexo: 'MACHO',
                            dataNascimento: new Date('2015-11-05'),
                            atendimentos: {
                                create: [
                                    {
                                        ...finalizado,
                                        ...periodo(60),
                                        prioridade: true,
                                        queixa:
                                            'Vômito e falta de apetite '
                                            + 'desde ontem.',
                                        peso: 7.8,
                                        anamnese:
                                            'Comeu restos de churrasco. '
                                            + 'Três episódios de vômito.',
                                        diagnostico: 'Gastrite aguda.',
                                        conduta:
                                            'Dieta leve e protetor '
                                            + 'gástrico por 7 dias.',
                                    },
                                    {
                                        dataChegada: minutosAtras(10),
                                        prioridade: true,
                                        queixa: 'Dificuldade para respirar.',
                                    },
                                ],
                            },
                        },
                    ],
                },
            },
        }),
        prisma.tutor.create({
            data: {
                nome: 'Fernanda Rocha',
                cpf: '60538192470',
                telefone: '85991234567',
                email: 'fernanda.rocha@exemplo.com',
                animais: {
                    create: [
                        {
                            nome: 'Piu',
                            especie: 'AVE',
                            raca: 'Calopsita',
                            sexo: 'MACHO',
                            atendimentos: {
                                create: [
                                    {
                                        ...finalizado,
                                        ...periodo(30),
                                        queixa: 'Perdendo muitas penas.',
                                        peso: 0.09,
                                        diagnostico: 'Muda natural de penas.',
                                        conduta:
                                            'Suplemento vitamínico na água '
                                            + 'por 30 dias.',
                                    },
                                ],
                            },
                        },
                        {
                            nome: 'Nina',
                            especie: 'ROEDOR',
                            raca: 'Hamster sírio',
                            sexo: 'FEMEA',
                            dataNascimento: new Date('2025-01-15'),
                            atendimentos: {
                                create: [
                                    {
                                        ...cancelado(8),
                                        queixa: 'Unhas grandes.',
                                    },
                                    {
                                        dataChegada: minutosAtras(5),
                                    },
                                ],
                            },
                        },
                    ],
                },
            },
        }),
    ])
    console.log('Demonstração criada: 3 tutores, 5 animais.')
}

console.log('Seed ok.')
await prisma.$disconnect()
