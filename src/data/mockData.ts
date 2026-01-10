import { Asset, User, WorkOrder } from '@/types';

export const mockAssets: Asset[] = [
  {
    id: 'asset-001',
    qr_code_value: 'HONDA-CNC-001',
    nome: 'CNC Fresadora Vertical',
    codigo_interno: 'CNC-FV-001',
    setor_padrao: 'Produção',
    local_padrao: 'Linha A',
    status: 'ativo',
  },
  {
    id: 'asset-002',
    qr_code_value: 'HONDA-PRENSA-002',
    nome: 'Prensa Hidráulica 200T',
    codigo_interno: 'PH-200-002',
    setor_padrao: 'Estamparia',
    local_padrao: 'Célula 3',
    status: 'ativo',
  },
  {
    id: 'asset-003',
    qr_code_value: 'HONDA-ROBO-003',
    nome: 'Robô de Solda FANUC',
    codigo_interno: 'RS-FANUC-003',
    setor_padrao: 'Soldagem',
    local_padrao: 'Estação 5',
    status: 'ativo',
  },
];

export const mockUsers: User[] = [
  {
    id: 'user-001',
    nome: 'Carlos Silva',
    role: 'MANUTENCAO',
    disponibilidade: 'DISPONIVEL',
  },
  {
    id: 'user-002',
    nome: 'Maria Santos',
    role: 'MANUTENCAO',
    disponibilidade: 'OCUPADO',
  },
  {
    id: 'user-003',
    nome: 'João Operador',
    role: 'OPERACAO',
    disponibilidade: 'DISPONIVEL',
  },
];

let orderCounter = 1;

export const generateProtocolo = (): string => {
  const num = orderCounter++;
  return `OS-${String(num).padStart(6, '0')}`;
};

export const mockWorkOrders: WorkOrder[] = [];

export const findAssetByQR = (qrValue: string): Asset | undefined => {
  return mockAssets.find(
    (asset) => asset.qr_code_value.toLowerCase() === qrValue.toLowerCase()
  );
};

export const findAssetByCode = (code: string): Asset | undefined => {
  return mockAssets.find(
    (asset) =>
      asset.codigo_interno.toLowerCase() === code.toLowerCase() ||
      asset.qr_code_value.toLowerCase() === code.toLowerCase()
  );
};
