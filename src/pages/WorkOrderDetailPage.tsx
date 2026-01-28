import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useWorkOrder } from '@/context/WorkOrderContext';
import { PartUsed } from '@/types';
import Header from '@/components/Header';
import StatusBadge from '@/components/StatusBadge';
import PriorityBadge from '@/components/PriorityBadge';
import PartsUsedList from '@/components/PartsUsedList';
import WorkOrderChecklist from '@/components/workorder/WorkOrderChecklist';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft,
  Wrench,
  MapPin,
  Calendar,
  User,
  Clock,
  CheckCircle2,
  PlayCircle,
  Upload,
  FileText,
  ShieldCheck,
  Lightbulb,
  ClipboardList,
  Package,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const WorkOrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    getWorkOrder,
    startWorkOrder,
    closeWorkOrder,
    addPartToWorkOrder,
    removePartFromWorkOrder,
    currentUser,
  } = useWorkOrder();

  const [order, setOrder] = useState(getWorkOrder(id || ''));
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const [formData, setFormData] = useState({
    diagnostico: order?.diagnostico || '',
    acao_corretiva: order?.acao_corretiva || '',
    acao_preventiva: order?.acao_preventiva || '',
    tempo_gasto: order?.tempo_gasto || '',
  });

  const [localParts, setLocalParts] = useState<PartUsed[]>(order?.parts_used || []);

  useEffect(() => {
    const updated = getWorkOrder(id || '');
    setOrder(updated);
    if (updated) {
      setLocalParts(updated.parts_used || []);
    }
  }, [id, getWorkOrder]);

  if (!order) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto flex flex-col items-center justify-center px-4 py-16">
          <FileText className="mb-4 h-16 w-16 text-muted-foreground" />
          <h1 className="text-xl font-semibold text-foreground">OS não encontrada</h1>
          <p className="mt-2 text-muted-foreground">
            O chamado solicitado não existe ou foi removido.
          </p>
          <Button onClick={() => navigate('/scan')} className="mt-6">
            Abrir Novo Chamado
          </Button>
        </main>
      </div>
    );
  }

  const isReadOnly = order.status === 'FECHADO';
  const canClose =
    formData.diagnostico.trim() &&
    formData.acao_corretiva.trim() &&
    formData.acao_preventiva.trim() &&
    order.status === 'EM_ANDAMENTO';

  const handleStart = () => {
    startWorkOrder(order.id);
    setOrder(getWorkOrder(order.id));
    toast.success('Atendimento iniciado!');
  };

  const handleClose = () => {
    if (!canClose) return;

    closeWorkOrder(order.id, {
      diagnostico: formData.diagnostico,
      acao_corretiva: formData.acao_corretiva,
      acao_preventiva: formData.acao_preventiva,
      tempo_gasto: formData.tempo_gasto,
      parts_used: localParts,
    });

    setOrder(getWorkOrder(order.id));
    setShowSuccessModal(true);
  };

  const handleAddPart = (part: Omit<PartUsed, 'id' | 'work_order_id'>) => {
    const newPart: PartUsed = {
      ...part,
      id: `temp-${Date.now()}`,
      work_order_id: order.id,
    };
    setLocalParts((prev) => [...prev, newPart]);
  };

  const handleRemovePart = (partId: string) => {
    setLocalParts((prev) => prev.filter((p) => p.id !== partId));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-background pb-8">
      <Header />

      <main className="container mx-auto px-4 py-6">
        {/* Back & Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="font-mono text-xl font-semibold text-foreground">
                  {order.protocolo}
                </h1>
                <StatusBadge status={order.status} />
              </div>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Registre o atendimento e finalize a OS
              </p>
            </div>
          </div>

          {order.status === 'ABERTO' && (
            <Button onClick={handleStart} className="gap-2">
              <PlayCircle className="h-5 w-5" />
              Iniciar Atendimento
            </Button>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column - Order Info */}
          <div className="space-y-6 lg:col-span-1">
            {/* Equipment Card */}
            <div className="card-elevated p-5">
              <h2 className="mb-4 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Wrench className="h-4 w-4" />
                Equipamento
              </h2>
              <div className="space-y-3">
                <div>
                  <p className="font-semibold text-foreground">
                    {order.asset?.nome || 'N/A'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Código: {order.asset?.codigo_interno || 'N/A'}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  {order.setor} • {order.local}
                </div>
              </div>
            </div>

            {/* Details Card */}
            <div className="card-elevated p-5">
              <h2 className="mb-4 text-sm font-medium text-muted-foreground">
                Detalhes do Chamado
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Prioridade</span>
                  <PriorityBadge priority={order.prioridade} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Tipo</span>
                  <span className="text-sm text-foreground">
                    {order.tipo_ocorrencia.replace('_', ' ')}
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <Calendar className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Abertura</p>
                    <p className="text-sm text-foreground">{formatDate(order.created_at)}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <User className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Solicitante</p>
                    <p className="text-sm text-foreground">{order.solicitante_nome}</p>
                  </div>
                </div>
                {order.closed_at && (
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-success" />
                    <div>
                      <p className="text-sm text-muted-foreground">Fechamento</p>
                      <p className="text-sm text-foreground">{formatDate(order.closed_at)}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Problem Description */}
            <div className="card-elevated p-5">
              <h2 className="mb-3 text-sm font-medium text-muted-foreground">
                Descrição do Problema
              </h2>
              <p className="text-sm leading-relaxed text-foreground">
                {order.descricao_solicitante}
              </p>
            </div>

            {/* Technician Info */}
            {order.tecnico && (
              <div className="card-elevated p-5">
                <h2 className="mb-3 text-sm font-medium text-muted-foreground">
                  Técnico Responsável
                </h2>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    {order.tecnico.nome.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{order.tecnico.nome}</p>
                    <p className="text-xs text-muted-foreground">Manutenção</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Maintenance Form with Tabs */}
          <div className="space-y-6 lg:col-span-2">
            <div className="card-elevated p-6">
              <Tabs defaultValue="registro" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="registro" className="gap-2">
                    <FileText className="h-4 w-4" />
                    <span className="hidden sm:inline">Registro</span>
                  </TabsTrigger>
                  <TabsTrigger value="checklist" className="gap-2">
                    <ClipboardList className="h-4 w-4" />
                    <span className="hidden sm:inline">Checklist</span>
                  </TabsTrigger>
                  <TabsTrigger value="pecas" className="gap-2">
                    <Package className="h-4 w-4" />
                    <span className="hidden sm:inline">Peças</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="registro" className="mt-6">
                  <div className="space-y-6">
                {/* Diagnóstico */}
                <div className="space-y-2">
                  <Label
                    htmlFor="diagnostico"
                    className="flex items-center gap-2 text-sm font-medium"
                  >
                    <FileText className="h-4 w-4 text-primary" />
                    Problema Encontrado (Diagnóstico) *
                  </Label>
                  <Textarea
                    id="diagnostico"
                    value={formData.diagnostico}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, diagnostico: e.target.value }))
                    }
                    placeholder="Descreva o que foi identificado como causa do problema..."
                    rows={3}
                    disabled={isReadOnly}
                    className={isReadOnly ? 'bg-muted' : ''}
                  />
                </div>

                {/* Ação Corretiva */}
                <div className="space-y-2">
                  <Label
                    htmlFor="acao_corretiva"
                    className="flex items-center gap-2 text-sm font-medium"
                  >
                    <Wrench className="h-4 w-4 text-primary" />
                    O que foi feito para resolver (Ação Corretiva) *
                  </Label>
                  <Textarea
                    id="acao_corretiva"
                    value={formData.acao_corretiva}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, acao_corretiva: e.target.value }))
                    }
                    placeholder="Descreva as ações realizadas para corrigir o problema..."
                    rows={3}
                    disabled={isReadOnly}
                    className={isReadOnly ? 'bg-muted' : ''}
                  />
                </div>

                {/* Ação Preventiva */}
                <div className="space-y-2">
                  <Label
                    htmlFor="acao_preventiva"
                    className="flex items-center gap-2 text-sm font-medium"
                  >
                    <ShieldCheck className="h-4 w-4 text-primary" />
                    Ação preventiva para não acontecer novamente *
                  </Label>
                  <Textarea
                    id="acao_preventiva"
                    value={formData.acao_preventiva}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, acao_preventiva: e.target.value }))
                    }
                    placeholder="Sugira medidas preventivas para evitar recorrência..."
                    rows={3}
                    disabled={isReadOnly}
                    className={isReadOnly ? 'bg-muted' : ''}
                  />
                </div>

                {/* Tempo Automático - Calculado pelo Sistema */}
                {(order.data_hora_inicio || order.status !== 'ABERTO') && (
                  <div className="rounded-xl border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10 p-5">
                    <div className="mb-3 flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20">
                        <Clock className="h-4 w-4 text-primary" />
                      </div>
                      <h3 className="font-semibold text-foreground">Tempo de Manutenção</h3>
                      <span className="ml-auto rounded-full bg-primary/20 px-2 py-0.5 text-xs font-medium text-primary">
                        Automático
                      </span>
                    </div>
                    
                    <div className="grid gap-4 sm:grid-cols-3">
                      {/* Início */}
                      <div className="rounded-lg bg-background/60 p-3">
                        <p className="mb-1 text-xs font-medium text-muted-foreground">Início</p>
                        <p className="font-mono text-sm font-semibold text-foreground">
                          {order.data_hora_inicio 
                            ? formatDate(order.data_hora_inicio)
                            : '—'}
                        </p>
                      </div>
                      
                      {/* Fim */}
                      <div className="rounded-lg bg-background/60 p-3">
                        <p className="mb-1 text-xs font-medium text-muted-foreground">Fim</p>
                        <p className="font-mono text-sm font-semibold text-foreground">
                          {order.data_hora_fim 
                            ? formatDate(order.data_hora_fim)
                            : order.status === 'EM_ANDAMENTO' 
                              ? 'Em andamento...' 
                              : '—'}
                        </p>
                      </div>
                      
                      {/* Tempo Total Destacado */}
                      <div className="rounded-lg bg-primary/20 p-3">
                        <p className="mb-1 text-xs font-medium text-primary">Tempo Total</p>
                        <p className="font-mono text-lg font-bold text-primary">
                          {order.tempo_total_horas !== null && order.tempo_total_horas !== undefined
                            ? `${Math.floor(order.tempo_total_horas)}h ${order.tempo_total_minutos ? order.tempo_total_minutos % 60 : 0}min`
                            : order.tempo_total_minutos 
                              ? `${order.tempo_total_minutos} min`
                              : order.status === 'EM_ANDAMENTO'
                                ? 'Calculando...'
                                : '—'}
                        </p>
                      </div>
                    </div>
                    
                    <p className="mt-3 text-xs text-muted-foreground">
                      ⏱️ Tempo calculado automaticamente pelo sistema (início ao fechar a OS)
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                {!isReadOnly && order.status === 'EM_ANDAMENTO' && (
                  <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:justify-end">
                    <Button
                      onClick={handleClose}
                      disabled={!canClose}
                      size="lg"
                      className="gap-2"
                    >
                      <CheckCircle2 className="h-5 w-5" />
                      Fechar OS
                    </Button>
                  </div>
                )}

                {!canClose && order.status === 'EM_ANDAMENTO' && (
                  <div className="flex items-start gap-2 rounded-lg bg-warning/10 p-4">
                    <Lightbulb className="mt-0.5 h-5 w-5 text-warning" />
                    <p className="text-sm text-warning">
                      Preencha o diagnóstico, ação corretiva e ação preventiva para habilitar
                      o fechamento da OS.
                    </p>
                  </div>
                )}
                  </div>
                </TabsContent>

                <TabsContent value="checklist" className="mt-6">
                  <WorkOrderChecklist
                    workOrderId={order.id}
                    assetId={order.asset_id}
                    readOnly={isReadOnly}
                    tecnicoNome={order.tecnico?.nome}
                  />
                </TabsContent>

                <TabsContent value="pecas" className="mt-6">
                  <PartsUsedList
                    parts={localParts}
                    onAddPart={handleAddPart}
                    onRemovePart={handleRemovePart}
                    readOnly={isReadOnly}
                  />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </main>

      {/* Success Modal */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent>
          <DialogHeader>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
              <CheckCircle2 className="h-8 w-8 text-success" />
            </div>
            <DialogTitle className="text-center text-xl">OS Encerrada!</DialogTitle>
            <DialogDescription className="text-center">
              O chamado foi fechado com sucesso. Você já está disponível para novas demandas.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 pt-4">
            <Button onClick={() => navigate('/scan')} className="w-full">
              Abrir Novo Chamado
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowSuccessModal(false)}
              className="w-full"
            >
              Continuar Visualizando
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WorkOrderDetailPage;
