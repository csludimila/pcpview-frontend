# PCPView Frontend

Frontend Angular do PCPView.

## Rodar localmente

O jeito mais simples é usar o script do backend, que sobe PostgreSQL, backend e frontend:

```powershell
cd C:\Users\alexj\OneDrive\Desktop\PCPView
.\scripts\start-local-dev.ps1
```

Frontend:

```text
http://localhost:4200
```

## Login local

```text
Administrador: admin@pcpview.local / 123456
Operador:      operador@pcpview.local / 123456
```

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

Tambem e possivel subir tudo pelo compose completo do backend:

```powershell
cd C:\Users\alexj\OneDrive\Desktop\PCPView
docker compose -f compose.full.yaml --env-file .env.example up --build
```

## Telas principais

```text
/login
/planejamento
/maquinas
/operacao
/acompanhamento
/cadastro
```

`/cadastro` aparece apenas para administradores.
Produtos permanece no código, mas a rota `/produtos` redireciona para Planejamento enquanto a tela fica fora do fluxo principal.
