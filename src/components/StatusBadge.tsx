import React from 'react';
import { Status } from '@/types';
import { Clock, PlayCircle, CheckCircle2 } from 'lucide-react';

interface StatusBadgeProps {
  status: Status;
  size?: 'sm' | 'md' | 'lg';
}

const statusConfig: Record<Status, { label: string; className: string; Icon: React.FC<{ className?: string }> }> = {
  ABERTO: {
    label: 'Aberto',
    className: 'status-aberto',
    Icon: Clock,
  },
  EM_ANDAMENTO: {
    label: 'Em Andamento',
    className: 'status-em-andamento',
    Icon: PlayCircle,
  },
  FECHADO: {
    label: 'Fechado',
    className: 'status-fechado',
    Icon: CheckCircle2,
  },
};

const sizeClasses = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-3 py-1 text-xs',
  lg: 'px-4 py-1.5 text-sm',
};

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const config = statusConfig[status];
  const Icon = config.Icon;

  return (
    <span className={`status-badge ${config.className} ${sizeClasses[size]}`}>
      <Icon className="mr-1.5 h-3.5 w-3.5" />
      {config.label}
    </span>
  );
};

export default StatusBadge;
