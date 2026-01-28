import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer, X } from 'lucide-react';
import { toast } from 'sonner';
import hondaLogo from '@/assets/honda-logo.png';

interface Asset {
  id: string;
  nome: string;
  codigo_interno: string;
  qr_code_value: string;
  setor_padrao?: string | null;
  local_padrao?: string | null;
}

interface BatchPrintDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assets: Asset[];
  onClearSelection: () => void;
}

const BatchPrintDialog: React.FC<BatchPrintDialogProps> = ({
  open,
  onOpenChange,
  assets,
  onClearSelection,
}) => {
  const handleBatchPrint = () => {
    if (assets.length === 0) return;

    const printWindow = window.open('', '', 'width=800,height=600');
    if (!printWindow) {
      toast.error('Não foi possível abrir a janela de impressão');
      return;
    }

    const qrCards = assets.map((asset) => `
      <div class="qr-card">
        <img src="${hondaLogo}" alt="Honda" class="logo" />
        <div class="title">EQUIPAMENTO DE MANUTENÇÃO</div>
        <div class="qr-container">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 180" width="140" height="140">
            <rect width="180" height="180" fill="white"/>
          </svg>
        </div>
        <div class="equipment-name">${asset.nome}</div>
        <div class="equipment-code">${asset.codigo_interno}</div>
        <div class="equipment-id">ID: ${asset.id}</div>
        ${asset.setor_padrao || asset.local_padrao ? `
          <div class="location">
            ${asset.setor_padrao || ''} ${asset.local_padrao ? `• ${asset.local_padrao}` : ''}
          </div>
        ` : ''}
      </div>
    `).join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Impressão em Lote - QR Codes</title>
          <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: Arial, sans-serif; 
              padding: 20px;
              background: #f5f5f5;
            }
            .grid {
              display: grid;
              grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
              gap: 20px;
              justify-items: center;
            }
            .qr-card {
              border: 3px solid #000;
              border-radius: 12px;
              padding: 16px;
              width: 280px;
              text-align: center;
              background: white;
              page-break-inside: avoid;
            }
            .logo {
              height: 32px;
              margin-bottom: 8px;
            }
            .title {
              font-size: 11px;
              font-weight: bold;
              color: #666;
              margin-bottom: 6px;
            }
            .qr-container {
              display: flex;
              justify-content: center;
              padding: 12px;
              background: #f5f5f5;
              border-radius: 8px;
              margin-bottom: 10px;
            }
            .equipment-name {
              font-size: 14px;
              font-weight: bold;
              margin-bottom: 2px;
            }
            .equipment-code {
              font-size: 20px;
              font-weight: bold;
              color: #cc0000;
              margin-bottom: 6px;
            }
            .equipment-id {
              font-size: 9px;
              color: #999;
              font-family: monospace;
              margin-bottom: 6px;
            }
            .location {
              font-size: 11px;
              color: #666;
            }
            @media print {
              body { padding: 10px; background: white; }
              .grid { gap: 15px; }
              .qr-card { border-width: 2px; }
            }
          </style>
        </head>
        <body>
          <div class="grid">
            ${qrCards}
          </div>
          <script>
            const assets = ${JSON.stringify(assets)};
            document.querySelectorAll('.qr-card').forEach((card, index) => {
              const qrContainer = card.querySelector('.qr-container');
              qrContainer.innerHTML = '';
              const qrDiv = document.createElement('div');
              qrDiv.id = 'qr-' + index;
              qrContainer.appendChild(qrDiv);
              new QRCode(qrDiv, {
                text: assets[index].qr_code_value,
                width: 140,
                height: 140,
                correctLevel: QRCode.CorrectLevel.H
              });
            });
            
            setTimeout(() => {
              window.print();
            }, 500);
          </script>
        </body>
      </html>
    `);

    printWindow.document.close();
    toast.success(`Enviando ${assets.length} QR Codes para impressão!`);
    onOpenChange(false);
    onClearSelection();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Printer className="h-5 w-5" />
            Impressão em Lote - {assets.length} QR Codes
          </DialogTitle>
          <DialogDescription>
            Confira os equipamentos selecionados antes de imprimir
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-96 overflow-y-auto">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {assets.map((asset) => (
              <div
                key={asset.id}
                className="flex flex-col items-center rounded-lg border bg-muted/30 p-3"
              >
                <QRCodeSVG
                  value={asset.qr_code_value}
                  size={80}
                  level="H"
                  className="mb-2 rounded bg-white p-1"
                />
                <p className="text-center text-sm font-medium line-clamp-1">
                  {asset.nome}
                </p>
                <p className="text-center font-mono text-xs text-primary">
                  {asset.codigo_interno}
                </p>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              onClearSelection();
            }}
            className="gap-2"
          >
            <X className="h-4 w-4" />
            Cancelar
          </Button>
          <Button onClick={handleBatchPrint} className="gap-2">
            <Printer className="h-4 w-4" />
            Imprimir Todos
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BatchPrintDialog;