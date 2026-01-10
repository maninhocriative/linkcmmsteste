import React, { useState } from 'react';
import { Scanner } from '@yudiel/react-qr-scanner';
import { QrCode, Camera, X, Keyboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface QRScannerProps {
  onScan: (result: string) => void;
  onManualInput: (code: string) => void;
}

const QRScanner: React.FC<QRScannerProps> = ({ onScan, onManualInput }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  const [manualCode, setManualCode] = useState('');

  const handleScan = (result: { rawValue: string }[]) => {
    if (result && result[0]?.rawValue) {
      setIsScanning(false);
      onScan(result[0].rawValue);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      setManualMode(false);
      onManualInput(manualCode.trim());
      setManualCode('');
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="card-elevated flex w-full max-w-md flex-col items-center gap-6 p-8">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-muted">
          <QrCode className="h-10 w-10 text-muted-foreground" />
        </div>
        
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground">
            Escaneie o QR Code
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Aponte a câmera para o QR Code do equipamento para iniciar um novo chamado
          </p>
        </div>

        <div className="flex w-full flex-col gap-3">
          <Button
            onClick={() => setIsScanning(true)}
            className="w-full gap-2"
            size="lg"
          >
            <Camera className="h-5 w-5" />
            Abrir Câmera
          </Button>
          
          <Button
            variant="outline"
            onClick={() => setManualMode(true)}
            className="w-full gap-2"
          >
            <Keyboard className="h-4 w-4" />
            Digitar Código Manualmente
          </Button>
        </div>
      </div>

      {/* Scanner Modal */}
      <Dialog open={isScanning} onOpenChange={setIsScanning}>
        <DialogContent className="max-w-md p-0 overflow-hidden">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle>Escaneando QR Code</DialogTitle>
            <DialogDescription>
              Posicione o QR Code do equipamento dentro da área de leitura
            </DialogDescription>
          </DialogHeader>
          <div className="relative aspect-square w-full bg-black">
            <Scanner
              onScan={handleScan}
              allowMultiple={false}
              scanDelay={300}
              styles={{
                container: { width: '100%', height: '100%' },
                video: { width: '100%', height: '100%', objectFit: 'cover' },
              }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-48 w-48 rounded-2xl border-4 border-primary/50" />
            </div>
          </div>
          <div className="p-4">
            <Button
              variant="outline"
              onClick={() => setIsScanning(false)}
              className="w-full gap-2"
            >
              <X className="h-4 w-4" />
              Cancelar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Manual Input Modal */}
      <Dialog open={manualMode} onOpenChange={setManualMode}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Digitar Código do Equipamento</DialogTitle>
            <DialogDescription>
              Digite o código interno ou valor do QR Code do equipamento
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleManualSubmit} className="flex flex-col gap-4">
            <Input
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              placeholder="Ex: CNC-FV-001 ou HONDA-CNC-001"
              autoFocus
            />
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setManualMode(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button type="submit" className="flex-1" disabled={!manualCode.trim()}>
                Buscar Equipamento
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default QRScanner;
