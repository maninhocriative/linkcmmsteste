import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Clock, DollarSign, Wrench, Package, TrendingUp, Download, BarChart3, Search } from 'lucide-react';
import { toast } from 'sonner';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface ReportData {
  totalOs: number;
  osFechadas: number;
  osAbertas: number;
  osEmAndamento: number;
  mttrMinutos: number;
  custoTotal: number;
  pecasMaisUsadas: { nome: string; quantidade: number }[];
  servicosMaisExecutados: { nome: string; quantidade: number }[];
  osPorSetor: { setor: string; quantidade: number }[];
  osPorPrioridade: { prioridade: string; quantidade: number }[];
}

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
const prioridadeLabels: Record<string, string> = { BAIXA: 'Baixa', MEDIA: 'Média', ALTA: 'Alta', CRITICA: 'Crítica' };

const ReportsPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ReportData | null>(null);
  const [filters, setFilters] = useState({
    dataInicio: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    dataFim: new Date().toISOString().split('T')[0],
    setor: 'todos',
    prioridade: 'todos',
  });

  const fetchReportData = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('work_orders')
        .select('*, parts_used(*)')
        .gte('created_at', filters.dataInicio)
        .lte('created_at', filters.dataFim + 'T23:59:59');

      if (filters.setor !== 'todos') query = query.eq('setor', filters.setor);
      if (filters.prioridade !== 'todos') query = query.eq('prioridade', filters.prioridade as any);

      const { data: workOrders } = await query;
      const { data: servicesExecuted } = await supabase.from('services_executed').select('*');
      const { data: partsUsed } = await supabase.from('parts_used').select('*, parts_catalog(nome)');

      const osFechadas = workOrders?.filter(o => o.status === 'FECHADO') || [];
      const osAbertas = workOrders?.filter(o => o.status === 'ABERTO') || [];
      const osEmAndamento = workOrders?.filter(o => o.status === 'EM_ANDAMENTO') || [];

      const temposReparo = osFechadas.filter(o => o.tempo_total_minutos).map(o => o.tempo_total_minutos!);
      const mttrMinutos = temposReparo.length > 0 ? Math.round(temposReparo.reduce((a, b) => a + b, 0) / temposReparo.length) : 0;
      const custoTotal = (partsUsed || []).reduce((total, part) => total + (part.valor_total || 0), 0);

      const pecasCount: Record<string, number> = {};
      (partsUsed || []).forEach(part => {
        const nome = (part as any).parts_catalog?.nome || part.item;
        pecasCount[nome] = (pecasCount[nome] || 0) + part.quantidade;
      });
      const pecasMaisUsadas = Object.entries(pecasCount).map(([nome, quantidade]) => ({ nome, quantidade })).sort((a, b) => b.quantidade - a.quantidade).slice(0, 5);

      const servicosCount: Record<string, number> = {};
      (servicesExecuted || []).forEach(s => { servicosCount[s.nome_servico] = (servicosCount[s.nome_servico] || 0) + 1; });
      const servicosMaisExecutados = Object.entries(servicosCount).map(([nome, quantidade]) => ({ nome, quantidade })).sort((a, b) => b.quantidade - a.quantidade).slice(0, 5);

      const setorCount: Record<string, number> = {};
      (workOrders || []).forEach(wo => { setorCount[wo.setor] = (setorCount[wo.setor] || 0) + 1; });
      const osPorSetor = Object.entries(setorCount).map(([setor, quantidade]) => ({ setor, quantidade })).sort((a, b) => b.quantidade - a.quantidade);

      const prioridadeCount: Record<string, number> = {};
      (workOrders || []).forEach(wo => { prioridadeCount[wo.prioridade] = (prioridadeCount[wo.prioridade] || 0) + 1; });
      const osPorPrioridade = Object.entries(prioridadeCount).map(([prioridade, quantidade]) => ({ prioridade: prioridadeLabels[prioridade] || prioridade, quantidade }));

      setData({ totalOs: workOrders?.length || 0, osFechadas: osFechadas.length, osAbertas: osAbertas.length, osEmAndamento: osEmAndamento.length, mttrMinutos, custoTotal, pecasMaisUsadas, servicosMaisExecutados, osPorSetor, osPorPrioridade });
    } catch (error) {
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  };

  const handleExport = () => {
    if (!data) return;
    const w = window.open('', '_blank');
    if (!w) { toast.error('Permita popups'); return; }
    w.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Relatório</title><style>body{font-family:Arial,sans-serif;margin:20px}.header{text-align:center;border-bottom:2px solid #e60012;padding-bottom:20px;margin-bottom:20px}.header h1{color:#e60012}.kpi-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:24px}.kpi{border:1px solid #ddd;border-radius:8px;padding:16px;text-align:center}.kpi .value{font-size:24px;font-weight:bold;color:#e60012}.kpi .label{font-size:12px;color:#666}table{width:100%;border-collapse:collapse;margin-top:16px}th,td{border:1px solid #ddd;padding:8px;font-size:12px}th{background:#e60012;color:white}</style></head><body>
    <div class="header"><h1>Relatório de Manutenção</h1><p>Período: ${filters.dataInicio} a ${filters.dataFim}</p></div>
    <div class="kpi-grid">
      <div class="kpi"><div class="value">${data.totalOs}</div><div class="label">Total OS</div></div>
      <div class="kpi"><div class="value">${data.osFechadas}</div><div class="label">Fechadas</div></div>
      <div class="kpi"><div class="value">${formatTime(data.mttrMinutos)}</div><div class="label">MTTR</div></div>
      <div class="kpi"><div class="value">R$ ${data.custoTotal.toLocaleString('pt-BR',{minimumFractionDigits:2})}</div><div class="label">Custo Total</div></div>
    </div>
    ${data.osPorSetor.length > 0 ? `<h3>OS por Setor</h3><table><tr><th>Setor</th><th>Quantidade</th></tr>${data.osPorSetor.map(s=>`<tr><td>${s.setor}</td><td>${s.quantidade}</td></tr>`).join('')}</table>` : ''}
    <script>window.onload=function(){window.print()}</script></body></html>`);
    w.document.close();
  };

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-foreground">Relatórios de Manutenção</h1>
              <p className="text-xs text-muted-foreground">Indicadores e análises de desempenho</p>
            </div>
          </div>
          <Button variant="outline" onClick={handleExport} disabled={!data} className="gap-2 h-8 text-xs">
            <Download className="h-3.5 w-3.5" />
            Exportar PDF
          </Button>
        </div>

        {/* Filters */}
        <div className="mb-5 flex flex-wrap items-end gap-3 rounded-xl border border-border bg-card p-4">
          <div className="grid gap-1.5">
            <Label className="text-xs">Data Início</Label>
            <Input type="date" value={filters.dataInicio} onChange={e => setFilters(p => ({ ...p, dataInicio: e.target.value }))} className="h-8 w-36 text-xs" />
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs">Data Fim</Label>
            <Input type="date" value={filters.dataFim} onChange={e => setFilters(p => ({ ...p, dataFim: e.target.value }))} className="h-8 w-36 text-xs" />
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs">Setor</Label>
            <Select value={filters.setor} onValueChange={v => setFilters(p => ({ ...p, setor: v }))}>
              <SelectTrigger className="h-8 w-36 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="Produção">Produção</SelectItem>
                <SelectItem value="Estamparia">Estamparia</SelectItem>
                <SelectItem value="Soldagem">Soldagem</SelectItem>
                <SelectItem value="Pintura">Pintura</SelectItem>
                <SelectItem value="Montagem">Montagem</SelectItem>
                <SelectItem value="Usinagem">Usinagem</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs">Prioridade</Label>
            <Select value={filters.prioridade} onValueChange={v => setFilters(p => ({ ...p, prioridade: v }))}>
              <SelectTrigger className="h-8 w-36 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas</SelectItem>
                <SelectItem value="BAIXA">Baixa</SelectItem>
                <SelectItem value="MEDIA">Média</SelectItem>
                <SelectItem value="ALTA">Alta</SelectItem>
                <SelectItem value="CRITICA">Crítica</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={fetchReportData} disabled={loading} className="h-8 gap-2 text-xs">
            <Search className="h-3.5 w-3.5" />
            {loading ? 'Buscando...' : 'Buscar'}
          </Button>
        </div>

        {!data && !loading && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <BarChart3 className="h-12 w-12 text-muted-foreground/30 mb-3" />
            <p className="text-sm font-medium text-muted-foreground">Clique em "Buscar" para carregar os relatórios</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Selecione o período e filtros desejados</p>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-3">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <p className="text-sm text-muted-foreground">Carregando dados...</p>
            </div>
          </div>
        )}

        {data && !loading && (
          <>
            {/* KPI Cards */}
            <div className="mb-5 grid gap-3 grid-cols-2 lg:grid-cols-4">
              {[
                { label: 'Total de OS', value: data.totalOs, sub: `${data.osAbertas} abertas · ${data.osEmAndamento} em andamento`, icon: BarChart3, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                { label: 'OS Fechadas', value: data.osFechadas, sub: `${data.totalOs > 0 ? Math.round((data.osFechadas / data.totalOs) * 100) : 0}% de resolução`, icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                { label: 'MTTR', value: formatTime(data.mttrMinutos), sub: 'Tempo médio de reparo', icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10' },
                { label: 'Custo Total', value: `R$ ${data.custoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, sub: 'Em peças utilizadas', icon: DollarSign, color: 'text-purple-500', bg: 'bg-purple-500/10' },
              ].map((kpi, i) => (
                <Card key={i} className="border-border/60">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">{kpi.label}</p>
                        <p className="mt-1 text-2xl font-bold text-foreground">{kpi.value}</p>
                        <p className="mt-0.5 text-[11px] text-muted-foreground/70">{kpi.sub}</p>
                      </div>
                      <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${kpi.bg}`}>
                        <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Charts */}
            <div className="grid gap-4 lg:grid-cols-2">
              <Card className="border-border/60">
                <CardHeader className="pb-2 pt-4 px-4">
                  <CardTitle className="text-sm font-semibold">OS por Setor</CardTitle>
                  <CardDescription className="text-xs">Distribuição de chamados por área</CardDescription>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  {data.osPorSetor.length > 0 ? (
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={data.osPorSetor}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="setor" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                        <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                        <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
                        <Bar dataKey="quantidade" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex h-[220px] items-center justify-center text-xs text-muted-foreground">Sem dados</div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-border/60">
                <CardHeader className="pb-2 pt-4 px-4">
                  <CardTitle className="text-sm font-semibold">OS por Prioridade</CardTitle>
                  <CardDescription className="text-xs">Classificação por nível de urgência</CardDescription>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  {data.osPorPrioridade.length > 0 ? (
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie data={data.osPorPrioridade} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={4} dataKey="quantidade" nameKey="prioridade" label={({ prioridade, quantidade }) => `${prioridade}: ${quantidade}`} labelLine={false}>
                          {data.osPorPrioridade.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex h-[220px] items-center justify-center text-xs text-muted-foreground">Sem dados</div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-border/60">
                <CardHeader className="pb-2 pt-4 px-4">
                  <CardTitle className="flex items-center gap-2 text-sm font-semibold"><Package className="h-4 w-4" />Peças Mais Utilizadas</CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  {data.pecasMaisUsadas.length > 0 ? (
                    <div className="space-y-2.5">
                      {data.pecasMaisUsadas.map((p, i) => (
                        <div key={i} className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                            <span className="text-xs text-foreground">{p.nome}</span>
                          </div>
                          <span className="text-xs font-semibold">{p.quantidade} un</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex h-24 items-center justify-center text-xs text-muted-foreground">Sem dados</div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-border/60">
                <CardHeader className="pb-2 pt-4 px-4">
                  <CardTitle className="flex items-center gap-2 text-sm font-semibold"><Wrench className="h-4 w-4" />Serviços Mais Executados</CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  {data.servicosMaisExecutados.length > 0 ? (
                    <div className="space-y-2.5">
                      {data.servicosMaisExecutados.map((s, i) => (
                        <div key={i} className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                            <span className="text-xs text-foreground">{s.nome}</span>
                          </div>
                          <span className="text-xs font-semibold">{s.quantidade}x</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex h-24 items-center justify-center text-xs text-muted-foreground">Sem dados</div>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
};

export default ReportsPage;
