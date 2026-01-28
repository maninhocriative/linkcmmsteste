import React from 'react';
import { Link } from 'react-router-dom';
import {
  Wrench,
  QrCode,
  Clock,
  Package,
  Settings,
  BarChart3,
  Shield,
  Users,
  CheckCircle,
  ArrowRight,
  Zap,
  ClipboardList,
  TrendingUp,
  Calendar,
  Database,
  FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const PublicInfoPage: React.FC = () => {
  const features = [
    {
      icon: QrCode,
      title: 'Abertura via QR Code',
      description: 'Escaneie o QR Code do equipamento para abrir chamados de manutenção instantaneamente, com identificação automática do ativo.',
    },
    {
      icon: Clock,
      title: 'Tempo Automático',
      description: 'Registro automático de início e fim do atendimento com cálculo preciso do tempo total de manutenção.',
    },
    {
      icon: Package,
      title: 'Catálogo de Peças',
      description: 'Gestão completa de peças com controle de estoque, valores médios, prazos de entrega e alertas de estoque mínimo.',
    },
    {
      icon: Settings,
      title: 'Catálogo de Serviços',
      description: 'Padronização de serviços com tempo estimado, valores e categorias (elétrica, mecânica, hidráulica, etc).',
    },
    {
      icon: ClipboardList,
      title: 'Plano de Aquisição',
      description: 'Planejamento e acompanhamento de compras de peças com status (Planejado, Orçado, Comprado, Recebido).',
    },
    {
      icon: Calendar,
      title: 'Ações Preventivas',
      description: 'Estruturação de manutenções preventivas com periodicidade, custos estimados e responsáveis definidos.',
    },
  ];

  const kpis = [
    {
      icon: TrendingUp,
      title: 'MTTR',
      description: 'Mean Time To Repair - Tempo médio de reparo por equipamento e período.',
    },
    {
      icon: BarChart3,
      title: 'Custos por Período',
      description: 'Análise de custos totais por equipamento, setor e período selecionado.',
    },
    {
      icon: Package,
      title: 'Peças Mais Usadas',
      description: 'Ranking das peças com maior utilização para planejamento de estoque.',
    },
    {
      icon: Settings,
      title: 'Serviços Executados',
      description: 'Análise dos serviços mais realizados e tempo médio de execução.',
    },
  ];

  const roles = [
    {
      icon: Users,
      title: 'Operador',
      description: 'Abre chamados de manutenção via QR Code com descrição e fotos.',
    },
    {
      icon: Wrench,
      title: 'Técnico',
      description: 'Executa manutenções, registra diagnósticos, peças e serviços realizados.',
    },
    {
      icon: Shield,
      title: 'Gestor',
      description: 'Visualiza relatórios, custos, indicadores e aprova aquisições de peças.',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-card/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <Wrench className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-semibold leading-tight text-foreground">
                Sistema de Manutenção
              </h1>
              <p className="text-xs text-muted-foreground">Honda Brasil</p>
            </div>
          </div>
          <Link to="/">
            <Button>
              Acessar Sistema
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="border-b border-border bg-gradient-to-b from-primary/5 to-background py-16 md:py-24">
        <div className="container mx-auto px-4 text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary">
            <Wrench className="h-10 w-10 text-primary-foreground" />
          </div>
          <h1 className="mb-4 text-3xl font-bold text-foreground sm:text-4xl md:text-5xl">
            Sistema de Gestão de Manutenção
          </h1>
          <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground">
            Plataforma completa para gerenciamento de chamados de manutenção industrial com abertura via QR Code, controle de tempo automático, gestão de peças e serviços, e relatórios gerenciais.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/">
              <Button size="lg" className="gap-2">
                <QrCode className="h-5 w-5" />
                Acessar Sistema
              </Button>
            </Link>
            <a href="#funcionalidades">
              <Button size="lg" variant="outline" className="gap-2">
                <FileText className="h-5 w-5" />
                Ver Funcionalidades
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Quick Stats */}
      <section className="border-b border-border bg-card py-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="text-center">
              <div className="mb-2 flex justify-center">
                <Zap className="h-8 w-8 text-primary" />
              </div>
              <p className="text-2xl font-bold text-foreground">Rápido</p>
              <p className="text-sm text-muted-foreground">Abertura via QR Code</p>
            </div>
            <div className="text-center">
              <div className="mb-2 flex justify-center">
                <Clock className="h-8 w-8 text-primary" />
              </div>
              <p className="text-2xl font-bold text-foreground">Automático</p>
              <p className="text-sm text-muted-foreground">Controle de tempo</p>
            </div>
            <div className="text-center">
              <div className="mb-2 flex justify-center">
                <Database className="h-8 w-8 text-primary" />
              </div>
              <p className="text-2xl font-bold text-foreground">Integrado</p>
              <p className="text-sm text-muted-foreground">Peças e serviços</p>
            </div>
            <div className="text-center">
              <div className="mb-2 flex justify-center">
                <BarChart3 className="h-8 w-8 text-primary" />
              </div>
              <p className="text-2xl font-bold text-foreground">Analítico</p>
              <p className="text-sm text-muted-foreground">Relatórios e KPIs</p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Features */}
      <section id="funcionalidades" className="py-16">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-2xl font-bold text-foreground sm:text-3xl">
              Funcionalidades Principais
            </h2>
            <p className="mx-auto max-w-2xl text-muted-foreground">
              Ferramentas completas para gestão eficiente de manutenção industrial
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <Card key={index} className="transition-shadow hover:shadow-lg">
                <CardHeader>
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Work Order Flow */}
      <section className="border-y border-border bg-muted/30 py-16">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-2xl font-bold text-foreground sm:text-3xl">
              Fluxo da Ordem de Serviço
            </h2>
            <p className="mx-auto max-w-2xl text-muted-foreground">
              Acompanhe todo o ciclo de vida de um chamado de manutenção
            </p>
          </div>

          <div className="mx-auto max-w-4xl">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-xl border border-border bg-card p-6 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-500/10">
                  <span className="text-2xl font-bold text-blue-500">1</span>
                </div>
                <h3 className="mb-2 font-semibold text-foreground">ABERTO</h3>
                <p className="text-sm text-muted-foreground">
                  Chamado registrado via QR Code com descrição do problema e foto opcional
                </p>
              </div>

              <div className="rounded-xl border border-border bg-card p-6 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-yellow-500/10">
                  <span className="text-2xl font-bold text-yellow-500">2</span>
                </div>
                <h3 className="mb-2 font-semibold text-foreground">EM ANDAMENTO</h3>
                <p className="text-sm text-muted-foreground">
                  Técnico assumiu a OS, tempo iniciado automaticamente, registro de diagnóstico
                </p>
              </div>

              <div className="rounded-xl border border-border bg-card p-6 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-500/10">
                  <span className="text-2xl font-bold text-green-500">3</span>
                </div>
                <h3 className="mb-2 font-semibold text-foreground">FECHADO</h3>
                <p className="text-sm text-muted-foreground">
                  Manutenção concluída com registro de ações, peças, serviços e tempo total
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* KPIs and Reports */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-2xl font-bold text-foreground sm:text-3xl">
              Indicadores e Relatórios
            </h2>
            <p className="mx-auto max-w-2xl text-muted-foreground">
              Dashboards e métricas para tomada de decisão estratégica
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {kpis.map((kpi, index) => (
              <Card key={index} className="text-center">
                <CardHeader className="pb-2">
                  <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <kpi.icon className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-base">{kpi.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-xs">
                    {kpi.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-8 rounded-xl border border-border bg-card p-6">
            <h3 className="mb-4 font-semibold text-foreground">Recursos de Exportação</h3>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2 rounded-lg bg-muted px-4 py-2">
                <FileText className="h-4 w-4 text-red-500" />
                <span className="text-sm">Exportar PDF</span>
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-muted px-4 py-2">
                <FileText className="h-4 w-4 text-green-500" />
                <span className="text-sm">Exportar Excel</span>
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-muted px-4 py-2">
                <BarChart3 className="h-4 w-4 text-primary" />
                <span className="text-sm">Gráficos Interativos</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* User Roles */}
      <section className="border-y border-border bg-muted/30 py-16">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-2xl font-bold text-foreground sm:text-3xl">
              Perfis de Usuário
            </h2>
            <p className="mx-auto max-w-2xl text-muted-foreground">
              Controle de acesso por perfil com permissões específicas
            </p>
          </div>

          <div className="mx-auto grid max-w-3xl gap-6 md:grid-cols-3">
            {roles.map((role, index) => (
              <Card key={index} className="text-center">
                <CardHeader>
                  <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                    <role.icon className="h-7 w-7 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{role.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{role.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Feature List */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-2xl font-bold text-foreground sm:text-3xl">
              Lista Completa de Recursos
            </h2>
          </div>

          <div className="mx-auto max-w-4xl">
            <div className="grid gap-4 md:grid-cols-2">
              {[
                'Abertura de chamados via QR Code',
                'Identificação automática de equipamentos',
                'Registro de fotos do problema',
                'Classificação por prioridade (Baixa, Média, Alta, Crítica)',
                'Tipos de ocorrência pré-definidos',
                'Tempo de manutenção automático',
                'Catálogo de peças com estoque',
                'Catálogo de serviços padronizados',
                'Registro de peças utilizadas',
                'Controle de movimentação de estoque',
                'Plano de aquisição de peças',
                'Status de compra (Planejado → Recebido)',
                'Serviços executados com tempo real vs padrão',
                'Ações preventivas estruturadas',
                'Periodicidade de manutenções',
                'Relatórios por período e setor',
                'Dashboard de indicadores (MTTR, custos)',
                'Gráficos de análise',
                'Exportação PDF e Excel',
                'Controle de acesso por perfil',
              ].map((feature, index) => (
                <div key={index} className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
                  <CheckCircle className="h-5 w-5 shrink-0 text-green-500" />
                  <span className="text-sm text-foreground">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t border-border bg-primary/5 py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="mb-4 text-2xl font-bold text-foreground sm:text-3xl">
            Pronto para começar?
          </h2>
          <p className="mx-auto mb-8 max-w-xl text-muted-foreground">
            Acesse o sistema e comece a gerenciar suas manutenções de forma eficiente
          </p>
          <Link to="/">
            <Button size="lg" className="gap-2">
              <Wrench className="h-5 w-5" />
              Acessar Sistema de Manutenção
              <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-8">
        <div className="container mx-auto px-4 text-center">
          <div className="mb-4 flex items-center justify-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Wrench className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-foreground">Sistema de Manutenção</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Honda Brasil • Sistema de Gestão de Manutenção Industrial
          </p>
        </div>
      </footer>
    </div>
  );
};

export default PublicInfoPage;
