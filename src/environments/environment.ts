export const environment = {
  production: true,
  // Em producao, o navegador chama o proxy /api do Nginx.
  // Isso evita CORS e conteudo misto quando o front estiver em HTTPS.
  apiUrl: '/api'
};
