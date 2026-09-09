# PCPView Frontend

Frontend Angular do PCPView, implementado contra o back-end oficial:

```text
https://github.com/Carlos-DMS/PCPView.git
```

O front consome somente as funcionalidades que existem nesse back-end: autenticação JWT, usuários, produtos, máquinas, ordens, subordens e execuções.

## Rodar localmente

Suba o back-end do Carlos em `http://localhost:8080` e depois rode o front:

```powershell
cd C:\Users\alexj\OneDrive\Desktop\pcpview-frontend
npm start
```

Frontend:

```text
http://localhost:4200
```

## Login local

O back-end cria um administrador inicial pelo arquivo `AdminSeedConfig.java`. Consulte esse seed no back-end local e troque a senha antes de publicar.

Novos usuários cadastrados entram como `USER`. Um administrador pode promovê-los para `ADMIN`.

## Comandos úteis

```powershell
npm start
npm run build
npm run build:local
npm run build:prod
npm run test:headless
npm run test:types
```

O projeto usa CSS proprio para manter fidelidade ao prototipo. Bootstrap e Bootstrap Icons nao sao dependencias do frontend.

`npm start` usa `environment.development.ts` e aponta para `http://localhost:8080`.
`npm run build:prod` usa `environment.ts`; antes de publicar, troque `apiUrl` para a URL real do backend.

O frontend possui um tratamento global de erro para mostrar uma mensagem amigavel caso alguma falha inesperada escape das telas principais.

## Publicar online

No build de producao, o Angular usa:

```text
src/environments/environment.ts
```

Troque `apiUrl` pela URL real do backend antes de publicar:

```ts
export const environment = {
  production: true,
  apiUrl: 'https://api.seu-dominio.com'
};
```

Depois rode `npm run build:prod` e publique a pasta `dist/pcpview-frontend/browser`.

## Docker

O frontend possui `Dockerfile` e `nginx.conf` para servir o Angular como aplicacao estatica com fallback de rota e headers basicos de seguranca.

Build manual:

```powershell
docker build --build-arg API_URL=https://sua-api.com -t pcpview-frontend .
docker run --rm -p 4200:80 pcpview-frontend
```

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
2. Cadastro, listagem, promoção para admin e desativação de usuários.
3. CRUD de produtos.
4. CRUD de máquinas, busca por ID e alternância de status operacional.
5. Criação de ordens por subconjuntos/letras e quantidade de etapas.
6. Alteração de quantidade, prioridade e status de ordens.
7. Criação, exclusão e alteração manual de status de subordens.
8. Início, finalização com quantidade produzida e cancelamento de execuções.
9. Acompanhamento por ordens aguardando, em produção e finalizadas.

## Pontos para pedir ao back-end

- Liberar `PATCH` no CORS. O back usa endpoints PATCH, mas o CORS atual libera apenas GET, POST, PUT, DELETE e OPTIONS.
- Configurar CORS por variável de ambiente para permitir a URL do front quando publicar na nuvem.
- Se quiser acompanhamento mais preciso, incluir `status` em `OrderResponseDTO` e `SubOrderResponseDTO`.
- Se quiser vincular OF a produto, incluir produto no `OrderRequestDTO`/`OrderResponseDTO`.
- Se quiser fila por máquina, setor, roteiro industrial, pausa/retomada, setup de primeira peça, manutenção com retorno para fila ou dashboards, esses endpoints ainda não existem no back oficial.
- Para nuvem com banco persistente, trocar o H2 em memória por um banco hospedado, como PostgreSQL, MySQL ou H2 em arquivo persistente com volume.
