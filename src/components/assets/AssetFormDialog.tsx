import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

const assetFormSchema = z.object({
  nome: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  codigo_interno: z.string().min(2, 'Código interno é obrigatório'),
  qr_code_value: z.string().min(2, 'Valor do QR Code é obrigatório'),
  setor_padrao: z.string().optional(),
  local_padrao: z.string().optional(),
  tag: z.string().optional(),
  modelo: z.string().optional(),
  numero_serie: z.string().optional(),
  fabricante: z.string().optional(),
  status: z.enum(['ativo', 'inativo']),
});

type AssetFormValues = z.infer<typeof assetFormSchema>;

interface AssetFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: AssetFormValues) => Promise<void>;
  initialData?: Partial<AssetFormValues>;
  isEditing?: boolean;
  isLoading?: boolean;
}

const SETORES = [
  'Produção',
  'Estamparia',
  'Soldagem',
  'Pintura',
  'Montagem',
  'Qualidade',
  'Logística',
  'Manutenção',
];

const AssetFormDialog: React.FC<AssetFormDialogProps> = ({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  isEditing = false,
  isLoading = false,
}) => {
  const form = useForm<AssetFormValues>({
    resolver: zodResolver(assetFormSchema),
    defaultValues: {
      nome: '',
      codigo_interno: '',
      qr_code_value: '',
      setor_padrao: '',
      local_padrao: '',
      tag: '',
      modelo: '',
      numero_serie: '',
      fabricante: '',
      status: 'ativo',
    },
  });

  useEffect(() => {
    if (open && initialData) {
      form.reset({
        nome: initialData.nome || '',
        codigo_interno: initialData.codigo_interno || '',
        qr_code_value: initialData.qr_code_value || '',
        setor_padrao: initialData.setor_padrao || '',
        local_padrao: initialData.local_padrao || '',
        tag: initialData.tag || '',
        modelo: initialData.modelo || '',
        numero_serie: initialData.numero_serie || '',
        fabricante: initialData.fabricante || '',
        status: initialData.status || 'ativo',
      });
    } else if (open && !isEditing) {
      form.reset({
        nome: '',
        codigo_interno: '',
        qr_code_value: '',
        setor_padrao: '',
        local_padrao: '',
        tag: '',
        modelo: '',
        numero_serie: '',
        fabricante: '',
        status: 'ativo',
      });
    }
  }, [open, initialData, isEditing, form]);

  const handleSubmit = async (data: AssetFormValues) => {
    await onSubmit(data);
    form.reset();
  };

  // Auto-generate QR code value from codigo_interno
  const codigoInterno = form.watch('codigo_interno');
  useEffect(() => {
    if (!isEditing && codigoInterno && !form.getValues('qr_code_value')) {
      form.setValue('qr_code_value', `HONDA-${codigoInterno.toUpperCase()}`);
    }
  }, [codigoInterno, isEditing, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Equipamento' : 'Novo Equipamento'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Atualize as informações do equipamento.'
              : 'Preencha as informações do equipamento. Um ID único será gerado automaticamente.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Equipamento *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: CNC Fresadora Vertical" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="codigo_interno"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Código Interno *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: CNC-FV-001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="qr_code_value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor do QR Code *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: HONDA-CNC-001" {...field} />
                    </FormControl>
                    <FormDescription>
                      Valor codificado no QR Code
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="setor_padrao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Setor</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o setor" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {SETORES.map((setor) => (
                          <SelectItem key={setor} value={setor}>
                            {setor}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="local_padrao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Local</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Linha A" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="tag"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>TAG</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: TAG-001" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="fabricante"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fabricante</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: FANUC" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="modelo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Modelo</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: RoboDrill" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="numero_serie"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Número de Série</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: SN-123456" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="ativo">Ativo</SelectItem>
                      <SelectItem value="inativo">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? 'Salvar' : 'Cadastrar'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AssetFormDialog;
