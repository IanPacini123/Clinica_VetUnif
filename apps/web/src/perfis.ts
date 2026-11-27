import type { Perfil } from "@clinica/shared";

export const NOME_PERFIL: Record<Perfil, string> = {
    ADMIN: 'Administrador',
    ATENDENTE: 'Atendente',
    VETERINARIO: 'Veterinário',
}

export const PODE_CRIAR_E_INATIVAR: Perfil[] = ['ADMIN', 'ATENDENTE']

// Ver inativos e reativar (a api confere o mesmo em podeVerInativos).
export const PODE_VER_INATIVOS: Perfil[] = ['ADMIN']

// A api confere o mesmo no hook de rotasUsuarios.
export const PODE_GERIR_USUARIOS: Perfil[] = ['ADMIN']

// Registrar Chegada, editar Prioridade e Queixa e cancelar.
// A api confere o mesmo em rotasAtendimentos.
export const PODE_REGISTRAR_CHEGADA: Perfil[] = ['ADMIN', 'ATENDENTE']

// Pegar o Paciente e preencher o Atendimento.
// A api confere o mesmo em rotasAtendimentos.
export const PODE_ATENDER: Perfil[] = ['VETERINARIO']
