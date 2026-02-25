import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  LayoutDashboard,
  TrendingUp,
  AlertTriangle,
  Package,
  Wrench,
  FileDown,
  ClipboardList,
  Calendar,
  DollarSign,
  Clock,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

const CentralPlanningPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sectorFilter, setSectorFilter] = useState('all');
  const [planTitle, setPlanTitle] = useState('');
  const [planNotes, setPlanNotes] = useState('');
  const [selectedActions, setSelectedActions] = useState<string[]>([]);

  // Fetch work orders with asset info
  const { data: workOrders = [] } = useQuery({
    queryKey: ['central-work-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('work_orders')
        .select('*, assets(nome, codigo_interno, setor_padrao)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Fetch parts catalog (low stock)
  const { data: partsCatalog = [] } = useQuery({
    queryKey: ['central-parts-catalog'],
    queryFn: async () => {
      const { data, error } = await supabase.from('parts_catalog').select('*').eq('status', 'ativo');
      if (error) throw error;
      return data;
    },
  });

  // Fetch preventive actions
  const { data: preventiveActions = [] } = useQuery({
    queryKey: ['central-preventive-actions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('preventive_actions')
        .select('*, work_orders(protocolo, assets(nome))')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Fetch services executed
  const { data: servicesExecuted = [] } = useQuery({
    queryKey: ['central-services-executed'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('services_executed')
        .select('*, work_orders(protocolo, setor)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Fetch parts used
  const { data: partsUsed = [] } = useQuery({
    queryKey: ['central-parts-used'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('parts_used')
        .select('*, work_orders(protocolo)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Fetch assets
  const { data: assets = [] } = useQuery({
    queryKey: ['central-assets'],
    queryFn: async () => {
      const { data, error } = await supabase.from('assets').select('*');
      if (error) throw error;
      return data;
    },
  });

  // KPIs
  const kpis = useMemo(() => {
    const osAbertas = workOrders.filter((o: any) => o.status === 'ABERTO').length;
    const osAndamento = workOrders.filter((o: any) => o.status === 'EM_ANDAMENTO').length;
    const osFechadas = workOrders.filter((o: any) => o.status === 'FECHADO').length;
    const lowStockParts = partsCatalog.filter(
      (p: any) => p.estoque_atual !== null && p.estoque_minimo !== null && p.estoque_atual <= p.estoque_minimo
    );
    const totalPartsCost = partsUsed.reduce((acc: number, p: any) => acc + (p.valor_total || 0), 0);
    const totalServicesCost = servicesExecuted.reduce((acc: number, s: any) => acc + (s.valor_servico || 0), 0);
    const avgResolutionTime = workOrders
      .filter((o: any) => o.status === 'FECHADO' && o.tempo_total_minutos)
      .reduce((acc: number, o: any, _: any, arr: any[]) => acc + o.tempo_total_minutos / arr.length, 0);

    return {
      osAbertas,
      osAndamento,
      osFechadas,
      totalOS: workOrders.length,
      lowStockCount: lowStockParts.length,
      lowStockParts,
      totalPartsCost,
      totalServicesCost,
      totalCost: totalPartsCost + totalServicesCost,
      avgResolutionTime: Math.round(avgResolutionTime),
      pendingPreventive: preventiveActions.length,
    };
  }, [workOrders, partsCatalog, partsUsed, servicesExecuted, preventiveActions]);

  // Actionable items for plan generation
  const actionableItems = useMemo(() => {
    const items: Array<{ id: string; type: string; title: string; detail: string; priority: string; cost: number; }> = [];

    // Low stock → purchase action
    kpis.lowStockParts.forEach((p: any) => {
      items.push({
        id: `stock-${p.id}`,
        type: 'COMPRA',
        title: `Repor estoque: ${p.nome}`,
        detail: `Estoque atual: ${p.estoque_atual} | Mínimo: ${p.estoque_minimo} | Fornecedor: ${p.fornecedor_padrao || 'N/A'}`,
        priority: p.estoque_atual === 0 ? 'CRITICA' : 'ALTA',
        cost: (p.valor_medio || 0) * Math.max((p.estoque_minimo || 0) - (p.estoque_atual || 0), 1),
      });
    });

    // Open work orders → action needed
    workOrders
      .filter((o: any) => o.status === 'ABERTO')
      .forEach((o: any) => {
        items.push({
          id: `os-${o.id}`,
          type: 'MANUTENÇÃO',
          title: `OS ${o.protocolo} - ${(o as any).assets?.nome || 'Equipamento'}`,
          detail: `Setor: ${o.setor} | Tipo: ${o.tipo_ocorrencia} | Prioridade: ${o.prioridade}`,
          priority: o.prioridade,
          cost: 0,
        });
      });

    // Preventive actions → scheduled maintenance
    preventiveActions.forEach((pa: any) => {
      items.push({
        id: `prev-${pa.id}`,
        type: 'PREVENTIVA',
        title: `Ação preventiva: ${pa.descricao?.substring(0, 60)}`,
        detail: `Periodicidade: ${pa.periodicidade || 'N/A'} | Custo estimado: R$ ${(pa.custo_estimado || 0).toFixed(2)}`,
        priority: 'MEDIA',
        cost: pa.custo_estimado || 0,
      });
    });

    return items;
  }, [kpis, workOrders, preventiveActions]);

  const filteredItems = useMemo(() => {
    return actionableItems.filter((item) => {
      const matchesSearch =
        !searchTerm ||
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.detail.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSector = sectorFilter === 'all' || item.type === sectorFilter;
      return matchesSearch && matchesSector;
    });
  }, [actionableItems, searchTerm, sectorFilter]);

  const selectedCost = useMemo(
    () => filteredItems.filter((i) => selectedActions.includes(i.id)).reduce((acc, i) => acc + i.cost, 0),
    [selectedActions, filteredItems]
  );

  const toggleAction = (id: string) => {
    setSelectedActions((prev) => (prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]));
  };

  const selectAll = () => {
    setSelectedActions(filteredItems.map((i) => i.id));
  };

  const priorityColor = (p: string) => {
    switch (p) {
      case 'CRITICA': return 'bg-destructive/10 text-destructive';
      case 'ALTA': return 'bg-warning/10 text-warning';
      case 'MEDIA': return 'bg-info/10 text-info';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const typeColor = (t: string) => {
    switch (t) {
      case 'COMPRA': return 'bg-primary/10 text-primary';
      case 'MANUTENÇÃO': return 'bg-destructive/10 text-destructive';
      case 'PREVENTIVA': return 'bg-success/10 text-success';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const exportPlan = (exportFormat: 'pdf' | 'csv') => {
    const selected = filteredItems.filter((i) => selectedActions.includes(i.id));
    if (selected.length === 0) {
      toast.error('Selecione ao menos uma ação para gerar o plano.');
      return;
    }

    const title = planTitle || `Plano de Ação - ${format(new Date(), 'dd/MM/yyyy', { locale: ptBR })}`;

    if (exportFormat === 'csv') {
      const header = 'Tipo;Ação;Detalhe;Prioridade;Custo Estimado (R$)';
      const rows = selected.map(
        (i) => `${i.type};${i.title};${i.detail};${i.priority};${i.cost.toFixed(2)}`
      );
      const totalRow = `;;TOTAL;;${selectedCost.toFixed(2)}`;
      const csv = '\uFEFF' + [header, ...rows, '', totalRow].join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title.replace(/\s/g, '_')}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Planilha exportada com sucesso!');
    } else {
      const html = `
        <html><head><title>${title}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 30px; color: #333; }
          h1 { font-size: 20px; margin-bottom: 5px; }
          h2 { font-size: 14px; color: #666; margin-bottom: 20px; }
          .notes { background: #f5f5f5; padding: 12px; border-radius: 8px; margin-bottom: 20px; font-size: 13px; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; }
          th { background: #1a1a2e; color: white; padding: 10px 8px; text-align: left; }
          td { padding: 8px; border-bottom: 1px solid #eee; }
          tr:nth-child(even) { background: #f9f9f9; }
          .summary { margin-top: 20px; display: flex; gap: 20px; }
          .summary-card { background: #f0f0f0; padding: 15px; border-radius: 8px; flex: 1; text-align: center; }
          .summary-card h3 { font-size: 22px; margin: 0; }
          .summary-card p { font-size: 11px; color: #666; margin: 5px 0 0; }
          @media print { body { padding: 15px; } }
        </style></head><body>
        <h1>${title}</h1>
        <h2>Gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</h2>
        ${planNotes ? `<div class="notes"><strong>Observações:</strong> ${planNotes}</div>` : ''}
        <div class="summary">
          <div class="summary-card"><h3>${selected.length}</h3><p>Ações no plano</p></div>
          <div class="summary-card"><h3>R$ ${selectedCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3><p>Custo total estimado</p></div>
          <div class="summary-card"><h3>${selected.filter(i => i.type === 'COMPRA').length}</h3><p>Compras</p></div>
          <div class="summary-card"><h3>${selected.filter(i => i.type === 'MANUTENÇÃO').length}</h3><p>Manutenções</p></div>
        </div>
        <table style="margin-top:20px;">
          <thead><tr><th>#</th><th>Tipo</th><th>Ação</th><th>Detalhe</th><th>Prioridade</th><th>Custo (R$)</th></tr></thead>
          <tbody>${selected.map((i, idx) => `
            <tr>
              <td>${idx + 1}</td>
              <td>${i.type}</td>
              <td>${i.title}</td>
              <td>${i.detail}</td>
              <td>${i.priority}</td>
              <td>${i.cost.toFixed(2)}</td>
            </tr>`).join('')}
            <tr style="font-weight:bold;border-top:2px solid #333;">
              <td colspan="5">TOTAL</td>
              <td>R$ ${selectedCost.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
        </body></html>
      `;
      const win = window.open('', '_blank');
      if (win) {
        win.document.write(html);
        win.document.close();
        win.print();
      }
      toast.success('PDF gerado com sucesso!');
    }
  };

  // Sectors from work orders
  const sectors = useMemo(() => {
    const s = new Set(workOrders.map((o: any) => o.setor).filter(Boolean));
    return Array.from(s);
  }, [workOrders]);

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-6 space-y-6 max-w-7xl">
        {/* Page Header */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
              <LayoutDashboard className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground sm:text-2xl">Central de Planejamento</h1>
              <p className="text-sm text-muted-foreground">Visão consolidada de todas as áreas</p>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <Card className="border-border/50">
            <CardContent className="p-4 text-center">
              <ClipboardList className="mx-auto h-5 w-5 text-info mb-1" />
              <p className="text-2xl font-bold text-foreground">{kpis.osAbertas}</p>
              <p className="text-[11px] text-muted-foreground">OS Abertas</p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-4 text-center">
              <Clock className="mx-auto h-5 w-5 text-warning mb-1" />
              <p className="text-2xl font-bold text-foreground">{kpis.osAndamento}</p>
              <p className="text-[11px] text-muted-foreground">Em Andamento</p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-4 text-center">
              <CheckCircle2 className="mx-auto h-5 w-5 text-success mb-1" />
              <p className="text-2xl font-bold text-foreground">{kpis.osFechadas}</p>
              <p className="text-[11px] text-muted-foreground">Fechadas</p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-4 text-center">
              <AlertTriangle className="mx-auto h-5 w-5 text-destructive mb-1" />
              <p className="text-2xl font-bold text-foreground">{kpis.lowStockCount}</p>
              <p className="text-[11px] text-muted-foreground">Estoque Baixo</p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-4 text-center">
              <DollarSign className="mx-auto h-5 w-5 text-primary mb-1" />
              <p className="text-lg font-bold text-foreground">R$ {kpis.totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}</p>
              <p className="text-[11px] text-muted-foreground">Custo Total</p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-4 text-center">
              <TrendingUp className="mx-auto h-5 w-5 text-info mb-1" />
              <p className="text-2xl font-bold text-foreground">{kpis.avgResolutionTime}</p>
              <p className="text-[11px] text-muted-foreground">MTTR (min)</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="planner" className="space-y-4">
          <TabsList className="w-full flex-wrap h-auto gap-1 p-1">
            <TabsTrigger value="planner" className="flex-1 min-w-[120px] text-xs sm:text-sm">
              <ClipboardList className="h-4 w-4 mr-1.5" />
              Gerador de Plano
            </TabsTrigger>
            <TabsTrigger value="history" className="flex-1 min-w-[120px] text-xs sm:text-sm">
              <Calendar className="h-4 w-4 mr-1.5" />
              Histórico Geral
            </TabsTrigger>
            <TabsTrigger value="stock" className="flex-1 min-w-[120px] text-xs sm:text-sm">
              <Package className="h-4 w-4 mr-1.5" />
              Estoque Crítico
            </TabsTrigger>
          </TabsList>

          {/* Tab: Plan Generator */}
          <TabsContent value="planner" className="space-y-4">
            {/* Plan metadata */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Configurar Plano</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Input
                  placeholder="Título do plano (ex: Plano de Compras Q1 2026)"
                  value={planTitle}
                  onChange={(e) => setPlanTitle(e.target.value)}
                />
                <Textarea
                  placeholder="Observações e notas adicionais..."
                  value={planNotes}
                  onChange={(e) => setPlanNotes(e.target.value)}
                  rows={2}
                />
              </CardContent>
            </Card>

            {/* Filters */}
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar ações..."
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={sectorFilter} onValueChange={setSectorFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  <SelectItem value="COMPRA">Compras</SelectItem>
                  <SelectItem value="MANUTENÇÃO">Manutenção</SelectItem>
                  <SelectItem value="PREVENTIVA">Preventiva</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Selection summary */}
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4 flex-wrap">
                  <span className="text-sm font-medium">
                    {selectedActions.length} de {filteredItems.length} ações selecionadas
                  </span>
                  <Badge variant="outline" className="text-sm">
                    <DollarSign className="h-3 w-3 mr-1" />
                    R$ {selectedCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </Badge>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Button variant="outline" size="sm" onClick={selectAll}>
                    Selecionar Todos
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setSelectedActions([])}>
                    Limpar
                  </Button>
                  <Button size="sm" onClick={() => exportPlan('csv')}>
                    <FileDown className="h-4 w-4 mr-1.5" />
                    Excel
                  </Button>
                  <Button size="sm" onClick={() => exportPlan('pdf')}>
                    <FileDown className="h-4 w-4 mr-1.5" />
                    PDF
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Actions list */}
            <ScrollArea className="max-h-[600px]">
              <div className="space-y-2">
                {filteredItems.map((item) => (
                  <Card
                    key={item.id}
                    className={`cursor-pointer transition-all ${
                      selectedActions.includes(item.id)
                        ? 'border-primary ring-1 ring-primary/30'
                        : 'border-border/50 hover:border-border'
                    }`}
                    onClick={() => toggleAction(item.id)}
                  >
                    <CardContent className="flex items-start gap-3 p-3 sm:p-4">
                      <Checkbox
                        checked={selectedActions.includes(item.id)}
                        onCheckedChange={() => toggleAction(item.id)}
                        className="mt-0.5"
                      />
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge className={`text-[10px] ${typeColor(item.type)}`} variant="secondary">
                            {item.type}
                          </Badge>
                          <Badge className={`text-[10px] ${priorityColor(item.priority)}`} variant="secondary">
                            {item.priority}
                          </Badge>
                        </div>
                        <p className="text-sm font-medium text-foreground">{item.title}</p>
                        <p className="text-xs text-muted-foreground">{item.detail}</p>
                      </div>
                      {item.cost > 0 && (
                        <span className="shrink-0 text-sm font-semibold text-foreground">
                          R$ {item.cost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      )}
                    </CardContent>
                  </Card>
                ))}
                {filteredItems.length === 0 && (
                  <div className="flex flex-col items-center py-12 text-center">
                    <CheckCircle2 className="h-12 w-12 text-success/50 mb-3" />
                    <p className="text-muted-foreground">Nenhuma ação pendente encontrada</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Tab: History */}
          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Histórico de Ordens de Serviço
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-left">
                        <th className="pb-3 pr-4 font-medium text-muted-foreground">Protocolo</th>
                        <th className="pb-3 pr-4 font-medium text-muted-foreground">Equipamento</th>
                        <th className="pb-3 pr-4 font-medium text-muted-foreground hidden sm:table-cell">Setor</th>
                        <th className="pb-3 pr-4 font-medium text-muted-foreground">Status</th>
                        <th className="pb-3 pr-4 font-medium text-muted-foreground hidden md:table-cell">Prioridade</th>
                        <th className="pb-3 font-medium text-muted-foreground hidden lg:table-cell">Data</th>
                      </tr>
                    </thead>
                    <tbody>
                      {workOrders.slice(0, 50).map((o: any) => (
                        <tr key={o.id} className="border-b border-border/50 hover:bg-muted/30">
                          <td className="py-2.5 pr-4 font-mono text-xs">{o.protocolo}</td>
                          <td className="py-2.5 pr-4 text-xs">{o.assets?.nome || '-'}</td>
                          <td className="py-2.5 pr-4 text-xs hidden sm:table-cell">{o.setor}</td>
                          <td className="py-2.5 pr-4">
                            <Badge
                              variant="secondary"
                              className={`text-[10px] ${
                                o.status === 'ABERTO'
                                  ? 'bg-info/10 text-info'
                                  : o.status === 'EM_ANDAMENTO'
                                  ? 'bg-warning/10 text-warning'
                                  : 'bg-success/10 text-success'
                              }`}
                            >
                              {o.status.replace('_', ' ')}
                            </Badge>
                          </td>
                          <td className="py-2.5 pr-4 hidden md:table-cell">
                            <Badge variant="secondary" className={`text-[10px] ${priorityColor(o.prioridade)}`}>
                              {o.prioridade}
                            </Badge>
                          </td>
                          <td className="py-2.5 text-xs text-muted-foreground hidden lg:table-cell">
                            {format(new Date(o.created_at), 'dd/MM/yy HH:mm')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Critical Stock */}
          <TabsContent value="stock" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  Peças com Estoque Crítico
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-left">
                        <th className="pb-3 pr-4 font-medium text-muted-foreground">Peça</th>
                        <th className="pb-3 pr-4 font-medium text-muted-foreground">Código</th>
                        <th className="pb-3 pr-4 font-medium text-muted-foreground">Atual</th>
                        <th className="pb-3 pr-4 font-medium text-muted-foreground">Mínimo</th>
                        <th className="pb-3 pr-4 font-medium text-muted-foreground hidden sm:table-cell">Fornecedor</th>
                        <th className="pb-3 font-medium text-muted-foreground hidden sm:table-cell">Valor Médio</th>
                      </tr>
                    </thead>
                    <tbody>
                      {kpis.lowStockParts.map((p: any) => (
                        <tr key={p.id} className="border-b border-border/50">
                          <td className="py-2.5 pr-4 text-xs font-medium">{p.nome}</td>
                          <td className="py-2.5 pr-4 font-mono text-xs">{p.codigo_interno || '-'}</td>
                          <td className="py-2.5 pr-4">
                            <Badge variant="secondary" className={`text-[10px] ${p.estoque_atual === 0 ? 'bg-destructive/10 text-destructive' : 'bg-warning/10 text-warning'}`}>
                              {p.estoque_atual}
                            </Badge>
                          </td>
                          <td className="py-2.5 pr-4 text-xs">{p.estoque_minimo}</td>
                          <td className="py-2.5 pr-4 text-xs hidden sm:table-cell">{p.fornecedor_padrao || '-'}</td>
                          <td className="py-2.5 text-xs hidden sm:table-cell">R$ {(p.valor_medio || 0).toFixed(2)}</td>
                        </tr>
                      ))}
                      {kpis.lowStockParts.length === 0 && (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-muted-foreground">
                            <CheckCircle2 className="mx-auto h-8 w-8 text-success/50 mb-2" />
                            Todos os estoques estão dentro do nível seguro
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default CentralPlanningPage;
