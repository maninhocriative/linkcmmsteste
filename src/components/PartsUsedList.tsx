import React, { useState } from 'react';
import { PartUsed } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, Package } from 'lucide-react';

interface PartsUsedListProps {
  parts: PartUsed[];
  onAddPart: (part: Omit<PartUsed, 'id' | 'work_order_id'>) => void;
  onRemovePart: (partId: string) => void;
  readOnly?: boolean;
}

const PartsUsedList: React.FC<PartsUsedListProps> = ({
  parts,
  onAddPart,
  onRemovePart,
  readOnly = false,
}) => {
  const [newPart, setNewPart] = useState({
    item: '',
    quantidade: 1,
    codigo_peca: '',
  });

  const handleAdd = () => {
    if (newPart.item.trim() && newPart.quantidade > 0) {
      onAddPart({
        item: newPart.item.trim(),
        quantidade: newPart.quantidade,
        codigo_peca: newPart.codigo_peca.trim() || undefined,
      });
      setNewPart({ item: '', quantidade: 1, codigo_peca: '' });
    }
  };

  return (
    <div className="space-y-4">
      <Label className="flex items-center gap-2">
        <Package className="h-4 w-4" />
        Peças Utilizadas
      </Label>

      {parts.length > 0 && (
        <div className="space-y-2">
          {parts.map((part) => (
            <div
              key={part.id}
              className="flex items-center gap-3 rounded-lg bg-muted/50 p-3"
            >
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{part.item}</p>
                <p className="text-xs text-muted-foreground">
                  Qtd: {part.quantidade}
                  {part.codigo_peca && ` • Código: ${part.codigo_peca}`}
                </p>
              </div>
              {!readOnly && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onRemovePart(part.id)}
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {!readOnly && (
        <div className="space-y-3 rounded-lg border border-dashed border-border p-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="part-item" className="text-xs">
                Peça / Material
              </Label>
              <Input
                id="part-item"
                value={newPart.item}
                onChange={(e) => setNewPart((prev) => ({ ...prev, item: e.target.value }))}
                placeholder="Ex: Rolamento 6205"
                className="h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="part-qty" className="text-xs">
                Quantidade
              </Label>
              <Input
                id="part-qty"
                type="number"
                min={1}
                value={newPart.quantidade}
                onChange={(e) =>
                  setNewPart((prev) => ({ ...prev, quantidade: parseInt(e.target.value) || 1 }))
                }
                className="h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="part-code" className="text-xs">
                Código (opcional)
              </Label>
              <Input
                id="part-code"
                value={newPart.codigo_peca}
                onChange={(e) =>
                  setNewPart((prev) => ({ ...prev, codigo_peca: e.target.value }))
                }
                placeholder="Ex: SKF-6205-2RS"
                className="h-9"
              />
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAdd}
            disabled={!newPart.item.trim()}
            className="w-full gap-2"
          >
            <Plus className="h-4 w-4" />
            Adicionar Peça
          </Button>
        </div>
      )}

      {parts.length === 0 && readOnly && (
        <p className="text-sm text-muted-foreground">Nenhuma peça registrada</p>
      )}
    </div>
  );
};

export default PartsUsedList;
