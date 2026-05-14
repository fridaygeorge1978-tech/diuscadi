"use client";
// app/admin/settings/departments/page.tsx
//
// Global pool view of all departments.
// Each row shows: department name | faculty | institution | status
// Create flow: name → select institution → select faculty within that institution
// Bulk import: JSON array of { name, facultyName? }

import React, { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LuBookOpen,
  LuPlus,
  LuChevronLeft,
  LuLoader,
  LuPencil,
  LuPower,
  LuUpload,
  LuX,
  LuCheck,
  LuSearch,
  LuTriangleAlert,
} from "react-icons/lu";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { toast } from "react-hot-toast";
import { cn } from "@/lib/utils";
import { Portal } from "@/components/ui/Portal";

// ── Types ─────────────────────────────────────────────────────────────────────

interface DeptRow {
  id: string;
  name: string;
  isActive: boolean;
  // Populated after joins
  faculty?: { id: string; name: string };
  institution?: { id: string; name: string; abbreviation: string };
}

interface InstitutionOption {
  id: string;
  name: string;
  abbreviation: string;
  faculties: string[];
}
interface FacultyOption {
  id: string;
  name: string;
  departments: string[];
}
interface BulkResult {
  inserted: number;
  skipped: number;
  errors: number;
}

const PAGE_SIZE = 50;

// ── Create modal (3-step) ─────────────────────────────────────────────────────

function CreateDeptModal({
  isOpen,
  onClose,
  institutions,
  onCreated,
}: {
  isOpen: boolean;
  onClose: () => void;
  institutions: InstitutionOption[];
  onCreated: () => void;
}) {
  const { token } = useAuth();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [deptName, setDeptName] = useState("");
  const [selectedInst, setSelectedInst] = useState("");
  const [selectedFaculty, setSelectedFaculty] = useState("");
  const [faculties, setFaculties] = useState<FacultyOption[]>([]);
  const [loadingFac, setLoadingFac] = useState(false);
  const [saving, setSaving] = useState(false);
  const [degreeType, setDegreeType] = useState("");

  // Reset on close
  useEffect(() => {
    if (!isOpen) {
      setStep(1);
      setDeptName("");
      setSelectedInst("");
      setSelectedFaculty("");
      setFaculties([]);
      setDegreeType("");
    }
  }, [isOpen]);

  // Load faculties when institution selected
  useEffect(() => {
    if (!selectedInst || !token) return;
    setLoadingFac(true);
    fetch(`/api/platform/institutions/${selectedInst}/faculties`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => setFaculties(d.faculties ?? []))
      .catch(() => setFaculties([]))
      .finally(() => setLoadingFac(false));
  }, [selectedInst, token]);

  const handleSubmit = async () => {
    if (!token || !deptName.trim()) return;
    setSaving(true);
    try {
      // Step 1: create department
      const res = await fetch("/api/platform/departments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: deptName.trim(),
          degreeType: degreeType || undefined,
        }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "Failed to create department");

      // Step 2: assign to faculty if selected
      if (selectedFaculty) {
        await fetch(`/api/platform/faculties/${selectedFaculty}/departments`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ departmentId: d.department.id }),
        });
      }

      toast.success(
        "Department created" + (selectedFaculty ? " and assigned" : ""),
      );
      onCreated();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const selectedInstObj = institutions.find((i) => i.id === selectedInst);
  const selectedFacObj = faculties.find((f) => f.id === selectedFaculty);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-background rounded-[2.5rem] border-2 border-border w-full max-w-lg shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="px-8 pt-8 pb-6 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-foreground tracking-tight uppercase">
              Add Department
            </h2>
            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
              Step {step} of 3 —{" "}
              {step === 1
                ? "Name"
                : step === 2
                  ? "Select Institution"
                  : "Select Faculty"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-xl cursor-pointer"
          >
            <LuX className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-muted">
          <div
            className="h-1 bg-primary transition-all duration-300"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>

        <div className="px-8 py-6 space-y-4">
          {step === 1 && (
            <div className="space-y-2">
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                Department Name *
              </label>
              <input
                value={deptName}
                onChange={(e) => setDeptName(e.target.value)}
                placeholder="e.g. Computer Science"
                className="w-full bg-muted border border-border rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:border-primary transition-all"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && deptName.trim()) setStep(2);
                }}
              />
              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                  Degree Type{" "}
                  <span className="text-muted-foreground font-normal normal-case">
                    (optional)
                  </span>
                </label>
                <select
                  value={degreeType}
                  onChange={(e) => setDegreeType(e.target.value)}
                  className="w-full bg-muted border border-border rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:border-primary transition-all cursor-pointer"
                >
                  <option value="">— Select degree type —</option>
                  {[
                    "B.Sc",
                    "B.Eng",
                    "B.Ed",
                    "B.A",
                    "B.Tech",
                    "ND",
                    "HND",
                    "M.Sc",
                    "PhD",
                    "Others",
                  ].map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-2">
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                Institution (optional)
              </label>
              <p className="text-[9px] text-muted-foreground">
                Skip to create without assigning to any institution
              </p>
              <select
                value={selectedInst}
                onChange={(e) => {
                  setSelectedInst(e.target.value);
                  setSelectedFaculty("");
                }}
                className="w-full bg-muted border border-border rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:border-primary transition-all cursor-pointer"
              >
                <option value="">— Skip —</option>
                {institutions.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.abbreviation} — {i.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-2">
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                Faculty at{" "}
                {selectedInstObj?.abbreviation ?? "selected institution"}{" "}
                (optional)
              </label>
              {loadingFac ? (
                <div className="flex items-center gap-2 py-3 text-xs text-muted-foreground">
                  <LuLoader className="w-4 h-4 animate-spin" /> Loading
                  faculties…
                </div>
              ) : faculties.length === 0 ? (
                <p className="text-[11px] text-amber-600 font-bold py-2">
                  No faculties assigned to this institution yet. Create
                  faculties first, then assign departments.
                </p>
              ) : (
                <select
                  value={selectedFaculty}
                  onChange={(e) => setSelectedFaculty(e.target.value)}
                  className="w-full bg-muted border border-border rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:border-primary transition-all cursor-pointer"
                >
                  <option value="">— Skip —</option>
                  {faculties.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* Summary before final submit */}
          {step === 3 && (
            <div className="bg-muted rounded-2xl p-4 space-y-1 text-[10px] font-bold text-muted-foreground">
              <p>
                <span className="text-foreground">Department:</span> {deptName}
              </p>
              {degreeType && (
                <p>
                  <span className="text-foreground">Degree Type:</span>{" "}
                  {degreeType}
                </p>
              )}
              {selectedInstObj && (
                <p>
                  <span className="text-foreground">Institution:</span>{" "}
                  {selectedInstObj.abbreviation} — {selectedInstObj.name}
                </p>
              )}
              {selectedFacObj && (
                <p>
                  <span className="text-foreground">Faculty:</span>{" "}
                  {selectedFacObj.name}
                </p>
              )}
              {!selectedInst && (
                <p className="text-slate-400">
                  Will be created without assignment
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-8 pb-8 flex gap-3">
          {step > 1 && (
            <button
              onClick={() => setStep((s) => (s - 1) as 1 | 2 | 3)}
              className="flex-1 py-4 rounded-2xl border border-border text-[11px] font-black uppercase tracking-widest hover:border-foreground transition-all cursor-pointer"
            >
              Back
            </button>
          )}
          {step < 3 ? (
            <button
              onClick={() => {
                if (step === 1 && !deptName.trim()) return;
                setStep((s) => (s + 1) as 2 | 3);
              }}
              disabled={step === 1 && !deptName.trim()}
              className="flex-1 py-4 rounded-2xl bg-foreground text-background text-[11px] font-black uppercase tracking-widest hover:bg-primary hover:text-foreground transition-all cursor-pointer disabled:opacity-50"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl bg-foreground text-background text-[11px] font-black uppercase tracking-widest hover:bg-primary hover:text-foreground transition-all cursor-pointer disabled:opacity-60"
            >
              {saving ? (
                <LuLoader className="w-4 h-4 animate-spin" />
              ) : (
                <LuCheck className="w-4 h-4" />
              )}
              {saving ? "Creating…" : "Create Department"}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function DepartmentsSettingsPage() {
  const router = useRouter();
  const { token } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [departments, setDepartments] = useState<DeptRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filterFaculty, setFilterFaculty] = useState("");
  const [filterInst, setFilterInst] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<DeptRow | null>(null);
  const [editName, setEditName] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const [showBulk, setShowBulk] = useState(false);
  const [bulkJson, setBulkJson] = useState("");
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkResult, setBulkResult] = useState<BulkResult | null>(null);
  const [institutions, setInstitutions] = useState<InstitutionOption[]>([]);
  const [allFaculties, setAllFaculties] = useState<FacultyOption[]>([]);

  // ── Load reference data ────────────────────────────────────────────────────
  useEffect(() => {
    if (!token) return;
    Promise.all([
      fetch("/api/platform/institutions?all=true&limit=500", {
        headers: { Authorization: `Bearer ${token}` },
      }).then((r) => r.json()),
      fetch("/api/platform/faculties?all=true&limit=500", {
        headers: { Authorization: `Bearer ${token}` },
      }).then((r) => r.json()),
    ])
      .then(([instData, facData]) => {
        setInstitutions(instData.institutions ?? []);
        setAllFaculties(facData.faculties ?? []);
      })
      .catch(() => {});
  }, [token]);

  // ── Load departments with joined context ───────────────────────────────────
  const fetchDepartments = useCallback(
    async (p = 1) => {
      if (!token) return;
      setLoading(true);
      try {
        const params = new URLSearchParams({
          all: "true",
          page: String(p),
          limit: String(PAGE_SIZE),
          ...(search ? { search } : {}),
        });

        const res = await fetch(`/api/platform/departments?${params}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();

        // Build reverse maps for joining
        // deptId → faculty
        const deptToFaculty = new Map<string, FacultyOption>();
        for (const fac of allFaculties) {
          for (const dId of fac.departments) {
            deptToFaculty.set(dId, fac);
          }
        }
        // facultyId → institution
        const facToInst = new Map<string, InstitutionOption>();
        for (const inst of institutions) {
          for (const fId of inst.faculties) {
            facToInst.set(fId, inst);
          }
        }

        const rows: DeptRow[] = (data.departments ?? []).map(
          (d: { id: string; name: string; isActive: boolean }) => {
            const faculty = deptToFaculty.get(d.id);
            const inst = faculty ? facToInst.get(faculty.id) : undefined;
            return {
              ...d,
              faculty: faculty
                ? { id: faculty.id, name: faculty.name }
                : undefined,
              institution: inst,
            };
          },
        );

        // Client-side filter by faculty/institution
        const filtered = rows.filter((r) => {
          if (filterFaculty && r.faculty?.id !== filterFaculty) return false;
          if (filterInst && r.institution?.id !== filterInst) return false;
          return true;
        });

        setDepartments(filtered);
        setTotal(filtered.length);
        setPage(p);
      } catch {
        toast.error("Failed to load departments");
      } finally {
        setLoading(false);
      }
    },
    [token, search, filterFaculty, filterInst, allFaculties, institutions],
  );

  useEffect(() => {
    if (institutions.length > 0 || allFaculties.length > 0) fetchDepartments(1);
  }, [fetchDepartments, institutions, allFaculties]);

  // ── Toggle active ──────────────────────────────────────────────────────────
  const handleToggle = async (dept: DeptRow) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/platform/departments/${dept.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isActive: !dept.isActive }),
      });
      if (!res.ok) throw new Error();
      toast.success(
        `${dept.name} ${dept.isActive ? "deactivated" : "activated"}`,
      );
      fetchDepartments(page);
    } catch {
      toast.error("Failed to update");
    }
  };

  // ── Edit save ──────────────────────────────────────────────────────────────
  const handleEditSave = async () => {
    if (!token || !editing || !editName.trim()) return;
    setEditSaving(true);
    try {
      const res = await fetch(`/api/platform/departments/${editing.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: editName.trim() }),
      });
      if (!res.ok) throw new Error("Failed to update");
      toast.success("Department updated");
      setEditing(null);
      fetchDepartments(page);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setEditSaving(false);
    }
  };

  // ── Bulk import ────────────────────────────────────────────────────────────
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      if (file.name.endsWith(".csv")) {
        const lines = text.split("\n").filter(Boolean);
        const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
        const rows = lines.slice(1).map((line) => {
          const vals: Record<string, string> = {};
          line.split(",").forEach((v, i) => {
            vals[headers[i]] = v.trim();
          });
          return vals;
        });
        setBulkJson(JSON.stringify(rows, null, 2));
      } else {
        setBulkJson(text);
      }
    };
    reader.readAsText(file);
  };

  const handleBulkImport = async () => {
    if (!token || !bulkJson.trim()) return;
    setBulkLoading(true);
    setBulkResult(null);
    try {
      let arr: unknown[];
      try {
        arr = JSON.parse(bulkJson);
      } catch {
        toast.error("Invalid JSON");
        return;
      }
      if (!Array.isArray(arr) || !arr.length) {
        toast.error("No records found");
        return;
      }

      // Build faculty name → id map for assignment
      const facNameMap = new Map(
        allFaculties.map((f) => [f.name.toLowerCase(), f.id]),
      );

      let inserted = 0,
        skipped = 0,
        errors = 0;

      for (const item of arr as Record<string, unknown>[]) {
        const name = String(item.name ?? "").trim();
        if (!name) {
          errors++;
          continue;
        }

        const res = await fetch("/api/platform/departments", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ name }),
        });

        if (res.status === 409) {
          skipped++;
          continue;
        }
        if (!res.ok) {
          errors++;
          continue;
        }

        const d = await res.json();
        inserted++;

        // Auto-assign to faculty if facultyName provided
        const facName = String(item.facultyName ?? "").toLowerCase();
        if (facName && facNameMap.has(facName)) {
          try {
            await fetch(
              `/api/platform/faculties/${facNameMap.get(facName)}/departments`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ departmentId: d.department.id }),
              },
            );
          } catch {
            /* non-fatal */
          }
        }
      }

      setBulkResult({ inserted, skipped, errors });
      toast.success(`Imported ${inserted} departments`);
      fetchDepartments(1);
    } finally {
      setBulkLoading(false);
    }
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  // Faculties for the selected institution filter
  const filteredFacultiesForSelect = filterInst
    ? allFaculties.filter((f) => {
        const inst = institutions.find((i) => i.id === filterInst);
        return inst?.faculties.includes(f.id);
      })
    : allFaculties;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="max-w-[1600px] w-full mt-20 p-5 mx-auto space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/admin/settings")}
            className="p-3 rounded-2xl border border-border hover:border-foreground transition-all cursor-pointer"
          >
            <LuChevronLeft className="w-5 h-5" />
          </button>
          <div className="w-14 h-14 rounded-2xl bg-foreground flex items-center justify-center shadow-xl shadow-foreground/20">
            <LuBookOpen className="w-7 h-7 text-background" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-foreground tracking-tighter uppercase">
              Departments
            </h1>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">
              {total} departments across all faculties
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowBulk((v) => !v)}
            className="flex items-center gap-2 px-5 py-3 border border-border rounded-2xl text-[10px] font-black uppercase tracking-widest hover:border-foreground transition-all cursor-pointer"
          >
            <LuUpload className="w-4 h-4" /> Bulk Import
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-3 px-6 py-3 bg-foreground text-background rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-primary hover:text-foreground transition-all shadow-xl cursor-pointer"
          >
            <LuPlus className="w-4 h-4" /> Add Department
          </button>
        </div>
      </div>

      {/* Bulk import panel */}
      <AnimatePresence>
        {showBulk && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-background border-2 border-border rounded-[2.5rem] p-8 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-foreground uppercase tracking-tight">
                    Bulk Import Departments
                  </h3>
                  <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">
                    Paste JSON or upload CSV/JSON file
                  </p>
                </div>
                <button
                  onClick={() => setShowBulk(false)}
                  className="p-2 hover:bg-muted rounded-xl cursor-pointer"
                >
                  <LuX className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
              <div className="bg-muted rounded-2xl p-4">
                <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">
                  Expected format
                </p>
                <pre className="text-[9px] font-mono text-muted-foreground">
                  {`[{ "name": "Computer Science", "facultyName": "Faculty of Engineering" },
 { "name": "Accounting" }]`}
                </pre>
                <p className="text-[9px] text-muted-foreground mt-1">
                  <span className="font-black">facultyName</span> must match an
                  existing faculty name exactly
                </p>
              </div>
              <div className="flex items-center gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,.csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2.5 border border-border rounded-xl text-[10px] font-black uppercase tracking-widest hover:border-primary transition-all cursor-pointer"
                >
                  <LuUpload className="w-3.5 h-3.5" /> Upload File
                </button>
                {bulkJson && (
                  <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest flex items-center gap-1">
                    <LuCheck className="w-3 h-3" /> Loaded
                  </span>
                )}
              </div>
              <textarea
                value={bulkJson}
                onChange={(e) => setBulkJson(e.target.value)}
                placeholder='[{"name":"Computer Science","facultyName":"Faculty of Engineering"}]'
                rows={5}
                className="w-full bg-muted border border-border rounded-2xl p-4 text-xs font-mono outline-none focus:border-primary transition-all resize-none"
              />
              {bulkResult && (
                <div
                  className={cn(
                    "flex items-center gap-3 p-4 rounded-2xl border",
                    bulkResult.errors > 0
                      ? "bg-amber-50 border-amber-100"
                      : "bg-emerald-50 border-emerald-100",
                  )}
                >
                  {bulkResult.errors > 0 ? (
                    <LuTriangleAlert className="w-4 h-4 text-amber-600 shrink-0" />
                  ) : (
                    <LuCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  )}
                  <p className="text-[10px] font-black uppercase tracking-widest text-foreground">
                    Inserted: {bulkResult.inserted} · Skipped:{" "}
                    {bulkResult.skipped} · Errors: {bulkResult.errors}
                  </p>
                </div>
              )}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setBulkJson("");
                    setBulkResult(null);
                  }}
                  className="flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:bg-muted transition-all cursor-pointer"
                >
                  Clear
                </button>
                <button
                  onClick={handleBulkImport}
                  disabled={bulkLoading || !bulkJson.trim()}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-foreground text-background hover:bg-primary hover:text-foreground transition-all cursor-pointer disabled:opacity-60"
                >
                  {bulkLoading ? (
                    <LuLoader className="w-4 h-4 animate-spin" />
                  ) : (
                    <LuUpload className="w-4 h-4" />
                  )}
                  {bulkLoading ? "Importing…" : "Import"}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 bg-muted border border-border rounded-xl px-3 py-2 flex-1 max-w-xs">
          <LuSearch className="w-4 h-4 text-muted-foreground shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search departments…"
            className="bg-transparent text-sm outline-none w-full placeholder:text-muted-foreground"
          />
        </div>
        <select
          value={filterInst}
          onChange={(e) => {
            setFilterInst(e.target.value);
            setFilterFaculty("");
          }}
          className="bg-muted border border-border rounded-xl px-3 py-2 text-[11px] font-black uppercase tracking-widest outline-none cursor-pointer max-w-[200px]"
        >
          <option value="">All Institutions</option>
          {institutions.map((i) => (
            <option key={i.id} value={i.id}>
              {i.abbreviation}
            </option>
          ))}
        </select>
        <select
          value={filterFaculty}
          onChange={(e) => setFilterFaculty(e.target.value)}
          className="bg-muted border border-border rounded-xl px-3 py-2 text-[11px] font-black uppercase tracking-widest outline-none cursor-pointer max-w-[200px]"
        >
          <option value="">All Faculties</option>
          {filteredFacultiesForSelect.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </select>
        {(search || filterInst || filterFaculty) && (
          <button
            onClick={() => {
              setSearch("");
              setFilterInst("");
              setFilterFaculty("");
            }}
            className="text-[10px] font-black text-muted-foreground hover:text-foreground uppercase tracking-widest cursor-pointer"
          >
            Clear
          </button>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <LuLoader className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : (
        <>
          <div className="bg-background border-2 border-border rounded-[2.5rem] overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-muted/50 border-b border-border">
                    {[
                      "Department Name",
                      "Faculty",
                      "Institution",
                      "Status",
                      "Actions",
                    ].map((h, i) => (
                      <th
                        key={h}
                        className={cn(
                          "px-5 py-4 text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em]",
                          i === 4 && "text-right",
                        )}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {departments.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-6 py-16 text-center text-xs font-bold text-muted-foreground"
                      >
                        No departments found
                      </td>
                    </tr>
                  ) : (
                    departments.map((dept, index) => (
                      <motion.tr
                        key={dept.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.02 }}
                        className={cn(
                          "group hover:bg-muted/50 transition-all",
                          !dept.isActive && "opacity-50",
                        )}
                      >
                        <td className="px-5 py-3">
                          <span className="text-sm font-black text-foreground group-hover:text-primary transition-colors">
                            {dept.name}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          {dept.faculty ? (
                            <span className="text-[11px] font-bold text-muted-foreground">
                              {dept.faculty.name}
                            </span>
                          ) : (
                            <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">
                              Unassigned
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3">
                          {dept.institution ? (
                            <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-lg text-[8px] font-black uppercase tracking-widest">
                              {dept.institution.abbreviation}
                            </span>
                          ) : (
                            <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">
                              —
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3">
                          <span
                            className={cn(
                              "px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border",
                              dept.isActive
                                ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                                : "bg-muted text-muted-foreground border-border",
                            )}
                          >
                            {dept.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setEditing(dept);
                                setEditName(dept.name);
                              }}
                              className="p-1.5 hover:bg-background border border-transparent hover:border-border rounded-lg text-muted-foreground hover:text-foreground transition-all cursor-pointer"
                            >
                              <LuPencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleToggle(dept)}
                              className={cn(
                                "p-1.5 rounded-lg border border-transparent transition-all cursor-pointer",
                                dept.isActive
                                  ? "text-amber-600 hover:bg-amber-50 hover:border-amber-100"
                                  : "text-emerald-600 hover:bg-emerald-50 hover:border-emerald-100",
                              )}
                            >
                              <LuPower className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => fetchDepartments(page - 1)}
                disabled={page === 1}
                className="px-4 py-2 rounded-xl border border-border text-[10px] font-black uppercase tracking-widest disabled:opacity-40 hover:border-foreground transition-all cursor-pointer"
              >
                Previous
              </button>
              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                {page} of {totalPages}
              </span>
              <button
                onClick={() => fetchDepartments(page + 1)}
                disabled={page === totalPages}
                className="px-4 py-2 rounded-xl border border-border text-[10px] font-black uppercase tracking-widest disabled:opacity-40 hover:border-foreground transition-all cursor-pointer"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* 3-step create modal */}
      <Portal>
        <CreateDeptModal
          isOpen={showCreate}
          onClose={() => setShowCreate(false)}
          institutions={institutions}
          onCreated={() => fetchDepartments(1)}
        />
      </Portal>

      {/* Inline edit modal */}
      <Portal>
        {editing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-background rounded-[2.5rem] border-2 border-border w-full max-w-md shadow-2xl overflow-hidden"
            >
              <div className="px-8 pt-8 pb-6 border-b border-border flex items-center justify-between">
                <h2 className="text-xl font-black text-foreground tracking-tight uppercase">
                  Edit Department
                </h2>
                <button
                  onClick={() => setEditing(null)}
                  className="p-2 hover:bg-muted rounded-xl cursor-pointer"
                >
                  <LuX className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>
              <div className="px-8 py-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                    Department Name *
                  </label>
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full bg-muted border border-border rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:border-primary transition-all"
                  />
                </div>
                {editing.faculty && (
                  <div className="bg-muted rounded-2xl p-4 text-[10px] font-bold text-muted-foreground space-y-1">
                    <p>
                      <span className="text-foreground">Faculty:</span>{" "}
                      {editing.faculty.name}
                    </p>
                    {editing.institution && (
                      <p>
                        <span className="text-foreground">Institution:</span>{" "}
                        {editing.institution.abbreviation} —{" "}
                        {editing.institution.name}
                      </p>
                    )}
                  </div>
                )}
              </div>
              <div className="px-8 pb-8 flex gap-3">
                <button
                  onClick={() => setEditing(null)}
                  className="flex-1 py-4 rounded-2xl border border-border text-[11px] font-black uppercase tracking-widest hover:border-foreground transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditSave}
                  disabled={editSaving || !editName.trim()}
                  className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl bg-foreground text-background text-[11px] font-black uppercase tracking-widest hover:bg-primary hover:text-foreground transition-all cursor-pointer disabled:opacity-60"
                >
                  {editSaving ? (
                    <LuLoader className="w-4 h-4 animate-spin" />
                  ) : (
                    <LuCheck className="w-4 h-4" />
                  )}
                  {editSaving ? "Saving…" : "Save Changes"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </Portal>
    </motion.div>
  );
}
