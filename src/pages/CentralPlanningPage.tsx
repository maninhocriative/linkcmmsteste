import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
  LayoutDashboard, TrendingUp, AlertTriangle, Package, Wrench,
  FileDown, ClipboardList, Calendar, DollarSign, Clock,
  CheckCircle2, Search, Filter, Settings, Cpu, ShoppingCart,
  Activity, Hammer, Eye, ChevronRight, Box,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

type ActionableItem = {
  id: string;
  type: 'EQUIPAMENTO' | 'PECA' | 'SERVICO' | 'MANUTENCAO' | 'COMPRA' | 'PREVENTIVA' | 'OS';
  title: string;
  subtitle: string;
  details: Record<string, string>;
  priority: string;
  cost: number;
  source: string;
};

const TYPE_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  EQUIPAMENTO: { label: 'Equipamento', icon: Cpu, color: 'bg-blue-500/10 text-blue-600' },
  PECA: { label: 'Peça', icon: Box, color: 'bg-emerald-500/10 text-emerald-600' },
  SERVICO: { label: 'Serviço', icon: Hammer, color: 'bg-violet-500/10 text-violet-600' },
  MANUTENCAO: { label: 'Manutenção', icon: Settings, color: 'bg-amber-500/10 text-amber-600' },
  COMPRA: { label: 'Compra', icon: ShoppingCart, color: 'bg-rose-500/10 text-rose-600' },
  PREVENTIVA: { label: 'Preventiva', icon: Activity, color: 'bg-teal-500/10 text-teal-600' },
  OS: { label: 'Ordem de Serviço', icon: ClipboardList, color: 'bg-orange-500/10 text-orange-600' },
};

const PRIORITY_CONFIG: Record<string, string> = {
  CRITICA: 'bg-destructive/10 text-destructive border-destructive/20',
  ALTA: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
  MEDIA: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  BAIXA: 'bg-muted text-muted-foreground border-border',
  INFO: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
};

const CentralPlanningPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [planTitle, setPlanTitle] = useState('');
  const [planNotes, setPlanNotes] = useState('');
  const [selectedActions, setSelectedActions] = useState<string[]>([]);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  // === DATA FETCHING ===
  const { data: workOrders = [] } = useQuery({
    queryKey: ['central-work-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('work_orders')
        .select('*, assets(nome, codigo_interno, setor_padrao, fabricante, modelo)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: partsCatalog = [] } = useQuery({
    queryKey: ['central-parts-catalog'],
    queryFn: async () => {
      const { data, error } = await supabase.from('parts_catalog').select('*').eq('status', 'ativo');
      if (error) throw error;
      return data;
    },
  });

  const { data: servicesCatalog = [] } = useQuery({
    queryKey: ['central-services-catalog'],
    queryFn: async () => {
      const { data, error } = await supabase.from('services_catalog').select('*').eq('status', 'ativo');
      if (error) throw error;
      return data;
    },
  });

  const { data: assets = [] } = useQuery({
    queryKey: ['central-assets'],
    queryFn: async () => {
      const { data, error } = await supabase.from('assets').select('*, maintenance_plan_templates(nome)');
      if (error) throw error;
      return data;
    },
  });

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

  const { data: maintenanceTemplates = [] } = useQuery({
    queryKey: ['central-maintenance-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('maintenance_plan_templates')
        .select('*, maintenance_plan_items(count)')
        .eq('status', 'ativo');
      if (error) throw error;
      return data;
    },
  });

  const { data: partsUsed = [] } = useQuery({
    queryKey: ['central-parts-used'],
    queryFn: async () => {
      const { data, error } = await supabase.from('parts_used').select('*');
      if (error) throw error;
      return data;
    },
  });

  const { data: servicesExecuted = [] } = useQuery({
    queryKey: ['central-services-executed'],
    queryFn: async () => {
      const { data, error } = await supabase.from('services_executed').select('*');
      if (error) throw error;
      return data;
    },
  });

  // === KPIs ===
  const kpis = useMemo(() => {
    const osAbertas = workOrders.filter((o: any) => o.status === 'ABERTO').length;
    const osAndamento = workOrders.filter((o: any) => o.status === 'EM_ANDAMENTO').length;
    const osFechadas = workOrders.filter((o: any) => o.status === 'FECHADO').length;
    const lowStockParts = partsCatalog.filter(
      (p: any) => p.estoque_atual != null && p.estoque_minimo != null && p.estoque_atual <= p.estoque_minimo
    );
    const totalPartsCost = partsUsed.reduce((acc: number, p: any) => acc + (p.valor_total || 0), 0);
    const totalServicesCost = servicesExecuted.reduce((acc: number, s: any) => acc + (s.valor_servico || 0), 0);
    const closedWithTime = workOrders.filter((o: any) => o.status === 'FECHADO' && o.tempo_total_minutos);
    const avgTime = closedWithTime.length > 0
      ? closedWithTime.reduce((acc: number, o: any) => acc + o.tempo_total_minutos, 0) / closedWithTime.length
      : 0;

    return {
      osAbertas, osAndamento, osFechadas,
      lowStockCount: lowStockParts.length,
      lowStockParts,
      totalCost: totalPartsCost + totalServicesCost,
      avgResolutionTime: Math.round(avgTime),
      totalEquipamentos: assets.length,
      totalPecas: partsCatalog.length,
      totalServicos: servicesCatalog.length,
    };
  }, [workOrders, partsCatalog, partsUsed, servicesExecuted, assets, servicesCatalog]);

  // === BUILD ACTIONABLE ITEMS ===
  const actionableItems = useMemo(() => {
    const items: ActionableItem[] = [];

    // 1. All Equipment
    assets.forEach((a: any) => {
      const osCount = workOrders.filter((o: any) => o.asset_id === a.id).length;
      const openOS = workOrders.filter((o: any) => o.asset_id === a.id && o.status !== 'FECHADO').length;
      items.push({
        id: `equip-${a.id}`,
        type: 'EQUIPAMENTO',
        title: a.nome,
        subtitle: `${a.codigo_interno} • ${a.setor_padrao || 'Sem setor'} • ${a.local_padrao || 'Sem local'}`,
        details: {
          'Código Interno': a.codigo_interno,
          'Fabricante': a.fabricante || 'N/A',
          'Modelo': a.modelo || 'N/A',
          'Nº Série': a.numero_serie || 'N/A',
          'Setor': a.setor_padrao || 'N/A',
          'Local': a.local_padrao || 'N/A',
          'Status': a.status,
          'Tag': a.tag || 'N/A',
          'Plano de Manutenção': (a as any).maintenance_plan_templates?.nome || 'Nenhum',
          'Total de OS': String(osCount),
          'OS Abertas': String(openOS),
        },
        priority: openOS > 0 ? 'ALTA' : 'INFO',
        cost: 0,
        source: 'Cadastro de Equipamentos',
      });
    });

    // 2. All Parts from Catalog
    partsCatalog.forEach((p: any) => {
      const isLow = p.estoque_atual != null && p.estoque_minimo != null && p.estoque_atual <= p.estoque_minimo;
      const deficit = isLow ? Math.max((p.estoque_minimo || 0) - (p.estoque_atual || 0), 1) : 0;
      items.push({
        id: `peca-${p.id}`,
        type: isLow ? 'COMPRA' : 'PECA',
        title: p.nome,
        subtitle: `${p.codigo_interno || 'Sem código'} • ${p.categoria || 'Sem categoria'} • Estoque: ${p.estoque_atual ?? 0}`,
        details: {
          'Código Interno': p.codigo_interno || 'N/A',
          'Código Fabricante': p.codigo_fabricante || 'N/A',
          'Categoria': p.categoria || 'N/A',
          'Fornecedor Padrão': p.fornecedor_padrao || 'N/A',
          'Unidade': p.unidade_medida || 'UN',
          'Estoque Atual': String(p.estoque_atual ?? 0),
          'Estoque Mínimo': String(p.estoque_minimo ?? 0),
          'Valor Médio': `R$ ${(p.valor_medio || 0).toFixed(2)}`,
          'Prazo Entrega': `${p.prazo_medio_entrega || 0} dias`,
          ...(isLow ? { 'Deficit': `${deficit} unidades`, 'Custo Reposição': `R$ ${(deficit * (p.valor_medio || 0)).toFixed(2)}` } : {}),
        },
        priority: p.estoque_atual === 0 ? 'CRITICA' : isLow ? 'ALTA' : 'INFO',
        cost: isLow ? deficit * (p.valor_medio || 0) : 0,
        source: isLow ? 'Estoque Crítico' : 'Catálogo de Peças',
      });
    });

    // 3. All Services from Catalog
    servicesCatalog.forEach((s: any) => {
      const execCount = servicesExecuted.filter((se: any) => se.service_catalog_id === s.id).length;
      items.push({
        id: `serv-${s.id}`,
        type: 'SERVICO',
        title: s.nome,
        subtitle: `${s.tipo} • ${s.categoria} • ${s.tempo_padrao_minutos || 0} min`,
        details: {
          'Tipo': s.tipo,
          'Categoria': s.categoria,
          'Tempo Padrão': `${s.tempo_padrao_minutos || 0} minutos`,
          'Valor': `R$ ${(s.valor_servico || 0).toFixed(2)}`,
          'Descrição': s.descricao || 'N/A',
          'Vezes Executado': String(execCount),
        },
        priority: 'INFO',
        cost: s.valor_servico || 0,
        source: 'Catálogo de Serviços',
      });
    });

    // 4. Open Work Orders
    workOrders.filter((o: any) => o.status !== 'FECHADO').forEach((o: any) => {
      items.push({
        id: `os-${o.id}`,
        type: 'OS',
        title: `${o.protocolo} — ${(o as any).assets?.nome || 'Equipamento'}`,
        subtitle: `${o.setor} • ${o.tipo_ocorrencia} • ${o.status.replace('_', ' ')}`,
        details: {
          'Protocolo': o.protocolo,
          'Equipamento': (o as any).assets?.nome || 'N/A',
          'Código Equipamento': (o as any).assets?.codigo_interno || 'N/A',
          'Setor': o.setor,
          'Local': o.local || 'N/A',
          'Tipo Ocorrência': o.tipo_ocorrencia,
          'Prioridade': o.prioridade,
          'Status': o.status,
          'Solicitante': o.solicitante_nome,
          'Descrição': o.descricao_solicitante,
          'Diagnóstico': o.diagnostico || 'Pendente',
          'Data Abertura': format(new Date(o.created_at), 'dd/MM/yyyy HH:mm'),
        },
        priority: o.prioridade,
        cost: 0,
        source: 'Ordens de Serviço',
      });
    });

    // 5. Preventive Actions
    preventiveActions.forEach((pa: any) => {
      items.push({
        id: `prev-${pa.id}`,
        type: 'PREVENTIVA',
        title: pa.descricao?.substring(0, 80) || 'Ação preventiva',
        subtitle: `${pa.periodicidade || 'Sem periodicidade'} • ${(pa as any).work_orders?.assets?.nome || 'N/A'} • OS ${(pa as any).work_orders?.protocolo || 'N/A'}`,
        details: {
          'Descrição': pa.descricao,
          'Periodicidade': pa.periodicidade || 'N/A',
          'Custo Estimado': `R$ ${(pa.custo_estimado || 0).toFixed(2)}`,
          'Peças Recomendadas': pa.pecas_recomendadas || 'N/A',
          'Responsável': pa.responsavel_nome || 'N/A',
          'Observações': pa.observacoes || 'N/A',
          'OS Origem': (pa as any).work_orders?.protocolo || 'N/A',
          'Equipamento': (pa as any).work_orders?.assets?.nome || 'N/A',
        },
        priority: 'MEDIA',
        cost: pa.custo_estimado || 0,
        source: 'Ações Preventivas',
      });
    });

    // 6. Maintenance Templates
    maintenanceTemplates.forEach((t: any) => {
      const linkedAssets = assets.filter((a: any) => a.maintenance_template_id === t.id).length;
      items.push({
        id: `template-${t.id}`,
        type: 'MANUTENCAO',
        title: t.nome,
        subtitle: `${t.modelo_equipamento || 'Geral'} • ${(t as any).maintenance_plan_items?.[0]?.count || 0} itens • ${linkedAssets} equipamentos`,
        details: {
          'Nome': t.nome,
          'Modelo Equipamento': t.modelo_equipamento || 'N/A',
          'Descrição': t.descricao || 'N/A',
          'Itens do Plano': String((t as any).maintenance_plan_items?.[0]?.count || 0),
          'Equipamentos Vinculados': String(linkedAssets),
        },
        priority: 'INFO',
        cost: 0,
        source: 'Planos de Manutenção',
      });
    });

    return items;
  }, [assets, partsCatalog, servicesCatalog, workOrders, preventiveActions, maintenanceTemplates, servicesExecuted]);

  // === FILTERING ===
  const filteredItems = useMemo(() => {
    return actionableItems.filter((item) => {
      const matchesSearch =
        !searchTerm ||
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.subtitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        Object.values(item.details).some(v => v.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesType = typeFilter === 'all' || item.type === typeFilter;
      const matchesPriority = priorityFilter === 'all' || item.priority === priorityFilter;
      return matchesSearch && matchesType && matchesPriority;
    });
  }, [actionableItems, searchTerm, typeFilter, priorityFilter]);

  const selectedCost = useMemo(
    () => actionableItems.filter((i) => selectedActions.includes(i.id)).reduce((acc, i) => acc + i.cost, 0),
    [selectedActions, actionableItems]
  );

  const selectedByType = useMemo(() => {
    const sel = actionableItems.filter((i) => selectedActions.includes(i.id));
    const counts: Record<string, number> = {};
    sel.forEach(s => { counts[s.type] = (counts[s.type] || 0) + 1; });
    return counts;
  }, [selectedActions, actionableItems]);

  const toggleAction = (id: string) => {
    setSelectedActions((prev) => (prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]));
  };

  const selectAll = () => setSelectedActions(filteredItems.map((i) => i.id));
  const clearAll = () => setSelectedActions([]);

  const selectByType = (type: string) => {
    const ids = filteredItems.filter(i => i.type === type).map(i => i.id);
    setSelectedActions(prev => [...new Set([...prev, ...ids])]);
  };

  const exportPlan = (exportFormat: 'pdf' | 'csv') => {
    const selected = actionableItems.filter((i) => selectedActions.includes(i.id));
    if (selected.length === 0) {
      toast.error('Selecione ao menos um item para gerar o plano.');
      return;
    }
    const title = planTitle || `Plano de Ação - ${format(new Date(), 'dd/MM/yyyy', { locale: ptBR })}`;

    if (exportFormat === 'csv') {
      const header = 'Tipo;Item;Detalhe;Prioridade;Custo Estimado (R$);Origem';
      const rows = selected.map(i => `${TYPE_CONFIG[i.type]?.label || i.type};${i.title};${i.subtitle};${i.priority};${i.cost.toFixed(2)};${i.source}`);
      const totalRow = `;;;TOTAL;${selectedCost.toFixed(2)};`;
      const csv = '\uFEFF' + [header, ...rows, '', totalRow].join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title.replace(/\s/g, '_')}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Planilha exportada!');
    } else {
      const html = `<html><head><title>${title}</title>
        <style>
          body{font-family:'Segoe UI',Arial,sans-serif;padding:30px;color:#1a1a2e;font-size:13px}
          h1{font-size:20px;margin-bottom:4px}
          h2{font-size:13px;color:#666;margin-bottom:24px;font-weight:normal}
          .notes{background:#f8f8fa;padding:12px 16px;border-radius:8px;margin-bottom:20px;font-size:12px;border-left:3px solid #333}
          .summary{display:flex;gap:12px;margin-bottom:24px;flex-wrap:wrap}
          .s-card{background:#f8f8fa;padding:14px;border-radius:8px;flex:1;min-width:120px;text-align:center}
          .s-card h3{font-size:22px;margin:0;color:#1a1a2e}
          .s-card p{font-size:10px;color:#888;margin:4px 0 0;text-transform:uppercase;letter-spacing:0.5px}
          table{width:100%;border-collapse:collapse}
          th{background:#1a1a2e;color:#fff;padding:10px 8px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:0.5px}
          td{padding:8px;border-bottom:1px solid #eee;font-size:12px}
          tr:nth-child(even){background:#fafafb}
          .total-row{font-weight:bold;border-top:2px solid #1a1a2e}
          @media print{body{padding:15px}}
        </style></head><body>
        <h1>${title}</h1>
        <h2>Gerado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</h2>
        ${planNotes ? `<div class="notes"><strong>Observações:</strong> ${planNotes}</div>` : ''}
        <div class="summary">
          <div class="s-card"><h3>${selected.length}</h3><p>Itens no plano</p></div>
          <div class="s-card"><h3>R$ ${selectedCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3><p>Custo estimado</p></div>
          ${Object.entries(selectedByType).map(([t, c]) => `<div class="s-card"><h3>${c}</h3><p>${TYPE_CONFIG[t]?.label || t}</p></div>`).join('')}
        </div>
        <table>
          <thead><tr><th>#</th><th>Tipo</th><th>Item</th><th>Detalhe</th><th>Prioridade</th><th>Custo (R$)</th><th>Origem</th></tr></thead>
          <tbody>
          ${selected.map((i, idx) => `<tr><td>${idx + 1}</td><td>${TYPE_CONFIG[i.type]?.label || i.type}</td><td>${i.title}</td><td>${i.subtitle}</td><td>${i.priority}</td><td>${i.cost.toFixed(2)}</td><td>${i.source}</td></tr>`).join('')}
          <tr class="total-row"><td colspan="5">TOTAL</td><td>R$ ${selectedCost.toFixed(2)}</td><td></td></tr>
          </tbody>
        </table></body></html>`;
      const win = window.open('', '_blank');
      if (win) { win.document.write(html); win.document.close(); win.print(); }
      toast.success('PDF gerado!');
    }
  };

  // Type counts for filter badges
  const typeCounts = useMemo(() => {
    const c: Record<string, number> = {};
    actionableItems.forEach(i => { c[i.type] = (c[i.type] || 0) + 1; });
    return c;
  }, [actionableItems]);

  return (
    <AppLayout>
      <div className="container mx-auto px-3 py-4 space-y-5 max-w-7xl sm:px-4 sm:py-6">
        {/* Header */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
              <LayoutDashboard className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground sm:text-2xl">Central de Planejamento</h1>
              <p className="text-xs text-muted-foreground sm:text-sm">
                {actionableItems.length} itens disponíveis • {assets.length} equipamentos • {partsCatalog.length} peças • {servicesCatalog.length} serviços
              </p>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-3 lg:grid-cols-6 sm:gap-3">
          {[
            { icon: ClipboardList, value: kpis.osAbertas, label: 'OS Abertas', color: 'text-blue-500' },
            { icon: Clock, value: kpis.osAndamento, label: 'Em Andamento', color: 'text-amber-500' },
            { icon: CheckCircle2, value: kpis.osFechadas, label: 'Fechadas', color: 'text-emerald-500' },
            { icon: AlertTriangle, value: kpis.lowStockCount, label: 'Estoque Baixo', color: 'text-destructive' },
            { icon: DollarSign, value: `R$ ${kpis.totalCost.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`, label: 'Custo Total', color: 'text-primary' },
            { icon: TrendingUp, value: kpis.avgResolutionTime, label: 'MTTR (min)', color: 'text-blue-500' },
          ].map((kpi, idx) => (
            <Card key={idx} className="border-border/50">
              <CardContent className="p-3 text-center sm:p-4">
                <kpi.icon className={`mx-auto h-4 w-4 sm:h-5 sm:w-5 mb-1 ${kpi.color}`} />
                <p className="text-lg font-bold text-foreground sm:text-2xl">{kpi.value}</p>
                <p className="text-[10px] text-muted-foreground sm:text-[11px]">{kpi.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="planner" className="space-y-4">
          <TabsList className="w-full flex-wrap h-auto gap-1 p-1">
            <TabsTrigger value="planner" className="flex-1 min-w-[100px] text-xs sm:text-sm">
              <ClipboardList className="h-4 w-4 mr-1.5 hidden sm:inline" />
              Gerador de Plano
            </TabsTrigger>
            <TabsTrigger value="history" className="flex-1 min-w-[100px] text-xs sm:text-sm">
              <Calendar className="h-4 w-4 mr-1.5 hidden sm:inline" />
              Histórico
            </TabsTrigger>
            <TabsTrigger value="stock" className="flex-1 min-w-[100px] text-xs sm:text-sm">
              <Package className="h-4 w-4 mr-1.5 hidden sm:inline" />
              Estoque Crítico
            </TabsTrigger>
          </TabsList>

          {/* === PLANNER TAB === */}
          <TabsContent value="planner" className="space-y-4">
            {/* Plan Config */}
            <Card>
              <CardHeader className="pb-2 px-4 pt-4">
                <CardTitle className="text-sm font-semibold">Configurar Plano</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 px-4 pb-4">
                <Input placeholder="Título do plano (ex: Plano de Compras Q1 2026)" value={planTitle} onChange={(e) => setPlanTitle(e.target.value)} />
                <Textarea placeholder="Observações e notas adicionais..." value={planNotes} onChange={(e) => setPlanNotes(e.target.value)} rows={2} className="resize-none" />
              </CardContent>
            </Card>

            {/* Filters */}
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Buscar por nome, código, setor, fornecedor..." className="pl-9" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full sm:w-44">
                  <Filter className="h-4 w-4 mr-1.5" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos ({actionableItems.length})</SelectItem>
                  {Object.entries(TYPE_CONFIG).map(([key, cfg]) => (
                    <SelectItem key={key} value={key}>{cfg.label} ({typeCounts[key] || 0})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Prioridade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas prioridades</SelectItem>
                  <SelectItem value="CRITICA">Crítica</SelectItem>
                  <SelectItem value="ALTA">Alta</SelectItem>
                  <SelectItem value="MEDIA">Média</SelectItem>
                  <SelectItem value="BAIXA">Baixa</SelectItem>
                  <SelectItem value="INFO">Info</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Quick Select Buttons */}
            <div className="flex flex-wrap gap-2">
              {Object.entries(TYPE_CONFIG).map(([key, cfg]) => {
                const count = typeCounts[key] || 0;
                if (count === 0) return null;
                return (
                  <Button key={key} variant="outline" size="sm" className="text-xs h-7" onClick={() => selectByType(key)}>
                    <cfg.icon className="h-3 w-3 mr-1" />
                    + {cfg.label} ({count})
                  </Button>
                );
              })}
            </div>

            {/* Selection Summary */}
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-sm font-semibold">
                    {selectedActions.length} de {filteredItems.length} selecionados
                  </span>
                  <Badge variant="outline" className="font-mono">
                    <DollarSign className="h-3 w-3 mr-0.5" />
                    R$ {selectedCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </Badge>
                  {Object.entries(selectedByType).map(([t, c]) => (
                    <Badge key={t} variant="secondary" className={`text-[10px] ${TYPE_CONFIG[t]?.color || ''}`}>
                      {TYPE_CONFIG[t]?.label}: {c}
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Button variant="outline" size="sm" className="text-xs" onClick={selectAll}>Selecionar Todos</Button>
                  <Button variant="outline" size="sm" className="text-xs" onClick={clearAll}>Limpar</Button>
                  <Button size="sm" className="text-xs" onClick={() => exportPlan('csv')}>
                    <FileDown className="h-3.5 w-3.5 mr-1" /> Excel
                  </Button>
                  <Button size="sm" className="text-xs" onClick={() => exportPlan('pdf')}>
                    <FileDown className="h-3.5 w-3.5 mr-1" /> PDF
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Items List */}
            <ScrollArea className="max-h-[600px]">
              <div className="space-y-2">
                {filteredItems.map((item) => {
                  const cfg = TYPE_CONFIG[item.type];
                  const Icon = cfg?.icon || Box;
                  const isExpanded = expandedItem === item.id;
                  const isSelected = selectedActions.includes(item.id);

                  return (
                    <Card
                      key={item.id}
                      className={`transition-all ${isSelected ? 'border-primary ring-1 ring-primary/30 bg-primary/[0.02]' : 'border-border/50 hover:border-border'}`}
                    >
                      <CardContent className="p-0">
                        {/* Main Row */}
                        <div className="flex items-start gap-3 p-3 sm:p-4 cursor-pointer" onClick={() => toggleAction(item.id)}>
                          <Checkbox checked={isSelected} onCheckedChange={() => toggleAction(item.id)} className="mt-1 shrink-0" />
                          <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${cfg?.color || 'bg-muted'}`}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
                              <Badge variant="secondary" className={`text-[10px] px-1.5 py-0 ${cfg?.color || ''}`}>
                                {cfg?.label || item.type}
                              </Badge>
                              <Badge variant="secondary" className={`text-[10px] px-1.5 py-0 ${PRIORITY_CONFIG[item.priority] || PRIORITY_CONFIG.BAIXA}`}>
                                {item.priority}
                              </Badge>
                              <span className="text-[10px] text-muted-foreground hidden sm:inline">• {item.source}</span>
                            </div>
                            <p className="text-sm font-medium text-foreground truncate">{item.title}</p>
                            <p className="text-xs text-muted-foreground truncate">{item.subtitle}</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {item.cost > 0 && (
                              <span className="text-sm font-semibold text-foreground hidden sm:block">
                                R$ {item.cost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </span>
                            )}
                            <Button
                              variant="ghost" size="icon" className="h-7 w-7"
                              onClick={(e) => { e.stopPropagation(); setExpandedItem(isExpanded ? null : item.id); }}
                            >
                              <ChevronRight className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                            </Button>
                          </div>
                        </div>

                        {/* Expanded Details */}
                        {isExpanded && (
                          <div className="border-t border-border/50 bg-muted/30 px-4 py-3">
                            {item.cost > 0 && (
                              <p className="text-sm font-semibold text-foreground mb-2 sm:hidden">
                                Custo: R$ {item.cost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </p>
                            )}
                            <div className="grid grid-cols-1 gap-x-6 gap-y-1.5 sm:grid-cols-2 lg:grid-cols-3">
                              {Object.entries(item.details).map(([key, val]) => (
                                <div key={key} className="flex items-baseline gap-2">
                                  <span className="text-[11px] font-medium text-muted-foreground whitespace-nowrap">{key}:</span>
                                  <span className="text-[11px] text-foreground truncate">{val}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
                {filteredItems.length === 0 && (
                  <div className="flex flex-col items-center py-12 text-center">
                    <Eye className="h-10 w-10 text-muted-foreground/30 mb-3" />
                    <p className="text-sm text-muted-foreground">Nenhum item encontrado com os filtros atuais</p>
                    <Button variant="link" size="sm" onClick={() => { setSearchTerm(''); setTypeFilter('all'); setPriorityFilter('all'); }}>
                      Limpar filtros
                    </Button>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* === HISTORY TAB === */}
          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Calendar className="h-4 w-4" /> Histórico de Ordens de Serviço ({workOrders.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-left">
                        <th className="pb-2 pr-3 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Protocolo</th>
                        <th className="pb-2 pr-3 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Equipamento</th>
                        <th className="pb-2 pr-3 text-[11px] font-medium text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Setor</th>
                        <th className="pb-2 pr-3 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                        <th className="pb-2 pr-3 text-[11px] font-medium text-muted-foreground uppercase tracking-wider hidden md:table-cell">Prioridade</th>
                        <th className="pb-2 text-[11px] font-medium text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Data</th>
                      </tr>
                    </thead>
                    <tbody>
                      {workOrders.slice(0, 50).map((o: any) => (
                        <tr key={o.id} className="border-b border-border/30 hover:bg-muted/30">
                          <td className="py-2 pr-3 font-mono text-xs">{o.protocolo}</td>
                          <td className="py-2 pr-3 text-xs">{o.assets?.nome || '-'}</td>
                          <td className="py-2 pr-3 text-xs hidden sm:table-cell">{o.setor}</td>
                          <td className="py-2 pr-3">
                            <Badge variant="secondary" className={`text-[10px] ${
                              o.status === 'ABERTO' ? 'bg-blue-500/10 text-blue-600' :
                              o.status === 'EM_ANDAMENTO' ? 'bg-amber-500/10 text-amber-600' :
                              'bg-emerald-500/10 text-emerald-600'
                            }`}>{o.status.replace('_', ' ')}</Badge>
                          </td>
                          <td className="py-2 pr-3 hidden md:table-cell">
                            <Badge variant="secondary" className={`text-[10px] ${PRIORITY_CONFIG[o.prioridade] || ''}`}>{o.prioridade}</Badge>
                          </td>
                          <td className="py-2 text-xs text-muted-foreground hidden lg:table-cell">
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

          {/* === STOCK TAB === */}
          <TabsContent value="stock" className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-destructive" /> Peças com Estoque Crítico ({kpis.lowStockParts.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-left">
                        <th className="pb-2 pr-3 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Peça</th>
                        <th className="pb-2 pr-3 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Código</th>
                        <th className="pb-2 pr-3 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Atual</th>
                        <th className="pb-2 pr-3 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Mínimo</th>
                        <th className="pb-2 pr-3 text-[11px] font-medium text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Fornecedor</th>
                        <th className="pb-2 text-[11px] font-medium text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Valor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {kpis.lowStockParts.map((p: any) => (
                        <tr key={p.id} className="border-b border-border/30">
                          <td className="py-2 pr-3 text-xs font-medium">{p.nome}</td>
                          <td className="py-2 pr-3 font-mono text-xs">{p.codigo_interno || '-'}</td>
                          <td className="py-2 pr-3">
                            <Badge variant="secondary" className={`text-[10px] ${p.estoque_atual === 0 ? 'bg-destructive/10 text-destructive' : 'bg-amber-500/10 text-amber-600'}`}>
                              {p.estoque_atual}
                            </Badge>
                          </td>
                          <td className="py-2 pr-3 text-xs">{p.estoque_minimo}</td>
                          <td className="py-2 pr-3 text-xs hidden sm:table-cell">{p.fornecedor_padrao || '-'}</td>
                          <td className="py-2 text-xs hidden sm:table-cell">R$ {(p.valor_medio || 0).toFixed(2)}</td>
                        </tr>
                      ))}
                      {kpis.lowStockParts.length === 0 && (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-muted-foreground text-xs">
                            <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-500/30 mb-2" />
                            Estoques dentro do nível seguro
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
