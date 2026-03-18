"use client";

import { useState, useEffect } from "react";
import { Loader2, Plus, Trash2, Edit3, FileText, X } from "lucide-react";

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
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [templateType, setTemplateType] = useState("general");

  useEffect(() => {
    fetch("/api/recruiter/templates")
      .then((r) => (r.ok ? r.json() : []))
      .then(setTemplates)
      .finally(() => setLoading(false));
  }, []);

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
      const body = { name: name.trim(), subject: subject.trim() || null, content: content.trim(), template_type: templateType };
      if (editId) {
        const res = await fetch(`/api/recruiter/templates/${editId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (res.ok) {
          const updated = await res.json();
          setTemplates((prev) => prev.map((t) => (t.id === editId ? updated : t)));
          resetForm();
        }
      } else {
        const res = await fetch("/api/recruiter/templates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (res.ok) {
          const created = await res.json();
          setTemplates((prev) => [created, ...prev]);
          resetForm();
        }
      }
    } catch { /* ignore */ }
    finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this template?")) return;
    const res = await fetch(`/api/recruiter/templates/${id}`, { method: "DELETE" });
    if (res.ok) setTemplates((prev) => prev.filter((t) => t.id !== id));
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-bold text-text sm:text-2xl lg:text-3xl">Message Templates</h1>
        <button onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 active:bg-primary/80 min-h-[44px] w-full sm:w-auto">
          <Plus className="h-4 w-4" /> New Template
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSave} className="rounded-xl border border-gray-200 bg-card p-3 sm:p-4 md:p-5 space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-text">{editId ? "Edit Template" : "New Template"}</h2>
            <button type="button" onClick={resetForm} className="text-text-muted hover:text-text min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 flex items-center justify-center">
              <X className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          </div>
          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-text">Template Name *</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Interview Invitation"
                className="w-full rounded-lg border border-gray-300 bg-background px-3 py-2 text-base sm:text-sm text-text focus:border-primary focus:outline-none min-h-[44px]" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-text">Type</label>
              <select value={templateType} onChange={(e) => setTemplateType(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-background px-3 py-2 text-base sm:text-sm text-text focus:border-primary focus:outline-none min-h-[44px]">
                {TEMPLATE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-text">Subject</label>
            <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Email subject line"
              className="w-full rounded-lg border border-gray-300 bg-background px-3 py-2 text-base sm:text-sm text-text focus:border-primary focus:outline-none min-h-[44px]" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-text">Content *</label>
            <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={6}
              placeholder="Dear {candidate_name},&#10;&#10;We would like to invite you for an interview..."
              className="w-full rounded-lg border border-gray-300 bg-background px-3 py-2 text-base sm:text-sm text-text focus:border-primary focus:outline-none" />
            <p className="mt-1 text-xs text-text-muted">Use {"{candidate_name}"}, {"{job_title}"}, {"{company_name}"} as placeholders</p>
          </div>
          <button type="submit" disabled={saving}
            className="flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 active:bg-primary/80 disabled:opacity-50 min-h-[44px] w-full sm:w-auto">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {editId ? "Update" : "Create"} Template
          </button>
        </form>
      )}

      {loading ? (
        <p className="text-sm text-text-muted">Loading...</p>
      ) : templates.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 py-10 text-center">
          <FileText className="mx-auto h-8 w-8 text-gray-300" />
          <p className="mt-2 text-sm text-text-muted">No templates yet. Create reusable message templates.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {templates.map((t) => (
            <div key={t.id} className="rounded-xl border border-gray-200 bg-card p-3 sm:p-4 md:p-5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium text-text truncate">{t.name}</p>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${TYPE_COLORS[t.template_type] || TYPE_COLORS.general}`}>
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
