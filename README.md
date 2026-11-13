# FindIt Frontend

Interface web progressiva do protótipo FindIt, feita com React, TypeScript, Vite e Material UI. A [API](https://github.com/rafabalves/findIt-backend) está em outro repositório.

## Funcionalidades

- Catálogo público, busca e detalhes dos itens.
- Login com conta Microsoft e acompanhamento das solicitações de recuperação.
- Painel administrativo para itens, categorias, etiquetas QR, solicitações e administradores.
- Captura ou envio de fotografias, leitura de etiquetas pela câmera e geração de PDFs para impressão.

## Executar localmente

Requisitos: Node.js LTS com npm e a API FindIt em execução. No backend, use o perfil `FindIt.Api (contas Microsoft - teste)`.

```powershell
npm install
npm run dev
```

Abra `http://localhost:5173`. Em desenvolvimento, o Vite encaminha `/api` para `https://localhost:64529`. Se o certificado local da API não estiver confiável, execute `dotnet dev-certs https --trust` no computador de desenvolvimento.

No registro **FindIt Web** do Microsoft Entra ID, cadastre `http://localhost:5173` como URI de redirecionamento do tipo SPA. O login usa o fluxo de código de autorização com PKCE e solicita um token de acesso para a FindIt API. O fluxo institucional da UEMG não foi validado porque depende de consentimento administrativo; os testes do protótipo usam contas Microsoft pessoais.

## Configuração

As variáveis disponíveis estão em `.env.example`. Para personalizar a execução local, copie o arquivo para `.env.local` e ajuste os valores necessários:

| Variável | Finalidade |
| --- | --- |
| `VITE_API_BASE_URL` | URL pública da API; deixe vazia no desenvolvimento para usar o proxy do Vite. |
| `VITE_PUBLIC_APP_URL` | Origem pública codificada nas etiquetas QR e nos PDFs. |
| `VITE_AZURE_CLIENT_ID` | ID público do aplicativo FindIt Web. |
| `VITE_AZURE_AUTHORITY` | Autoridade Microsoft usada no login. |
| `VITE_API_SCOPE` | Escopo delegado da FindIt API. |

Cadastre a origem publicada como URI SPA no Entra ID e como origem permitida em `Cors:AllowedOrigins` na API. Configure `VITE_PUBLIC_APP_URL` antes de imprimir etiquetas que serão lidas em outros dispositivos.

## Criar a versão de distribuição

```powershell
npm run build
```

Os arquivos gerados ficam em `dist`. No Cloudflare Pages, use `npm run build` como comando de build e `dist` como diretório de saída. As variáveis `VITE_*` devem estar configuradas no ambiente de build.

A interface pode ser instalada como atalho em navegadores compatíveis, mas não oferece funcionamento offline. Na demonstração temporária, a API, o MySQL e as fotografias permanecem no computador do desenvolvedor; portanto, o site publicado depende de a API e o túnel HTTPS estarem ativos.

## Fotografias e etiquetas

O cadastro de item exige uma etiqueta QR livre. É possível selecioná-la na lista ou escanear a etiqueta impressa com a câmera. As fotografias são enviadas depois dos dados do item: até três arquivos JPEG, PNG ou WebP de até 5 MB cada. O administrador pode substituí-las ou removê-las na edição. A câmera depende de permissão do navegador e de HTTPS ou `localhost`.
