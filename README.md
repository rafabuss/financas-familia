# 💰 Finanças da Família

> **Plataforma Completa de Gestão Financeira Familiar, Previsibilidade e Orçamento por Envelopes.**
> Desenvolvida com **React 19**, **Vite**, **TailwindCSS** e **Supabase (PostgreSQL)**.

---

## 📌 Visão Geral do Projeto

O **Finanças da Família** é uma aplicação projetada para fornecer controle financeiro rigoroso, transparência compartilhada e planejamento futuro para famílias. Diferente de planilhas complexas ou aplicativos engessados, o sistema une:

1. **Gestão do Presente:** Controle diário de contas, faturas de cartão de crédito e extrato detalhado.
2. **Método dos Envelopes Orçamentários:** Definição de tetos mensais por categoria para evitar surpresas no fim do mês.
3. **Simulador de Futuro (*What-If*):** Projeção de fluxo de caixa futuro e impacto de grandes decisões financeiras antes de tomar a decisão real.
4. **Visão Compartilhada vs. Individual:** Conciliação da renda familiar com a autonomia de cada membro.

---

## 🛠️ Stack Tecnológica

| Camada | Tecnologia | Descrição |
| :--- | :--- | :--- |
| **Frontend** | React 19 + Vite 6 | Aplicação SPA ultra-rápida e responsiva |
| **Estilização** | TailwindCSS v4 | Interface moderna, limpa e responsiva |
| **Ícones** | Lucide React | Conjunto visual consistente |
| **Leitura de Documentos** | PDF.js (`pdfjs-dist`) | Extração automatizada de extratos e faturas em PDF |
| **Backend & Banco de Dados** | Supabase (PostgreSQL) | Banco relacional com Row Level Security (RLS) |
| **Autenticação** | Supabase Auth | Gerenciamento de sessões com fallback local |
| **Offline-First / Cache** | LocalStorage + Sync Queue | Persistência resiliente mesmo com oscilações de rede |

---

## 🌟 Funcionalidades Atuais do Sistema

O sistema já conta com uma base robusta de recursos em produção, divididos nos seguintes módulos:

### 1. 📊 Dashboard Inteligente
* **Visão Geral Mensal:** Totalizadores dinâmicos de Entradas, Saídas, Saldo do Mês e Saldo Acumulado.
* **Status dos Lançamentos:** Separação clara entre valores *Realizados* (já pagos/recebidos), *Comprometidos* (faturas/boletos fechados) e *Previstos* (recorrentes e estimativas).
* **Filtro por Membro:** Alternância instantânea de visão entre a Família consolidada ou membros individuais.
* **Próximos Vencimentos:** Linha do tempo com contas e faturas a vencer nos próximos dias.
* **Alertas Financeiros:** Notificações contextuais sobre faturas em aberto e envelopes próximos do limite.

### 2. 📝 Lançamentos & Extrato Completo
* **Gestão de Transações:** Cadastro, edição e exclusão de Receitas, Despesas e Transferências entre contas.
* **Parcelamentos Inteligentes:** Lançamento de compras parceladas (ex: `1/10`), com geração automática de todas as parcelas futuras e agrupamento lógico.
* **Recorrências Mensais:** Despesas fixas (aluguel, condomínio, assinaturas) geradas automaticamente.
* **Filtros Avançados:** Busca textual, filtro por período/mês, status, conta bancária, cartão, categoria, membro e escopo (familiar ou pessoal).
* **Classificação por Status:**
  * `REALIZADO`: Transação já liquidada.
  * `COMPROMETIDO`: Compra no cartão ou boleto com valor fechado.
  * `PREVISTO`: Despesa esperada que ainda vai acontecer.
  * `HIPOTETICO`: Lançamento de simulação temporária.

### 3. 🏦 Contas Bancárias & Carteiras
* **Múltiplas Instituições:** Suporte a contas correntes, investimentos, poupança e reservas de emergência.
* **Cálculo Automático de Saldo:** O saldo atual é calculado em tempo real a partir do saldo inicial somado às movimentações liquidadas.
* **Vínculo com Membros:** Atribuição de titularidade (contas conjuntas da família ou contas particulares de um membro).
* **Arquivamento Seguro:** Possibilidade de desativar contas antigas preservando o histórico histórico de lançamentos.

### 4. 💳 Cartões de Crédito & Gestão de Faturas
* **Datas de Corte e Vencimento:** Cálculo automatizado do melhor dia de compra, fechamento de fatura e vencimento.
* **Acompanhamento de Limite:** Medidor visual de limite total, limite utilizado e limite disponível.
* **Faturas Futuras:** Visualização antecipada de faturas dos meses subsequentes baseada nas parcelas pendentes.
* **Identidade Visual:** Cores e bandeiras personalizadas por cartão (Nubank, XP, Itaú, Inter, etc.).

### 5. ✉️ Orçamento por Envelopes & Tetos Mensais
* **Teto por Categoria:** Aplicação da metodologia clássica de envelopes financeiros.
* **Termômetro de Gastos:** Barras de progresso com alertas de cores (Verde: dentro do teto; Amarelo: alerta; Vermelho: orçamento estourado).
* **Regras Específicas por Mês:** Ajuste de tetos para meses atípicos (ex: férias, festas de fim de ano, IPTU/IPVA) sem desconfigurar o padrão anual.

### 6. 🗂️ Categorias & Subcategorias Hierárquicas
* **Classificação Clara:** Divisão entre categorias de Receita e Despesa.
* **Organização em Árvore:** Suporte a categorias pai e subcategorias filhas (ex: `Moradia > Condomínio`, `Alimentação > Supermercado`).
* **Cores e Identificadores:** Identificação cromática rápida para gráficos e relatórios.

### 7. 📈 Projeções & Fluxo de Caixa Futuro
* **Previsibilidade Anual:** Gráficos e tabelas projetando o saldo bancário e o fluxo financeiro mês a mês para os próximos 6 a 12 meses.
* **Integração Completa:** Considera receitas recorrentes, parcelamentos ativos em cartões de crédito e despesas fixas da família.

### 8. 🔮 Cenários Hipotéticos (*"What-If"*)
* **Simulador de Decisões:** Criação de cenários de teste (ex: *"Trocar de carro"*, *"Fazer curso de pós-graduação"*, *"Aumento de salário"*).
* **Toggle Ativar/Desativar:** Ative um ou mais cenários e veja o impacto instantâneo no fluxo de caixa futuro **sem alterar nenhum dado real do banco**.
* **Impacto Mensal e Duração:** Configuração de início, duração em meses e categoria de impacto.

### 9. 📊 Gráficos & Relatórios Analíticos
* **Distribuição de Gastos:** Gráficos interativos de rosca/pizza por categoria.
* **Balanço Mensal:** Comparativo entre Entradas vs. Saídas mês a mês.
* **Participação por Membro:** Visibilidade do peso de cada pessoa nas despesas e receitas do núcleo familiar.

### 10. 📄 Importador Inteligente de Faturas (PDF)
* **Extração Direta via Navegador:** Utilização de `pdfjs-dist` para ler faturas sem precisar enviar arquivos para servidores externos.
* **Suporte Inicial:** Faturas de instituições como Itaú e Mercado Pago.
* **Revisão Pré-Lançamento:** Tela de conferência dos lançamentos extraídos, permitindo selecionar quais importar e associar categorias antes de salvar.

### 11. 🤖 Assistente de IA Financeiro Conversacional (Google Gemini)
* **Visão Contextual Dinâmica:** A IA recebe a cada mensagem o panorama financeiro em tempo real (saldo bancário, faturas de cartões, limites disponíveis, status dos envelopes e categorias ativas).
* **Tool Calling / Function Calling:** Capaz de executar ações autônomas diretamente no app:
  * `criar_transacao`: Registra receitas e despesas identificando automaticamente a categoria e forma de pagamento.
  * `simular_cenario`: Cria simulações *What-If* sem alterar os dados reais.
* **Cards Visuais de Ação:** Exibe no chat confirmações com atalhos diretos (*"Ver no Extrato"*, *"Ver em Cenários"*).
* **Acesso Simples:** Botão flutuante moderno (FAB) no canto inferior direito.
* **Modo Demonstração vs. Real:** Totalmente seguro em demonstrações (grava apenas na sessão em memória) e integrado ao Supabase no Modo Real.

### 12. 💾 Sincronização Híbrida & Persistência Resiliente
* **Nuvem (Supabase):** Tabelas PostgreSQL modeladas (`accounts`, `cards`, `categories`, `transactions`, `scenarios`, `monthly_envelopes`, `profiles`).
* **Fallback e Modo Offline:** Suporte a LocalStorage para uso sem conexão ou sem configuração imediata de chaves Supabase, com fila de sincronização pendente.

### 13. 👥 Multi-Tenancy Seguro & Row-Level Security (RLS)
* **Isolamento por Família (`households` e `household_members`):** Cada família possui seu próprio espaço estritamente isolado. Nenhum usuário externo pode visualizar ou alterar dados de outra família.
* **Adesão e Convites:** Novos usuários podem ingressar através de código de convite (com aprovação obrigatória do administrador) ou criar uma nova família independente como administrador titular.
* **RLS Otimizado com Funções Escalares:** Políticas PostgreSQL ultra-rápidas utilizando a função `current_user_household_ids() RETURNS UUID[]` com verificação de array `= ANY(...)`.

### 14. 🧠 Arquitetura Centralizada de Estado (`FinanceContext`)
* **Eliminação de Prop Drilling Residual:** Toda a orquestração de dados, sincronização com a nuvem, listeners de rede e 100% dos cálculos financeiros de alta fidelidade são centralizados em `src/contexts/FinanceContext.jsx`.
* **Consumo Transparente (`useFinance`):** Componentes consom o contexto através de hooks reativos com alta performance de renderização.

### 15. 🔒 Acesso Individual com Impacto Familiar ("Olho Amigo / Privacidade do Cônjuge")
* **Autonomia com Transparência Financeira:** Cada membro pode registrar gastos pessoais marcados como privados (`PERSONAL_PRIVATE`).
* **Preservação Contábil Absoluta:** O valor em centavos abate rigorosamente o saldo bancário, as faturas de cartão e os envelopes orçamentários da família.
* **Mascaramento Protetor:** O cônjuge visualiza o lançamento no extrato como *"Gasto Pessoal de [Nome]"*, com categoria neutra e botões de edição/exclusão travados, preservando a intimidade individual sem comprometer a exatidão financeira da casa.

---

## 🏗️ Arquitetura Modular & Estrutura de Componentes

Com a conclusão da **Fase 4**, o aplicativo adota uma arquitetura em camadas orientada a responsabilidades, contratos explícitos de estado via `FinanceContext` e isolamento modular:

```
src/
├── contexts/
│   └── FinanceContext.jsx             # Estado global, cálculos e sincronização híbrida
├── components/
│   ├── layout/
│   │   └── Navbar.jsx                 # Top bar, modo demo, Olho Mágico, seletor de membro, navegação
│   ├── dashboard/
│   │   └── DashboardTab.jsx           # Resumo financeiro, atalhos rápidos, próximos vencimentos
│   ├── transactions/
│   │   └── TransactionsTab.jsx        # Extrato completo, filtros avançados, faturas agrupadas
│   ├── accounts/
│   │   └── AccountsTab.jsx            # Contas correntes, investimentos, carteiras e cartões
│   ├── cards/
│   │   └── CardsInvoicesTab.jsx       # Gestão de cartões, faturas mensais e parcelas futuras
│   ├── envelopes/
│   │   └── EnvelopesTab.jsx           # Metodologia dos envelopes e tetos orçamentários por mês
│   ├── categories/
│   │   └── CategoriesTab.jsx          # Centros de custo e árvore hierárquica (pai/filhas)
│   ├── projections/
│   │   └── ProjectionsTab.jsx         # Fluxo de caixa futuro projetado e drawer "What-If"
│   ├── scenarios/
│   │   └── ScenariosTab.jsx           # Simulador de cenários hipotéticos e conversão em dados reais
│   ├── charts/
│   │   └── ChartsTab.jsx              # Análise gráfica percentual e drill-down por categoria
│   ├── import/
│   │   └── ImportTab.jsx              # Importador client-side de faturas PDF e conciliação
│   ├── exports/
│   │   └── ExportsTab.jsx             # Backup em JSON, exportação para planilhas e restauração
│   └── modals/
│       ├── EntityModal.jsx            # Modal unificado para Contas, Cartões, Categorias e Cenários
│       ├── TransactionModal.jsx       # Modal completo de lançamento (parcelas, recorrências, privacidade)
│       ├── DeleteModals.jsx           # Modais de exclusão (transação única, parcelas em lote, fatura)
│       ├── InvoicePaymentModal.jsx    # Liquidação de fatura com débito em conta bancária
│       └── EnvelopeModals.jsx         # Programação mensal, conflito de tetos e exclusão de envelopes
├── data/
│   ├── constants.js                   # Membros da família (FAMILY_MEMBERS) e categorias essenciais
│   └── demoData.js                    # Conjunto rico de dados de exemplo para a Sandbox em memória
├── utils/
│   └── formatters.js                  # formatMoney com Olho Mágico, formatDateBR e regras bancárias
└── services/
    ├── financeService.js              # Camada de persistência híbrida e fila de sincronização
    ├── aiService.js                   # Integração com API Google Gemini e Function Calling
    ├── supabase.js                    # Cliente de autenticação e banco PostgreSQL na nuvem
    └── pdfParser.js                   # Parser client-side de faturas bancárias em PDF
```

### 🧩 Detalhamento dos Módulos:

1. **`Navbar.jsx` (Navegação & Layout Global):**
   Gerencia a barra superior fixa do sistema. Integra o banner de alerta do Modo Demonstração, botão de alternância do Modo Privacidade ("Olho Mágico"), seletor de titularidade (`user-all`, gastos conjuntos da família ou visão privada de cada membro), botão de criação rápida de lançamentos e menu de abas responsivo.

2. **`DashboardTab.jsx` (Visão Geral da Família):**
   Tela inicial executiva com totalizadores inteligentes do mês (Entradas, Despesas, Saldo Operacional e Saldo Acumulado), timeline de próximos vencimentos de contas e faturas, alertas de envelopes próximos do limite e cartões bancários ativos.

3. **`TransactionsTab.jsx` (Extrato & Lançamentos):**
   Módulo de controle transacional diário. Inclui campo de busca em tempo real, drawer com múltiplos filtros combináveis (período pré-definido ou personalizado, status, membro, categoria e conta), visualização em lote, atalhos de liquidação rápida e agrupamento visual de faturas de cartão de crédito.

4. **`AccountsTab.jsx` (Contas Bancárias & Carteiras):**
   Gerenciamento de contas correntes, contas de investimento e carteiras de dinheiro físico. Calcula saldos consolidados em tempo real, permite arquivar contas inativas preservando o histórico e exibe os cartões associados a cada titular.

5. **`CardsInvoicesTab.jsx` (Cartões & Faturas):**
   Módulo de crédito da família. Exibe limites totais, utilizados e disponíveis, histórico de faturas mensais e visualização das parcelas de compras que impactarão os meses seguintes, com modal direto para liquidação da fatura.

6. **`EnvelopesTab.jsx` (Orçamento por Envelopes):**
   Implementa a metodologia clássica de envelopes financeiros. Permite destinar um teto orçamentário mensal para cada categoria de despesa, monitorar barras de progresso com alertas de estouro de orçamento e programar valores recorrentes para meses específicos.

7. **`CategoriesTab.jsx` (Categorias & Centros de Custo):**
   Organização das naturezas financeiras da família em estrutura em árvore (Categorias Pai e Subcategorias filhas). Define identificação cromática e tetos sugeridos.

8. **`ProjectionsTab.jsx` (Planejamento & Fluxo de Caixa Futuro):**
   Gráficos e tabelas projetando a liquidez familiar mês a mês para os próximos 6 a 12 meses. Inclui o simulador dinâmico *"What-If"*, que permite testar reduções de gastos e exclusão de receitas hipotéticas em tempo de execução.

9. **`ScenariosTab.jsx` (Cenários & Simulações):**
   Laboratório de simulação financeira. Permite criar propostas (ex: troca de veículo, reforma, nova fonte de renda) e ativá-las/desativá-las para medir o impacto no fluxo futuro sem alterar o banco de dados real, permitindo a conversão do cenário em lançamentos reais com um clique.

10. **`ChartsTab.jsx` (Análise Gráfica & Relatórios):**
    Visualização gráfica percentual da origem das receitas e destino das despesas. Suporta alternância entre visão agregada e hierárquica, além de *drill-down* direto para o extrato ao clicar em qualquer fatia.

11. **`ImportTab.jsx` (Importador Inteligente de Faturas):**
    Leitura de faturas em PDF (Itaú, Mercado Pago, etc.) diretamente no navegador via Web Worker (`pdfjs-dist`). Oferece conferência item a item, detecção automática de compras duplicadas e seleção em lote antes da gravação.

12. **`ExportsTab.jsx` (Backup & Portabilidade):**
    Exportação completa dos dados da família em formato JSON estruturado ou planilhas Excel/CSV, além de controles administrativos para restauração dos dados do sandbox de demonstração e reset de fábrica.

13. **`src/components/modals/` (Modais Desacoplados):**
    Componentes especializados isolados que não recarregam a árvore principal do app:
    * `EntityModal.jsx`: Cadastro/edição unificada de Contas, Cartões, Categorias e Cenários.
    * `TransactionModal.jsx`: Criação e edição de transações com gerador automático de compras parceladas (1/N) e regras de repetição mensal.
    * `DeleteModals.jsx`: Exclusão segura com seleção de escopo (apenas esta parcela, parcelas futuras ou todo o grupo).
    * `InvoicePaymentModal.jsx`: Liquidação de fatura com débito na conta bancária selecionada.
    * `EnvelopeModals.jsx`: Configuração mensal e validação assistida de hierarquia de tetos (Categoria Pai vs. Subcategorias).

14. **`src/utils/formatters.js` & `src/data/constants.js`:**
    Funções puras e imutáveis com suporte ao **Modo Privacidade ("Olho Mágico")** (`formatMoney`), tratamento defensivo de datas ISO (`formatDateBR`) e regras de fechamento/vencimento de faturas de cartão (`calculateCardDueDate`).

---

## 🚀 Roadmap de Evolução (Do Projeto Pessoal ao Produto SaaS)

Abaixo está o cronograma estratégico de evolução do sistema. Conforme cada fase for desenvolvida, ela será documentada e marcada nesta lista.

- [x] **Fase 1: Vitrine, Demonstração Segura & Modo Privacidade**
  - [x] Modo Demonstração (*Showcase Sandbox*) 100% em memória via `/?demo=true` e botão na interface.
  - [x] Zero gravação no banco Supabase durante apresentações para terceiros.
  - [x] Conjunto de dados fictícios rico e realista para demonstração de todos os recursos.
  - [x] Modo Privacidade ("Olho Mágico") na navbar para mascarar saldos e valores em compartilhamento de tela.

- [x] **Fase 2: Assistente de IA Financeiro Conversacional (Google Gemini - MVP & Testes)**
  - [x] Integração com a API do Google Gemini (`gemini-3.8-flash` / `gemini-3.6-flash`).
  - [x] Arquitetura desacoplada em serviço (`src/services/aiService.js`) com suporte a chave de ambiente (`VITE_GEMINI_API_KEY`) e fallback em `localStorage`.
  - [x] Chat financeiro nativo na interface com visão do contexto atual da família (saldos, faturas, envelopes, despesas).
  - [x] *Tool Calling / Function Calling:* A IA é capaz de criar transações e simular cenários diretamente por comandos de texto com cards visuais de execução.
  - [x] Compatibilidade total com Modo Real (Supabase) e Modo Demonstração (sandbox em memória).
  - [x] Consultoria preditiva: Alertas de padrões de consumo, anomalias e sugestões de corte de custos.

- [x] **Fase 3: Arquitetura, Modularização & Desacoplamento do App**
  - [x] Desmembramento do arquivo monolítico `src/App.jsx` em componentes modulares dedicados por aba (`DashboardTab`, `TransactionsTab`, `AccountsTab`, `CardsInvoicesTab`, `EnvelopesTab`, `CategoriesTab`, `ProjectionsTab`, `ScenariosTab`, `ChartsTab`, `ImportTab`, `ExportsTab`).
  - [x] Modularização do Navbar superior com suporte a multi-membro, modo demonstração e modo privacidade ("Olho Mágico").
  - [x] Desacoplamento de modais do sistema em componentes dedicados (`EntityModal`, `TransactionModal`, `DeleteModals`, `InvoicePaymentModal`, `EnvelopeModals`).
  - [x] Criação de utilitários globais de formatação e regras de datas/vencimentos em `src/utils/formatters.js` e constantes em `src/data/constants.js`.
  - [x] Redução drástica da complexidade do `App.jsx` (de ~11.820 linhas para ~4.750 linhas) mantendo 100% de integridade funcional e visual com zero regressões.

- [x] **Fase 3.1: Gestão Completa de Pagamentos de Faturas (Edição, Estorno & Recálculo de Saldos)**
  - [x] Possibilidade de **editar pagamentos de faturas já realizados** (trocar a conta bancária de débito, data e valor pago).
  - [x] Recálculo dinâmico automático e imediato dos saldos das contas envolvidas (estorno da conta antiga e débito na nova conta informada).
  - [x] Botão de **desfazer/estornar pagamento** de fatura, reabrindo os lançamentos vinculados como comprometidos.
  - [x] Exibição transparente no Extrato e na aba de Cartões de qual conta bancária liquidou cada fatura.

- [x] **Fase 3.2: Refinamento de Interface & Layout Clean da Barra Superior (Navbar Polish)**
  - [x] Redesenho da barra superior (`Navbar.jsx`) para dar destaque à marca e ao título "Finanças da Família".
  - [x] Transformação de botões utilitários (Olho Mágico e Assistente IA) em IconButtons minimalistas com tooltips.
  - [x] Unificação do perfil do usuário em um menu avatar suspenso moderno (avatar, nome, cargo e logout).
  - [x] Substituição do texto longo de conexão por um indicador discreto com pulso (verde/cinza/âmbar).
  - [x] Preservação de 100% dos callbacks, responsividade e integridade do banner do Modo Demonstração.

- [x] **Fase 3.3: Extratos Dedicados & Aglomeração de Faturas de Cartão**
  - [x] **Aglomeração & Acordeão de Lançamentos de Faturas (`CardsInvoicesTab`):** Exibir as faturas dos cartões de forma compacta e colapsável por padrão, permitindo expandir/recolher os lançamentos sob demanda para uma navegação ágil e sem rolagem infinita.
  - [x] **Extrato por Conta Bancária:** Botão/ícone de ação rápida no card de cada conta em `AccountsTab` para abrir o extrato exclusivo daquela conta com um único clique e banner dedicado com saldo atual.
  - [x] **Cálculo de Saldo Progressivo (Linha a Linha):** Visualização cronológica do saldo acumulado a cada entrada e saída (saldo inicial + entradas - saídas = saldo resultante na linha), idêntico ao extrato do banco real.
  - [x] **Extrato por Cartão de Crédito:** Atalho nos cards de cartões para visualizar o histórico de compras e parcelas exclusivas do cartão selecionado.
  - [x] **Extrato por Categoria / Envelope:** Possibilidade de clicar em qualquer envelope ou categoria (ex: "Supermercado") e abrir a listagem imediata de todos os gastos daquele grupo no mês.

- [ ] **Fase 4: Multi-Tenancy, Arquitetura de Estado (`FinanceContext`) & "Acesso Individual com Impacto Familiar"**
  - [ ] Introdução do `FinanceContext` (React Context) para eliminar o *prop drilling* remanescente do `App.jsx` e centralizar o estado.
  - [ ] Modelagem de Multi-Tenancy no Supabase (`households` e `household_members`).
  - [ ] Políticas rigorosas de Row-Level Security (RLS) no PostgreSQL, impedindo vazamento de dados entre famílias.
  - [ ] **Diferencial Matador:** Lançamentos Pessoais Privados (visíveis com detalhes apenas para quem gastou, mas computados no saldo e apresentados de forma agregada para o cônjuge).
  - [ ] Sistema de convites por e-mail com papéis de Administrador e Membro da família.

- [ ] **Fase 5: Transferências entre Contas (Pix) & Módulo de Cofrinhos / Metas / Investimentos**
  - [ ] **Tipo Nativo `TRANSFER` (Transferência entre Contas):** Lançamentos que movimentam saldo entre conta de origem e conta de destino (ex: Pix do Itaú para o Nubank para pagamento de fatura) sem inflar artificialmente as receitas ou despesas da família.
  - [ ] **Módulo de Cofrinhos / Caixinhas / Metas de Poupança:**
    - Cadastro de cofrinhos/caixinhas associados a contas (ex: Cofrinho Inter, Caixinhas Nubank, Tesouro Direto, CDBs).
    - Aporte programado a partir da renda mensal (destinar valores da renda para a meta/cofrinho).
    - Resgate e transferência de valores de volta para a conta corrente para uso imediato.
    - Acompanhamento de evolução patrimonial, saldo acumulado e rendimento das metas.

- [ ] **Fase 6: Importações Flexíveis & Conciliação Inteligente**
  - [ ] Ampliação de leitura de extratos em formato OFX e múltiplos bancos (Nubank, Inter, BB, C6, etc.).
  - [ ] **Conciliação Híbrida Inteligente:** Motor que detecta despesas manuais já cadastradas e sugere a unificação com os lançamentos bancários importados, sem duplicações.
  - [ ] Edição, recategorização e divisão (*split*) livre de qualquer lançamento importado.
  - [ ] Preparação da arquitetura para futura conexão direta via Open Finance (Pluggy / Belvo).

- [ ] **Fase 7: Empacotamento Mobile & Publicação em Lojas (Play Store / App Store)**
  - [ ] **IA Comercial Segura (Backend Proxy):** Migração da chamada da IA para **Supabase Edge Functions** (chave centralizada e oculta, controle de quotas por usuário e zero atrito para o consumidor final).
  - [ ] Configuração do Capacitor para transformar o app web em aplicativo nativo iOS e Android.
  - [ ] Integração de autenticação nativa com *Sign in with Apple* e *Sign in with Google*.
  - [ ] Atalhos rápidos no celular para inclusão de gastos imediatos no dia a dia.
  - [ ] Preparação para modelo comercial (planos de assinatura ou distribuição para beta testers).

---

## 💻 Como Rodar o Projeto Localmente

### Pré-requisitos
* **Node.js** (versão 18 ou superior)
* **npm** ou **yarn**

### Instalação

```bash
# 1. Clone o repositório
git clone https://github.com/rafabuss/financas-familia.git

# 2. Acesse a pasta do projeto
cd financas-da-familia

# 3. Instale as dependências
npm install

# 4. Configure as variáveis de ambiente
cp .env.example .env.local
# Preencha suas chaves do Supabase e do Google Gemini em .env.local
# - VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY (opcional se for rodar em modo local/demo puro)
# - VITE_GEMINI_API_KEY (gratuita em https://aistudio.google.com/app/apikey)

# 5. Inicie o servidor de desenvolvimento
npm run dev
```

A aplicação estará disponível em `http://localhost:5173`.

### 🔑 Como obter e configurar a Chave da API Google Gemini

O assistente financeiro utiliza o **Google Gemini** (`gemini-3.8-flash` ou `gemini-3.6-flash`). Você pode obter uma chave gratuita em menos de 1 minuto:

1. Acesse o [Google AI Studio](https://aistudio.google.com/app/apikey).
2. Faça login com sua conta Google e clique em **"Create API Key"** (ou "Criar Chave de API").
3. Copie a chave gerada (iniciada por `AIzaSy...`).
4. **Onde colocar a chave? (Você pode escolher uma das duas opções):**
   * **Opção 1 (Via arquivo local - Recomendado para desenvolvimento):**
     Abra o arquivo `.env.local` na raiz do projeto e defina:
     ```bash
     VITE_GEMINI_API_KEY=sua-chave-aqui
     ```
   * **Opção 2 (Direto na interface do aplicativo):**
     Abra o aplicativo, clique no botão flutuante do **Assistente IA** (canto inferior direito), clique no ícone de chave (**🔑**) no topo do painel do chat, cole sua chave e clique em **"Salvar Chave"**. Ela ficará salva com segurança no seu navegador (`localStorage`).

---

## 📄 Licença
Propriedade privada de Rafael & Família. Todos os direitos reservados.
