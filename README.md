# FindIt Frontend

Primeira versão da interface do FindIt, feita com React, TypeScript, Vite, Material UI e MSAL React. Ela usa a API em `FindIt-backend`.

## Telas

- Catálogo público com busca, filtro por categoria, paginação e itens encerrados recentemente.
- Detalhe do item, inclusive acesso por `/qr/{guid}` e envio de solicitação autenticada.
- Minhas solicitações, com andamento e cancelamento de pedidos pendentes.
- Painel administrativo para analisar solicitações, cadastrar e editar itens, gerenciar categorias, gerar etiquetas QR e atribuir administradores.

## Executar localmente

Requisitos: Node.js LTS com npm, MySQL e a API do FindIt. Inicie o backend no perfil **FindIt.Api (contas Microsoft - teste)**, na porta `https://localhost:64529`.

```powershell
cd C:\Users\Rafae\Desktop\FindIt-frontend
npm install
npm run dev
```

Abra `http://localhost:5173`. O Vite encaminha chamadas `/api` para o backend local, evitando configurar CORS durante o desenvolvimento. O certificado HTTPS local do .NET deve estar confiável no Windows (`dotnet dev-certs https --trust` se necessário).

## Login Microsoft

Em **FindIt Web → Autenticação → Aplicativo de página única (SPA)**, cadastre exatamente `http://localhost:5173` como URI de redirecionamento. Mantenha também a URI do Swagger. O frontend usa o ID do FindIt Web, a autoridade `/common` e o escopo delegado `api://a66cb6cf-367c-4568-b267-8e9f475a99bb/access_as_user`. IDs públicos podem ficar no código; não crie segredo de cliente no navegador.

As opções estão em `src/auth.ts` e podem ser substituídas pelas variáveis em `.env.example`. Se publicar a interface em outra origem, configure `VITE_API_BASE_URL`, cadastre a URI de redirecionamento correspondente no Entra e adicione a origem em `Cors:AllowedOrigins` da API.

O login com conta institucional da UEMG segue dependente do consentimento do administrador da universidade. Para os testes do TCC, use o perfil da API para contas Microsoft.

## Limites desta primeira versão

- A API ainda não possui um endpoint administrativo para listar todos os itens. O painel mostra itens ativos e os encerrados nos últimos sete dias; detalhes de qualquer item conhecido continuam acessíveis por ID ou QR.
- Não há imagens dos itens no backend. Os cartões exibem ilustrações por categoria.
- As etiquetas QR exibem uma URL que aponta para `/qr/{guid}` neste frontend. Para etiquetas impressas, use a URL definitiva após a publicação.
