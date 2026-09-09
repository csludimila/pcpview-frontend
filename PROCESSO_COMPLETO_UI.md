# PCPView - Backlog Para Processo Completo

Este front foi alinhado ao back-end oficial de Carlos-DMS/PCPView. A tela atual implementa apenas o que a API já entrega: usuários, produtos, máquinas, ordens, subordens e execuções.

## Implementado contra o back oficial

- Planejamento cria OF por subconjuntos e quantidade de etapas.
- Planejamento altera quantidade, prioridade e status de ordens.
- Planejamento cria, exclui e altera status de subordens.
- Produtos possui cadastro, listagem, edição de nome e exclusão.
- Máquinas possui cadastro, busca por ID, edição de nome, alternância operacional e exclusão.
- Operação inicia execução, finaliza apontamento com quantidade produzida e cancela execução criada por engano.
- Acompanhamento separa ordens aguardando, em produção e finalizadas usando quantidades e execuções retornadas pela API.
- Usuários possui cadastro, listagem, promoção para administrador e desativação.

## Pedir ao back-end antes de voltar ao processo completo

- Liberar `PATCH` no CORS.
- Retornar `status` em `OrderResponseDTO` e `SubOrderResponseDTO`.
- Retornar `maquinaId` em `ExecutionResponseDTO`.
- Vincular produto à ordem no DTO de criação e resposta.
- Criar setor/tipo de centro em máquina.
- Criar roteiro de processo com nome de etapa, setor e ordem da etapa.
- Criar fila por máquina/centro, com posição e reordenação.
- Implementar pausa, retomada, setup da primeira peça e manutenção com retorno da etapa para a fila.
- Registrar tempos produtivos, tempos de pausa, setup, refugos e retrabalho.
- Preparar banco persistente e CORS por variável de ambiente para publicação em nuvem.
