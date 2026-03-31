"use client"

import Link from "next/link"
import { useState } from "react"
import { CloudUpload, Plug, Upload } from "lucide-react"

import { AppShell } from "@/components/layout/app-shell"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"

const connections = [
  { name: "Alpaca", status: "Disconnected" },
  { name: "Tradier", status: "Disconnected" },
  { name: "Oanda", status: "Disconnected" },
]

export default function ImportsPage() {
  const [csv, setCsv] = useState("")
  const [status, setStatus] = useState<string | null>(null)
  const [preview, setPreview] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit() {
    setIsLoading(true)
    try {
      const res = await fetch("/api/imports/csv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csv }),
      })
      const json = await res.json()
      setStatus(json.message ?? "Imported")
      setPreview(json.preview ?? [])
    } catch (e: any) {
      setStatus(e?.message ?? "Import failed")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AppShell
      title="Imports"
      cta={
        <Button asChild className="bg-[--primary] text-[--primary-foreground]">
          <Link href="#">Start import</Link>
        </Button>
      }
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <CsvWizard />

        <Card className="border-border/70 bg-card/80 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Plug className="h-5 w-5" />
              Broker Connections
            </CardTitle>
            <CardDescription>Connect paper/live accounts to sync executions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {connections.map((c) => (
              <div key={c.name} className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2">
                <div className="text-sm font-medium">{c.name}</div>
                <Badge variant="outline" className="capitalize border-border/70">
                  {c.status}
                </Badge>
              </div>
            ))}
            <Button asChild variant="outline" className="w-full">
              <Link href="#">Add connection</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}

import Papa from "papaparse"
import { UploadCloud, File, AlertCircle } from "lucide-react"

function CsvWizard() {
  const [file, setFile] = useState<File | null>(null)
  const [status, setStatus] = useState<string | null>(null)
  const [preview, setPreview] = useState<any[]>([])
  const [parsedData, setParsedData] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0]
      setFile(selectedFile)
      setStatus(null)
      
      Papa.parse(selectedFile, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.errors.length > 0) {
            setStatus("Parse error: " + results.errors[0].message)
          } else {
            setParsedData(results.data)
            setPreview(results.data.slice(0, 5))
          }
        },
      })
    }
  }

  const handleImport = async () => {
    if (parsedData.length === 0) return
    setIsLoading(true)
    setStatus(null)

    try {
      // In a real app we would map this dynamically, but for now we expect typical headers
      // or we can just send the raw JSON array and let the backend handle the mapping logic
      // Since our new parsing sends JSON, we'll alter the backend to accept an array of objects
      const res = await fetch("/api/imports/csv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ trades: parsedData }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || "Import failed")
      
      setStatus(`Successfully Imported ${json.inserted} trades!`)
      setFile(null)
      setParsedData([])
      setPreview([])
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Import failed")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="border-border/70 bg-card/80 backdrop-blur shadow-lg">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2 text-indigo-400">
          <CloudUpload className="h-5 w-5" />
          CSV Upload
        </CardTitle>
        <CardDescription>Upload a CSV file from any broker to import your trading history.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {!file ? (
          <div className="border-2 border-dashed border-slate-700/50 rounded-lg p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-slate-800/50 transition-colors relative group">
            <input 
              type="file" 
              accept=".csv" 
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              onChange={handleFileChange}
            />
            <UploadCloud className="h-10 w-10 text-slate-400 mb-3 group-hover:text-indigo-400 transition-colors" />
            <h3 className="font-medium text-slate-200">Click or drag CSV file here</h3>
            <p className="text-sm text-slate-500 mt-1">Maximum file size 5MB</p>
          </div>
        ) : (
          <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-500/10 p-2 rounded text-indigo-400">
                <File className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-200">{file.name}</p>
                <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB • {parsedData.length} rows</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => { setFile(null); setParsedData([]); setPreview([]); setStatus(null); }}>
              Remove
            </Button>
          </div>
        )}

        {preview.length > 0 && (
           <div className="space-y-3">
             <h4 className="text-sm font-medium text-slate-400">Preview Data</h4>
             <div className="bg-slate-950 rounded-md overflow-hidden overflow-x-auto border border-slate-800">
               <table className="w-full text-left text-xs text-slate-300">
                 <thead className="bg-slate-900 text-slate-400">
                   <tr>
                     <th className="px-3 py-2">Symbol</th>
                     <th className="px-3 py-2">Entry Time</th>
                     <th className="px-3 py-2 text-right">P&L</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-800">
                   {preview.map((row, i) => (
                     <tr key={i}>
                       <td className="px-3 py-2 font-medium">{row.symbol || row.Symbol || row.ticker || "N/A"}</td>
                       <td className="px-3 py-2">{row.entry_time || row.Date || row.time || "N/A"}</td>
                       <td className="px-3 py-2 text-right">{row.profit_loss || row.PnL || row.pnl || "$0.00"}</td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
           </div>
        )}

        {status && (
          <div className={`p-3 rounded-md text-sm flex items-start gap-2 ${status.includes('fail') || status.includes('error') ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <p>{status}</p>
          </div>
        )}

        <Button onClick={handleImport} disabled={isLoading || parsedData.length === 0} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
          {isLoading ? "Importing to Database..." : "Import " + (parsedData.length > 0 ? parsedData.length + " Trades" : "Trades")}
        </Button>
        <Separator className="border-slate-800" />
        <div className="text-xs text-slate-500 flex justify-between">
          <span>Required headers: symbol, entry_time</span>
          <Link href="#" className="text-indigo-400 hover:underline">Download template</Link>
        </div>
      </CardContent>
    </Card>
  )
}
