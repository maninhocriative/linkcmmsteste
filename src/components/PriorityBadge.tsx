import React from 'react';
import { Prioridade } from '@/types';

interface PriorityBadgeProps {
  priority: Prioridade;
}

const priorityConfig: Record<Prioridade, { label: string; className: string }> = {
  BAIXA: {
    label: 'Baixa',
    className: 'priority-baixa',
  },
  MEDIA: {
    label: 'Média',
    className: 'priority-media',
  },
  ALTA: {
    label: 'Alta',
    className: 'priority-alta',
  },
  CRITICA: {
    label: 'Crítica',
    className: 'priority-critica',
  },
};

const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority }) => {
  const config = priorityConfig[priority];

  return <span className={`priority-badge ${config.className}`}>{config.label}</span>;
};

export default PriorityBadge;
