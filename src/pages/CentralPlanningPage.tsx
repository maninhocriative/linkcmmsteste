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
import {
  LayoutDashboard, TrendingUp, AlertTriangle, Package, Wrench,
  FileDown, ClipboardList, Calendar, DollarSign, Clock,
  CheckCircle2, Search, Filter, Settings, Cpu, ShoppingCart,
  Activity, Hammer, Eye, ChevronRight, Box, Target, FileText,
  Zap, Shield, BarChart3,
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

const TYPE_CONFIG: Record<string, { label: string; icon: React.ElementType; cssClass: string }> = {
  EQUIPAMENTO: { label: 'Equipamento', icon: Cpu, cssClass: 'status-badge bg-info/10 text-info' },
  PECA: { label: 'Peça', icon: Box, cssClass: 'status-badge bg-success/10 text-success' },
  SERVICO: { label: 'Serviço', icon: Hammer, cssClass: 'status-badge bg-primary/10 text-primary' },
  MANUTENCAO: { label: 'Manutenção', icon: Settings, cssClass: 'status-badge bg-warning/10 text-warning' },
  COMPRA: { label: 'Compra', icon: ShoppingCart, cssClass: 'status-badge bg-destructive/10 text-destructive' },
  PREVENTIVA: { label: 'Preventiva', icon: Activity, cssClass: 'status-badge bg-success/10 text-success' },
  OS: { label: 'Ordem de Serviço', icon: ClipboardList, cssClass: 'status-badge bg-warning/10 text-warning' },
};

const PLAN_TYPES = [
  { value: 'compras', label: 'Plano de Compras', icon: ShoppingCart, description: 'Planejamento de aquisição de peças e materiais' },
  { value: 'preventiva', label: 'Manutenção Preventiva', icon: Shield, description: 'Plano de manutenções preventivas programadas' },
  { value: 'corretiva', label: 'Manutenção Corretiva', icon: Wrench, description: 'Planejamento de ações corretivas pendentes' },
  { value: 'investimento', label: 'Investimento / CAPEX', icon: BarChart3, description: 'Planejamento de investimentos em equipamentos' },
  { value: 'geral', label: 'Plano Geral', icon: Target, description: 'Planejamento livre com múltiplas categorias' },
];

const CentralPlanningPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [planTitle, setPlanTitle] = useState('');
  const [planNotes, setPlanNotes] = useState('');
  const [planType, setPlanType] = useState('');
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

    return { osAbertas, osAndamento, osFechadas, lowStockCount: lowStockParts.length, lowStockParts, totalCost: totalPartsCost + totalServicesCost, avgResolutionTime: Math.round(avgTime) };
  }, [workOrders, partsCatalog, partsUsed, servicesExecuted]);

  // === ACTIONABLE ITEMS ===
  const actionableItems = useMemo(() => {
    const items: ActionableItem[] = [];

    assets.forEach((a: any) => {
      const osCount = workOrders.filter((o: any) => o.asset_id === a.id).length;
      const openOS = workOrders.filter((o: any) => o.asset_id === a.id && o.status !== 'FECHADO').length;
      items.push({
        id: `equip-${a.id}`, type: 'EQUIPAMENTO', title: a.nome,
        subtitle: `${a.codigo_interno} • ${a.setor_padrao || 'Sem setor'} • ${a.local_padrao || 'Sem local'}`,
        details: { 'Código': a.codigo_interno, 'Fabricante': a.fabricante || 'N/A', 'Modelo': a.modelo || 'N/A', 'Nº Série': a.numero_serie || 'N/A', 'Setor': a.setor_padrao || 'N/A', 'Local': a.local_padrao || 'N/A', 'Status': a.status, 'Tag': a.tag || 'N/A', 'Plano Manutenção': (a as any).maintenance_plan_templates?.nome || 'Nenhum', 'Total OS': String(osCount), 'OS Abertas': String(openOS) },
        priority: openOS > 0 ? 'ALTA' : 'INFO', cost: 0, source: 'Equipamentos',
      });
    });

    partsCatalog.forEach((p: any) => {
      const isLow = p.estoque_atual != null && p.estoque_minimo != null && p.estoque_atual <= p.estoque_minimo;
      const deficit = isLow ? Math.max((p.estoque_minimo || 0) - (p.estoque_atual || 0), 1) : 0;
      items.push({
        id: `peca-${p.id}`, type: isLow ? 'COMPRA' : 'PECA', title: p.nome,
        subtitle: `${p.codigo_interno || 'Sem código'} • ${p.categoria || 'Sem categoria'} • Estoque: ${p.estoque_atual ?? 0}`,
        details: { 'Código Interno': p.codigo_interno || 'N/A', 'Código Fabricante': p.codigo_fabricante || 'N/A', 'Categoria': p.categoria || 'N/A', 'Fornecedor': p.fornecedor_padrao || 'N/A', 'Unidade': p.unidade_medida || 'UN', 'Estoque Atual': String(p.estoque_atual ?? 0), 'Estoque Mínimo': String(p.estoque_minimo ?? 0), 'Valor Médio': `R$ ${(p.valor_medio || 0).toFixed(2)}`, 'Prazo Entrega': `${p.prazo_medio_entrega || 0} dias`, ...(isLow ? { 'Deficit': `${deficit} un`, 'Custo Reposição': `R$ ${(deficit * (p.valor_medio || 0)).toFixed(2)}` } : {}) },
        priority: p.estoque_atual === 0 ? 'CRITICA' : isLow ? 'ALTA' : 'INFO', cost: isLow ? deficit * (p.valor_medio || 0) : 0, source: isLow ? 'Estoque Crítico' : 'Catálogo',
      });
    });

    servicesCatalog.forEach((s: any) => {
      const execCount = servicesExecuted.filter((se: any) => se.service_catalog_id === s.id).length;
      items.push({
        id: `serv-${s.id}`, type: 'SERVICO', title: s.nome,
        subtitle: `${s.tipo} • ${s.categoria} • ${s.tempo_padrao_minutos || 0} min`,
        details: { 'Tipo': s.tipo, 'Categoria': s.categoria, 'Tempo Padrão': `${s.tempo_padrao_minutos || 0} min`, 'Valor': `R$ ${(s.valor_servico || 0).toFixed(2)}`, 'Descrição': s.descricao || 'N/A', 'Execuções': String(execCount) },
        priority: 'INFO', cost: s.valor_servico || 0, source: 'Serviços',
      });
    });

    workOrders.filter((o: any) => o.status !== 'FECHADO').forEach((o: any) => {
      items.push({
        id: `os-${o.id}`, type: 'OS', title: `${o.protocolo} — ${(o as any).assets?.nome || 'Equipamento'}`,
        subtitle: `${o.setor} • ${o.tipo_ocorrencia} • ${o.status.replace('_', ' ')}`,
        details: { 'Protocolo': o.protocolo, 'Equipamento': (o as any).assets?.nome || 'N/A', 'Setor': o.setor, 'Tipo': o.tipo_ocorrencia, 'Prioridade': o.prioridade, 'Status': o.status, 'Solicitante': o.solicitante_nome, 'Descrição': o.descricao_solicitante, 'Diagnóstico': o.diagnostico || 'Pendente', 'Data': format(new Date(o.created_at), 'dd/MM/yyyy HH:mm') },
        priority: o.prioridade, cost: 0, source: 'Ordens de Serviço',
      });
    });

    preventiveActions.forEach((pa: any) => {
      items.push({
        id: `prev-${pa.id}`, type: 'PREVENTIVA', title: pa.descricao?.substring(0, 80) || 'Ação preventiva',
        subtitle: `${pa.periodicidade || 'Sem periodicidade'} • ${(pa as any).work_orders?.assets?.nome || 'N/A'}`,
        details: { 'Descrição': pa.descricao, 'Periodicidade': pa.periodicidade || 'N/A', 'Custo Estimado': `R$ ${(pa.custo_estimado || 0).toFixed(2)}`, 'Peças': pa.pecas_recomendadas || 'N/A', 'Responsável': pa.responsavel_nome || 'N/A', 'OS Origem': (pa as any).work_orders?.protocolo || 'N/A' },
        priority: 'MEDIA', cost: pa.custo_estimado || 0, source: 'Preventivas',
      });
    });

    maintenanceTemplates.forEach((t: any) => {
      const linkedAssets = assets.filter((a: any) => a.maintenance_template_id === t.id).length;
      items.push({
        id: `template-${t.id}`, type: 'MANUTENCAO', title: t.nome,
        subtitle: `${t.modelo_equipamento || 'Geral'} • ${(t as any).maintenance_plan_items?.[0]?.count || 0} itens • ${linkedAssets} equipamentos`,
        details: { 'Nome': t.nome, 'Modelo': t.modelo_equipamento || 'N/A', 'Descrição': t.descricao || 'N/A', 'Itens': String((t as any).maintenance_plan_items?.[0]?.count || 0), 'Equipamentos': String(linkedAssets) },
        priority: 'INFO', cost: 0, source: 'Planos',
      });
    });

    return items;
  }, [assets, partsCatalog, servicesCatalog, workOrders, preventiveActions, maintenanceTemplates, servicesExecuted]);

  // === FILTERING ===
  const filteredItems = useMemo(() => {
    return actionableItems.filter((item) => {
      const matchesSearch = !searchTerm || item.title.toLowerCase().includes(searchTerm.toLowerCase()) || item.subtitle.toLowerCase().includes(searchTerm.toLowerCase()) || Object.values(item.details).some(v => v.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesType = typeFilter === 'all' || item.type === typeFilter;
      const matchesPriority = priorityFilter === 'all' || item.priority === priorityFilter;
      return matchesSearch && matchesType && matchesPriority;
    });
  }, [actionableItems, searchTerm, typeFilter, priorityFilter]);

  const selectedCost = useMemo(() => actionableItems.filter((i) => selectedActions.includes(i.id)).reduce((acc, i) => acc + i.cost, 0), [selectedActions, actionableItems]);

  const selectedByType = useMemo(() => {
    const sel = actionableItems.filter((i) => selectedActions.includes(i.id));
    const counts: Record<string, number> = {};
    sel.forEach(s => { counts[s.type] = (counts[s.type] || 0) + 1; });
    return counts;
  }, [selectedActions, actionableItems]);

  const toggleAction = (id: string) => setSelectedActions((prev) => (prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]));
  const selectAll = () => setSelectedActions(filteredItems.map((i) => i.id));
  const clearAll = () => setSelectedActions([]);
  const selectByType = (type: string) => {
    const ids = filteredItems.filter(i => i.type === type).map(i => i.id);
    setSelectedActions(prev => [...new Set([...prev, ...ids])]);
  };

  const typeCounts = useMemo(() => {
    const c: Record<string, number> = {};
    actionableItems.forEach(i => { c[i.type] = (c[i.type] || 0) + 1; });
    return c;
  }, [actionableItems]);

  const selectedPlanType = PLAN_TYPES.find(p => p.value === planType);

  const exportPlan = (exportFormat: 'pdf' | 'csv') => {
    const selected = actionableItems.filter((i) => selectedActions.includes(i.id));
    if (selected.length === 0) { toast.error('Selecione ao menos um item.'); return; }
    if (!planType) { toast.error('Selecione o tipo de planejamento.'); return; }

    const title = planTitle || `${selectedPlanType?.label || 'Plano'} - ${format(new Date(), 'dd/MM/yyyy', { locale: ptBR })}`;

    if (exportFormat === 'csv') {
      const header = 'Tipo Plano;Tipo Item;Item;Detalhe;Prioridade;Custo (R$);Origem';
      const rows = selected.map(i => `${selectedPlanType?.label || ''};${TYPE_CONFIG[i.type]?.label || i.type};${i.title};${i.subtitle};${i.priority};${i.cost.toFixed(2)};${i.source}`);
      const csv = '\uFEFF' + [header, ...rows, '', `;;;;TOTAL;${selectedCost.toFixed(2)};`].join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `${title.replace(/\s/g, '_')}.csv`; a.click();
      URL.revokeObjectURL(url);
      toast.success('Planilha exportada!');
    } else {
      const html = `<html><head><title>${title}</title>
        <style>
          *{margin:0;padding:0;box-sizing:border-box}
          body{font-family:'Segoe UI',system-ui,sans-serif;padding:40px;color:#1a1a2e;font-size:13px;background:#fff}
          .header{border-bottom:2px solid #1a1a2e;padding-bottom:16px;margin-bottom:24px}
          .header h1{font-size:22px;font-weight:700;letter-spacing:-0.5px}
          .header .meta{display:flex;gap:20px;margin-top:6px;color:#666;font-size:12px}
          .header .plan-type{display:inline-block;background:#1a1a2e;color:#fff;padding:4px 12px;border-radius:4px;font-size:11px;font-weight:600;letter-spacing:0.5px;text-transform:uppercase;margin-top:8px}
          .notes{background:#f8f8fa;padding:14px 18px;border-radius:8px;margin-bottom:20px;font-size:12px;border-left:3px solid #1a1a2e}
          .summary{display:flex;gap:12px;margin-bottom:24px;flex-wrap:wrap}
          .s-card{background:#f8f8fa;padding:16px;border-radius:8px;flex:1;min-width:120px;text-align:center;border:1px solid #eee}
          .s-card h3{font-size:24px;margin:0;color:#1a1a2e;font-weight:700}
          .s-card p{font-size:10px;color:#888;margin:4px 0 0;text-transform:uppercase;letter-spacing:0.5px}
          table{width:100%;border-collapse:collapse;margin-top:4px}
          th{background:#1a1a2e;color:#fff;padding:10px 8px;text-align:left;font-size:10px;text-transform:uppercase;letter-spacing:0.5px}
          td{padding:8px;border-bottom:1px solid #eee;font-size:11px}
          tr:nth-child(even){background:#fafafb}
          .total-row{font-weight:700;border-top:2px solid #1a1a2e;background:#f8f8fa}
          @media print{body{padding:20px}}
        </style></head><body>
        <div class="header">
          <h1>${title}</h1>
          <div class="meta"><span>Gerado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span></div>
          <div class="plan-type">${selectedPlanType?.label || 'Plano'}</div>
        </div>
        ${planNotes ? `<div class="notes"><strong>Observações:</strong> ${planNotes}</div>` : ''}
        <div class="summary">
          <div class="s-card"><h3>${selected.length}</h3><p>Itens</p></div>
          <div class="s-card"><h3>R$ ${selectedCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3><p>Custo estimado</p></div>
          ${Object.entries(selectedByType).map(([t, c]) => `<div class="s-card"><h3>${c}</h3><p>${TYPE_CONFIG[t]?.label || t}</p></div>`).join('')}
        </div>
        <table><thead><tr><th>#</th><th>Tipo</th><th>Item</th><th>Detalhe</th><th>Prioridade</th><th>Custo (R$)</th><th>Origem</th></tr></thead>
        <tbody>${selected.map((i, idx) => `<tr><td>${idx + 1}</td><td>${TYPE_CONFIG[i.type]?.label || i.type}</td><td>${i.title}</td><td>${i.subtitle}</td><td>${i.priority}</td><td>${i.cost.toFixed(2)}</td><td>${i.source}</td></tr>`).join('')}
        <tr class="total-row"><td colspan="5">TOTAL</td><td>R$ ${selectedCost.toFixed(2)}</td><td></td></tr></tbody></table></body></html>`;
      const win = window.open('', '_blank');
      if (win) { win.document.write(html); win.document.close(); win.print(); }
      toast.success('PDF gerado!');
    }
  };

  return (
    <AppLayout>
      <div className="container mx-auto px-3 py-4 space-y-5 max-w-7xl sm:px-6 sm:py-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary shadow-premium">
              <LayoutDashboard className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground tracking-tight sm:text-2xl">Central de Planejamento</h1>
              <p className="text-xs text-muted-foreground sm:text-sm">
                {actionableItems.length} itens • {assets.length} equip. • {partsCatalog.length} peças • {servicesCatalog.length} serviços
              </p>
            </div>
          </div>
        </div>

        {/* KPI Row */}
        <div className="grid grid-cols-3 gap-2 lg:grid-cols-6 sm:gap-3">
          {[
            { icon: ClipboardList, value: kpis.osAbertas, label: 'OS Abertas', cls: 'status-aberto' },
            { icon: Clock, value: kpis.osAndamento, label: 'Em Andamento', cls: 'status-em-andamento' },
            { icon: CheckCircle2, value: kpis.osFechadas, label: 'Fechadas', cls: 'status-fechado' },
            { icon: AlertTriangle, value: kpis.lowStockCount, label: 'Estoque Baixo', cls: 'priority-critica' },
            { icon: DollarSign, value: `R$ ${kpis.totalCost.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`, label: 'Custo Total', cls: '' },
            { icon: TrendingUp, value: kpis.avgResolutionTime, label: 'MTTR (min)', cls: '' },
          ].map((kpi, idx) => (
            <Card key={idx} className="card-elevated">
              <CardContent className="p-3 text-center sm:p-4">
                <kpi.icon className="mx-auto h-4 w-4 sm:h-5 sm:w-5 mb-1.5 text-muted-foreground" />
                <p className="text-lg font-bold text-foreground sm:text-2xl tracking-tight">{kpi.value}</p>
                <p className="text-[10px] text-muted-foreground sm:text-[11px] uppercase tracking-wider mt-0.5">{kpi.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="planner" className="space-y-4">
          <TabsList className="w-full h-auto gap-1 p-1 bg-secondary/60">
            <TabsTrigger value="planner" className="flex-1 min-w-[90px] text-xs sm:text-sm data-[state=active]:bg-card data-[state=active]:shadow-premium">
              <ClipboardList className="h-3.5 w-3.5 mr-1 sm:mr-1.5" />
              <span className="hidden xs:inline">Gerador de</span> Plano
            </TabsTrigger>
            <TabsTrigger value="history" className="flex-1 min-w-[90px] text-xs sm:text-sm data-[state=active]:bg-card data-[state=active]:shadow-premium">
              <Calendar className="h-3.5 w-3.5 mr-1 sm:mr-1.5" />
              Histórico
            </TabsTrigger>
            <TabsTrigger value="stock" className="flex-1 min-w-[90px] text-xs sm:text-sm data-[state=active]:bg-card data-[state=active]:shadow-premium">
              <Package className="h-3.5 w-3.5 mr-1 sm:mr-1.5" />
              Estoque
            </TabsTrigger>
          </TabsList>

          {/* === PLANNER === */}
          <TabsContent value="planner" className="space-y-4">
            {/* Plan Type Selector */}
            <Card className="card-elevated overflow-hidden">
              <CardHeader className="pb-3 px-4 pt-4 sm:px-6">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-muted-foreground" />
                  <CardTitle className="text-sm font-semibold">Tipo de Planejamento</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="px-4 pb-4 sm:px-6">
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
                  {PLAN_TYPES.map((pt) => {
                    const Icon = pt.icon;
                    const isActive = planType === pt.value;
                    return (
                      <button
                        key={pt.value}
                        onClick={() => setPlanType(pt.value)}
                        className={`group relative flex flex-col items-center gap-1.5 rounded-lg border p-3 text-center transition-all sm:p-4 ${
                          isActive
                            ? 'border-primary bg-primary/5 ring-1 ring-primary/20 shadow-premium'
                            : 'border-border/60 bg-card hover:border-border hover:shadow-premium'
                        }`}
                      >
                        <div className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${
                          isActive ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary'
                        }`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <span className={`text-xs font-medium leading-tight ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {pt.label}
                        </span>
                        <span className="text-[10px] text-muted-foreground leading-tight hidden sm:block">
                          {pt.description}
                        </span>
                        {isActive && (
                          <div className="absolute -top-px left-0 right-0 h-0.5 rounded-full bg-primary" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Plan Config */}
            <Card className="card-elevated">
              <CardHeader className="pb-2 px-4 pt-4 sm:px-6">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <CardTitle className="text-sm font-semibold">Configurar Plano</CardTitle>
                  {selectedPlanType && (
                    <Badge variant="secondary" className="text-[10px] ml-auto">
                      {selectedPlanType.label}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-2.5 px-4 pb-4 sm:px-6">
                <Input
                  placeholder={`Título (ex: ${selectedPlanType?.label || 'Plano de Ação'} Q1 2026)`}
                  value={planTitle}
                  onChange={(e) => setPlanTitle(e.target.value)}
                  className="bg-background/60"
                />
                <Textarea
                  placeholder="Observações, justificativas e notas adicionais..."
                  value={planNotes}
                  onChange={(e) => setPlanNotes(e.target.value)}
                  rows={2}
                  className="resize-none bg-background/60"
                />
              </CardContent>
            </Card>

            {/* Filters */}
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Buscar por nome, código, setor, fornecedor..." className="pl-9 bg-card" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full sm:w-44 bg-card">
                  <Filter className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
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
                <SelectTrigger className="w-full sm:w-36 bg-card">
                  <SelectValue placeholder="Prioridade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="CRITICA">Crítica</SelectItem>
                  <SelectItem value="ALTA">Alta</SelectItem>
                  <SelectItem value="MEDIA">Média</SelectItem>
                  <SelectItem value="BAIXA">Baixa</SelectItem>
                  <SelectItem value="INFO">Info</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Quick select */}
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(TYPE_CONFIG).map(([key, cfg]) => {
                const count = typeCounts[key] || 0;
                if (count === 0) return null;
                const Icon = cfg.icon;
                return (
                  <Button key={key} variant="outline" size="sm" className="text-[11px] h-7 px-2.5 border-border/60" onClick={() => selectByType(key)}>
                    <Icon className="h-3 w-3 mr-1" />
                    + {cfg.label} ({count})
                  </Button>
                );
              })}
            </div>

            {/* Selection Summary */}
            <Card className="card-elevated border-primary/20 bg-primary/[0.03]">
              <CardContent className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-foreground">
                    {selectedActions.length} <span className="font-normal text-muted-foreground">de</span> {filteredItems.length}
                  </span>
                  <Badge variant="outline" className="font-mono text-xs">
                    <DollarSign className="h-3 w-3 mr-0.5" />
                    R$ {selectedCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </Badge>
                  {Object.entries(selectedByType).map(([t, c]) => (
                    <Badge key={t} variant="secondary" className="text-[10px]">{TYPE_CONFIG[t]?.label}: {c}</Badge>
                  ))}
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  <Button variant="outline" size="sm" className="text-[11px] h-7" onClick={selectAll}>Selecionar Todos</Button>
                  <Button variant="outline" size="sm" className="text-[11px] h-7" onClick={clearAll}>Limpar</Button>
                  <Button size="sm" className="text-[11px] h-7" onClick={() => exportPlan('csv')}>
                    <FileDown className="h-3 w-3 mr-1" /> Excel
                  </Button>
                  <Button size="sm" className="text-[11px] h-7" onClick={() => exportPlan('pdf')}>
                    <FileDown className="h-3 w-3 mr-1" /> PDF
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Items */}
            <ScrollArea className="max-h-[600px]">
              <div className="space-y-1.5">
                {filteredItems.map((item) => {
                  const cfg = TYPE_CONFIG[item.type];
                  const Icon = cfg?.icon || Box;
                  const isExpanded = expandedItem === item.id;
                  const isSelected = selectedActions.includes(item.id);

                  return (
                    <Card
                      key={item.id}
                      className={`transition-all duration-150 ${
                        isSelected ? 'card-elevated border-primary/30 ring-1 ring-primary/20' : 'card-elevated'
                      }`}
                    >
                      <CardContent className="p-0">
                        <div className="flex items-start gap-2.5 p-3 cursor-pointer sm:p-4 sm:gap-3" onClick={() => toggleAction(item.id)}>
                          <Checkbox checked={isSelected} onCheckedChange={() => toggleAction(item.id)} className="mt-1 shrink-0" />
                          <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                            isSelected ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'
                          } transition-colors`}>
                            <Icon className="h-3.5 w-3.5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-1 mb-0.5">
                              <span className={`${cfg?.cssClass || 'status-badge bg-muted text-muted-foreground'} !text-[9px] !px-1.5 !py-0`}>
                                {cfg?.label || item.type}
                              </span>
                              <span className={`priority-badge !text-[9px] !px-1.5 !py-0 ${
                                item.priority === 'CRITICA' ? 'priority-critica' :
                                item.priority === 'ALTA' ? 'priority-alta' :
                                item.priority === 'MEDIA' ? 'priority-media' : 'priority-baixa'
                              }`}>
                                {item.priority}
                              </span>
                              <span className="text-[9px] text-muted-foreground hidden sm:inline ml-1">{item.source}</span>
                            </div>
                            <p className="text-sm font-medium text-foreground truncate leading-tight">{item.title}</p>
                            <p className="text-[11px] text-muted-foreground truncate mt-0.5">{item.subtitle}</p>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {item.cost > 0 && (
                              <span className="text-xs font-semibold text-foreground hidden sm:block font-mono">
                                R$ {item.cost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </span>
                            )}
                            <button
                              className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-secondary transition-colors"
                              onClick={(e) => { e.stopPropagation(); setExpandedItem(isExpanded ? null : item.id); }}
                            >
                              <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} />
                            </button>
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="border-t border-border/50 bg-secondary/30 px-4 py-3 sm:px-6 animate-fade-in">
                            {item.cost > 0 && (
                              <p className="text-sm font-semibold text-foreground mb-2 sm:hidden font-mono">
                                R$ {item.cost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </p>
                            )}
                            <div className="grid grid-cols-1 gap-x-8 gap-y-1.5 sm:grid-cols-2 lg:grid-cols-3">
                              {Object.entries(item.details).map(([key, val]) => (
                                <div key={key} className="flex items-baseline gap-2 py-0.5">
                                  <span className="text-[11px] font-semibold text-muted-foreground whitespace-nowrap uppercase tracking-wider">{key}</span>
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
                  <div className="flex flex-col items-center py-16 text-center">
                    <Eye className="h-10 w-10 text-muted-foreground/20 mb-3" />
                    <p className="text-sm text-muted-foreground">Nenhum item encontrado</p>
                    <Button variant="link" size="sm" className="text-xs mt-1" onClick={() => { setSearchTerm(''); setTypeFilter('all'); setPriorityFilter('all'); }}>
                      Limpar filtros
                    </Button>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* === HISTORY === */}
          <TabsContent value="history" className="space-y-4">
            <Card className="card-elevated">
              <CardHeader className="pb-2 px-4 sm:px-6">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  Histórico de OS ({workOrders.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 sm:px-6">
                <div className="overflow-x-auto -mx-4 sm:-mx-6">
                  <table className="w-full text-sm min-w-[500px]">
                    <thead>
                      <tr className="border-b border-border">
                        {['Protocolo', 'Equipamento', 'Setor', 'Status', 'Prioridade', 'Data'].map((h, i) => (
                          <th key={h} className={`pb-2.5 px-4 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider text-left ${i >= 2 && i < 4 ? 'hidden sm:table-cell' : ''} ${i >= 4 ? 'hidden md:table-cell' : ''}`}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {workOrders.slice(0, 50).map((o: any) => (
                        <tr key={o.id} className="border-b border-border/30 hover:bg-secondary/30 transition-colors">
                          <td className="py-2.5 px-4 font-mono text-xs font-medium">{o.protocolo}</td>
                          <td className="py-2.5 px-4 text-xs">{o.assets?.nome || '-'}</td>
                          <td className="py-2.5 px-4 text-xs hidden sm:table-cell">{o.setor}</td>
                          <td className="py-2.5 px-4">
                            <span className={`status-badge !text-[10px] ${
                              o.status === 'ABERTO' ? 'status-aberto' :
                              o.status === 'EM_ANDAMENTO' ? 'status-em-andamento' : 'status-fechado'
                            }`}>{o.status.replace('_', ' ')}</span>
                          </td>
                          <td className="py-2.5 px-4 hidden md:table-cell">
                            <span className={`priority-badge !text-[10px] ${
                              o.prioridade === 'CRITICA' ? 'priority-critica' :
                              o.prioridade === 'ALTA' ? 'priority-alta' :
                              o.prioridade === 'MEDIA' ? 'priority-media' : 'priority-baixa'
                            }`}>{o.prioridade}</span>
                          </td>
                          <td className="py-2.5 px-4 text-xs text-muted-foreground hidden md:table-cell">
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

          {/* === STOCK === */}
          <TabsContent value="stock" className="space-y-4">
            <Card className="card-elevated">
              <CardHeader className="pb-2 px-4 sm:px-6">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  Estoque Crítico ({kpis.lowStockParts.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 sm:px-6">
                <div className="overflow-x-auto -mx-4 sm:-mx-6">
                  <table className="w-full text-sm min-w-[400px]">
                    <thead>
                      <tr className="border-b border-border">
                        {['Peça', 'Código', 'Atual', 'Mínimo', 'Fornecedor', 'Valor'].map((h, i) => (
                          <th key={h} className={`pb-2.5 px-4 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider text-left ${i >= 4 ? 'hidden sm:table-cell' : ''}`}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {kpis.lowStockParts.map((p: any) => (
                        <tr key={p.id} className="border-b border-border/30 hover:bg-secondary/30 transition-colors">
                          <td className="py-2.5 px-4 text-xs font-medium">{p.nome}</td>
                          <td className="py-2.5 px-4 font-mono text-xs">{p.codigo_interno || '-'}</td>
                          <td className="py-2.5 px-4">
                            <span className={`priority-badge !text-[10px] ${p.estoque_atual === 0 ? 'priority-critica' : 'priority-alta'}`}>
                              {p.estoque_atual}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 text-xs">{p.estoque_minimo}</td>
                          <td className="py-2.5 px-4 text-xs hidden sm:table-cell">{p.fornecedor_padrao || '-'}</td>
                          <td className="py-2.5 px-4 text-xs font-mono hidden sm:table-cell">R$ {(p.valor_medio || 0).toFixed(2)}</td>
                        </tr>
                      ))}
                      {kpis.lowStockParts.length === 0 && (
                        <tr>
                          <td colSpan={6} className="py-12 text-center">
                            <CheckCircle2 className="mx-auto h-8 w-8 text-success/30 mb-2" />
                            <p className="text-xs text-muted-foreground">Estoques dentro do nível seguro</p>
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
