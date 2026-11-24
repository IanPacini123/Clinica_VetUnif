# Exclusão de Tutor, Animal e Usuário é lógica (Inativação)

A operação "Excluir" do CRUD não apaga a linha do banco: marca o registro como inativo. Escolhemos isso para preservar o Histórico de Atendimentos, que referencia Animais e VETERINARIOS, e para permitir que o ADMIN desfaça uma exclusão por engano com a Reativação. Atendimentos nunca são excluídos; usam o status CANCELADO.

## Consequences

- Listagens mostram apenas ativos por padrão; o ADMIN pode ver inativos.
- Não é possível inativar um Tutor com Animais ativos, nem um Animal com Atendimento em aberto.
- Não é possível reativar um Animal cujo Tutor está inativo.
- Usuário inativo não consegue entrar no sistema.
