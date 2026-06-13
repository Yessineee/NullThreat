import { cn } from '../../../lib/utils.js'

export default function StatCard({ label, value, sub, icon: Icon, accent = 'brand' }) {
  const accents = {
    brand: 'border-l-brand-500 text-brand-500',
    threat: 'border-l-destructive text-destructive',
    muted: 'border-l-muted-foreground text-muted-foreground',
    warning: 'border-l-yellow-500 text-yellow-500',
  }

  return (
    <div className={cn(
      'bg-card border border-border rounded-xl p-4 border-l-2',
      accents[accent]
    )}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1">
            {label}
          </p>
          <p className="text-2xl font-mono font-semibold text-foreground">{value}</p>
          {sub && <p className="text-[11px] text-muted-foreground mt-1">{sub}</p>}
        </div>
        {Icon && (
          <div className={cn(
            'w-8 h-8 rounded-lg flex items-center justify-center',
            accent === 'brand' && 'bg-brand-500/10',
            accent === 'threat' && 'bg-destructive/10',
            accent === 'muted' && 'bg-muted',
            accent === 'warning' && 'bg-yellow-500/10',
          )}>
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>
    </div>
  )
}