# Escopo do Projeto — Korte

> **Versão final — 01/10/2026**  
> Projeto acadêmico da disciplina de **Web 2**.  
> Este documento é a referência principal para requisitos, regras de negócio, arquitetura, modelagem e planejamento do projeto.

---

# 1. Integrantes

| Nome | Prontuário |
|---|---|
| João Pedro Yamada Domingues | PC3031659 |
| Davi Carvalho Silva | PC3036707 |
| João Lucas Vendimiatti | PC3042804 |
| João Vittor Ishida de Sousa | PC3031462 |
| André de Carvalho Bispo | PC3031101 |

---

# 2. Tema e visão geral

## 2.1 Tema

Sistema web de **gestão e agendamento para uma barbearia**.

A aplicação permitirá que a barbearia divulgue seus serviços e profissionais, receba agendamentos online, organize a agenda dos barbeiros, registre atendimentos e pagamentos e gerencie um clube de assinatura para clientes.

## 2.2 Objetivo principal

Construir uma aplicação web responsiva com front-end, back-end e banco de dados que demonstre os principais conceitos trabalhados na disciplina:

- levantamento e organização de requisitos;
- autenticação e autorização por perfil;
- modelagem orientada a objetos;
- persistência em banco de dados relacional;
- implementação de regras de negócio;
- arquitetura de aplicação;
- aplicação de padrões de projeto;
- integração com serviços externos;
- versionamento com Git e trunk-based development;
- CI/CD e deploy da aplicação.

## 2.3 Escopo do domínio

O sistema será desenvolvido para **uma barbearia**, reunindo em uma única aplicação as operações de cadastro de serviços e profissionais, disponibilidade de agenda, agendamentos, atendimentos, pagamentos, assinaturas e indicadores básicos.

---

# 3. Atores e permissões

O sistema possui três perfis de acesso.

| Perfil | Responsabilidades principais |
|---|---|
| **Dono** | Administra a barbearia, profissionais, serviços, expedientes, agenda geral, planos, assinaturas, pagamentos e indicadores. Pode também atuar como barbeiro. |
| **Barbeiro** | Visualiza e opera a própria agenda, cria bloqueios próprios, registra agendamentos presenciais, conclui atendimentos e registra pagamentos. |
| **Cliente** | Consulta a página pública, realiza agendamentos, gerencia os próprios agendamentos, consulta histórico e acompanha sua assinatura. |

## 3.1 Dono que também atende

O dono utiliza uma única conta com perfil `OWNER`.

Quando estiver configurado para atender clientes, terá também um `BarberProfile` associado ao seu usuário. Nesse caso:

- aparece na lista de profissionais;
- pode ser associado a serviços;
- possui expediente próprio;
- possui bloqueios próprios;
- recebe agendamentos;
- possui agenda individual.

As permissões administrativas do dono continuam disponíveis normalmente.

## 3.2 Matriz resumida de permissões

| Área | Dono | Barbeiro | Cliente |
|---|:---:|:---:|:---:|
| Dados da barbearia | ✔ | — | — |
| Gerenciar barbeiros | ✔ | — | — |
| Gerenciar serviços | ✔ | — | — |
| Gerenciar expedientes | ✔ | — | — |
| Criar bloqueios de agenda | ✔ | próprio | — |
| Ver agenda geral | ✔ | — | — |
| Ver agenda individual | ✔ | própria | — |
| Criar agendamento presencial | qualquer agenda | própria agenda | — |
| Agendar online | — | — | ✔ |
| Cancelar agendamento | ✔ | próprios atendimentos | próprio |
| Marcar falta | ✔ | próprios atendimentos | — |
| Concluir atendimento | ✔ | próprios atendimentos | — |
| Registrar pagamento | ✔ | próprios atendimentos | — |
| Gerenciar planos e assinaturas | ✔ | — | — |
| Ver indicadores administrativos | ✔ | — | — |
| Ver histórico de atendimentos | — | — | próprio |

O dono define a grade de trabalho de cada profissional. O barbeiro pode registrar bloqueios apenas sobre a própria agenda.

---

# 4. Gestão do projeto

## 4.1 Metodologia

Será utilizada uma combinação de **Scrum + Kanban**, adaptada ao tamanho do projeto.

- sprints de 1 semana;
- backlog priorizado;
- quadro Kanban no Notion;
- tarefas pequenas e rastreáveis;
- revisão semanal do andamento;
- retrospectiva ao final de cada sprint.

## 4.2 Fluxo de desenvolvimento

O repositório utilizará **trunk-based development**:

- branch principal `main`;
- branches curtas para tarefas;
- pull requests pequenas;
- integração frequente;
- validações automáticas antes da integração na `main`.

## 4.3 Prioridades do backlog

- **MVP** — necessário para a primeira apresentação do projeto;
- **Must** — necessário para a entrega final;
- **Should** — implementado caso o escopo principal esteja concluído e estável.

**Escopo comprometido = MVP + Must.**

---

# 5. Requisitos funcionais

## M1 — Contas e acesso

| ID | Funcionalidade | Descrição | Perfil | Prioridade |
|---|---|---|---|---|
| **RF01** | Cadastro e autenticação | Cadastro de cliente, login, logout e recuperação de senha. | Todos | MVP |
| **RF02** | Perfis e autorização | Restringir telas, dados e operações conforme os perfis Dono, Barbeiro e Cliente. As permissões devem ser verificadas no back-end. | Todos | MVP |
| **RF03** | Equipe da barbearia | Dono cadastra, edita, ativa ou desativa barbeiros e pode habilitar o próprio perfil de atendimento. As credenciais dos profissionais utilizam o mesmo mecanismo de autenticação e recuperação de senha do sistema. | Dono | MVP |

## M2 — Barbearia e catálogo

| ID | Funcionalidade | Descrição | Perfil | Prioridade |
|---|---|---|---|---|
| **RF04** | Dados da barbearia | Cadastrar e editar nome, endereço, telefone, WhatsApp, logo e demais informações exibidas na página pública. | Dono | MVP |
| **RF05** | Serviços | Cadastrar serviços com nome, descrição curta, duração, preço e status. Definir quais barbeiros realizam cada serviço. | Dono | MVP |
| **RF06** | Página pública | Exibir informações da barbearia, serviços, preços, profissionais e acesso ao fluxo de agendamento. | Visitante / Cliente | MVP |
| **RF07** | Endereço e contato | Preencher endereço a partir do CEP via ViaCEP e disponibilizar botão para contato pelo WhatsApp usando `wa.me`. | Dono / Visitante | Should |

### Regras estruturais do catálogo

- cada serviço possui um único preço;
- cada serviço possui uma única duração;
- cada agendamento possui exatamente um serviço;
- um serviço pode ser realizado por um ou mais barbeiros;
- um barbeiro pode realizar um ou mais serviços.

## M3 — Agenda

| ID | Funcionalidade | Descrição | Perfil | Prioridade |
|---|---|---|---|---|
| **RF08** | Expediente dos barbeiros | Definir os intervalos de trabalho de cada profissional por dia da semana. | Dono | MVP |
| **RF09** | Bloqueios de agenda | Registrar períodos indisponíveis com data/hora inicial, data/hora final e motivo. O barbeiro pode bloquear apenas a própria agenda. | Dono / Barbeiro | Must |
| **RF10** | Agendamento online | Cliente escolhe serviço, barbeiro, data e horário entre as opções calculadas como disponíveis pelo sistema. | Cliente | MVP |
| **RF11** | Agenda operacional | Barbeiro visualiza sua agenda por dia e semana. Dono visualiza agenda geral e agenda individual dos profissionais. | Dono / Barbeiro | MVP |
| **RF12** | Meus agendamentos | Cliente consulta próximos agendamentos e histórico, podendo cancelar dentro do prazo permitido e iniciar um novo agendamento. | Cliente | Must |
| **RF13** | Agendamento presencial | Dono registra agendamento ou encaixe em qualquer agenda. Barbeiro registra agendamento ou encaixe na própria agenda. O atendimento pode ser associado a cliente cadastrado ou a cliente avulso com nome e telefone. | Dono / Barbeiro | Must |

## M4 — Atendimento e pagamento

| ID | Funcionalidade | Descrição | Perfil | Prioridade |
|---|---|---|---|---|
| **RF14** | Conclusão do atendimento | Marcar um agendamento como concluído ou como falta. Na conclusão, registrar valor final e forma de pagamento: dinheiro, PIX, débito ou crédito. | Dono / Barbeiro | Must |

O sistema registra os dados do pagamento realizado no atendimento para composição do histórico e dos indicadores administrativos.

Clientes avulsos cadastrados em um agendamento presencial permanecem vinculados somente ao atendimento correspondente até que criem uma conta de cliente.

## M5 — Clube de assinatura

| ID | Funcionalidade | Descrição | Perfil | Prioridade |
|---|---|---|---|---|
| **RF15** | Planos | Dono cadastra planos com nome, preço, serviços incluídos e quantidade de usos permitidos em um ciclo de 30 dias. | Dono | Must |
| **RF16** | Assinaturas | Dono ativa, renova ou cancela a assinatura de um cliente e registra valor e forma de pagamento da ativação/renovação. Cliente consulta plano, validade e usos restantes. Serviços cobertos pelo plano utilizam um uso disponível no momento da conclusão do atendimento. | Dono / Cliente | Must |

### Regras estruturais da assinatura

- a ativação e a renovação são registradas pelo dono;
- cada ativação ou renovação inicia um novo ciclo de 30 dias a partir da data do registro;
- ao iniciar um novo ciclo, a quantidade de usos realizados volta a zero;
- o plano define os serviços cobertos;
- o plano define a quantidade de usos disponível por ciclo;
- o consumo ocorre apenas quando o atendimento é concluído;
- o cliente visualiza a validade e a quantidade de usos restantes.

## M6 — Comunicação e indicadores

| ID | Funcionalidade | Descrição | Perfil | Prioridade |
|---|---|---|---|---|
| **RF17** | E-mail de confirmação | Após a criação de um agendamento, o sistema envia e-mail com serviço, profissional, data e horário. | Sistema | Must |
| **RF18** | Painéis resumidos | Dono consulta faturamento registrado, quantidade de atendimentos e distribuição por barbeiro. Barbeiro consulta agenda e atendimentos do período. Cliente consulta próximos agendamentos, histórico e assinatura. | Todos | Must |

### Contagem do escopo

- **18 requisitos funcionais**;
- **9 MVP**;
- **8 Must**;
- **1 Should**;
- **17 requisitos comprometidos** na entrega final.

---

# 6. Regras de negócio

## RN01 — Profissional apto

Um profissional pode receber um agendamento de um serviço quando:

- estiver ativo;
- estiver associado ao serviço escolhido.

O dono com `BarberProfile` segue a mesma regra dos demais barbeiros.

## RN02 — Disponibilidade

Um horário está disponível quando todos os critérios abaixo forem atendidos:

1. o profissional realiza o serviço escolhido;
2. o horário está dentro do expediente do profissional;
3. o período não se sobrepõe a um bloqueio de agenda;
4. o período não se sobrepõe a outro agendamento ativo do profissional;
5. a duração completa do serviço cabe no intervalo disponível.

Os horários de início serão organizados em uma grade fixa de **10 minutos**.

## RN03 — Serviço, preço e duração

Cada agendamento possui exatamente um serviço.

O valor e a duração do atendimento são inicialmente obtidos do serviço cadastrado. O valor final registrado na conclusão pode ser R$ 0,00 quando o atendimento for coberto pela assinatura do cliente.

## RN04 — Ciclo de vida do agendamento

Estados possíveis:

- `AGENDADO`;
- `CONCLUIDO`;
- `CANCELADO`;
- `FALTOU`.

Transições permitidas:

| De | Para | Quem | Condição |
|---|---|---|---|
| — | `AGENDADO` | Cliente, Dono ou Barbeiro | Horário disponível |
| `AGENDADO` | `CONCLUIDO` | Dono ou barbeiro responsável | Atendimento realizado e pagamento registrado ou cobertura por assinatura |
| `AGENDADO` | `CANCELADO` | Cliente | Dentro do prazo de cancelamento |
| `AGENDADO` | `CANCELADO` | Dono ou barbeiro responsável | Atendimento sob sua responsabilidade |
| `AGENDADO` | `FALTOU` | Dono ou barbeiro responsável | Horário do atendimento já ultrapassado |

Os estados `CONCLUIDO`, `CANCELADO` e `FALTOU` são finais.

## RN05 — Cancelamento e novo agendamento

O cliente pode cancelar um agendamento até **2 horas antes** do horário marcado.

Após o cancelamento, a interface pode direcionar o cliente ao fluxo de criação de um novo agendamento.

## RN06 — Atendimento e pagamento

Para concluir um atendimento, o sistema deve possuir o valor final e a forma de pagamento correspondente, exceto quando o valor final for R$ 0,00 por utilização de assinatura.

Formas de pagamento registradas:

- dinheiro;
- PIX;
- débito;
- crédito.

## RN07 — Assinatura

Uma assinatura registra:

- cliente;
- plano;
- data de início do ciclo;
- data de fim do ciclo;
- quantidade total de usos;
- quantidade de usos realizados;
- data de cancelamento, quando houver.

A situação exibida ao usuário é calculada a partir das datas da assinatura: **ativa** quando estiver dentro da validade e sem cancelamento, **cancelada** quando houver cancelamento e **expirada** quando a data final já tiver sido ultrapassada.

Uma assinatura é utilizável somente quando estiver ativa e possuir usos disponíveis.

A renovação inicia um novo ciclo de 30 dias na data do registro e reinicia a contagem de usos do ciclo.

Quando um atendimento utiliza a assinatura:

1. o serviço deve estar incluído no plano;
2. deve existir pelo menos um uso disponível;
3. o uso é consumido somente ao concluir o atendimento;
4. o valor do serviço coberto é registrado como R$ 0,00;
5. a quantidade de usos realizados é incrementada de forma atômica com a conclusão do atendimento.

## RN08 — Faturamento exibido no painel

O faturamento apresentado no painel administrativo é calculado a partir dos pagamentos registrados em:

- atendimentos concluídos;
- ativações de assinatura;
- renovações de assinatura.

Os indicadores representam os valores registrados no sistema para acompanhamento gerencial da barbearia.

---

# 7. Histórias de usuário e critérios de aceitação

## HU01 — Agendar serviço

**Como cliente**, quero escolher serviço, barbeiro, data e horário para reservar um atendimento.

**Critérios de aceitação:**

- devem aparecer apenas profissionais que realizam o serviço escolhido;
- devem aparecer apenas horários disponíveis;
- o sistema deve impedir conflito de agenda para o mesmo profissional;
- ao concluir o fluxo, o agendamento deve aparecer para o cliente e para o profissional;
- o envio do e-mail ocorre após a criação bem-sucedida do agendamento.

## HU02 — Operar agenda

**Como barbeiro**, quero visualizar meus atendimentos e registrar o resultado de cada um para manter minha agenda atualizada.

**Critérios de aceitação:**

- o barbeiro visualiza apenas sua agenda operacional;
- o atendimento pode ser concluído somente com os dados necessários de pagamento ou cobertura por assinatura;
- a falta só pode ser registrada após o horário do atendimento.

## HU03 — Administrar serviços e equipe

**Como dono**, quero cadastrar serviços e profissionais para definir a oferta e a capacidade de atendimento da barbearia.

**Critérios de aceitação:**

- serviço possui nome, preço e duração válidos;
- barbeiro inativo deixa de receber novos agendamentos;
- a associação entre barbeiro e serviço determina quais atendimentos o profissional pode receber;
- dados históricos de atendimentos concluídos permanecem consistentes após alterações cadastrais.

## HU04 — Utilizar assinatura

**Como cliente assinante**, quero utilizar os serviços incluídos no meu plano enquanto minha assinatura estiver válida e possuir usos disponíveis.

**Critérios de aceitação:**

- o sistema informa validade e usos restantes;
- apenas serviços incluídos no plano recebem cobertura;
- o uso é consumido na conclusão do atendimento;
- o saldo de usos não pode se tornar negativo.

---

# 8. Requisitos não funcionais

| ID | Atributo | Requisito | Verificação |
|---|---|---|---|
| **RNF01** | Responsividade | As telas principais devem funcionar adequadamente em celular, tablet e desktop, com atenção especial à agenda e ao fluxo de agendamento. | Testes em larguras de 360 px, 768 px e 1280 px. |
| **RNF02** | Usabilidade | O fluxo de agendamento deve apresentar etapas claras e exigir apenas as informações necessárias para concluir uma reserva. | Teste manual do fluxo principal. |
| **RNF03** | Segurança | Senhas devem utilizar mecanismo seguro de autenticação, sessões devem ser protegidas e permissões verificadas no servidor. | Testes de acesso indevido entre perfis. |
| **RNF04** | Desempenho | As páginas principais devem carregar em até 3 s em condição normal de demonstração e a consulta de horários deve responder, como meta, em até 1 s. | Medição no ambiente publicado e análise das consultas. |
| **RNF05** | Manutenibilidade | Regras de negócio devem permanecer separadas da camada de apresentação e do acesso direto ao banco. | Revisão da arquitetura e do código. |
| **RNF06** | Portabilidade | Configurações devem ser realizadas por variáveis de ambiente e o projeto deve possuir procedimento reproduzível de execução local. | Documentação de setup e execução do ambiente. |
| **RNF07** | Consistência | O sistema deve impedir a criação simultânea de agendamentos conflitantes para o mesmo profissional. | Transação no agendamento e restrição de não sobreposição no banco. |
| **RNF08** | Localização e custo | Datas e horários devem respeitar `America/Sao_Paulo`, valores devem ser apresentados em R$ e os serviços de infraestrutura utilizados durante o projeto devem caber nos planos adotados pelo grupo. | Testes funcionais e revisão da infraestrutura. |

---

# 9. Arquitetura e tecnologias

## 9.1 Abordagem de desenvolvimento

O sistema utilizará abordagem **Full Stack**.

### Front-end

- Next.js / React;
- TypeScript;
- Tailwind CSS;
- interface responsiva e mobile-first.

### Back-end

- recursos server-side do Next.js;
- TypeScript;
- programação orientada a objetos aplicada ao domínio e aos casos de uso;
- validação de dados e permissões no servidor.

### Banco de dados

- PostgreSQL;
- Supabase como banco gerenciado em produção;
- Prisma ORM para modelagem e persistência.

### Autenticação

- Better Auth;
- usuários e sessões persistidos no banco da aplicação.

## 9.2 Arquitetura da aplicação

Será utilizada uma **Clean Architecture simplificada**, organizada em quatro áreas:

1. **Presentation** — páginas, componentes, formulários e endpoints/actions;
2. **Application** — casos de uso e coordenação das operações;
3. **Domain** — entidades e regras de negócio;
4. **Infrastructure** — Prisma, banco de dados, autenticação, e-mail e integrações externas.

A divisão tem como objetivo manter responsabilidades bem definidas e facilitar testes e manutenção.

## 9.3 Padrões de projeto

### Repository

Os casos de uso que necessitarem de persistência acessarão os dados por contratos de repositório.

Exemplos:

- `AppointmentRepository`;
- `ServiceRepository`;
- `SubscriptionRepository`.

### Observer / eventos de aplicação

A criação de um agendamento gera um evento de aplicação, como `AppointmentCreated`.

Uma reação ao evento é o envio do e-mail de confirmação.

O agendamento é persistido como operação principal, e o processamento da notificação é tratado separadamente.

### Adapter

Serviços externos serão encapsulados por adapters.

Exemplos:

- adapter de e-mail para Brevo;
- adapter de endereço para ViaCEP.

Assim, os casos de uso dependem de contratos internos, e não diretamente das bibliotecas ou APIs utilizadas na infraestrutura.

## 9.4 Arquitetura de infraestrutura

### Desenvolvimento

- variáveis de ambiente em `.env`;
- Docker Compose para o PostgreSQL local de desenvolvimento;
- separação entre os ambientes de desenvolvimento, preview (pull requests) e produção.

### Produção

- aplicação: Vercel;
- banco: Supabase PostgreSQL;
- código: GitHub;
- integração contínua: GitHub Actions.

## 9.5 APIs e serviços externos

| Serviço | Uso |
|---|---|
| **ViaCEP** | Preenchimento de endereço a partir do CEP. |
| **Brevo** | Envio de e-mail de confirmação de agendamento. |
| **WhatsApp `wa.me`** | Acesso direto à conversa com a barbearia. |

---

# 10. Modelagem prevista

## 10.1 Entidades principais

A modelagem inicial será composta pelas seguintes entidades:

- `User`;
- `Barbershop`;
- `BarberProfile`;
- `Service`;
- `BarberService`;
- `WorkSchedule`;
- `ScheduleBlock`;
- `Appointment`;
- `Payment`;
- `Plan`;
- `PlanService`;
- `Subscription`;
- `SubscriptionUsage`.

A nomenclatura final pode ser refinada durante a modelagem, mantendo as regras definidas neste documento.

## 10.2 Relacionamentos principais

- `User` pode representar Dono, Barbeiro ou Cliente;
- Dono e Barbeiro podem possuir `BarberProfile`;
- `BarberProfile` possui expedientes e bloqueios;
- `BarberProfile` se relaciona com `Service` por `BarberService`;
- `Appointment` relaciona Barbeiro e Serviço e pode apontar para um `User` cliente cadastrado; para cliente avulso, mantém nome e telefone diretamente no registro do agendamento;
- `Appointment` pode possuir um `Payment` associado quando concluído;
- `Payment` registra valor, forma de pagamento e a origem do pagamento, permitindo relacioná-lo a atendimento ou operação de assinatura;
- `Plan` se relaciona com os serviços cobertos por `PlanService`;
- Cliente pode possuir `Subscription`;
- utilizações de assinatura são registradas por `SubscriptionUsage` ou estrutura equivalente.

## 10.3 Diagramas e artefatos

Serão produzidos:

- protótipo das telas principais no Figma ou equivalente;
- diagrama de casos de uso;
- diagrama de classes;
- MER do banco de dados;
- diagrama de sequência do fluxo **Criar agendamento**;
- diagrama da arquitetura da aplicação;
- diagrama simplificado da infraestrutura.

## 10.4 Telas prototipadas

1. login e cadastro;
2. página pública da barbearia;
3. escolha de horário (fluxo de agendamento);
4. agendamento confirmado;
5. agenda do barbeiro (celular);
6. agenda geral do dono;
7. conclusão do atendimento e pagamento;
8. painel do dono;
9. planos e assinaturas.

---

# 11. Qualidade e CI/CD

Testes automatizados ficaram fora do escopo da disciplina. A qualidade é garantida por:

- TypeScript em modo estrito;
- lint e formatação padronizados;
- revisão de cada pull request por outro integrante;
- validação manual do fluxo principal (seção 16) antes de cada entrega.

O pipeline do GitHub Actions executa a cada pull request:

1. instalação das dependências;
2. lint;
3. checagem de tipos;
4. build da aplicação.

A publicação em produção ocorre automaticamente após a integração na `main`.

---

# 12. Entregas por etapa

## 12.1 Primeira etapa — meados de outubro

A apresentação intermediária deverá mostrar:

- integrantes;
- tema e problema;
- lista de requisitos;
- metodologia de gestão;
- planejamento do projeto;
- style guide;
- protótipo inicial;
- abordagem Full Stack;
- tecnologias de front-end, back-end e banco;
- visão inicial da arquitetura;
- parte da implementação funcionando.

### Meta técnica do MVP

Até essa etapa, o objetivo é demonstrar:

1. autenticação;
2. perfis básicos;
3. cadastro de serviço;
4. cadastro de barbeiro;
5. configuração de expediente;
6. página pública;
7. criação de um agendamento válido;
8. visualização do agendamento nas agendas.

## 12.2 Segunda etapa — final de novembro

A entrega final deverá apresentar:

- implementação do escopo comprometido;
- apresentação geral e técnica do sistema;
- modelagem final;
- arquitetura da aplicação;
- arquitetura de infraestrutura;
- padrões de projeto utilizados;
- processo de implementação e manutenção;
- viabilidade do negócio;
- viabilidade gerencial e evolução do sistema;
- dificuldades e facilidades encontradas durante o desenvolvimento;
- possíveis trabalhos futuros identificados ao final do projeto.

---

# 13. Identidade visual — Style Guide

## 13.1 Cores principais

- **Azul-marinho:** `#050929`;
- **Off-white de fundo:** `#F8F8F7`;
- **Cards:** branco;
- estados de sucesso, atenção e erro devem utilizar cores com contraste adequado e aplicação consistente.

## 13.2 Diretrizes de interface

- layout mobile-first;
- navegação simples e consistente;
- componentes reutilizáveis;
- contraste adequado;
- formulários com mensagens claras de validação;
- agenda utilizável pelo celular;
- feedback visual para carregamento, sucesso e erro;
- hierarquia visual clara nas telas administrativas e operacionais.

## 13.3 Tipografia e componentes

- **Tipografia:** Manrope na interface e DM Serif Display no logotipo e nos títulos da página pública, com fallback para fontes do sistema;
- **escala de espaçamento:** múltiplos de 4 px, priorizando 8/12/16/24/32 px;
- **bordas:** raio de 8 px em botões e campos e de 12 px em cards;
- **botões:** variantes primária, secundária e destrutiva;
- **campos:** rótulo visível, estado de foco e mensagem de validação;
- **feedback:** mensagens apresentadas próximas à ação correspondente.

O style guide visual e o protótipo em HTML (pasta `prototipo/`) detalham tamanhos, estados e componentes com base nessas diretrizes.

---

# 14. Decisões consolidadas

| ID | Decisão | Situação |
|---|---|---|
| **D1** | O sistema será desenvolvido para uma única barbearia. | Confirmada |
| **D2** | Os perfis de acesso são Dono, Barbeiro e Cliente. | Confirmada |
| **D3** | O dono pode atender utilizando um `BarberProfile` associado à própria conta. | Confirmada |
| **D4** | Cada agendamento possui exatamente um serviço. | Confirmada |
| **D5** | Preço e duração são definidos no cadastro do serviço. | Confirmada |
| **D6** | O cliente escolhe o barbeiro ao realizar o agendamento online. | Confirmada |
| **D7** | A assinatura funciona em ciclos de 30 dias com serviços e quantidade de usos definidos pelo plano. | Confirmada |
| **D8** | Pagamentos são registrados na conclusão do atendimento e nas operações de assinatura. | Confirmada |
| **D9** | E-mail é utilizado para confirmação automática de agendamento. | Confirmada |
| **D10** | A aplicação utilizará abordagem Full Stack com Clean Architecture simplificada. | Confirmada |
| **D11** | Repository, Observer e Adapter serão os padrões de projeto principais. | Confirmada |
| **D12** | O fluxo de desenvolvimento seguirá trunk-based development. | Confirmada |
| **D13** | O fluxo de agendamento é o caminho crítico do projeto e terá prioridade de implementação. | Confirmada |
| **D14** | Testes automatizados ficam fora do escopo; o CI executa lint, checagem de tipos e build. | Confirmada |
| **D15** | Tipografia Manrope (interface) e DM Serif Display (logotipo). | Confirmada |

---

# 15. Checklist de aderência à disciplina

| Exigência da disciplina | Cobertura no projeto |
|---|---|
| Integrantes | Seção 1 |
| Tema / domínio | Seção 2 |
| Metodologia de gestão | Seção 4 |
| Backlog / requisitos funcionais | Seção 5 |
| Requisitos de qualidade / NFRs | Seção 8 |
| Identidade visual / Style Guide | Seção 13 |
| Prototipação | Seção 10 |
| Diagrama de classes | Seção 10 |
| MER | Seção 10 |
| Outros diagramas UML | Seção 10 |
| Kanban / Notion | Seção 4 |
| Definição Full Stack ou stacks separadas | Seção 9 — Full Stack |
| Front-end responsivo | Seções 8, 9 e 13 |
| Back-end | Seção 9 |
| Banco de dados | Seção 9 |
| Orientação a objetos | Seções 2 e 9 |
| Arquitetura de aplicação | Seção 9 |
| Arquitetura de infraestrutura | Seção 9 |
| Padrões de projeto | Seção 9 |
| APIs externas | Seção 9 |
| Git | Seções 4 e 11 |
| Trunk-based development | Seção 4 |
| Docker / ambientes | Seção 9 |
| CI/CD | Seção 11 |
| Implementação parcial na primeira etapa | Seção 12 |
| Discussão de manutenção, viabilidade e trabalhos futuros | Seção 12 |

---

# 16. Fluxo principal de demonstração

Este é o caminho principal do sistema e deve receber prioridade máxima de implementação:

1. Dono cadastra um barbeiro.
2. Dono cadastra um serviço e associa o barbeiro ao serviço.
3. Dono configura o expediente do barbeiro.
4. Cliente acessa a página pública.
5. Cliente escolhe o serviço.
6. Cliente escolhe o barbeiro.
7. Sistema calcula os horários disponíveis.
8. Cliente cria o agendamento.
9. Barbeiro visualiza o agendamento em sua agenda.
10. Após o atendimento, o barbeiro conclui o atendimento e registra o pagamento.
11. Dono visualiza o atendimento e o valor nos indicadores administrativos.

## 16.1 Fluxo de assinatura

1. Dono cadastra um plano.
2. Dono ativa o plano para um cliente.
3. Cliente realiza um agendamento para serviço coberto.
4. Na conclusão, o sistema valida a assinatura e os usos disponíveis.
5. O atendimento é concluído com valor R$ 0,00 para o serviço coberto.
6. Um uso é registrado na assinatura.
7. Cliente passa a visualizar o saldo atualizado de usos.

---

# 17. Critério de conclusão do projeto

O projeto será considerado funcionalmente concluído quando:

- todos os requisitos **MVP** e **Must** estiverem implementados;
- o fluxo principal da seção 16 puder ser executado de ponta a ponta;
- as permissões dos três perfis estiverem funcionando corretamente;
- a agenda impedir conflitos para o mesmo profissional;
- as regras de assinatura estiverem funcionando conforme a seção 6;
- as telas principais estiverem responsivas;
- a aplicação estiver publicada em ambiente acessível para demonstração;
- protótipo, diagramas, arquitetura e documentação estiverem atualizados conforme a implementação real.

O requisito **Should** (RF07) não impede a conclusão do projeto caso o escopo comprometido esteja completo.
