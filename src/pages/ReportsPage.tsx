import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ArrowLeft,
  Clock,
  DollarSign,
  Wrench,
  Package,
  TrendingUp,
  Download,
  BarChart3,
  Calendar,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

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

const prioridadeLabels: Record<string, string> = {
  BAIXA: 'Baixa',
  MEDIA: 'Média',
  ALTA: 'Alta',
  CRITICA: 'Crítica',
};

const ReportsPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ReportData | null>(null);

  const [filters, setFilters] = useState({
    dataInicio: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    dataFim: new Date().toISOString().split('T')[0],
    setor: 'todos',
    prioridade: 'todos',
  });

  useEffect(() => {
    fetchReportData();
  }, [filters]);

  const fetchReportData = async () => {
    setLoading(true);

    try {
      // Fetch work orders
      let query = supabase
        .from('work_orders')
        .select('*, parts_used(*)')
        .gte('created_at', filters.dataInicio)
        .lte('created_at', filters.dataFim + 'T23:59:59');

      if (filters.setor !== 'todos') {
        query = query.eq('setor', filters.setor);
      }
      if (filters.prioridade !== 'todos') {
        query = query.eq('prioridade', filters.prioridade as 'BAIXA' | 'MEDIA' | 'ALTA' | 'CRITICA');
      }

      const { data: workOrders, error: woError } = await query;
      if (woError) throw woError;

      // Fetch services executed
      const { data: servicesExecuted, error: seError } = await supabase
        .from('services_executed')
        .select('*');
      if (seError) throw seError;

      // Fetch parts used
      const { data: partsUsed, error: puError } = await supabase
        .from('parts_used')
        .select('*, parts_catalog(nome)');
      if (puError) throw puError;

      // Calculate metrics
      const osFechadas = workOrders?.filter((o) => o.status === 'FECHADO') || [];
      const osAbertas = workOrders?.filter((o) => o.status === 'ABERTO') || [];
      const osEmAndamento = workOrders?.filter((o) => o.status === 'EM_ANDAMENTO') || [];

      // MTTR calculation
      const temposReparo = osFechadas
        .filter((o) => o.tempo_total_minutos)
        .map((o) => o.tempo_total_minutos!);
      const mttrMinutos =
        temposReparo.length > 0
          ? Math.round(temposReparo.reduce((a, b) => a + b, 0) / temposReparo.length)
          : 0;

      // Cost calculation
      const custoTotal = (partsUsed || []).reduce(
        (total, part) => total + (part.valor_total || 0),
        0
      );

      // Parts most used
      const pecasCount: Record<string, number> = {};
      (partsUsed || []).forEach((part) => {
        const nome = (part as any).parts_catalog?.nome || part.item;
        pecasCount[nome] = (pecasCount[nome] || 0) + part.quantidade;
      });
      const pecasMaisUsadas = Object.entries(pecasCount)
        .map(([nome, quantidade]) => ({ nome, quantidade }))
        .sort((a, b) => b.quantidade - a.quantidade)
        .slice(0, 5);

      // Services most executed
      const servicosCount: Record<string, number> = {};
      (servicesExecuted || []).forEach((service) => {
        servicosCount[service.nome_servico] = (servicosCount[service.nome_servico] || 0) + 1;
      });
      const servicosMaisExecutados = Object.entries(servicosCount)
        .map(([nome, quantidade]) => ({ nome, quantidade }))
        .sort((a, b) => b.quantidade - a.quantidade)
        .slice(0, 5);

      // OS by sector
      const setorCount: Record<string, number> = {};
      (workOrders || []).forEach((wo) => {
        setorCount[wo.setor] = (setorCount[wo.setor] || 0) + 1;
      });
      const osPorSetor = Object.entries(setorCount)
        .map(([setor, quantidade]) => ({ setor, quantidade }))
        .sort((a, b) => b.quantidade - a.quantidade);

      // OS by priority
      const prioridadeCount: Record<string, number> = {};
      (workOrders || []).forEach((wo) => {
        prioridadeCount[wo.prioridade] = (prioridadeCount[wo.prioridade] || 0) + 1;
      });
      const osPorPrioridade = Object.entries(prioridadeCount).map(([prioridade, quantidade]) => ({
        prioridade: prioridadeLabels[prioridade] || prioridade,
        quantidade,
      }));

      setData({
        totalOs: workOrders?.length || 0,
        osFechadas: osFechadas.length,
        osAbertas: osAbertas.length,
        osEmAndamento: osEmAndamento.length,
        mttrMinutos,
        custoTotal,
        pecasMaisUsadas,
        servicosMaisExecutados,
        osPorSetor,
        osPorPrioridade,
      });
    } catch (error) {
      console.error('Error fetching report data:', error);
      toast.error('Erro ao carregar dados do relatório');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  };

  const handleExport = () => {
    if (!data) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) { toast.error('Permita popups para gerar o PDF'); return; }
    printWindow.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Relatório de Manutenção</title><style>body{font-family:Arial,sans-serif;margin:20px;color:#333}.header{text-align:center;border-bottom:2px solid #e60012;padding-bottom:20px;margin-bottom:20px}.header h1{color:#e60012;margin:0}.kpi-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:24px}.kpi{border:1px solid #ddd;border-radius:8px;padding:16px;text-align:center}.kpi .value{font-size:24px;font-weight:bold;color:#e60012}.kpi .label{font-size:12px;color:#666}table{width:100%;border-collapse:collapse;margin-top:16px}th,td{border:1px solid #ddd;padding:8px;text-align:left;font-size:12px}th{background:#e60012;color:white}@media print{body{margin:0}}</style></head><body>
    <div class="header"><h1>Relatório de Manutenção</h1><p>Período: ${filters.dataInicio} a ${filters.dataFim}</p></div>
    <div class="kpi-grid">
      <div class="kpi"><div class="value">${data.totalOs}</div><div class="label">Total OS</div></div>
      <div class="kpi"><div class="value">${data.osFechadas}</div><div class="label">Fechadas</div></div>
      <div class="kpi"><div class="value">${formatTime(data.mttrMinutos)}</div><div class="label">MTTR</div></div>
      <div class="kpi"><div class="value">R$ ${data.custoTotal.toLocaleString('pt-BR',{minimumFractionDigits:2})}</div><div class="label">Custo Total</div></div>
    </div>
    ${data.pecasMaisUsadas.length > 0 ? `<h3>Peças Mais Utilizadas</h3><table><tr><th>Peça</th><th>Quantidade</th></tr>${data.pecasMaisUsadas.map(p=>`<tr><td>${p.nome}</td><td>${p.quantidade}</td></tr>`).join('')}</table>` : ''}
    ${data.osPorSetor.length > 0 ? `<h3>OS por Setor</h3><table><tr><th>Setor</th><th>Quantidade</th></tr>${data.osPorSetor.map(s=>`<tr><td>${s.setor}</td><td>${s.quantidade}</td></tr>`).join('')}</table>` : ''}
    <script>window.onload=function(){window.print()}</script></body></html>`);
    printWindow.document.close();
    toast.success('PDF gerado!');
  };

  return (
    <div className="min-h-screen bg-background pb-8">
      <Header />

      <main className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-semibold text-foreground">
                Relatórios de Manutenção
              </h1>
              <p className="text-sm text-muted-foreground">
                Indicadores e análises de desempenho
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExport} className="gap-2">
              <Download className="h-4 w-4" />
              Exportar PDF
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-wrap gap-4 rounded-lg border border-border bg-card p-4">
          <div className="grid gap-2">
            <Label>Data Início</Label>
            <Input
              type="date"
              value={filters.dataInicio}
              onChange={(e) => setFilters({ ...filters, dataInicio: e.target.value })}
              className="w-40"
            />
          </div>
          <div className="grid gap-2">
            <Label>Data Fim</Label>
            <Input
              type="date"
              value={filters.dataFim}
              onChange={(e) => setFilters({ ...filters, dataFim: e.target.value })}
              className="w-40"
            />
          </div>
          <div className="grid gap-2">
            <Label>Setor</Label>
            <Select
              value={filters.setor}
              onValueChange={(value) => setFilters({ ...filters, setor: value })}
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="Produção">Produção</SelectItem>
                <SelectItem value="Estamparia">Estamparia</SelectItem>
                <SelectItem value="Soldagem">Soldagem</SelectItem>
                <SelectItem value="Pintura">Pintura</SelectItem>
                <SelectItem value="Montagem">Montagem</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Prioridade</Label>
            <Select
              value={filters.prioridade}
              onValueChange={(value) => setFilters({ ...filters, prioridade: value })}
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas</SelectItem>
                <SelectItem value="BAIXA">Baixa</SelectItem>
                <SelectItem value="MEDIA">Média</SelectItem>
                <SelectItem value="ALTA">Alta</SelectItem>
                <SelectItem value="CRITICA">Crítica</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">Carregando dados...</p>
          </div>
        ) : data ? (
          <>
            {/* KPI Cards */}
            <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total de OS</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{data.totalOs}</div>
                  <p className="text-xs text-muted-foreground">
                    {data.osAbertas} abertas • {data.osEmAndamento} em andamento
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">OS Fechadas</CardTitle>
                  <TrendingUp className="h-4 w-4 text-success" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-success">{data.osFechadas}</div>
                  <p className="text-xs text-muted-foreground">
                    {data.totalOs > 0
                      ? Math.round((data.osFechadas / data.totalOs) * 100)
                      : 0}
                    % de resolução
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">MTTR</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatTime(data.mttrMinutos)}</div>
                  <p className="text-xs text-muted-foreground">
                    Tempo médio de reparo
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Custo Total</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    R$ {data.custoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Em peças utilizadas
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            <div className="grid gap-6 lg:grid-cols-2">
              {/* OS por Setor */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">OS por Setor</CardTitle>
                  <CardDescription>Distribuição de chamados por área</CardDescription>
                </CardHeader>
                <CardContent>
                  {data.osPorSetor.length > 0 ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={data.osPorSetor}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis
                          dataKey="setor"
                          className="text-xs"
                          tick={{ fill: 'hsl(var(--muted-foreground))' }}
                        />
                        <YAxis
                          className="text-xs"
                          tick={{ fill: 'hsl(var(--muted-foreground))' }}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                          }}
                        />
                        <Bar dataKey="quantidade" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex h-[250px] items-center justify-center text-muted-foreground">
                      Sem dados para exibir
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* OS por Prioridade */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">OS por Prioridade</CardTitle>
                  <CardDescription>Classificação por nível de urgência</CardDescription>
                </CardHeader>
                <CardContent>
                  {data.osPorPrioridade.length > 0 ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={data.osPorPrioridade}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={4}
                          dataKey="quantidade"
                          nameKey="prioridade"
                          label={({ prioridade, quantidade }) => `${prioridade}: ${quantidade}`}
                        >
                          {data.osPorPrioridade.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex h-[250px] items-center justify-center text-muted-foreground">
                      Sem dados para exibir
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Peças Mais Usadas */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Package className="h-4 w-4" />
                    Peças Mais Utilizadas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {data.pecasMaisUsadas.length > 0 ? (
                    <div className="space-y-4">
                      {data.pecasMaisUsadas.map((peca, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div
                              className="h-3 w-3 rounded-full"
                              style={{ backgroundColor: COLORS[index % COLORS.length] }}
                            />
                            <span className="text-sm text-foreground">{peca.nome}</span>
                          </div>
                          <span className="font-medium">{peca.quantidade} un</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex h-[200px] items-center justify-center text-muted-foreground">
                      Sem dados para exibir
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Serviços Mais Executados */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Wrench className="h-4 w-4" />
                    Serviços Mais Executados
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {data.servicosMaisExecutados.length > 0 ? (
                    <div className="space-y-4">
                      {data.servicosMaisExecutados.map((servico, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div
                              className="h-3 w-3 rounded-full"
                              style={{ backgroundColor: COLORS[index % COLORS.length] }}
                            />
                            <span className="text-sm text-foreground">{servico.nome}</span>
                          </div>
                          <span className="font-medium">{servico.quantidade}x</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex h-[200px] items-center justify-center text-muted-foreground">
                      Sem dados para exibir
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        ) : null}
      </main>
    </div>
  );
};

export default ReportsPage;
