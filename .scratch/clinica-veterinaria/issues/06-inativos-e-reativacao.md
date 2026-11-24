# 06: Inativos e Reativação

**What to build:** o ADMIN marca "mostrar inativos" nas listagens de Tutores e Animais, vê os registros inativos destacados e consegue reativá-los. Os outros Perfis não veem o filtro nem o botão.

**Blocked by:** 05 (CRUD de Animal)

**Status:** ready-for-agent

- [ ] Filtro "mostrar inativos" nas listagens de Tutor e Animal, visível só para o ADMIN
- [ ] Registros inativos aparecem visualmente diferentes dos ativos
- [ ] Botão "reativar" em Tutor e Animal inativos, visível só para o ADMIN
- [ ] API devolve 403 se outro Perfil tentar listar inativos ou reativar
- [ ] Reativar um Animal cujo Tutor está inativo devolve 409 com mensagem clara
- [ ] Funciona na URL publicada
