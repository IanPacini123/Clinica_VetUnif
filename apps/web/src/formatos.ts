import type { Especie, Sexo, StatusAtendimento } from "@clinica/shared";

export function formatarCpf(cpf: string): string {
    return cpf.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4')
}

export function formatarTelefone(telefone: string): string {
    if (telefone.length === 11) {
        return telefone.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3')
    }
    return telefone.replace(/^(\d{2})(\d{4})(\d{4})$/, '($1) $2-$3')
}

export const NOME_ESPECIE: Record<Especie, string> = {
    CACHORRO: 'Cachorro',
    GATO: 'Gato',
    AVE: 'Ave',
    ROEDOR: 'Roedor',
    OUTRO: 'Outro',
}

export const NOME_SEXO: Record<Sexo, string> = {
    MACHO: 'Macho',
    FEMEA: 'Fêmea',
}

// "2020-05-01" → "01/05/2020", sem passar por Date (evita erro de fuso).
export function formatarData(data: string): string {
    return data.replace(/^(\d{4})-(\d{2})-(\d{2})$/, '$3/$2/$1')
}

// Data e hora vêm em ISO (UTC); aqui viram o horário local, "09:05".
export function formatarHora(iso: string): string {
    return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

// ISO (UTC) → "27/11/2026 09:05", no horário local.
export function formatarDataHora(iso: string): string {
    return `${new Date(iso).toLocaleDateString('pt-BR')} ${formatarHora(iso)}`
}

export const NOME_STATUS: Record<StatusAtendimento, string> = {
    AGUARDANDO: 'Aguardando',
    EM_ATENDIMENTO: 'Em atendimento',
    FINALIZADO: 'Finalizado',
    CANCELADO: 'Cancelado',
}
