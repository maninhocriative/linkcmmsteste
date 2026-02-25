import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import AssetQRCodeCard from '@/components/assets/AssetQRCodeCard';
import AssetFormDialog from '@/components/assets/AssetFormDialog';
import AssetHistoryDialog from '@/components/assets/AssetHistoryDialog';
import BatchPrintDialog from '@/components/assets/BatchPrintDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Search, Loader2, QrCode, Package, Printer, CheckSquare } from 'lucide-react';
import { toast } from 'sonner';
import { Tables } from '@/integrations/supabase/types';

type Asset = Tables<'assets'>;

const AssetsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [setorFilter, setSetorFilter] = useState<string>('todos');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [selectedAssets, setSelectedAssets] = useState<Set<string>>(new Set());
  const [showBatchPrint, setShowBatchPrint] = useState(false);
  const [historyAsset, setHistoryAsset] = useState<Asset | null>(null);

  // Fetch assets
  const { data: assets, isLoading, error } = useQuery({
    queryKey: ['assets'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('assets')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Asset[];
    },
  });

  // Create asset mutation
  const createMutation = useMutation({
    mutationFn: async (data: {
      nome: string;
      codigo_interno: string;
      qr_code_value: string;
      setor_padrao: string | null;
      local_padrao: string | null;
      tag: string | null;
      modelo: string | null;
      numero_serie: string | null;
      fabricante: string | null;
      status: string;
    }) => {
      const { data: result, error } = await supabase
        .from('assets')
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      toast.success('Equipamento cadastrado com sucesso!');
      setIsFormOpen(false);
    },
    onError: (error: Error) => {
      toast.error(`Erro ao cadastrar: ${error.message}`);
    },
  });

  // Update asset mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: Partial<Asset> & { id: string }) => {
      const { data: result, error } = await supabase
        .from('assets')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      toast.success('Equipamento atualizado com sucesso!');
      setEditingAsset(null);
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar: ${error.message}`);
    },
  });

  const handleSubmit = async (data: {
    nome: string;
    codigo_interno: string;
    qr_code_value: string;
    setor_padrao?: string;
    local_padrao?: string;
    tag?: string;
    modelo?: string;
    numero_serie?: string;
    fabricante?: string;
    status: 'ativo' | 'inativo';
  }) => {
    const insertData = {
      nome: data.nome,
      codigo_interno: data.codigo_interno,
      qr_code_value: data.qr_code_value,
      setor_padrao: data.setor_padrao || null,
      local_padrao: data.local_padrao || null,
      tag: data.tag || null,
      modelo: data.modelo || null,
      numero_serie: data.numero_serie || null,
      fabricante: data.fabricante || null,
      status: data.status,
    };

    if (editingAsset) {
      await updateMutation.mutateAsync({ id: editingAsset.id, ...insertData });
    } else {
      await createMutation.mutateAsync(insertData);
    }
  };

  const handleEdit = (asset: Asset) => {
    setEditingAsset(asset);
  };

  // Get unique setores for filter
  const setores = React.useMemo(() => {
    if (!assets) return [];
    const unique = new Set(assets.map((a) => a.setor_padrao).filter(Boolean));
    return Array.from(unique) as string[];
  }, [assets]);

  // Filter assets
  const filteredAssets = React.useMemo(() => {
    if (!assets) return [];
    return assets.filter((asset) => {
      const matchesSearch =
        !search ||
        asset.nome.toLowerCase().includes(search.toLowerCase()) ||
        asset.codigo_interno.toLowerCase().includes(search.toLowerCase()) ||
        asset.qr_code_value.toLowerCase().includes(search.toLowerCase()) ||
        asset.id.toLowerCase().includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === 'todos' || asset.status === statusFilter;

      const matchesSetor =
        setorFilter === 'todos' || asset.setor_padrao === setorFilter;

      return matchesSearch && matchesStatus && matchesSetor;
    });
  }, [assets, search, statusFilter, setorFilter]);

  // Selection handlers
  const toggleAssetSelection = (assetId: string) => {
    setSelectedAssets((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(assetId)) {
        newSet.delete(assetId);
      } else {
        newSet.add(assetId);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedAssets.size === filteredAssets.length) {
      setSelectedAssets(new Set());
    } else {
      setSelectedAssets(new Set(filteredAssets.map((a) => a.id)));
    }
  };

  const clearSelection = () => {
    setSelectedAssets(new Set());
  };

  const selectedAssetsData = filteredAssets.filter((a) => selectedAssets.has(a.id));

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center text-destructive">
            Erro ao carregar equipamentos: {(error as Error).message}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-semibold">
              <QrCode className="h-6 w-6 text-primary" />
              Equipamentos
            </h1>
            <p className="mt-1 text-muted-foreground">
              Gerencie equipamentos e imprima QR Codes
            </p>
          </div>
          <div className="flex gap-2">
            {selectedAssets.size > 0 && (
              <Button 
                onClick={() => setShowBatchPrint(true)} 
                variant="outline"
                className="gap-2"
              >
                <Printer className="h-4 w-4" />
                Imprimir {selectedAssets.size} QR Code{selectedAssets.size > 1 ? 's' : ''}
              </Button>
            )}
            <Button onClick={() => setIsFormOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Novo Equipamento
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-col gap-4 rounded-lg border bg-card p-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, código, QR ou ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos Status</SelectItem>
              <SelectItem value="ativo">Ativo</SelectItem>
              <SelectItem value="inativo">Inativo</SelectItem>
            </SelectContent>
          </Select>
          <Select value={setorFilter} onValueChange={setSetorFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Setor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos Setores</SelectItem>
              {setores.map((setor) => (
                <SelectItem key={setor} value={setor}>
                  {setor}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Stats */}
        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-lg border bg-card p-4 text-center">
            <p className="text-2xl font-semibold">
              {assets?.length || 0}
            </p>
            <p className="text-sm text-muted-foreground">Total</p>
          </div>
          <div className="rounded-lg border bg-card p-4 text-center">
            <p className="text-2xl font-semibold text-green-600">
              {assets?.filter((a) => a.status === 'ativo').length || 0}
            </p>
            <p className="text-sm text-muted-foreground">Ativos</p>
          </div>
          <div className="rounded-lg border bg-card p-4 text-center">
            <p className="text-2xl font-semibold text-gray-500">
              {assets?.filter((a) => a.status === 'inativo').length || 0}
            </p>
            <p className="text-sm text-muted-foreground">Inativos</p>
          </div>
          <div className="rounded-lg border bg-card p-4 text-center">
            <p className="text-2xl font-semibold text-primary">
              {filteredAssets.length}
            </p>
            <p className="text-sm text-muted-foreground">Filtrados</p>
          </div>
        </div>

        {/* Selection Toolbar */}
        {filteredAssets.length > 0 && (
          <div className="mb-4 flex items-center gap-4 rounded-lg border bg-card p-3">
            <div className="flex items-center gap-2">
              <Checkbox
                id="select-all"
                checked={selectedAssets.size === filteredAssets.length && filteredAssets.length > 0}
                onCheckedChange={toggleSelectAll}
              />
              <label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
                Selecionar todos
              </label>
            </div>
            {selectedAssets.size > 0 && (
              <>
                <span className="text-sm text-muted-foreground">
                  {selectedAssets.size} selecionado{selectedAssets.size > 1 ? 's' : ''}
                </span>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={clearSelection}
                >
                  Limpar seleção
                </Button>
              </>
            )}
          </div>
        )}

        {/* Assets Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredAssets.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredAssets.map((asset) => (
              <div key={asset.id} className="relative">
                <div className="absolute left-3 top-3 z-10">
                  <Checkbox
                    checked={selectedAssets.has(asset.id)}
                    onCheckedChange={() => toggleAssetSelection(asset.id)}
                  />
                </div>
                <AssetQRCodeCard
                  asset={asset}
                  onEdit={() => handleEdit(asset)}
                  onShowHistory={() => setHistoryAsset(asset)}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed bg-muted/30 py-16">
            <Package className="mb-4 h-12 w-12 text-muted-foreground/50" />
            <h3 className="text-lg font-medium">Nenhum equipamento encontrado</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {search || statusFilter !== 'todos' || setorFilter !== 'todos'
                ? 'Tente ajustar os filtros de busca'
                : 'Cadastre o primeiro equipamento para começar'}
            </p>
            {!search && statusFilter === 'todos' && setorFilter === 'todos' && (
              <Button onClick={() => setIsFormOpen(true)} className="mt-4 gap-2">
                <Plus className="h-4 w-4" />
                Cadastrar Equipamento
              </Button>
            )}
          </div>
        )}
      </main>

      {/* Form Dialog */}
      <AssetFormDialog
        open={isFormOpen || !!editingAsset}
        onOpenChange={(open) => {
          if (!open) {
            setIsFormOpen(false);
            setEditingAsset(null);
          }
        }}
        onSubmit={handleSubmit}
        initialData={editingAsset ? {
          ...editingAsset,
          status: editingAsset.status as 'ativo' | 'inativo',
          setor_padrao: editingAsset.setor_padrao || undefined,
          local_padrao: editingAsset.local_padrao || undefined,
          tag: editingAsset.tag || undefined,
          modelo: editingAsset.modelo || undefined,
          numero_serie: editingAsset.numero_serie || undefined,
          fabricante: editingAsset.fabricante || undefined,
        } : undefined}
        isEditing={!!editingAsset}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      {/* Batch Print Dialog */}
      <BatchPrintDialog
        open={showBatchPrint}
        onOpenChange={setShowBatchPrint}
        assets={selectedAssetsData}
        onClearSelection={clearSelection}
      />

      {/* History Dialog */}
      {historyAsset && (
        <AssetHistoryDialog
          open={!!historyAsset}
          onOpenChange={(open) => !open && setHistoryAsset(null)}
          assetId={historyAsset.id}
          assetName={historyAsset.nome}
        />
      )}
    </div>
  );
};

export default AssetsPage;
