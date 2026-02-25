import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ArrowLeft,
  Search,
  ShoppingCart,
  FileSpreadsheet,
  FileText,
  Download,
  Package,
  Calendar,
  DollarSign,
  Truck,
  AlertTriangle,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { PartCatalog } from '@/types';
import { format, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface SelectedPart extends PartCatalog {
  quantidadeCompra: number;
}

const PurchasePlanningPage: React.FC = () => {
  const navigate = useNavigate();
  const [parts, setParts] = useState<PartCatalog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedParts, setSelectedParts] = useState<Map<string, SelectedPart>>(new Map());
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    fetchParts();
  }, []);

  const fetchParts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('parts_catalog')
      .select('*')
      .eq('status', 'ativo')
      .order('nome');

    if (error) {
      toast.error('Erro ao carregar peças');
      console.error(error);
    } else {
      setParts(data || []);
    }
    setLoading(false);
  };

  const filteredParts = parts.filter(
    (part) =>
      part.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      part.codigo_interno?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      part.categoria?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      part.fornecedor_padrao?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const lowStockParts = parts.filter((p) => (p.estoque_atual || 0) <= (p.estoque_minimo || 0));

  const togglePartSelection = (part: PartCatalog) => {
    const newSelected = new Map(selectedParts);
    if (newSelected.has(part.id)) {
      newSelected.delete(part.id);
    } else {
      const deficit = Math.max(0, (part.estoque_minimo || 0) - (part.estoque_atual || 0));
      newSelected.set(part.id, {
        ...part,
        quantidadeCompra: deficit > 0 ? deficit : 1,
      });
    }
    setSelectedParts(newSelected);
  };

  const updateQuantity = (partId: string, quantity: number) => {
    const newSelected = new Map(selectedParts);
    const part = newSelected.get(partId);
    if (part) {
      part.quantidadeCompra = Math.max(1, quantity);
      newSelected.set(partId, part);
      setSelectedParts(newSelected);
    }
  };

  const selectAllLowStock = () => {
    const newSelected = new Map(selectedParts);
    lowStockParts.forEach((part) => {
      if (!newSelected.has(part.id)) {
        const deficit = Math.max(1, (part.estoque_minimo || 0) - (part.estoque_atual || 0));
        newSelected.set(part.id, {
          ...part,
          quantidadeCompra: deficit,
        });
      }
    });
    setSelectedParts(newSelected);
    toast.success(`${lowStockParts.length} itens com estoque baixo selecionados`);
  };

  const clearSelection = () => {
    setSelectedParts(new Map());
  };

  // Cálculos do resumo
  const selectedPartsArray = Array.from(selectedParts.values());
  const totalCost = selectedPartsArray.reduce(
    (sum, part) => sum + (part.valor_medio || 0) * part.quantidadeCompra,
    0
  );
  const totalItems = selectedPartsArray.reduce((sum, part) => sum + part.quantidadeCompra, 0);
  const maxLeadTime = selectedPartsArray.length > 0
    ? Math.max(...selectedPartsArray.map((p) => p.prazo_medio_entrega || 0))
    : 0;
  const estimatedArrival = addDays(new Date(), maxLeadTime);

  // Exportar para Excel (CSV)
  const exportToExcel = () => {
    if (selectedPartsArray.length === 0) {
      toast.error('Selecione pelo menos um item');
      return;
    }

    setIsGenerating(true);
    try {
      const headers = [
        'Nome da Peça',
        'Código Interno',
        'Código Fabricante',
        'Categoria',
        'Fornecedor',
        'Quantidade',
        'Valor Unitário (R$)',
        'Valor Total (R$)',
        'Prazo Entrega (dias)',
        'Data Prevista Chegada',
        'Estoque Atual',
        'Estoque Mínimo',
      ];

      const rows = selectedPartsArray.map((part) => [
        part.nome,
        part.codigo_interno || '',
        part.codigo_fabricante || '',
        part.categoria || '',
        part.fornecedor_padrao || '',
        part.quantidadeCompra.toString(),
        (part.valor_medio || 0).toFixed(2).replace('.', ','),
        ((part.valor_medio || 0) * part.quantidadeCompra).toFixed(2).replace('.', ','),
        (part.prazo_medio_entrega || 0).toString(),
        format(addDays(new Date(), part.prazo_medio_entrega || 0), 'dd/MM/yyyy'),
        (part.estoque_atual || 0).toString(),
        (part.estoque_minimo || 0).toString(),
      ]);

      // Adicionar linha de totais
      rows.push([]);
      rows.push(['RESUMO DO ORÇAMENTO']);
      rows.push(['Total de Itens:', totalItems.toString()]);
      rows.push(['Custo Total:', `R$ ${totalCost.toFixed(2).replace('.', ',')}`]);
      rows.push(['Prazo Máximo:', `${maxLeadTime} dias`]);
      rows.push(['Data Prevista Chegada:', format(estimatedArrival, 'dd/MM/yyyy')]);

      const csvContent =
        '\uFEFF' + // BOM for UTF-8
        headers.join(';') +
        '\n' +
        rows.map((row) => row.join(';')).join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `plano_compras_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.csv`;
      link.click();

      toast.success('Planilha exportada com sucesso!');
    } catch (error) {
      console.error('Erro ao exportar:', error);
      toast.error('Erro ao exportar planilha');
    } finally {
      setIsGenerating(false);
    }
  };

  // Exportar para PDF
  const exportToPDF = () => {
    if (selectedPartsArray.length === 0) {
      toast.error('Selecione pelo menos um item');
      return;
    }

    setIsGenerating(true);
    try {
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        toast.error('Permita popups para gerar o PDF');
        return;
      }

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Plano de Compras - ${format(new Date(), 'dd/MM/yyyy')}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 20px;
              color: #333;
            }
            .header {
              text-align: center;
              border-bottom: 2px solid #e60012;
              padding-bottom: 20px;
              margin-bottom: 20px;
            }
            .header h1 {
              color: #e60012;
              margin: 0;
            }
            .header p {
              color: #666;
              margin: 5px 0 0;
            }
            .summary {
              display: flex;
              justify-content: space-between;
              background: #f5f5f5;
              padding: 15px;
              border-radius: 8px;
              margin-bottom: 20px;
            }
            .summary-item {
              text-align: center;
            }
            .summary-item .value {
              font-size: 24px;
              font-weight: bold;
              color: #e60012;
            }
            .summary-item .label {
              font-size: 12px;
              color: #666;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 10px;
              text-align: left;
              font-size: 12px;
            }
            th {
              background: #e60012;
              color: white;
            }
            tr:nth-child(even) {
              background: #f9f9f9;
            }
            .text-right {
              text-align: right;
            }
            .text-center {
              text-align: center;
            }
            .total-row {
              font-weight: bold;
              background: #f0f0f0 !important;
            }
            .footer {
              margin-top: 30px;
              text-align: center;
              font-size: 10px;
              color: #999;
            }
            @media print {
              body { margin: 0; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Plano de Compras</h1>
            <p>Sistema de Manutenção Honda Brasil</p>
            <p>Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
          </div>

          <div class="summary">
            <div class="summary-item">
              <div class="value">${selectedPartsArray.length}</div>
              <div class="label">Tipos de Peças</div>
            </div>
            <div class="summary-item">
              <div class="value">${totalItems}</div>
              <div class="label">Total de Itens</div>
            </div>
            <div class="summary-item">
              <div class="value">R$ ${totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
              <div class="label">Custo Total</div>
            </div>
            <div class="summary-item">
              <div class="value">${maxLeadTime} dias</div>
              <div class="label">Prazo Máximo</div>
            </div>
            <div class="summary-item">
              <div class="value">${format(estimatedArrival, 'dd/MM/yyyy')}</div>
              <div class="label">Previsão Chegada</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Peça</th>
                <th>Código</th>
                <th>Fornecedor</th>
                <th class="text-center">Qtd</th>
                <th class="text-right">Valor Unit.</th>
                <th class="text-right">Valor Total</th>
                <th class="text-center">Prazo</th>
                <th class="text-center">Previsão</th>
              </tr>
            </thead>
            <tbody>
              ${selectedPartsArray
                .map(
                  (part) => `
                <tr>
                  <td>${part.nome}</td>
                  <td>${part.codigo_interno || '-'}</td>
                  <td>${part.fornecedor_padrao || '-'}</td>
                  <td class="text-center">${part.quantidadeCompra}</td>
                  <td class="text-right">R$ ${(part.valor_medio || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                  <td class="text-right">R$ ${((part.valor_medio || 0) * part.quantidadeCompra).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                  <td class="text-center">${part.prazo_medio_entrega || 0} dias</td>
                  <td class="text-center">${format(addDays(new Date(), part.prazo_medio_entrega || 0), 'dd/MM/yyyy')}</td>
                </tr>
              `
                )
                .join('')}
              <tr class="total-row">
                <td colspan="3">TOTAL</td>
                <td class="text-center">${totalItems}</td>
                <td class="text-right">-</td>
                <td class="text-right">R$ ${totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                <td class="text-center">${maxLeadTime} dias</td>
                <td class="text-center">${format(estimatedArrival, 'dd/MM/yyyy')}</td>
              </tr>
            </tbody>
          </table>

          <div class="footer">
            <p>Documento gerado automaticamente pelo Sistema de Manutenção Honda Brasil</p>
          </div>

          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
        </html>
      `;

      printWindow.document.write(html);
      printWindow.document.close();

      toast.success('PDF gerado com sucesso!');
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast.error('Erro ao gerar PDF');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-6 pb-8">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-semibold text-foreground">
                Planejamento de Compras
              </h1>
              <p className="text-sm text-muted-foreground">
                Selecione peças e gere orçamentos para aquisição
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            {lowStockParts.length > 0 && (
              <Button variant="outline" onClick={selectAllLowStock} className="gap-2">
                <AlertTriangle className="h-4 w-4 text-warning" />
                Selecionar Estoque Baixo ({lowStockParts.length})
              </Button>
            )}
          </div>
        </div>

        {/* Summary Cards */}
        {selectedPartsArray.length > 0 && (
          <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Package className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{selectedPartsArray.length}</p>
                  <p className="text-xs text-muted-foreground">Tipos de Peças</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                  <ShoppingCart className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalItems}</p>
                  <p className="text-xs text-muted-foreground">Total de Itens</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
                  <DollarSign className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {totalCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </p>
                  <p className="text-xs text-muted-foreground">Custo Total</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/10">
                  <Calendar className="h-5 w-5 text-orange-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{maxLeadTime} dias</p>
                  <p className="text-xs text-muted-foreground">
                    Chegada: {format(estimatedArrival, 'dd/MM', { locale: ptBR })}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Actions Bar */}
        {selectedPartsArray.length > 0 && (
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-lg border bg-card p-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              <span className="font-medium">
                {selectedPartsArray.length} peça(s) selecionada(s)
              </span>
              <Button variant="ghost" size="sm" onClick={clearSelection}>
                Limpar
              </Button>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={exportToExcel}
                disabled={isGenerating}
                className="gap-2"
              >
                {isGenerating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FileSpreadsheet className="h-4 w-4" />
                )}
                Baixar Excel
              </Button>
              <Button
                onClick={exportToPDF}
                disabled={isGenerating}
                className="gap-2"
              >
                {isGenerating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FileText className="h-4 w-4" />
                )}
                Gerar PDF
              </Button>
            </div>
          </div>
        )}

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, código, categoria ou fornecedor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Parts Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Catálogo de Peças
            </CardTitle>
            <CardDescription>
              Selecione as peças que deseja incluir no plano de compras
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : filteredParts.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12"></TableHead>
                      <TableHead>Peça</TableHead>
                      <TableHead>Código</TableHead>
                      <TableHead>Fornecedor</TableHead>
                      <TableHead className="text-right">Valor Unit.</TableHead>
                      <TableHead className="text-center">Estoque</TableHead>
                      <TableHead className="text-center">Prazo</TableHead>
                      <TableHead className="text-center w-[100px]">Qtd. Compra</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredParts.map((part) => {
                      const isSelected = selectedParts.has(part.id);
                      const selectedPart = selectedParts.get(part.id);
                      const isLowStock = (part.estoque_atual || 0) <= (part.estoque_minimo || 0);

                      return (
                        <TableRow
                          key={part.id}
                          className={isSelected ? 'bg-primary/5' : ''}
                        >
                          <TableCell>
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => togglePartSelection(part)}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {isLowStock && (
                                <AlertTriangle className="h-4 w-4 text-warning" />
                              )}
                              <div>
                                <p className="font-medium">{part.nome}</p>
                                <p className="text-xs text-muted-foreground">
                                  {part.categoria || 'Sem categoria'}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="font-mono text-sm">
                              {part.codigo_interno || '-'}
                            </span>
                          </TableCell>
                          <TableCell>{part.fornecedor_padrao || '-'}</TableCell>
                          <TableCell className="text-right">
                            {(part.valor_medio || 0).toLocaleString('pt-BR', {
                              style: 'currency',
                              currency: 'BRL',
                            })}
                          </TableCell>
                          <TableCell className="text-center">
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                isLowStock
                                  ? 'bg-destructive/10 text-destructive'
                                  : 'bg-green-500/10 text-green-600'
                              }`}
                            >
                              {part.estoque_atual || 0} / {part.estoque_minimo || 0}
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Truck className="h-3 w-3 text-muted-foreground" />
                              <span className="text-sm">
                                {part.prazo_medio_entrega || 0}d
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {isSelected && selectedPart && (
                              <Input
                                type="number"
                                min="1"
                                value={selectedPart.quantidadeCompra}
                                onChange={(e) =>
                                  updateQuantity(part.id, parseInt(e.target.value) || 1)
                                }
                                className="h-8 w-20 text-center"
                              />
                            )}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {isSelected && selectedPart && (
                              <span className="text-primary">
                                {((part.valor_medio || 0) * selectedPart.quantidadeCompra).toLocaleString(
                                  'pt-BR',
                                  { style: 'currency', currency: 'BRL' }
                                )}
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Package className="mb-3 h-12 w-12 text-muted-foreground/50" />
                <p className="text-muted-foreground">Nenhuma peça encontrada</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default PurchasePlanningPage;
