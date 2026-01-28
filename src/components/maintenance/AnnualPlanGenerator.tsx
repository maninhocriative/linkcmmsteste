import React, { useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { FileDown, Printer, Check } from 'lucide-react';
import { 
  MaintenancePlanTemplate, 
  MaintenancePlanItem,
  FREQUENCIA_LABELS,
  TIPO_PROCEDIMENTO_LABELS,
  MESES,
  getMonthsForFrequency 
} from '@/types/maintenance';

interface AnnualPlanGeneratorProps {
  templates: MaintenancePlanTemplate[];
  selectedTemplateId: string | null;
  onSelectTemplate: (id: string) => void;
  items: MaintenancePlanItem[];
}

const AnnualPlanGenerator: React.FC<AnnualPlanGeneratorProps> = ({
  templates,
  selectedTemplateId,
  onSelectTemplate,
  items
}) => {
  const printRef = useRef<HTMLDivElement>(null);
  const selectedTemplate = templates.find(t => t.id === selectedTemplateId);
  const currentYear = new Date().getFullYear();

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>PM 14010 - ${selectedTemplate?.nome || 'Plano de Manutenção'}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: Arial, sans-serif; 
              padding: 20px;
              font-size: 10px;
            }
            .header { 
              text-align: center; 
              margin-bottom: 20px;
              border-bottom: 2px solid #333;
              padding-bottom: 10px;
            }
            .header h1 { font-size: 16px; margin-bottom: 5px; }
            .header p { font-size: 11px; color: #666; }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin-top: 10px;
            }
            th, td { 
              border: 1px solid #333; 
              padding: 4px 6px; 
              text-align: center;
              font-size: 9px;
            }
            th { background-color: #e0e0e0; font-weight: bold; }
            .item-num { width: 30px; }
            .component { text-align: left; min-width: 80px; }
            .checkpoint { text-align: left; min-width: 120px; }
            .freq { width: 60px; }
            .type { width: 60px; }
            .month { width: 30px; }
            .month-active { background-color: #90EE90; }
            .footer {
              margin-top: 30px;
              display: flex;
              justify-content: space-between;
            }
            .signature { 
              border-top: 1px solid #333; 
              width: 200px; 
              text-align: center;
              padding-top: 5px;
            }
            @media print {
              body { padding: 10px; }
              @page { size: landscape; margin: 10mm; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>PLANO DE MANUTENÇÃO PREVENTIVA - PM 14010</h1>
            <p>${selectedTemplate?.nome || ''} ${selectedTemplate?.modelo_equipamento ? `- ${selectedTemplate.modelo_equipamento}` : ''}</p>
            <p>Ano: ${currentYear}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th class="item-num">Nº</th>
                <th class="component">Componente</th>
                <th class="checkpoint">Ponto de Verificação</th>
                <th class="freq">Freq.</th>
                <th class="type">Tipo</th>
                ${MESES.map(m => `<th class="month">${m}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${items.map(item => {
                const activeMonths = getMonthsForFrequency(item.frequencia);
                return `
                  <tr>
                    <td class="item-num">${item.item_number}</td>
                    <td class="component">${item.componente}</td>
                    <td class="checkpoint">${item.ponto_verificacao}</td>
                    <td class="freq">${FREQUENCIA_LABELS[item.frequencia]}</td>
                    <td class="type">${TIPO_PROCEDIMENTO_LABELS[item.tipo_procedimento]}</td>
                    ${MESES.map((_, idx) => 
                      `<td class="month ${activeMonths.includes(idx) ? 'month-active' : ''}">
                        ${activeMonths.includes(idx) ? '●' : ''}
                      </td>`
                    ).join('')}
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
          <div class="footer">
            <div class="signature">Elaborado por</div>
            <div class="signature">Aprovado por</div>
            <div class="signature">Data</div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Gerar Plano Anual (PM 14010)</CardTitle>
          <CardDescription>
            Visualize e exporte o plano de manutenção no formato tradicional
          </CardDescription>
        </div>
        <Button onClick={handlePrint} disabled={!selectedTemplateId || items.length === 0} className="gap-2">
          <Printer className="h-4 w-4" />
          Imprimir / PDF
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="max-w-sm">
          <Label>Selecione o Template</Label>
          <Select value={selectedTemplateId || ''} onValueChange={onSelectTemplate}>
            <SelectTrigger>
              <SelectValue placeholder="Escolha um template" />
            </SelectTrigger>
            <SelectContent>
              {templates.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedTemplate && items.length > 0 && (
          <div ref={printRef} className="overflow-x-auto border rounded-lg">
            <div className="min-w-[1000px] p-4">
              {/* Header */}
              <div className="text-center mb-4 pb-3 border-b-2 border-foreground">
                <h2 className="text-lg font-bold">PLANO DE MANUTENÇÃO PREVENTIVA - PM 14010</h2>
                <p className="text-sm text-muted-foreground">
                  {selectedTemplate.nome} {selectedTemplate.modelo_equipamento && `- ${selectedTemplate.modelo_equipamento}`}
                </p>
                <p className="text-sm">Ano: {currentYear}</p>
              </div>

              {/* Table */}
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="bg-muted">
                    <th className="border border-border p-2 w-12">Nº</th>
                    <th className="border border-border p-2 text-left">Componente</th>
                    <th className="border border-border p-2 text-left">Ponto de Verificação</th>
                    <th className="border border-border p-2 w-20">Freq.</th>
                    <th className="border border-border p-2 w-24">Tipo</th>
                    {MESES.map((mes) => (
                      <th key={mes} className="border border-border p-1 w-10 text-center">{mes}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => {
                    const activeMonths = getMonthsForFrequency(item.frequencia);
                    return (
                      <tr key={item.id} className="hover:bg-muted/50">
                        <td className="border border-border p-2 text-center font-medium">{item.item_number}</td>
                        <td className="border border-border p-2">{item.componente}</td>
                        <td className="border border-border p-2">{item.ponto_verificacao}</td>
                        <td className="border border-border p-2 text-center">
                          <Badge variant="outline" className="text-[10px]">
                            {FREQUENCIA_LABELS[item.frequencia]}
                          </Badge>
                        </td>
                        <td className="border border-border p-2 text-center">
                          <Badge variant="secondary" className="text-[10px]">
                            {TIPO_PROCEDIMENTO_LABELS[item.tipo_procedimento]}
                          </Badge>
                        </td>
                        {MESES.map((_, idx) => (
                          <td 
                            key={idx} 
                            className={`border border-border p-1 text-center ${
                              activeMonths.includes(idx) ? 'bg-green-100 dark:bg-green-900/30' : ''
                            }`}
                          >
                            {activeMonths.includes(idx) && (
                              <Check className="h-3 w-3 mx-auto text-green-600" />
                            )}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Footer */}
              <div className="flex justify-between mt-8 pt-4">
                <div className="text-center">
                  <div className="border-t border-foreground w-48 mx-auto pt-1">
                    Elaborado por
                  </div>
                </div>
                <div className="text-center">
                  <div className="border-t border-foreground w-48 mx-auto pt-1">
                    Aprovado por
                  </div>
                </div>
                <div className="text-center">
                  <div className="border-t border-foreground w-48 mx-auto pt-1">
                    Data: ___/___/______
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedTemplate && items.length === 0 && (
          <p className="text-muted-foreground">
            O template selecionado não possui itens. Adicione itens na aba "Checklist".
          </p>
        )}

        {!selectedTemplate && (
          <p className="text-muted-foreground">
            Selecione um template para visualizar o plano anual.
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default AnnualPlanGenerator;
