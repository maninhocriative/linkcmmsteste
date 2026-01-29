import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Printer, Copy, Check, MapPin, Wrench, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import hondaLogo from '@/assets/honda-logo.png';
interface AssetQRCodeCardProps {
  asset: {
    id: string;
    nome: string;
    codigo_interno: string;
    qr_code_value: string;
    setor_padrao?: string | null;
    local_padrao?: string | null;
    status: string;
    tag?: string | null;
  };
  onEdit?: () => void;
}

const AssetQRCodeCard: React.FC<AssetQRCodeCardProps> = ({ asset, onEdit }) => {
  const navigate = useNavigate();
  const printRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = React.useState(false);

  const handleOpenWorkOrder = () => {
    navigate(`/scan?assetId=${asset.id}`);
  };
  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '', 'width=400,height=600');
    if (!printWindow) {
      toast.error('Não foi possível abrir a janela de impressão');
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR Code - ${asset.codigo_interno}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: Arial, sans-serif; 
              padding: 20px;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
            }
            .qr-card {
              border: 3px solid #000;
              border-radius: 12px;
              padding: 20px;
              width: 300px;
              text-align: center;
              background: white;
            }
            .logo {
              height: 40px;
              margin-bottom: 12px;
            }
            .title {
              font-size: 14px;
              font-weight: bold;
              color: #666;
              margin-bottom: 8px;
            }
            .qr-container {
              display: flex;
              justify-content: center;
              padding: 16px;
              background: #f5f5f5;
              border-radius: 8px;
              margin-bottom: 12px;
            }
            .equipment-name {
              font-size: 16px;
              font-weight: bold;
              margin-bottom: 4px;
            }
            .equipment-code {
              font-size: 24px;
              font-weight: bold;
              color: #cc0000;
              margin-bottom: 8px;
            }
            .equipment-id {
              font-size: 10px;
              color: #999;
              font-family: monospace;
              margin-bottom: 8px;
            }
            .location {
              font-size: 12px;
              color: #666;
            }
            @media print {
              body { padding: 0; }
              .qr-card { border-width: 2px; }
            }
          </style>
        </head>
        <body>
          <div class="qr-card">
            <img src="${hondaLogo}" alt="Honda" class="logo" />
            <div class="title">EQUIPAMENTO DE MANUTENÇÃO</div>
            <div class="qr-container">
              ${printContent.querySelector('svg')?.outerHTML || ''}
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
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);

    toast.success('Enviado para impressão!');
  };

  const handleCopyId = async () => {
    try {
      await navigator.clipboard.writeText(asset.id);
      setCopied(true);
      toast.success('ID copiado!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Erro ao copiar ID');
    }
  };

  return (
    <Card className="overflow-hidden transition-all hover:shadow-lg">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{asset.nome}</CardTitle>
            <p className="mt-1 font-mono text-xl font-bold text-primary">
              {asset.codigo_interno}
            </p>
          </div>
          <Badge variant={asset.status === 'ativo' ? 'default' : 'secondary'}>
            {asset.status === 'ativo' ? 'Ativo' : 'Inativo'}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div 
          ref={printRef}
          className="flex justify-center rounded-lg bg-muted/50 p-4"
        >
          <QRCodeSVG
            value={asset.id}
            size={160}
            level="H"
            includeMargin
            className="rounded-lg bg-white p-2"
          />
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <span className="font-medium">ID (QR Code):</span>
            <code className="rounded bg-muted px-2 py-0.5 text-xs">
              {asset.id.slice(0, 8)}...
            </code>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={handleCopyId}
            >
              {copied ? (
                <Check className="h-3 w-3 text-green-500" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </Button>
          </div>

          {(asset.setor_padrao || asset.local_padrao) && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>
                {asset.setor_padrao}
                {asset.local_padrao && ` • ${asset.local_padrao}`}
              </span>
            </div>
          )}

          {asset.tag && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Wrench className="h-4 w-4" />
              <span>TAG: {asset.tag}</span>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="flex-col gap-2 border-t pt-4">
        <Button 
          onClick={handleOpenWorkOrder} 
          variant="default"
          className="w-full gap-2 bg-red-600 hover:bg-red-700"
        >
          <AlertCircle className="h-4 w-4" />
          Abrir Chamado
        </Button>
        <div className="flex w-full gap-2">
          <Button onClick={handlePrint} variant="outline" className="flex-1 gap-2">
            <Printer className="h-4 w-4" />
            Imprimir QR
          </Button>
          {onEdit && (
            <Button variant="outline" onClick={onEdit}>
              Editar
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
};

export default AssetQRCodeCard;
