import { useState, memo } from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Edit, Check, X } from 'lucide-react';
import { MaintenancePlanItem, FrequenciaManutencao, TipoProcedimento, FREQUENCIA_LABELS, TIPO_PROCEDIMENTO_LABELS } from '@/types/maintenance';

interface VerificationPoint {
  id: string;
  nome: string;
  categoria: string | null;
}

interface ChecklistItemRowProps {
  item: MaintenancePlanItem;
  templateId: string;
  onUpdate: (id: string, templateId: string, updates: Partial<MaintenancePlanItem>) => void;
  onDelete: (id: string, templateId: string) => void;
  verificationPoints: VerificationPoint[];
  isUpdating?: boolean;
}

function ChecklistItemRowComponent({
  item,
  templateId,
  onUpdate,
  onDelete,
  verificationPoints,
  isUpdating,
}: ChecklistItemRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    item_number: item.item_number,
    componente: item.componente,
    ponto_verificacao: item.ponto_verificacao,
    frequencia: item.frequencia,
    tipo_procedimento: item.tipo_procedimento,
  });

  const handleSave = () => {
    onUpdate(item.id, templateId, editData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditData({
      item_number: item.item_number,
      componente: item.componente,
      ponto_verificacao: item.ponto_verificacao,
      frequencia: item.frequencia,
      tipo_procedimento: item.tipo_procedimento,
    });
    setIsEditing(false);
  };

  const handleQuickUpdate = (field: string, value: string) => {
    onUpdate(item.id, templateId, { [field]: value });
  };

  // Group verification points by category
  const groupedPoints = verificationPoints.reduce((acc, point) => {
    const category = point.categoria || 'Outros';
    if (!acc[category]) acc[category] = [];
    acc[category].push(point);
    return acc;
  }, {} as Record<string, VerificationPoint[]>);

  if (isEditing) {
    return (
      <TableRow className="bg-muted/30">
        <TableCell>
          <Input
            value={editData.item_number}
            onChange={(e) => setEditData(prev => ({ ...prev, item_number: e.target.value }))}
            className="h-8 w-16"
          />
        </TableCell>
        <TableCell>
          <Input
            value={editData.componente}
            onChange={(e) => setEditData(prev => ({ ...prev, componente: e.target.value }))}
            className="h-8"
          />
        </TableCell>
        <TableCell>
          <Select 
            value={editData.ponto_verificacao} 
            onValueChange={(v) => setEditData(prev => ({ ...prev, ponto_verificacao: v }))}
          >
            <SelectTrigger className="h-8 min-w-[200px]">
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent className="bg-background border shadow-lg z-50 max-h-60">
              {Object.entries(groupedPoints).map(([category, points]) => (
                <div key={category}>
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50">
                    {category}
                  </div>
                  {points.map((point) => (
                    <SelectItem key={point.id} value={point.nome}>
                      {point.nome}
                    </SelectItem>
                  ))}
                </div>
              ))}
            </SelectContent>
          </Select>
        </TableCell>
        <TableCell>
          <Select 
            value={editData.frequencia} 
            onValueChange={(v) => setEditData(prev => ({ ...prev, frequencia: v as FrequenciaManutencao }))}
          >
            <SelectTrigger className="h-8 w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-background border shadow-lg z-50">
              {Object.entries(FREQUENCIA_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </TableCell>
        <TableCell>
          <Select 
            value={editData.tipo_procedimento}
            onValueChange={(v) => setEditData(prev => ({ ...prev, tipo_procedimento: v as TipoProcedimento }))}
          >
            <SelectTrigger className="h-8 w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-background border shadow-lg z-50">
              {Object.entries(TIPO_PROCEDIMENTO_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </TableCell>
        <TableCell>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
              onClick={handleSave}
              disabled={isUpdating}
            >
              <Check className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={handleCancel}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </TableCell>
      </TableRow>
    );
  }

  return (
    <TableRow 
      className="group cursor-pointer hover:bg-muted/50 transition-colors"
      onClick={() => setIsEditing(true)}
    >
      <TableCell className="font-medium">{item.item_number}</TableCell>
      <TableCell>{item.componente}</TableCell>
      <TableCell onClick={(e) => e.stopPropagation()}>
        <Select 
          value={item.ponto_verificacao} 
          onValueChange={(v) => handleQuickUpdate('ponto_verificacao', v)}
        >
          <SelectTrigger className="h-8 min-w-[180px] border-transparent hover:border-border bg-transparent">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-background border shadow-lg z-50 max-h-60">
            {Object.entries(groupedPoints).map(([category, points]) => (
              <div key={category}>
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50">
                  {category}
                </div>
                {points.map((point) => (
                  <SelectItem key={point.id} value={point.nome}>
                    {point.nome}
                  </SelectItem>
                ))}
              </div>
            ))}
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell onClick={(e) => e.stopPropagation()}>
        <Select 
          value={item.frequencia} 
          onValueChange={(v) => handleQuickUpdate('frequencia', v)}
        >
          <SelectTrigger className="h-8 w-28 border-transparent hover:border-border bg-transparent">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-background border shadow-lg z-50">
            {Object.entries(FREQUENCIA_LABELS).map(([key, label]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell onClick={(e) => e.stopPropagation()}>
        <Select 
          value={item.tipo_procedimento}
          onValueChange={(v) => handleQuickUpdate('tipo_procedimento', v)}
        >
          <SelectTrigger className="h-8 w-32 border-transparent hover:border-border bg-transparent">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-background border shadow-lg z-50">
            {Object.entries(TIPO_PROCEDIMENTO_LABELS).map(([key, label]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell onClick={(e) => e.stopPropagation()}>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-primary"
            onClick={(e) => {
              e.stopPropagation();
              setIsEditing(true);
            }}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(item.id, templateId);
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

const ChecklistItemRow = memo(ChecklistItemRowComponent);

export default ChecklistItemRow;
