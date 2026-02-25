import React from 'react';
import { Link } from 'react-router-dom';
import { QrCode, Wrench, ArrowRight, ClipboardList } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AppLayout from '@/components/AppLayout';
import { useWorkOrder } from '@/context/WorkOrderContext';
import StatusBadge from '@/components/StatusBadge';
import PriorityBadge from '@/components/PriorityBadge';

const Index: React.FC = () => {
  const { workOrders } = useWorkOrder();
  const recentOrders = workOrders.slice(-5).reverse();

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="mb-12 flex flex-col items-center text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary">
            <Wrench className="h-10 w-10 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-semibold text-foreground sm:text-4xl">
            Sistema de Manutenção
          </h1>
          <p className="mt-3 max-w-md text-muted-foreground">
            Gerencie chamados de manutenção de forma rápida e eficiente com leitura de QR Code
          </p>

          <Link to="/scan" className="mt-8">
            <Button size="lg" className="gap-2 px-8">
              <QrCode className="h-5 w-5" />
              Abrir Novo Chamado
              <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
        </div>

        {/* Quick Stats */}
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="card-elevated p-4 text-center">
            <p className="text-3xl font-semibold text-foreground">
              {workOrders.filter((o) => o.status === 'ABERTO').length}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">Em Aberto</p>
          </div>
          <div className="card-elevated p-4 text-center">
            <p className="text-3xl font-semibold text-warning">
              {workOrders.filter((o) => o.status === 'EM_ANDAMENTO').length}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">Em Andamento</p>
          </div>
          <div className="card-elevated p-4 text-center">
            <p className="text-3xl font-semibold text-success">
              {workOrders.filter((o) => o.status === 'FECHADO').length}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">Fechados</p>
          </div>
          <div className="card-elevated p-4 text-center">
            <p className="text-3xl font-semibold text-foreground">{workOrders.length}</p>
            <p className="mt-1 text-sm text-muted-foreground">Total</p>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="card-elevated">
          <div className="flex items-center justify-between border-b border-border p-5">
            <div className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-muted-foreground" />
              <h2 className="font-semibold text-foreground">Chamados Recentes</h2>
            </div>
          </div>

          {recentOrders.length > 0 ? (
            <div className="divide-y divide-border">
              {recentOrders.map((order) => (
                <Link
                  key={order.id}
                  to={`/os/${order.id}`}
                  className="flex items-center justify-between p-4 transition-colors hover:bg-muted/50"
                >
                  <div className="flex items-center gap-4">
                    <div className="hidden h-10 w-10 items-center justify-center rounded-lg bg-muted sm:flex">
                      <Wrench className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-medium text-foreground">
                          {order.protocolo}
                        </span>
                        <StatusBadge status={order.status} size="sm" />
                      </div>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        {order.asset?.nome || 'Equipamento'} • {order.setor}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <PriorityBadge priority={order.prioridade} />
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ClipboardList className="mb-3 h-12 w-12 text-muted-foreground/50" />
              <p className="text-muted-foreground">Nenhum chamado registrado ainda</p>
              <Link to="/scan" className="mt-4">
                <Button variant="outline" size="sm">
                  Abrir Primeiro Chamado
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default Index;
