# Sistema de Gestão de Manutenção Industrial - Honda Brasil

## Visão Geral

Sistema web interno para gerenciamento de chamados de manutenção industrial com abertura via QR Code, controle de tempo automático, gestão de peças e serviços, e relatórios gerenciais.

---

## Funcionalidades Principais

### 1. Abertura de Chamados via QR Code
- Escaneamento do QR Code do equipamento para abertura instantânea de chamados
- Identificação automática do ativo (equipamento)
- Preenchimento automático de setor e local padrão do equipamento
- Geração automática de número de protocolo (formato: OS-XXXXXX)

### 2. Controle de Tempo Automático
- Registro automático de data/hora de início quando técnico assume a OS
- Registro automático de data/hora de fim quando OS é fechada
- Cálculo automático do tempo total de manutenção (horas e minutos)
- Bloqueio de edição manual do tempo (apenas leitura)

### 3. Catálogo de Peças
- Cadastro completo de peças com:
  - Código interno e código do fabricante
  - Nome e categoria
  - Unidade de medida
  - Valor médio
  - Estoque atual e estoque mínimo
  - Prazo médio de entrega
  - Fornecedor padrão
  - Observações
- Controle de movimentação de estoque
- Alertas de estoque mínimo
- Status: ATIVO / INATIVO

### 4. Catálogo de Serviços
- Cadastro de serviços padronizados com:
  - Nome e descrição
  - Tipo: CORRETIVO ou PREVENTIVO
  - Categoria: ELÉTRICA, MECÂNICA, HIDRÁULICA, PNEUMÁTICA, AJUSTE, LUBRIFICAÇÃO, OUTRO
  - Tempo padrão em minutos
  - Valor do serviço
- Status: ATIVO / INATIVO

### 5. Plano de Aquisição de Peças
- Planejamento de compras vinculado à OS
- Campos:
  - Peça (do catálogo ou manual)
  - Quantidade
  - Valor unitário e total
  - Fornecedor
  - Prazo de entrega em dias
  - Data prevista de chegada
  - Observações
- Status de compra: PLANEJADO → ORÇADO → COMPRADO → RECEBIDO
- Cálculo automático do custo total de aquisição

### 6. Serviços Executados
- Registro de serviços realizados na OS
- Campos:
  - Serviço (do catálogo ou manual)
  - Tempo padrão vs tempo real em minutos
  - Valor do serviço
  - Técnico responsável
  - Descrição adicional
- Comparativo tempo padrão x tempo real
- Cálculo automático do tempo total e valor total

### 7. Ações Preventivas Estruturadas
- Estruturação de manutenções preventivas vinculadas à OS
- Campos:
  - Descrição da ação
  - Peças recomendadas
  - Custo estimado
  - Periodicidade: DIÁRIA, SEMANAL, MENSAL, TRIMESTRAL, SEMESTRAL, ANUAL
  - Responsável
  - Observações
- Cálculo automático do custo estimado total

---

## Fluxo da Ordem de Serviço (OS)

### Status 1: ABERTO
- Chamado registrado via QR Code
- Informações preenchidas:
  - Equipamento (automático via QR)
  - Setor e local
  - Tipo de ocorrência: QUEBRA, FALHA_INTERMITENTE, PECA_DANIFICADA, RUIDO, VAZAMENTO, OUTRO
  - Prioridade: BAIXA, MÉDIA, ALTA, CRÍTICA
  - Descrição do problema
  - Foto opcional
  - Nome do solicitante

### Status 2: EM ANDAMENTO
- Técnico assume a OS
- Tempo inicia automaticamente (data_hora_inicio)
- Técnico registra:
  - Diagnóstico
  - Ação corretiva
  - Ação preventiva
  - Peças utilizadas
  - Plano de aquisição
  - Serviços executados
  - Ações preventivas estruturadas
- Foto de evidência opcional

### Status 3: FECHADO
- Manutenção concluída
- Tempo finaliza automaticamente (data_hora_fim)
- Cálculo automático do tempo total
- Técnico fica disponível para novos chamados

---

## Estrutura de Dados

### Equipamentos (Assets)
- ID único
- Código interno
- Nome
- QR Code value
- Setor padrão
- Local padrão
- Status: ATIVO / INATIVO

### Ordem de Serviço (Work Order)
- ID único
- Protocolo (OS-XXXXXX)
- Asset ID (equipamento)
- Setor e local
- Tipo de ocorrência
- Prioridade
- Status
- Descrição do solicitante
- Nome do solicitante
- Foto do solicitante (URL)
- Diagnóstico
- Ação corretiva
- Ação preventiva
- Evidência (URL)
- Data/hora início
- Data/hora fim
- Tempo total (horas e minutos)
- Técnico ID
- Data de criação
- Data de fechamento

### Peças Utilizadas
- ID único
- Work Order ID
- Part Catalog ID (opcional)
- Item (nome)
- Código da peça
- Quantidade
- Valor unitário
- Valor total

### Plano de Aquisição
- ID único
- Work Order ID
- Part Catalog ID (opcional)
- Nome da peça
- Código
- Quantidade
- Valor unitário
- Valor total
- Fornecedor
- Prazo de entrega (dias)
- Data prevista de chegada
- Status de compra
- Observações

### Serviços Executados
- ID único
- Work Order ID
- Service Catalog ID (opcional)
- Nome do serviço
- Descrição
- Tempo padrão (minutos)
- Tempo real (minutos)
- Valor do serviço
- Técnico ID
- Técnico nome

### Ações Preventivas
- ID único
- Work Order ID
- Descrição
- Peças recomendadas
- Custo estimado
- Periodicidade
- Responsável ID
- Responsável nome
- Observações

### Movimentação de Estoque
- ID único
- Part Catalog ID
- Work Order ID (opcional)
- Tipo: ENTRADA / SAÍDA
- Quantidade
- Quantidade anterior
- Quantidade posterior
- Motivo
- Usuário ID
- Usuário nome

---

## Perfis de Usuário

### Operador
- Abre chamados de manutenção via QR Code
- Preenche descrição do problema
- Anexa fotos do problema
- Define prioridade

### Técnico de Manutenção
- Assume ordens de serviço
- Registra diagnóstico e ações
- Registra peças utilizadas
- Registra serviços executados
- Planeja aquisições
- Define ações preventivas
- Fecha OS com evidências

### Gestor
- Visualiza todos os chamados
- Acessa relatórios e indicadores
- Analisa custos por período
- Aprova aquisições de peças
- Gerencia catálogos

---

## Indicadores e KPIs

### MTTR (Mean Time To Repair)
- Tempo médio de reparo por equipamento
- Análise por período selecionado

### Custos por Período
- Custos totais de peças
- Custos totais de serviços
- Análise por equipamento e setor

### Peças Mais Usadas
- Ranking de peças com maior utilização
- Planejamento de estoque

### Serviços Executados
- Análise dos serviços mais realizados
- Comparativo tempo padrão x real

---

## Recursos de Exportação

- Exportar relatórios em PDF
- Exportar dados em Excel
- Gráficos interativos

---

## Tipos de Ocorrência

1. QUEBRA - Equipamento parou de funcionar
2. FALHA_INTERMITENTE - Funcionamento irregular
3. PECA_DANIFICADA - Componente com defeito
4. RUIDO - Som anormal no equipamento
5. VAZAMENTO - Vazamento de fluidos
6. OUTRO - Outras ocorrências

---

## Níveis de Prioridade

1. BAIXA - Pode aguardar, sem impacto na produção
2. MÉDIA - Necessita atenção, impacto moderado
3. ALTA - Urgente, impacto significativo
4. CRÍTICA - Emergência, parada de produção

---

## Categorias de Serviço

1. ELÉTRICA - Serviços elétricos
2. MECÂNICA - Serviços mecânicos
3. HIDRÁULICA - Sistemas hidráulicos
4. PNEUMÁTICA - Sistemas pneumáticos
5. AJUSTE - Ajustes e calibrações
6. LUBRIFICAÇÃO - Lubrificação de equipamentos
7. OUTRO - Outros serviços

---

## Periodicidade de Manutenção Preventiva

1. DIÁRIA - Todos os dias
2. SEMANAL - Uma vez por semana
3. MENSAL - Uma vez por mês
4. TRIMESTRAL - A cada 3 meses
5. SEMESTRAL - A cada 6 meses
6. ANUAL - Uma vez por ano

---

## URL de Acesso

- Sistema: /
- Escanear QR: /scan
- Detalhes da OS: /os/{id}
- Catálogo de Peças: /pecas
- Catálogo de Serviços: /servicos
- Relatórios: /relatorios
- Sobre o Sistema: /sobre
