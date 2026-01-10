import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Asset, Prioridade, TipoOcorrencia } from '@/types';
import { useWorkOrder } from '@/context/WorkOrderContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, CheckCircle2, Upload, Wrench, MapPin, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface WorkOrderFormProps {
  asset: Asset;
  onBack: () => void;
}

const SETORES = ['Produção', 'Almoxarifado', 'Oficina', 'Estamparia', 'Soldagem', 'Pintura', 'Montagem'];

const TIPOS_OCORRENCIA: { value: TipoOcorrencia; label: string }[] = [
  { value: 'QUEBRA', label: 'Quebra' },
  { value: 'FALHA_INTERMITENTE', label: 'Falha intermitente' },
  { value: 'PECA_DANIFICADA', label: 'Peça danificada' },
  { value: 'RUIDO', label: 'Ruído anormal' },
  { value: 'VAZAMENTO', label: 'Vazamento' },
  { value: 'OUTRO', label: 'Outro' },
];

const PRIORIDADES: { value: Prioridade; label: string; description: string }[] = [
  { value: 'BAIXA', label: 'Baixa', description: 'Sem impacto na produção' },
  { value: 'MEDIA', label: 'Média', description: 'Impacto moderado' },
  { value: 'ALTA', label: 'Alta', description: 'Impacto significativo' },
  { value: 'CRITICA', label: 'Crítica', description: 'Parada de linha' },
];

const WorkOrderForm: React.FC<WorkOrderFormProps> = ({ asset, onBack }) => {
  const navigate = useNavigate();
  const { createWorkOrder } = useWorkOrder();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<{ protocolo: string; id: string } | null>(null);

  const [formData, setFormData] = useState({
    setor: asset.setor_padrao || '',
    local: asset.local_padrao || '',
    tipo_ocorrencia: '' as TipoOcorrencia | '',
    prioridade: '' as Prioridade | '',
    descricao_solicitante: '',
    solicitante_nome: '',
  });

  const isValid =
    formData.setor &&
    formData.tipo_ocorrencia &&
    formData.prioridade &&
    formData.descricao_solicitante.trim() &&
    formData.solicitante_nome.trim();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    setIsSubmitting(true);

    // Simulate a small delay for UX
    setTimeout(() => {
      const order = createWorkOrder({
        asset_id: asset.id,
        asset: asset,
        setor: formData.setor,
        local: formData.local,
        tipo_ocorrencia: formData.tipo_ocorrencia as TipoOcorrencia,
        prioridade: formData.prioridade as Prioridade,
        descricao_solicitante: formData.descricao_solicitante,
        solicitante_nome: formData.solicitante_nome,
      });

      setCreatedOrder({ protocolo: order.protocolo, id: order.id });
      setShowSuccess(true);
      setIsSubmitting(false);
      toast.success('Chamado aberto com sucesso!');
    }, 500);
  };

  if (showSuccess && createdOrder) {
    return (
      <div className="flex flex-col items-center gap-6 py-8">
        <div className="card-elevated flex w-full max-w-md flex-col items-center gap-6 p-8">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-success/10">
            <CheckCircle2 className="h-10 w-10 text-success" />
          </div>

          <div className="text-center">
            <h2 className="text-2xl font-semibold text-foreground">Chamado Aberto!</h2>
            <p className="mt-2 text-muted-foreground">
              Seu chamado foi registrado com sucesso
            </p>
          </div>

          <div className="w-full space-y-3 rounded-xl bg-muted/50 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Protocolo</span>
              <span className="font-mono text-lg font-semibold text-foreground">
                {createdOrder.protocolo}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Status</span>
              <span className="status-badge status-aberto">Aberto</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Equipamento</span>
              <span className="text-sm font-medium text-foreground">{asset.nome}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Setor</span>
              <span className="text-sm text-foreground">{formData.setor}</span>
            </div>
          </div>

          <div className="flex w-full flex-col gap-3">
            <Button
              onClick={() => navigate(`/os/${createdOrder.id}`)}
              className="w-full"
            >
              Ver Detalhes do Chamado
            </Button>
            <Button variant="outline" onClick={onBack} className="w-full">
              Abrir Novo Chamado
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-xl font-semibold text-foreground">Abrir Chamado</h1>
          <p className="text-sm text-muted-foreground">Preencha os dados do problema</p>
        </div>
      </div>

      {/* Equipment Info Card */}
      <div className="card-elevated p-4">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <Wrench className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-foreground">{asset.nome}</h3>
            <p className="text-sm text-muted-foreground">
              Código: {asset.codigo_interno}
            </p>
            <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" />
              {asset.setor_padrao} • {asset.local_padrao}
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="card-elevated space-y-5 p-6">
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="setor">Setor *</Label>
            <Select
              value={formData.setor}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, setor: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o setor" />
              </SelectTrigger>
              <SelectContent>
                {SETORES.map((setor) => (
                  <SelectItem key={setor} value={setor}>
                    {setor}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="local">Local</Label>
            <Input
              id="local"
              value={formData.local}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, local: e.target.value }))
              }
              placeholder="Ex: Linha A, Célula 3"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="tipo">Tipo de Ocorrência *</Label>
          <Select
            value={formData.tipo_ocorrencia}
            onValueChange={(value) =>
              setFormData((prev) => ({ ...prev, tipo_ocorrencia: value as TipoOcorrencia }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione o tipo de problema" />
            </SelectTrigger>
            <SelectContent>
              {TIPOS_OCORRENCIA.map((tipo) => (
                <SelectItem key={tipo.value} value={tipo.value}>
                  {tipo.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Prioridade *</Label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {PRIORIDADES.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, prioridade: p.value }))}
                className={`flex flex-col items-start rounded-lg border p-3 text-left transition-all ${
                  formData.prioridade === p.value
                    ? p.value === 'CRITICA'
                      ? 'border-destructive bg-destructive/5'
                      : p.value === 'ALTA'
                      ? 'border-warning bg-warning/5'
                      : 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <span className={`text-sm font-medium ${
                  formData.prioridade === p.value ? 'text-foreground' : 'text-foreground'
                }`}>
                  {p.label}
                </span>
                <span className="mt-0.5 text-xs text-muted-foreground">
                  {p.description}
                </span>
                {p.value === 'CRITICA' && (
                  <AlertTriangle className="mt-1 h-3.5 w-3.5 text-destructive" />
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="descricao">Descrição do Problema *</Label>
          <Textarea
            id="descricao"
            value={formData.descricao_solicitante}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, descricao_solicitante: e.target.value }))
            }
            placeholder="Descreva brevemente o problema encontrado..."
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="foto">Anexar Foto (opcional)</Label>
          <div className="flex items-center justify-center rounded-lg border border-dashed border-border p-6">
            <div className="flex flex-col items-center gap-2 text-center">
              <Upload className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Clique ou arraste uma imagem
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="solicitante">Seu Nome / Matrícula *</Label>
          <Input
            id="solicitante"
            value={formData.solicitante_nome}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, solicitante_nome: e.target.value }))
            }
            placeholder="Ex: João Silva ou 12345"
          />
        </div>

        <Button
          type="submit"
          className="w-full"
          size="lg"
          disabled={!isValid || isSubmitting}
        >
          {isSubmitting ? 'Abrindo chamado...' : 'Abrir Chamado'}
        </Button>
      </form>
    </div>
  );
};

export default WorkOrderForm;
