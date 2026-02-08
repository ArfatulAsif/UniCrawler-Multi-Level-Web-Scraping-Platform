// src/components/StatusBadge.tsx
import React from 'react';
import type { ConnectionStatus } from '../types';
import { Loader2, Wifi, WifiOff, CheckCircle } from 'lucide-react';
import { clsx } from 'clsx';

export const StatusBadge: React.FC<{ status: ConnectionStatus }> = ({ status }) => {
  const config = {
    idle: { color: 'bg-gray-100 text-gray-500', icon: WifiOff, text: 'System Idle' },
    connecting: { color: 'bg-yellow-100 text-yellow-700', icon: Loader2, text: 'Connecting...', animate: true },
    scanning: { color: 'bg-blue-100 text-blue-700', icon: Wifi, text: 'Live Scanning' },
    complete: { color: 'bg-green-100 text-green-700', icon: CheckCircle, text: 'Scan Complete' },
    error: { color: 'bg-red-100 text-red-700', icon: WifiOff, text: 'Connection Error' },
  };

  const current = config[status];
  const Icon = current.icon;

  return (
    <div className={clsx(
      "px-3 py-1 rounded-full text-xs font-medium flex items-center gap-2 border",
      current.color,
      status === 'error' ? 'border-red-200' : 'border-transparent'
    )}>
      <Icon size={14} className={current.animate ? "animate-spin" : ""} />
      {current.text}
    </div>
  );
};