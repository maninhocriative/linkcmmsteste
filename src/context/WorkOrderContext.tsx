import React, { createContext, useContext, useState, ReactNode } from 'react';
import { WorkOrder, User, PartUsed, Status } from '@/types';
import { mockUsers, mockWorkOrders, generateProtocolo } from '@/data/mockData';
import { v4 as uuidv4 } from 'uuid';

interface WorkOrderContextType {
  workOrders: WorkOrder[];
  users: User[];
  currentUser: User;
  createWorkOrder: (data: Omit<WorkOrder, 'id' | 'protocolo' | 'created_at' | 'status'>) => WorkOrder;
  updateWorkOrder: (id: string, data: Partial<WorkOrder>) => void;
  getWorkOrder: (id: string) => WorkOrder | undefined;
  startWorkOrder: (id: string) => void;
  closeWorkOrder: (id: string, data: { diagnostico: string; acao_corretiva: string; acao_preventiva: string; tempo_gasto: string; parts_used: PartUsed[]; evidencia_url?: string }) => void;
  addPartToWorkOrder: (workOrderId: string, part: Omit<PartUsed, 'id' | 'work_order_id'>) => void;
  removePartFromWorkOrder: (workOrderId: string, partId: string) => void;
}

const WorkOrderContext = createContext<WorkOrderContextType | undefined>(undefined);

export const WorkOrderProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>(mockWorkOrders);
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [currentUser] = useState<User>(mockUsers[0]);

  const createWorkOrder = (data: Omit<WorkOrder, 'id' | 'protocolo' | 'created_at' | 'status'>): WorkOrder => {
    const newOrder: WorkOrder = {
      ...data,
      id: uuidv4(),
      protocolo: generateProtocolo(),
      created_at: new Date().toISOString(),
      status: 'ABERTO',
      parts_used: [],
    };
    setWorkOrders((prev) => [...prev, newOrder]);
    return newOrder;
  };

  const updateWorkOrder = (id: string, data: Partial<WorkOrder>) => {
    setWorkOrders((prev) =>
      prev.map((order) => (order.id === id ? { ...order, ...data } : order))
    );
  };

  const getWorkOrder = (id: string): WorkOrder | undefined => {
    return workOrders.find((order) => order.id === id);
  };

  const startWorkOrder = (id: string) => {
    setWorkOrders((prev) =>
      prev.map((order) =>
        order.id === id
          ? { ...order, status: 'EM_ANDAMENTO' as Status, tecnico_id: currentUser.id, tecnico: currentUser }
          : order
      )
    );
    setUsers((prev) =>
      prev.map((user) =>
        user.id === currentUser.id ? { ...user, disponibilidade: 'OCUPADO' as const } : user
      )
    );
  };

  const closeWorkOrder = (
    id: string,
    data: {
      diagnostico: string;
      acao_corretiva: string;
      acao_preventiva: string;
      tempo_gasto: string;
      parts_used: PartUsed[];
      evidencia_url?: string;
    }
  ) => {
    setWorkOrders((prev) =>
      prev.map((order) =>
        order.id === id
          ? {
              ...order,
              ...data,
              status: 'FECHADO' as Status,
              closed_at: new Date().toISOString(),
            }
          : order
      )
    );
    setUsers((prev) =>
      prev.map((user) =>
        user.id === currentUser.id ? { ...user, disponibilidade: 'DISPONIVEL' as const } : user
      )
    );
  };

  const addPartToWorkOrder = (workOrderId: string, part: Omit<PartUsed, 'id' | 'work_order_id'>) => {
    const newPart: PartUsed = {
      ...part,
      id: uuidv4(),
      work_order_id: workOrderId,
    };
    setWorkOrders((prev) =>
      prev.map((order) =>
        order.id === workOrderId
          ? { ...order, parts_used: [...(order.parts_used || []), newPart] }
          : order
      )
    );
  };

  const removePartFromWorkOrder = (workOrderId: string, partId: string) => {
    setWorkOrders((prev) =>
      prev.map((order) =>
        order.id === workOrderId
          ? { ...order, parts_used: order.parts_used?.filter((p) => p.id !== partId) }
          : order
      )
    );
  };

  return (
    <WorkOrderContext.Provider
      value={{
        workOrders,
        users,
        currentUser,
        createWorkOrder,
        updateWorkOrder,
        getWorkOrder,
        startWorkOrder,
        closeWorkOrder,
        addPartToWorkOrder,
        removePartFromWorkOrder,
      }}
    >
      {children}
    </WorkOrderContext.Provider>
  );
};

export const useWorkOrder = () => {
  const context = useContext(WorkOrderContext);
  if (!context) {
    throw new Error('useWorkOrder must be used within a WorkOrderProvider');
  }
  return context;
};
