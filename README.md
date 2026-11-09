# Korte

Sistema web de gestão e agendamento para uma barbearia: página pública, agendamento online, agenda dos barbeiros, atendimentos e pagamentos, clube de assinatura e painéis.

Projeto da disciplina Web 2 — Engenharia da Computação.

## Integrantes

| Nome | Prontuário |
|---|---|
| João Pedro Yamada Domingues | PC3031659 |
| Davi Carvalho Silva | PC3036707 |
| João Lucas Vendimiatti | PC3042804 |
| João Vittor Ishida de Sousa | PC3031462 |
| André de Carvalho Bispo | PC3031101 |

## Stack

- **Full-stack:** Next.js + React + TypeScript + Tailwind
- **Banco:** PostgreSQL (Docker no desenvolvimento, Supabase em produção) com Prisma
- **Autenticação:** Better Auth
- **Arquitetura:** Clean Architecture
- **CI/CD:** GitHub Actions → Vercel

## Como rodar

Pré-requisitos: Node.js 24 e Docker.

```bash
cp .env.example .env
```

No `.env`, preencha `BETTER_AUTH_SECRET` (`openssl rand -base64 32`) e `SEED_PASSWORD` (senha das contas de exemplo). Depois:

```bash
npm install
npm run db:up
npm run db:deploy
npm run db:seed
npm run dev
```

A aplicação abre em http://localhost:3000. O banco usa a porta 5433 (ou a definida em `DB_PORT`).

### Contas de exemplo

O seed cria a Barbearia Vila Rica com serviços, equipe, um plano e histórico fictício dos últimos 30 dias. Todas as contas usam a senha definida em `SEED_PASSWORD`.

| Perfil | E-mail |
|---|---|
| Dono | `dono@korte.test` |
| Barbeiro | `diego@korte.test` |
| Cliente | `cliente@korte.test` |

Sem `BREVO_API_KEY`, os e-mails (confirmação de agendamento e recuperação de senha) aparecem no terminal.

### Verificações

```bash
npm run lint
npm run typecheck
npm run build
```

## Publicação

- **Banco:** projeto no Supabase. `DATABASE_URL` recebe a conexão pelo pooler (com `?pgbouncer=true&connection_limit=1`) e `DIRECT_URL` a conexão direta. As migrações rodam com `npm run db:deploy`.
- **Aplicação:** projeto na Vercel ligado a este repositório, com as variáveis do `.env.example` e `BETTER_AUTH_URL` apontando para o domínio publicado.
- Para um banco sem o histórico fictício, rode o seed com `SEED_DEMO=false`.

## Estrutura

```
app/                   Presentation: páginas, Server Actions e rotas /api
src/domain/            entidades e regras de negócio
src/application/       casos de uso, contratos e eventos
src/infrastructure/    Prisma, Better Auth, Brevo, ViaCEP e composição
prisma/                schema, migrações e seed
```

## Documentação

- [Documento de planejamento](docs/Korte%20-%20Documento%20de%20planejamento.docx): itens a–h do projeto
- [Escopo do projeto](docs/escopo-funcional.md): requisitos, regras de negócio, arquitetura e decisões
- [Quadro do projeto no Notion](https://app.notion.com/p/3ecd8be2c80f8196ae60f2a388926788): sprints, cronograma e backlog
- [Diagramas](docs/diagramas/): fontes em Mermaid e SVG
- [Protótipo](prototipo/index.html): telas em HTML

## Fluxo de trabalho (trunk-based development)

- A `main` está sempre estável e pronta para publicar.
- Cada tarefa vira uma branch curta (ex.: `feat/rf10-agendamento-online`) que dura no máximo um dia.
- A branch volta para a `main` por pull request pequeno, revisado por outro integrante e com o CI (lint, tipos e build) passando.
- Mensagens de commit no padrão Conventional Commits: `feat:`, `fix:`, `docs:`, `refactor:`, `chore:`.
