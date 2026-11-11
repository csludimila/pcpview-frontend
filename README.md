# PCPView Frontend

Frontend Angular do PCPView, implementado contra o back-end oficial:

```text
https://github.com/Carlos-DMS/PCPView.git
```

O front consome somente as funcionalidades que existem nesse back-end: autenticação JWT, usuários, produtos, máquinas, ordens, subordens e execuções.

## Rodar localmente com o back local

Suba o back-end do Carlos em `http://localhost:8080` e depois rode o front:

```powershell
cd C:\Users\alexj\OneDrive\Desktop\pcpview-frontend
npm start
```

Frontend:

```text
http://localhost:4200
```

## Rodar o front local com o back da AWS

O backend oficial esta publicado em:

```text
http://13.58.223.39:8080
```

Swagger:

```text
http://13.58.223.39:8080/swagger-ui/index.html
```

Para testar o Angular local contra essa API, nao e necessario iniciar o backend no computador:

```powershell
cd C:\Users\alexj\OneDrive\Desktop\pcpview-frontend
npm run start:aws
```

Depois acesse `http://localhost:4200`. O CORS da API foi validado para essa origem.

## Login local

O back-end cria um administrador inicial pelo arquivo `AdminSeedConfig.java`. Consulte esse seed no back-end local e troque a senha antes de publicar.

Novos usuários cadastrados entram como `USER`. Um administrador pode promovê-los para `ADMIN`.

## Comandos úteis

```powershell
npm start
npm run start:aws
npm run build
npm run build:local
npm run build:prod
npm run test:headless
npm run test:types
```

O projeto usa CSS proprio para manter fidelidade ao prototipo. Bootstrap e Bootstrap Icons nao sao dependencias do frontend.

`npm start` usa `environment.development.ts` e aponta para `http://localhost:8080`.
`npm run start:aws` usa `environment.aws.ts` e aponta para o backend publicado na AWS.
`npm run build:prod` usa `environment.ts` e aponta para `/api`, que e encaminhado pelo Nginx ao backend.

O frontend possui um tratamento global de erro para mostrar uma mensagem amigavel caso alguma falha inesperada escape das telas principais.

## Acessibilidade

- Estrutura alinhada as regras automatizaveis da WCAG 2.1 niveis A e AA.
- Widget oficial VLibras para traducao do conteudo textual para Libras.
- Idioma principal da pagina definido como `pt-BR`.
- Atalho de teclado para pular diretamente ao conteudo principal.
- Foco visivel para links, botoes e campos durante a navegacao por teclado.
- Rotulos associados aos campos e atributos ARIA em controles e mensagens dinamicas.
- Reducao de animacoes quando o sistema operacional solicita menos movimento.
- Tabelas com legenda acessivel e cabecalhos identificados semanticamente.
- Status acompanhados por texto, sem depender apenas de cores.
- Alvos de toque ampliados para operacao por teclado, tela touch ou uso de luvas.
- Auditoria automatizada com `axe-core` integrada aos testes Jasmine/Karma.

O VLibras e uma ferramenta de apoio e nao substitui um interprete humano em aulas, reunioes ou outros conteudos audiovisuais.

Atualmente, a suite possui 71 testes aprovados, incluindo 7 auditorias de componentes com `axe-core`. Os testes automatizados auxiliam a validacao, mas a avaliacao completa tambem deve incluir navegacao manual por teclado e testes com leitores de tela, como NVDA ou TalkBack.

## Publicar online

No build de producao, o Angular usa:

```text
src/environments/environment.ts
```

O endereco usado pelo navegador e relativo ao proprio front:

```ts
export const environment = {
  production: true,
  apiUrl: '/api'
};
```

Por padrao, o Nginx encaminha `/api/*` para `http://13.58.223.39:8080/*`. Esse proxy evita
CORS e o bloqueio de conteudo misto quando o endereco publico do front usar HTTPS.

Enquanto o backend estiver disponivel somente por HTTP, nao publique apenas os
arquivos estaticos em uma plataforma HTTPS sem configurar um proxy equivalente.

## Docker

O frontend possui `Dockerfile` e `nginx.conf` para servir o Angular como aplicacao estatica com fallback de rota e headers basicos de seguranca.

Build manual:

```powershell
docker build --build-arg API_URL=/api -t pcpview-frontend .
docker run --rm -p 4200:80 pcpview-frontend
```

Se o endereco do backend mudar, ele pode ser informado sem recompilar o Angular:

```powershell
docker run --rm -p 4200:80 `
  -e BACKEND_URL=http://novo-endereco-do-backend:8080 `
  pcpview-frontend
```

Ao escolher a plataforma de hospedagem do front, informe ao responsavel pelo
backend o endereco publico definitivo. Se o front usar o proxy `/api`, as chamadas
do navegador serao de mesma origem; ainda assim, o endereco deve ser registrado
na documentacao e nas regras de seguranca da infraestrutura.

## Telas principais

```text
/login
/planejamento
/produtos
/maquinas
/operacao
/acompanhamento
/cadastro
```

`/cadastro` aparece apenas para administradores.

## Funcionalidades implementadas no front

1. Login com JWT e controle visual de rotas para operador/admin.
2. Cadastro, listagem com situação ativa/inativa, promoção para admin e desativação de usuários.
3. CRUD de produtos.
4. CRUD de máquinas, busca por ID e alternância de status operacional.
5. Criação de ordens por subconjuntos/letras e quantidade de etapas.
6. Alteração de quantidade, prioridade e status de ordens.
7. Criação, exclusão e alteração manual de status de subordens.
8. Início, finalização com quantidade produzida e cancelamento de execuções.
9. Acompanhamento pelos status reais da API: aguardando, em produção, finalizadas e canceladas.
10. Identificação de execuções pausadas automaticamente quando uma máquina fica indisponível.

## Atualizações do back-end já integradas

- `PATCH` liberado no CORS para as alterações feitas pelo navegador.
- Campo `ativo` retornado na listagem de usuários.
- Campo `status` retornado em ordens e subordens.
- Campo `maquinaId` retornado nas execuções.
- Execuções passam para `PAUSADA_POR_QUEBRA` quando a máquina fica indisponível e voltam para `RODANDO` quando ela é liberada.
- Login inválido retorna HTTP 401 com mensagem tratável pelo front.
- Backend e banco MySQL publicados na AWS com dados persistentes.
- Regra de uma unica execucao ativa por maquina aplicada no backend.

## Proximos passos de infraestrutura

- Disponibilizar HTTPS para o backend ou manter o acesso por meio do proxy do front.
- Informar ao backend a URL publica definitiva do front quando a plataforma for escolhida.
- Se quiser vincular OF a produto, incluir produto no `OrderRequestDTO`/`OrderResponseDTO`.
- Se quiser fila por máquina, setor, roteiro industrial, pausa/retomada, setup de primeira peça, manutenção com retorno para fila ou dashboards, esses endpoints ainda não existem no back oficial.
