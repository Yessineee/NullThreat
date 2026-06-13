import { Search } from 'lucide-react'

export default function ScanningState({ filename }) {
  return (
    <div className="flex flex-col items-center gap-3 py-4">
      <div className="relative">
        <div className="w-10 h-10 rounded-full border-2 border-brand-500/20 border-t-brand-500 animate-spin" />
        <Search className="w-4 h-4 text-brand-500 absolute inset-0 m-auto" />
      </div>
      <div className="flex flex-col items-center gap-1">
        <p className="text-xs font-medium text-foreground">Scanning via VirusTotal</p>
        <p className="text-[10px] text-muted-foreground font-mono truncate max-w-[240px]">
          {filename}
        </p>
        <p className="text-[10px] text-muted-foreground">This may take up to 60 seconds</p>
      </div>
    </div>
  )
}