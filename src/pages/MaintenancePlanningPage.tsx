import React, { useState } from 'react';
import Header from '@/components/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, FileText, Settings2, ClipboardList, Trash2, Edit, Check, LinkIcon } from 'lucide-react';
import { 
  useMaintenanceTemplates, 
  useTemplateItems, 
  useAssetsWithTemplates,
  useCreateTemplate,
  useCreateItem,
  useDeleteItem,
  useAssignTemplateToAsset
} from '@/hooks/useMaintenancePlans';
import { 
  MaintenancePlanTemplate, 
  MaintenancePlanItem,
  FrequenciaManutencao, 
  TipoProcedimento,
  FREQUENCIA_LABELS, 
  TIPO_PROCEDIMENTO_LABELS,
  MESES,
  getMonthsForFrequency 
} from '@/types/maintenance';
import AnnualPlanGenerator from '@/components/maintenance/AnnualPlanGenerator';

const MaintenancePlanningPage: React.FC = () => {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('templates');
  const [showNewTemplateDialog, setShowNewTemplateDialog] = useState(false);
  const [showNewItemDialog, setShowNewItemDialog] = useState(false);
  const [showAssignDialog, setShowAssignDialog] = useState(false);

  // Form states
  const [newTemplate, setNewTemplate] = useState({ nome: '', modelo_equipamento: '', descricao: '' });
  const [newItem, setNewItem] = useState({
    item_number: '',
    componente: '',
    ponto_verificacao: '',
    frequencia: 'MENSAL' as FrequenciaManutencao,
    tipo_procedimento: 'VISUAL' as TipoProcedimento,
    instrucoes: '',
  });
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);

  // Queries
  const { data: templates = [], isLoading: loadingTemplates } = useMaintenanceTemplates();
  const { data: items = [], isLoading: loadingItems } = useTemplateItems(selectedTemplateId);
  const { data: assets = [], isLoading: loadingAssets } = useAssetsWithTemplates();

  // Mutations
  const createTemplate = useCreateTemplate();
  const createItem = useCreateItem();
  const deleteItem = useDeleteItem();
  const assignTemplate = useAssignTemplateToAsset();

  const selectedTemplate = templates.find(t => t.id === selectedTemplateId);

  const handleCreateTemplate = () => {
    if (!newTemplate.nome.trim()) return;
    createTemplate.mutate({
      nome: newTemplate.nome,
      modelo_equipamento: newTemplate.modelo_equipamento || undefined,
      descricao: newTemplate.descricao || undefined,
      status: 'ativo',
    }, {
      onSuccess: () => {
        setShowNewTemplateDialog(false);
        setNewTemplate({ nome: '', modelo_equipamento: '', descricao: '' });
      }
    });
  };

  const handleCreateItem = () => {
    if (!selectedTemplateId || !newItem.componente.trim() || !newItem.ponto_verificacao.trim()) return;
    createItem.mutate({
      template_id: selectedTemplateId,
      item_number: newItem.item_number || `${items.length + 1}.0`,
      componente: newItem.componente,
      ponto_verificacao: newItem.ponto_verificacao,
      frequencia: newItem.frequencia,
      tipo_procedimento: newItem.tipo_procedimento,
      instrucoes: newItem.instrucoes || undefined,
      ordem: items.length,
    }, {
      onSuccess: () => {
        setShowNewItemDialog(false);
        setNewItem({
          item_number: '',
          componente: '',
          ponto_verificacao: '',
          frequencia: 'MENSAL',
          tipo_procedimento: 'VISUAL',
          instrucoes: '',
        });
      }
    });
  };

  const handleAssignTemplate = () => {
    if (!selectedAssetId || !selectedTemplateId) return;
    assignTemplate.mutate({ assetId: selectedAssetId, templateId: selectedTemplateId }, {
      onSuccess: () => {
        setShowAssignDialog(false);
        setSelectedAssetId(null);
      }
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">
            Planejamento de Manutenção
          </h1>
          <p className="mt-1 text-muted-foreground">
            Gerencie checklists e planos de manutenção preventiva
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-flex">
            <TabsTrigger value="templates" className="gap-2">
              <ClipboardList className="h-4 w-4" />
              Templates
            </TabsTrigger>
            <TabsTrigger value="checklist" className="gap-2">
              <Settings2 className="h-4 w-4" />
              Checklist
            </TabsTrigger>
            <TabsTrigger value="plano" className="gap-2">
              <FileText className="h-4 w-4" />
              Plano Anual
            </TabsTrigger>
          </TabsList>

          {/* Templates Tab */}
          <TabsContent value="templates" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Templates de Checklist</CardTitle>
                  <CardDescription>Modelos base de checklist por tipo de equipamento</CardDescription>
                </div>
                <Dialog open={showNewTemplateDialog} onOpenChange={setShowNewTemplateDialog}>
                  <DialogTrigger asChild>
                    <Button className="gap-2">
                      <Plus className="h-4 w-4" />
                      Novo Template
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Criar Novo Template</DialogTitle>
                      <DialogDescription>
                        Crie um modelo de checklist para um tipo de equipamento
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="nome">Nome do Template *</Label>
                        <Input
                          id="nome"
                          value={newTemplate.nome}
                          onChange={(e) => setNewTemplate(prev => ({ ...prev, nome: e.target.value }))}
                          placeholder="Ex: Checklist Pistola de Pintura"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="modelo">Modelo de Equipamento</Label>
                        <Input
                          id="modelo"
                          value={newTemplate.modelo_equipamento}
                          onChange={(e) => setNewTemplate(prev => ({ ...prev, modelo_equipamento: e.target.value }))}
                          placeholder="Ex: Gema GM03"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="descricao">Descrição</Label>
                        <Textarea
                          id="descricao"
                          value={newTemplate.descricao}
                          onChange={(e) => setNewTemplate(prev => ({ ...prev, descricao: e.target.value }))}
                          placeholder="Descrição do template..."
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowNewTemplateDialog(false)}>
                        Cancelar
                      </Button>
                      <Button onClick={handleCreateTemplate} disabled={createTemplate.isPending}>
                        Criar Template
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {loadingTemplates ? (
                  <p className="text-muted-foreground">Carregando...</p>
                ) : templates.length === 0 ? (
                  <p className="text-muted-foreground">Nenhum template cadastrado</p>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {templates.map((template) => (
                      <Card 
                        key={template.id} 
                        className={`cursor-pointer transition-all hover:shadow-md ${
                          selectedTemplateId === template.id ? 'ring-2 ring-primary' : ''
                        }`}
                        onClick={() => {
                          setSelectedTemplateId(template.id);
                          setActiveTab('checklist');
                        }}
                      >
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">{template.nome}</CardTitle>
                          {template.modelo_equipamento && (
                            <Badge variant="secondary" className="w-fit">
                              {template.modelo_equipamento}
                            </Badge>
                          )}
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {template.descricao || 'Sem descrição'}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Checklist Tab */}
          <TabsContent value="checklist" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>
                    {selectedTemplate ? selectedTemplate.nome : 'Selecione um Template'}
                  </CardTitle>
                  <CardDescription>
                    {selectedTemplate 
                      ? `Itens do checklist • ${items.length} item(s)`
                      : 'Clique em um template na aba anterior para editar'
                    }
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  {selectedTemplate && (
                    <>
                      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
                        <DialogTrigger asChild>
                          <Button variant="outline" className="gap-2">
                            <LinkIcon className="h-4 w-4" />
                            Vincular Ativo
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Vincular Template a Ativo</DialogTitle>
                            <DialogDescription>
                              Selecione um equipamento para usar este checklist
                            </DialogDescription>
                          </DialogHeader>
                          <div className="py-4">
                            <Label>Equipamento</Label>
                            <Select value={selectedAssetId || ''} onValueChange={setSelectedAssetId}>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione um ativo" />
                              </SelectTrigger>
                              <SelectContent>
                                {assets.map((asset) => (
                                  <SelectItem key={asset.id} value={asset.id}>
                                    {asset.nome} {asset.tag && `(${asset.tag})`}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setShowAssignDialog(false)}>
                              Cancelar
                            </Button>
                            <Button onClick={handleAssignTemplate} disabled={!selectedAssetId || assignTemplate.isPending}>
                              Vincular
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                      <Dialog open={showNewItemDialog} onOpenChange={setShowNewItemDialog}>
                        <DialogTrigger asChild>
                          <Button className="gap-2">
                            <Plus className="h-4 w-4" />
                            Novo Item
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-lg">
                          <DialogHeader>
                            <DialogTitle>Adicionar Item ao Checklist</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label>Nº Item</Label>
                                <Input
                                  value={newItem.item_number}
                                  onChange={(e) => setNewItem(prev => ({ ...prev, item_number: e.target.value }))}
                                  placeholder="1.0"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Componente *</Label>
                                <Input
                                  value={newItem.componente}
                                  onChange={(e) => setNewItem(prev => ({ ...prev, componente: e.target.value }))}
                                  placeholder="Ex: Bico"
                                />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label>Ponto de Verificação *</Label>
                              <Textarea
                                value={newItem.ponto_verificacao}
                                onChange={(e) => setNewItem(prev => ({ ...prev, ponto_verificacao: e.target.value }))}
                                placeholder="Ex: Não deve estar batido ou amassado"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label>Frequência</Label>
                                <Select 
                                  value={newItem.frequencia} 
                                  onValueChange={(v) => setNewItem(prev => ({ ...prev, frequencia: v as FrequenciaManutencao }))}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {Object.entries(FREQUENCIA_LABELS).map(([key, label]) => (
                                      <SelectItem key={key} value={key}>{label}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <Label>Tipo de Procedimento</Label>
                                <Select 
                                  value={newItem.tipo_procedimento}
                                  onValueChange={(v) => setNewItem(prev => ({ ...prev, tipo_procedimento: v as TipoProcedimento }))}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {Object.entries(TIPO_PROCEDIMENTO_LABELS).map(([key, label]) => (
                                      <SelectItem key={key} value={key}>{label}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label>Instruções</Label>
                              <Textarea
                                value={newItem.instrucoes}
                                onChange={(e) => setNewItem(prev => ({ ...prev, instrucoes: e.target.value }))}
                                placeholder="Instruções detalhadas..."
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setShowNewItemDialog(false)}>
                              Cancelar
                            </Button>
                            <Button onClick={handleCreateItem} disabled={createItem.isPending}>
                              Adicionar Item
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {!selectedTemplate ? (
                  <p className="text-muted-foreground">Selecione um template para visualizar os itens</p>
                ) : loadingItems ? (
                  <p className="text-muted-foreground">Carregando itens...</p>
                ) : items.length === 0 ? (
                  <p className="text-muted-foreground">Nenhum item no checklist. Clique em "Novo Item" para adicionar.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-16">Nº</TableHead>
                          <TableHead>Componente</TableHead>
                          <TableHead>Ponto de Verificação</TableHead>
                          <TableHead className="w-28">Frequência</TableHead>
                          <TableHead className="w-32">Tipo</TableHead>
                          <TableHead className="w-20">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {items.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">{item.item_number}</TableCell>
                            <TableCell>{item.componente}</TableCell>
                            <TableCell className="max-w-xs truncate">{item.ponto_verificacao}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{FREQUENCIA_LABELS[item.frequencia]}</Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary">{TIPO_PROCEDIMENTO_LABELS[item.tipo_procedimento]}</Badge>
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive"
                                onClick={() => deleteItem.mutate({ id: item.id, templateId: selectedTemplateId! })}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Annual Plan Tab */}
          <TabsContent value="plano" className="space-y-4">
            <AnnualPlanGenerator 
              templates={templates}
              selectedTemplateId={selectedTemplateId}
              onSelectTemplate={setSelectedTemplateId}
              items={items}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default MaintenancePlanningPage;
