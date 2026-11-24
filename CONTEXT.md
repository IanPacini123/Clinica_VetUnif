# Clínica Veterinária de Bairro

Sistema de uma clínica veterinária pequena: cadastro de tutores e animais, recepção dos animais que chegam e registro dos atendimentos feitos pelos veterinários.

## Language

### Pessoas e acesso

**Usuário**:
Pessoa da equipe da clínica que acessa o sistema com nome de usuário e senha.
_Avoid_: Funcionário, conta, login

**Perfil**:
Papel do Usuário que define o que ele pode fazer: ADMIN, ATENDENTE ou VETERINARIO.
_Avoid_: Role, cargo, tipo de usuário

**ADMIN**:
Perfil que gerencia Usuários e reativa registros inativos. Não realiza Atendimentos.

**ATENDENTE**:
Perfil que cadastra Tutores e Animais e registra Chegadas na Recepção.
_Avoid_: Recepcionista

**VETERINARIO**:
Perfil que realiza Atendimentos. Possui CRMV. Pode editar Tutores e Animais, mas não criar nem inativar.
_Avoid_: Médico, doutor

### Cadastro

**Tutor**:
Pessoa responsável por um ou mais Animais, identificada pelo CPF.
_Avoid_: Dono, cliente, proprietário

**Animal**:
Animal de estimação cadastrado na clínica, sempre vinculado a exatamente um Tutor.
_Avoid_: Pet, paciente (como entidade)

**Inativação**:
Exclusão lógica de um Tutor, Animal ou Usuário: o registro deixa de aparecer e de ser usado, mas permanece guardado.
_Avoid_: Exclusão, remoção, deleção

**Reativação**:
Retorno de um registro inativo ao estado ativo. Somente o ADMIN pode reativar.

### Recepção e atendimento

**Recepção**:
Área onde a ATENDENTE registra Chegadas e onde todos veem a Fila.

**Chegada**:
Momento em que um Animal chega à clínica para ser atendido. Registrar a Chegada abre um Atendimento com status AGUARDANDO.
_Avoid_: Check-in, entrada

**Fila**:
Conjunto dos Atendimentos com status AGUARDANDO ou EM_ATENDIMENTO, com os prioritários no topo e os demais por ordem de Chegada.

**Paciente**:
Termo de exibição para um Animal que está na Fila. Não é uma entidade própria.

**Prioridade**:
Marcação feita na Chegada indicando que o Animal deve ser atendido antes dos demais. Exige Queixa.
_Avoid_: Urgência, emergência

**Queixa**:
Motivo da visita informado pelo Tutor na Chegada. Opcional, exceto quando há Prioridade.
_Avoid_: Sintoma, motivo

**Atendimento**:
Uma visita de um Animal à clínica, da Chegada até a finalização ou o cancelamento. Nunca é excluído.
_Avoid_: Consulta, visita, prontuário

**Status do Atendimento**:
Etapa do Atendimento: AGUARDANDO (na Fila), EM_ATENDIMENTO (com um VETERINARIO), FINALIZADO (concluído pelo VETERINARIO) ou CANCELADO (desistência antes de ser atendido).

**Histórico**:
Lista de todos os Atendimentos de um Animal.
_Avoid_: Prontuário, ficha
