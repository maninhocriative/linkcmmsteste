import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import Header from '@/components/Header';
import QRScanner from '@/components/QRScanner';
import WorkOrderForm from '@/components/WorkOrderForm';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertCircle, Loader2 } from 'lucide-react';

type Asset = Tables<'assets'>;

const ScanPage: React.FC = () => {
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [showNotFound, setShowNotFound] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const handleQRScan = async (qrValue: string) => {
    setIsSearching(true);
    try {
      const { data, error } = await supabase
        .from('assets')
        .select('*')
        .eq('id', qrValue)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        setSelectedAsset(data);
      } else {
        setShowNotFound(true);
      }
    } catch (error) {
      console.error('Erro ao buscar equipamento:', error);
      setShowNotFound(true);
    } finally {
      setIsSearching(false);
    }
  };

  const handleManualInput = async (code: string) => {
    setIsSearching(true);
    try {
      // Busca pelo ID único, código interno ou qr_code_value
      const { data, error } = await supabase
        .from('assets')
        .select('*')
        .or(`id.eq.${code},codigo_interno.ilike.%${code}%`)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        setSelectedAsset(data);
      } else {
        setShowNotFound(true);
      }
    } catch (error) {
      console.error('Erro ao buscar equipamento:', error);
      setShowNotFound(true);
    } finally {
      setIsSearching(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualInput.trim()) {
      handleManualInput(manualInput.trim());
    }
  };

  const handleBack = () => {
    setSelectedAsset(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-6">
        {selectedAsset ? (
          <WorkOrderForm asset={selectedAsset} onBack={handleBack} />
        ) : (
          <div className="flex flex-col items-center py-8">
            <div className="mb-8 text-center">
              <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary">
                Passo 1 de 2
              </div>
              <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">
                Novo Chamado de Manutenção
              </h1>
              <p className="mt-2 text-muted-foreground">
                Escaneie o QR Code do equipamento para abrir um chamado
              </p>
            </div>

            <QRScanner onScan={handleQRScan} onManualInput={handleManualInput} />
          </div>
        )}
      </main>

      {/* Not Found Modal */}
      <Dialog open={showNotFound} onOpenChange={setShowNotFound}>
        <DialogContent>
          <DialogHeader>
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
              <AlertCircle className="h-7 w-7 text-destructive" />
            </div>
            <DialogTitle className="text-center">QR Code não reconhecido</DialogTitle>
            <DialogDescription className="text-center">
              O código escaneado não foi encontrado no sistema. Digite o código do equipamento manualmente.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleManualSubmit} className="flex flex-col gap-4">
            <Input
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              placeholder="Digite o código do equipamento"
              autoFocus
            />
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowNotFound(false);
                  setManualInput('');
                }}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button type="submit" className="flex-1" disabled={!manualInput.trim()}>
                Buscar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ScanPage;
