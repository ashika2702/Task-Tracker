"use client";

import { useState } from "react";
import { Plus, Loader2 } from "lucide-react";

interface TaskInputProps {
  onAddTask: (title: string) => Promise<void>;
}

export default function TaskInput({ onAddTask }: TaskInputProps) {
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || loading) return;

    setLoading(true);
    try {
      await onAddTask(title);
      setTitle("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative">
      <div className="relative flex items-center">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What do you need to accomplish? (Press Enter to add)"
          disabled={loading}
          className="w-full pl-4 pr-24 py-3.5 rounded-2xl bg-white border border-slate-200/90 text-sm text-slate-800 placeholder-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all disabled:opacity-60"
        />

        <button
          type="submit"
          disabled={!title.trim() || loading}
          className="absolute right-2 top-2 bottom-2 px-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 text-white disabled:text-slate-400 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <Plus className="w-4 h-4" />
              <span>Add</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
