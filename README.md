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

## Documentação

- [Documento de planejamento](docs/Korte%20-%20Documento%20de%20planejamento.docx): itens a–h do projeto
- [Escopo do projeto](docs/escopo-funcional.md): requisitos, regras de negócio, arquitetura e decisões
- [Diagramas](docs/diagramas/): fontes em Mermaid e SVG
- [Protótipo](prototipo/index.html): telas em HTML

## Fluxo de trabalho (trunk-based development)

- A `main` está sempre estável e pronta para publicar.
- Cada tarefa vira uma branch curta (ex.: `feat/rf10-agendamento-online`) que dura no máximo um dia.
- A branch volta para a `main` por pull request pequeno, revisado por outro integrante e com o CI (lint, tipos e build) passando.
- Mensagens de commit no padrão Conventional Commits: `feat:`, `fix:`, `docs:`, `refactor:`, `chore:`.
