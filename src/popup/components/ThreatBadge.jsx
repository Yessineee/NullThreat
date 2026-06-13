import { cn } from '../../lib/utils.js'
import { ShieldCheck, ShieldAlert, ShieldQuestion } from 'lucide-react';

const config = {
  clean: {
    label: 'Clean',
    icon: ShieldCheck,
    classes: 'bg-brand-500/10 text-brand-500 border-brand-500/20',
  },
  threat: {
    label: 'Threat',
    icon: ShieldAlert,
    classes: 'bg-destructive/10 text-destructive border-destructive/20',
  },
  unknown: {
    label: 'Unknown',
    icon: ShieldQuestion,
    classes: 'bg-muted text-muted-foreground border-border',
  },
}

export default function ThreatBadge({ status, size = 'sm' }) {
  const { label, icon: Icon, classes } = config[status] || config.unknown

  return (
    <span className={cn(
      'inline-flex items-center gap-1 rounded-full border font-medium',
      size === 'sm' && 'text-[10px] px-2 py-0.5',
      size === 'md' && 'text-xs px-2.5 py-1',
      classes
    )}>
      <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
      {label}
    </span>
  )
}