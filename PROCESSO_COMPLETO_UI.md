# PCPView - UI Para Processo Completo

Este branch parte da versao final de usinagem salva em `baseline-usinagem-final`.

O objetivo visual continua sendo manter o padrao dark profissional e a fidelidade ao prototipo de alta fidelidade, mas ampliando a navegação para o processo completo da fabrica.

## Implementado nesta branch

- Planejamento cria OF com roteiro visual de Corte, Caldeiraria, Usinagem, Acabamento, Inspecao e Expedicao.
- Cada etapa pode ser ativada/desativada e receber um centro ideal do mesmo setor.
- Maquinas foi mantida como rota, mas os cards agora funcionam como centros de trabalho agrupados por setor.
- Cada card continua com fila abaixo, suporte a mover/tirar etapa da fila e reordenacao por arrastar.
- Operacao ganhou selecao de setor e centro, mostrando apenas etapas liberadas.
- Acompanhamento ganhou pesquisa por OF, produto, etapa, setor e centro, alem de rota em miniatura por OF.

## Nova organizacao visual

Menu sugerido:

```text
Planejamento
Centros
Operacao
Acompanhamento
Cadastro
Expedicao
```

Produtos continua fora do menu principal. Produto e roteiro aparecem dentro de planejamento/cadastro quando fizer sentido.

## Conceitos da interface

### Centros

Substitui a leitura atual de maquinas como conceito principal.

Cada card representa um centro de trabalho:
- torno;
- centro de usinagem;
- laser;
- plasma;
- bancada de solda;
- cabine de pintura;
- mesa de inspecao;
- area de embalagem.

Os cards devem ficar agrupados por setor:
- Corte;
- Caldeiraria;
- Usinagem;
- Acabamento;
- Inspecao;
- Expedicao.

### Fila por etapa

Cada centro deve manter uma fila abaixo do card, como ja foi validado na versao de usinagem.

O item da fila precisa mostrar:
- OF;
- produto;
- etapa;
- quantidade pendente;
- prioridade;
- centro ideal.

O admin deve conseguir:
- arrastar para mudar a ordem;
- mover item para outro centro compativel;
- tirar item da fila;
- alterar centro ideal.

### Operacao

A IHM deve continuar simples:
- selecionar setor;
- selecionar centro;
- selecionar OF/etapa;
- iniciar;
- pausar/retomar;
- setup primeira peca;
- manutencao;
- apontar/finalizar.

Quando finalizar uma etapa, o sistema deve mandar automaticamente o saldo aprovado para a proxima etapa do roteiro.

### Acompanhamento

A tela deve virar uma linha de acompanhamento por OF:

```text
OF 001-A-01
Corte -> Caldeiraria -> Usinagem -> Acabamento -> Inspecao -> Expedicao
```

Cada etapa deve mostrar:
- status;
- operador;
- centro de trabalho;
- inicio;
- fim;
- tempo de setup;
- tempo produtivo;
- pausas;
- quantidade finalizada;
- quantidade refugado/retrabalho, quando existir.

## Primeira versao que vale implementar

Para nao explodir escopo, a primeira entrega deve suportar:

1. setores fixos;
2. centros de trabalho vinculados a setor;
3. roteiro simples na criacao da OF;
4. OF gerando etapas automaticamente;
5. fila por centro;
6. operacao por etapa;
7. acompanhamento com linha do tempo;
8. expedicao como etapa final simples.

Depois disso entram melhorias:
- retrabalho;
- apontamento de refugos detalhado;
- calendario de capacidade;
- lead time previsto vs realizado;
- dashboards por setor;
- multiempresa/multicliente.
