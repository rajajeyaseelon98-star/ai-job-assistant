"use client";

import { useState } from "react";
import { Loader2, Plus, Trash2, Edit3, FileText, X } from "lucide-react";
import { useRecruiterTemplates, useSaveTemplate, useDeleteTemplate } from "@/hooks/queries/use-recruiter";

interface Template {
  id: string;
  name: string;
  subject: string | null;
  content: string;
  template_type: string;
  created_at: string;
}

const TEMPLATE_TYPES = [
  { value: "general", label: "General" },
  { value: "interview_invite", label: "Interview Invite" },
  { value: "rejection", label: "Rejection" },
  { value: "offer", label: "Offer" },
  { value: "follow_up", label: "Follow Up" },
];

const TYPE_COLORS: Record<string, string> = {
  general: "bg-gray-100 text-gray-700",
  interview_invite: "bg-blue-100 text-blue-700",
  rejection: "bg-red-100 text-red-700",
  offer: "bg-green-100 text-green-700",
  follow_up: "bg-yellow-100 text-yellow-700",
};

export default function RecruiterTemplatesPage() {
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [templateType, setTemplateType] = useState("general");

  const { data: templatesRaw, isLoading: loading } = useRecruiterTemplates();
  const templates = (templatesRaw ?? []) as Template[];
  const saveMutation = useSaveTemplate();
  const deleteMut = useDeleteTemplate();

  function resetForm() {
    setName("");
    setSubject("");
    setContent("");
    setTemplateType("general");
    setEditId(null);
    setShowForm(false);
  }

  function startEdit(t: Template) {
    setEditId(t.id);
    setName(t.name);
    setSubject(t.subject || "");
    setContent(t.content);
    setTemplateType(t.template_type);
    setShowForm(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !content.trim()) return;
    setSaving(true);
    try {
      await saveMutation.mutateAsync({
        id: editId ?? undefined,
        name: name.trim(),
        subject: subject.trim() || null,
        content: content.trim(),
        template_type: templateType,
      });
      resetForm();
    } catch { /* ignore */ }
    finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this template?")) return;
    await deleteMut.mutateAsync(id);
  }

  return (
    <div className="max-w-4xl mx-auto w-full py-10 px-6">
      <div className="flex items-center justify-between mb-10">
        <h1 className="font-display text-3xl font-bold text-slate-900 tracking-tight">Message Templates</h1>
        <button onClick={() => { resetForm(); setShowForm(true); }}
          className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/20 rounded-xl px-6 py-3 font-bold transition-all flex items-center justify-center gap-2">
          <Plus className="h-4 w-4" /> New Template
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSave} className="bg-white border border-slate-200 shadow-xl shadow-slate-200/50 rounded-[32px] p-8 sm:p-10 mb-12 relative space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-indigo-600 uppercase tracking-widest mb-6 block">{editId ? "Edit Template" : "New Template"}</h2>
            <button type="button" onClick={resetForm} className="absolute top-6 right-6 p-2 text-slate-300 hover:text-slate-500 hover:bg-slate-50 rounded-full transition-all">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="text-[13px] font-bold text-slate-700 mb-2 block ml-1">Template Name *</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Interview Invitation"
                className="bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 w-full focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none text-slate-900 appearance-none" />
            </div>
            <div>
              <label className="text-[13px] font-bold text-slate-700 mb-2 block ml-1">Type</label>
              <select value={templateType} onChange={(e) => setTemplateType(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 w-full focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none text-slate-900 appearance-none">
                {TEMPLATE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-[13px] font-bold text-slate-700 mb-2 block ml-1">Subject</label>
            <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Email subject line"
              className="bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 w-full focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none text-slate-900 appearance-none" />
          </div>
          <div>
            <label className="text-[13px] font-bold text-slate-700 mb-2 block ml-1">Content *</label>
            <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={6}
              placeholder="Dear {candidate_name},&#10;&#10;We would like to invite you for an interview..."
              className="bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 w-full focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none text-slate-900 appearance-none" />
            <p className="mt-4 p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100/50 text-[11px] text-indigo-600 font-medium leading-relaxed">
              Use {"{candidate_name}"}, {"{job_title}"}, {"{company_name}"} as placeholders
            </p>
          </div>
          <button type="submit" disabled={saving}
            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/30 rounded-xl px-10 py-4 font-bold transition-all w-full md:w-auto flex items-center justify-center gap-2 disabled:opacity-50">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {editId ? "Update" : "Create"} Template
          </button>
        </form>
      )}

      {loading ? (
        <p className="text-sm text-text-muted">Loading...</p>
      ) : templates.length === 0 ? (
        <div className="bg-slate-50/50 border-2 border-dashed border-slate-200 rounded-[32px] py-24 text-center">
          <div className="w-16 h-16 bg-white text-slate-200 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm">
            <FileText className="h-8 w-8" />
          </div>
          <p className="font-display text-slate-400 font-medium text-lg">No templates yet. Create reusable message templates.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {templates.map((t) => (
            <div key={t.id} className="bg-white border border-slate-200 rounded-2xl p-5 mb-4 flex justify-between items-center">
              <div className="flex items-start justify-between gap-2 w-full">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium text-text truncate">{t.name}</p>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded">
                      {TEMPLATE_TYPES.find((tt) => tt.value === t.template_type)?.label || t.template_type}
                    </span>
                  </div>
                  {t.subject && <p className="mt-0.5 text-xs text-text-muted truncate">Subject: {t.subject}</p>}
                  <p className="mt-1 text-xs text-text-muted line-clamp-2">{t.content}</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => startEdit(t)} className="rounded-lg p-2 sm:p-1.5 text-text-muted hover:bg-blue-50 hover:text-blue-600 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 flex items-center justify-center">
                    <Edit3 className="h-4 w-4 sm:h-5 sm:w-5" />
                  </button>
                  <button onClick={() => handleDelete(t.id)} className="rounded-lg p-2 sm:p-1.5 text-text-muted hover:bg-red-50 hover:text-red-600 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 flex items-center justify-center">
                    <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
