"use client"

import * as React from "react"
import { useTransition } from "react"
import { Save } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { saveJournalNote } from "./actions"

export function JournalEditor({ date, initialNotes }: { date: string; initialNotes: string }) {
  const [notes, setNotes] = React.useState(initialNotes)
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = React.useState(false)

  const handleSave = () => {
    startTransition(async () => {
      await saveJournalNote(date, notes)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-white">Daily Notes</h3>
        <Button 
          size="sm" 
          onClick={handleSave} 
          disabled={isPending || notes === initialNotes}
          className="bg-indigo-600 hover:bg-indigo-700 text-white"
        >
          <Save className="h-4 w-4 mr-2" />
          {saved ? "Saved!" : isPending ? "Saving..." : "Save Notes"}
        </Button>
      </div>
      <Textarea
        placeholder={`Write down your thoughts, emotions, and lessons learned for ${date}...`}
        className="min-h-[200px] bg-slate-900/40 border-slate-700 text-slate-100 placeholder:text-slate-500 focus-visible:ring-indigo-500"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />
    </div>
  )
}
