import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Clock, Wrench, ExternalLink, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AssetHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assetId: string;
  assetName: string;
}

const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  ABERTO: { label: 'Aberto', variant: 'destructive' },
  EM_ANDAMENTO: { label: 'Em Andamento', variant: 'default' },
  FECHADO: { label: 'Fechado', variant: 'secondary' },
};

const prioridadeMap: Record<string, { label: string; color: string }> = {
  BAIXA: { label: 'Baixa', color: 'text-blue-500' },
  MEDIA: { label: 'Média', color: 'text-yellow-500' },
  ALTA: { label: 'Alta', color: 'text-orange-500' },
  CRITICA: { label: 'Crítica', color: 'text-destructive' },
};

const AssetHistoryDialog: React.FC<AssetHistoryDialogProps> = ({
  open,
  onOpenChange,
  assetId,
  assetName,
}) => {
  const navigate = useNavigate();

  const { data: workOrders, isLoading } = useQuery({
    queryKey: ['asset-work-orders', assetId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('work_orders')
        .select('*')
        .eq('asset_id', assetId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  const totalOs = workOrders?.length || 0;
  const osFechadas = workOrders?.filter((o) => o.status === 'FECHADO').length || 0;
  const osAbertas = workOrders?.filter((o) => o.status !== 'FECHADO').length || 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Histórico de Manutenção - {assetName}
          </DialogTitle>
        </DialogHeader>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg border bg-card p-3 text-center">
            <p className="text-xl font-bold">{totalOs}</p>
            <p className="text-xs text-muted-foreground">Total OS</p>
          </div>
          <div className="rounded-lg border bg-card p-3 text-center">
            <p className="text-xl font-bold text-green-600">{osFechadas}</p>
            <p className="text-xs text-muted-foreground">Fechadas</p>
          </div>
          <div className="rounded-lg border bg-card p-3 text-center">
            <p className="text-xl font-bold text-orange-500">{osAbertas}</p>
            <p className="text-xs text-muted-foreground">Em Aberto</p>
          </div>
        </div>

        <ScrollArea className="max-h-[400px]">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : workOrders && workOrders.length > 0 ? (
            <div className="space-y-3">
              {workOrders.map((wo) => {
                const status = statusMap[wo.status] || { label: wo.status, variant: 'outline' as const };
                const prioridade = prioridadeMap[wo.prioridade] || { label: wo.prioridade, color: '' };

                return (
                  <div
                    key={wo.id}
                    className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-sm font-medium">{wo.protocolo}</span>
                        <Badge variant={status.variant}>{status.label}</Badge>
                        <span className={`text-xs font-medium ${prioridade.color}`}>
                          {prioridade.label}
                        </span>
                      </div>
                      <p className="mt-1 truncate text-sm text-muted-foreground">
                        {wo.descricao_solicitante}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(wo.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        {wo.tempo_total_minutos && (
                          <span className="ml-2">• {wo.tempo_total_minutos} min</span>
                        )}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        onOpenChange(false);
                        navigate(`/os/${wo.id}`);
                      }}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Wrench className="mb-2 h-8 w-8 opacity-50" />
              <p>Nenhuma ordem de serviço registrada</p>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default AssetHistoryDialog;
