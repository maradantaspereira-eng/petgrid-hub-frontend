# PetGrid Hub Frontend

Interface web (SPA) para gestão de produtos e controle de estoque de pet shops, feita apenas com **HTML5, CSS3 e JavaScript puro**, sem frameworks JavaScript.

Ela consome a API do projeto [petgrid-hub-backend](https://github.com/maradantaspereira-eng/petgrid-hub-backend).

## Funcionalidades

- Painel com indicadores: total de produtos, alertas de estoque, valor do estoque, validade em alerta e categorias.
- Cadastro, edição e exclusão de produtos.
- Listagem em **cards** ou em **tabela**, com alternância entre as duas visões.
- Busca por nome ou marca e filtro por categoria.
- Alertas visuais de estoque baixo, produto vencido e produto próximo do vencimento.

## Como utilizar

1. Suba a API seguindo o README do backend (ela deve responder em `http://127.0.0.1:5001`).
2. Abra o arquivo `index.html` diretamente no navegador. Não é necessário servidor local, extensão ou instalação de dependências.

Se a API estiver em outro endereço, altere a constante `API_URL` no início do arquivo `scripts.js`.

## Rotas da API utilizadas

| Momento na interface | Requisição |
|----------------------|------------|
| Ao abrir a página (seletores de categoria) | `GET /categorias` |
| Ao abrir a página e após cada alteração (lista) | `GET /produtos` |
| Ao abrir a página e após cada alteração (painel de indicadores) | `GET /resumo` |
| Ao clicar em **Editar** | `GET /produtos/{id}` |
| Ao clicar em **Adicionar produto** | `POST /produtos` |
| Ao clicar em **Salvar alterações** | `PUT /produtos/{id}` |
| Ao clicar em **Excluir** | `DELETE /produtos/{id}` |

## Estrutura

```
index.html   # estrutura da página
styles.css   # estilos personalizados
scripts.js   # lógica da SPA e chamadas à API
img/         # imagens
```
