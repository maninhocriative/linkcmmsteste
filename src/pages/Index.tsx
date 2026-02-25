import React from 'react';
import { Link } from 'react-router-dom';
import { QrCode, Wrench, ArrowRight, ClipboardList, BarChart3, Package, Cpu, LayoutDashboard, TrendingUp, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import AppLayout from '@/components/AppLayout';
import { useWorkOrder } from '@/context/WorkOrderContext';
import StatusBadge from '@/components/StatusBadge';
import PriorityBadge from '@/components/PriorityBadge';
import { useAuth } from '@/contexts/AuthContext';

const Index: React.FC = () => {
  const { workOrders } = useWorkOrder();
  const { user, isAdmin, isTechnician } = useAuth();
  const recentOrders = workOrders.slice(-5).reverse();

  const stats = {
    open: workOrders.filter((o) => o.status === 'ABERTO').length,
    inProgress: workOrders.filter((o) => o.status === 'EM_ANDAMENTO').length,
    closed: workOrders.filter((o) => o.status === 'FECHADO').length,
    total: workOrders.length,
  };

  return (
    <AppLayout>
      <div className="px-4 py-6 lg:px-8 lg:py-8 max-w-7xl mx-auto space-y-6">
        {/* Welcome */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground sm:text-2xl">
              Painel de Manutenção
            </h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Visão geral do sistema de manutenção Honda
            </p>
          </div>
          <Link to="/scan">
            <Button size="default" className="gap-2 shadow-premium-md w-full sm:w-auto">
              <QrCode className="h-4 w-4" />
              Novo Chamado
            </Button>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Card className="border-border/60 shadow-premium">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Abertas</p>
                  <p className="mt-1 text-2xl font-bold text-foreground">{stats.open}</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-info/10">
                  <AlertTriangle className="h-5 w-5 text-info" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/60 shadow-premium">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Em Andamento</p>
                  <p className="mt-1 text-2xl font-bold text-foreground">{stats.inProgress}</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-warning/10">
                  <Clock className="h-5 w-5 text-warning" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/60 shadow-premium">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Fechadas</p>
                  <p className="mt-1 text-2xl font-bold text-foreground">{stats.closed}</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/10">
                  <CheckCircle2 className="h-5 w-5 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/60 shadow-premium">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Total</p>
                  <p className="mt-1 text-2xl font-bold text-foreground">{stats.total}</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions + Recent Orders */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Quick Actions */}
          <div className="space-y-3 lg:col-span-1">
            <h3 className="text-[13px] font-bold uppercase tracking-wider text-muted-foreground">Acesso Rápido</h3>
            <div className="grid grid-cols-2 gap-2 lg:grid-cols-1">
              {[
                { to: '/scan', icon: QrCode, label: 'Novo Chamado', color: 'bg-info/10 text-info' },
                { to: '/equipamentos', icon: Cpu, label: 'Equipamentos', color: 'bg-primary/10 text-primary' },
                ...(isAdmin || isTechnician
                  ? [
                      { to: '/central-planejamento', icon: LayoutDashboard, label: 'Planejamento', color: 'bg-warning/10 text-warning' },
                      { to: '/relatorios', icon: BarChart3, label: 'Relatórios', color: 'bg-success/10 text-success' },
                    ]
                  : []),
              ].map((item) => (
                <Link key={item.to} to={item.to}>
                  <Card className="border-border/60 shadow-premium transition-all hover:shadow-premium-md hover:-translate-y-0.5 cursor-pointer">
                    <CardContent className="flex items-center gap-3 p-3">
                      <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${item.color}`}>
                        <item.icon className="h-4 w-4" />
                      </div>
                      <span className="text-[13px] font-semibold text-foreground">{item.label}</span>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>

          {/* Recent Orders */}
          <Card className="border-border/60 shadow-premium lg:col-span-2">
            <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                  <ClipboardList className="h-4 w-4 text-primary" />
                </div>
                <h3 className="text-sm font-bold text-foreground">Chamados Recentes</h3>
              </div>
              <Link to="/relatorios">
                <Button variant="ghost" size="sm" className="text-xs text-muted-foreground">
                  Ver todos
                  <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </Link>
            </div>

            {recentOrders.length > 0 ? (
              <div className="divide-y divide-border/40">
                {recentOrders.map((order) => (
                  <Link
                    key={order.id}
                    to={`/os/${order.id}`}
                    className="flex items-center justify-between px-5 py-3 transition-colors hover:bg-muted/40"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="hidden sm:flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                        <Wrench className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-bold text-foreground">
                            {order.protocolo}
                          </span>
                          <StatusBadge status={order.status} size="sm" />
                        </div>
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                          {order.asset?.nome || 'Equipamento'} • {order.setor}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <PriorityBadge priority={order.prioridade} />
                      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground hidden sm:block" />
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted mb-4">
                  <ClipboardList className="h-7 w-7 text-muted-foreground/50" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">Nenhum chamado registrado</p>
                <p className="mt-1 text-xs text-muted-foreground/70">Escaneie um QR Code para abrir o primeiro chamado</p>
                <Link to="/scan" className="mt-4">
                  <Button variant="outline" size="sm" className="gap-2">
                    <QrCode className="h-3.5 w-3.5" />
                    Abrir Chamado
                  </Button>
                </Link>
              </div>
            )}
          </Card>
        </div>
      </div>
    </AppLayout>
  );
};

export default Index;
