"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/useToast";
import { nanoid } from "nanoid";
import { X } from "lucide-react";
import { ImageUploader } from "@/components/ui/ImageUploader";
import type { CloudinaryImage } from "@/types/cloudinary";
import type {
  AboutSectionKey,
  AboutHero,
  AboutStat,
  AboutFounderStory,
  AboutValueCard,
  AboutFocusArea,
  AboutMilestone,
  AboutSDG,
  AboutPartner,
  AboutCTA,
} from "@/lib/models/aboutPageConfig";
import Image from "next/image";

// ─── Available icon keys (must match ICON_MAP in about/page.tsx) ──────────────
const ICON_OPTIONS = [
  "Target",
  "Lightbulb",
  "ShieldCheck",
  "Globe2",
  "Users",
  "BookOpen",
  "TrendingUp",
  "Rocket",
  "Sprout",
  "MonitorSmartphone",
  "HeartHandshake",
  "Laptop",
  "Briefcase",
  "GraduationCap",
  "Award",
];

// ─── Auth helpers ─────────────────────────────────────────────────────────────
function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("diuscadi_token");
}
function authHeaders(json = true): HeadersInit {
  const token = getToken();
  return {
    ...(json ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────
const TABS = [
  { key: "hero", label: "🌟 Hero" },
  { key: "stats", label: "📊 Stats" },
  { key: "founderStory", label: "👤 Founder Story" },
  { key: "values", label: "🎯 Values" },
  { key: "focusAreas", label: "🔧 Focus Areas" },
  { key: "timeline", label: "📅 LASCADSS Timeline" },
  { key: "sdgs", label: "🌍 SDGs" },
  { key: "partners", label: "🤝 Partners" },
  { key: "cta", label: "📣 CTA" },
] as const;

// ─── State shape ──────────────────────────────────────────────────────────────
interface AboutConfig {
  hero?: AboutHero;
  stats?: { items: AboutStat[] };
  founderStory?: AboutFounderStory;
  values?: { items: AboutValueCard[] };
  focusAreas?: { items: AboutFocusArea[] };
  timeline?: { items: AboutMilestone[] };
  sdgs?: { items: AboutSDG[] };
  partners?: { items: AboutPartner[] };
  cta?: AboutCTA;
}

// ─── Shared SaveBar ───────────────────────────────────────────────────────────
function SaveBar({
  onSave,
  saving,
  saved,
}: {
  onSave: () => void;
  saving: boolean;
  saved: boolean;
}) {
  return (
    <div className="flex items-center justify-end gap-3 pt-4 border-t">
      {saved && (
        <span className="text-sm text-green-600 font-medium">✓ Saved</span>
      )}
      <button
        onClick={onSave}
        disabled={saving}
        className="px-5 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save Changes"}
      </button>
    </div>
  );
}

// ─── Photo upload modal (reuses landing page pattern) ─────────────────────────
function PhotoUploadModal({
  open,
  onClose,
  onUploaded,
  ownerId,
}: {
  open: boolean;
  onClose: () => void;
  onUploaded: (url: string) => void;
  ownerId: string;
}) {
  if (!open || typeof window === "undefined") return null;
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative bg-background rounded-2xl shadow-2xl border border-border p-6 w-full max-w-md mx-4">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-full hover:bg-muted"
        >
          <X className="w-4 h-4" />
        </button>
        <h3 className="font-bold text-lg mb-1">Upload Photo</h3>
        <p className="text-xs text-muted-foreground mb-4">
          Face-aware crop to square. Max 5 MB.
        </p>
        <ImageUploader
          uploadType="landing-person"
          ownerId={ownerId}
          currentUrl={null}
          currentPublicId={null}
          shape="circle"
          aspectHint="400 × 400"
          label="Upload photo"
          cropLabel="Crop photo"
          onSuccess={(image: CloudinaryImage) => {
            const url = image.imageUrl ?? "";
            if (url) {
              onUploaded(url);
              onClose();
            }
          }}
          onRemove={() => {}}
        />
      </div>
    </div>,
    document.body,
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function AboutSettingsPage() {
  useAdminAuth();
  const { user } = useAuth();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<AboutSectionKey>("hero");
  const [config, setConfig] = useState<AboutConfig>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/settings/about", { headers: authHeaders() })
      .then((r) => r.json())
      .then(
        ({
          sections,
        }: {
          sections: Array<{ sectionKey: AboutSectionKey; data: unknown }>;
        }) => {
          const byKey: AboutConfig = {};
          for (const s of sections)
            (byKey as Record<string, unknown>)[s.sectionKey] = s.data;
          setConfig(byKey);
        },
      )
      .catch(() =>
        toast({ title: "Failed to load config", variant: "destructive" }),
      )
      .finally(() => setLoading(false));
  }, [toast]);

  async function save(sectionKey: AboutSectionKey, data: unknown) {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch("/api/admin/settings/about", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ sectionKey, data }),
      });
      if (!res.ok) throw new Error();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      toast({
        title: "Saved",
        description: `${sectionKey} updated.`,
        variant: "success",
      });
    } catch {
      toast({ title: "Save failed", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  if (loading)
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
        Loading about page config…
      </div>
    );

  const ownerId = user?.id ?? "about-cms";

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">About Page Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage every section of the public About page. Changes go live within
          60 seconds.
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex flex-wrap gap-2 border-b pb-3">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              activeTab === t.key
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted text-muted-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === "hero" && (
        <HeroTab
          data={config.hero}
          onChange={(d) => setConfig((p) => ({ ...p, hero: d }))}
          onSave={() => save("hero", config.hero)}
          saving={saving}
          saved={saved}
        />
      )}
      {activeTab === "stats" && (
        <StatsTab
          items={config.stats?.items ?? []}
          onChange={(items) => setConfig((p) => ({ ...p, stats: { items } }))}
          onSave={() => save("stats", config.stats ?? { items: [] })}
          saving={saving}
          saved={saved}
        />
      )}
      {activeTab === "founderStory" && (
        <FounderStoryTab
          data={config.founderStory}
          onChange={(d) => setConfig((p) => ({ ...p, founderStory: d }))}
          onSave={() => save("founderStory", config.founderStory)}
          saving={saving}
          saved={saved}
          ownerId={ownerId}
        />
      )}
      {activeTab === "values" && (
        <ValuesTab
          items={config.values?.items ?? []}
          onChange={(items) => setConfig((p) => ({ ...p, values: { items } }))}
          onSave={() => save("values", config.values ?? { items: [] })}
          saving={saving}
          saved={saved}
        />
      )}
      {activeTab === "focusAreas" && (
        <FocusAreasTab
          items={config.focusAreas?.items ?? []}
          onChange={(items) =>
            setConfig((p) => ({ ...p, focusAreas: { items } }))
          }
          onSave={() => save("focusAreas", config.focusAreas ?? { items: [] })}
          saving={saving}
          saved={saved}
        />
      )}
      {activeTab === "timeline" && (
        <TimelineTab
          items={config.timeline?.items ?? []}
          onChange={(items) =>
            setConfig((p) => ({ ...p, timeline: { items } }))
          }
          onSave={() => save("timeline", config.timeline ?? { items: [] })}
          saving={saving}
          saved={saved}
        />
      )}
      {activeTab === "sdgs" && (
        <SDGsTab
          items={config.sdgs?.items ?? []}
          onChange={(items) => setConfig((p) => ({ ...p, sdgs: { items } }))}
          onSave={() => save("sdgs", config.sdgs ?? { items: [] })}
          saving={saving}
          saved={saved}
        />
      )}
      {activeTab === "partners" && (
        <PartnersTab
          items={config.partners?.items ?? []}
          onChange={(items) =>
            setConfig((p) => ({ ...p, partners: { items } }))
          }
          onSave={() => save("partners", config.partners ?? { items: [] })}
          saving={saving}
          saved={saved}
        />
      )}
      {activeTab === "cta" && (
        <CTATab
          data={config.cta}
          onChange={(d) => setConfig((p) => ({ ...p, cta: d }))}
          onSave={() => save("cta", config.cta)}
          saving={saving}
          saved={saved}
        />
      )}
    </div>
  );
}

// ─── Tab: Hero ────────────────────────────────────────────────────────────────
function HeroTab({
  data,
  onChange,
  onSave,
  saving,
  saved,
}: {
  data: AboutHero | undefined;
  onChange: (d: AboutHero) => void;
  onSave: () => void;
  saving: boolean;
  saved: boolean;
}) {
  const d: AboutHero = data ?? {
    headline: "",
    headlineAccent: "",
    subtitle: "",
    cta1Label: "",
    cta1Href: "",
    cta2Label: "",
    cta2Href: "",
  };
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-muted-foreground">
            Headline (plain text)
          </label>
          <input
            type="text"
            value={d.headline}
            onChange={(e) => onChange({ ...d, headline: e.target.value })}
            placeholder="Shaping the Young for"
            className="w-full mt-1 rounded border px-2 py-1.5 text-sm bg-background"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">
            Headline Accent (coloured)
          </label>
          <input
            type="text"
            value={d.headlineAccent}
            onChange={(e) => onChange({ ...d, headlineAccent: e.target.value })}
            placeholder="Future Career Success"
            className="w-full mt-1 rounded border px-2 py-1.5 text-sm bg-background"
          />
        </div>
      </div>
      <div>
        <label className="text-xs text-muted-foreground">Subtitle</label>
        <textarea
          rows={4}
          value={d.subtitle}
          onChange={(e) => onChange({ ...d, subtitle: e.target.value })}
          className="w-full mt-1 rounded border px-2 py-1.5 text-sm bg-background"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-muted-foreground">CTA 1 Label</label>
          <input
            type="text"
            value={d.cta1Label}
            onChange={(e) => onChange({ ...d, cta1Label: e.target.value })}
            placeholder="Our Mission"
            className="w-full mt-1 rounded border px-2 py-1.5 text-sm bg-background"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">CTA 1 Link</label>
          <input
            type="text"
            value={d.cta1Href}
            onChange={(e) => onChange({ ...d, cta1Href: e.target.value })}
            placeholder="#mission"
            className="w-full mt-1 rounded border px-2 py-1.5 text-sm bg-background"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">CTA 2 Label</label>
          <input
            type="text"
            value={d.cta2Label}
            onChange={(e) => onChange({ ...d, cta2Label: e.target.value })}
            placeholder="LASCADSS Programme"
            className="w-full mt-1 rounded border px-2 py-1.5 text-sm bg-background"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">CTA 2 Link</label>
          <input
            type="text"
            value={d.cta2Href}
            onChange={(e) => onChange({ ...d, cta2Href: e.target.value })}
            placeholder="#lascadss"
            className="w-full mt-1 rounded border px-2 py-1.5 text-sm bg-background"
          />
        </div>
      </div>
      <SaveBar onSave={onSave} saving={saving} saved={saved} />
    </div>
  );
}

// ─── Tab: Stats ───────────────────────────────────────────────────────────────
function StatsTab({
  items,
  onChange,
  onSave,
  saving,
  saved,
}: {
  items: AboutStat[];
  onChange: (items: AboutStat[]) => void;
  onSave: () => void;
  saving: boolean;
  saved: boolean;
}) {
  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        These 4 stats appear in the glass bar below the hero.
      </p>
      {items.map((s, i) => (
        <div key={i} className="grid grid-cols-2 gap-3 border rounded-lg p-3">
          <div>
            <label className="text-xs text-muted-foreground">Value</label>
            <input
              type="text"
              value={s.value}
              onChange={(e) =>
                onChange(
                  items.map((x, j) =>
                    j === i ? { ...x, value: e.target.value } : x,
                  ),
                )
              }
              placeholder="5,000+"
              className="w-full mt-1 rounded border px-2 py-1.5 text-sm bg-background"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Label</label>
            <input
              type="text"
              value={s.label}
              onChange={(e) =>
                onChange(
                  items.map((x, j) =>
                    j === i ? { ...x, label: e.target.value } : x,
                  ),
                )
              }
              placeholder="Students Trained"
              className="w-full mt-1 rounded border px-2 py-1.5 text-sm bg-background"
            />
          </div>
        </div>
      ))}
      {items.length < 4 && (
        <button
          onClick={() => onChange([...items, { value: "", label: "" }])}
          className="px-3 py-1.5 rounded border text-sm hover:bg-muted"
        >
          + Add Stat
        </button>
      )}
      <SaveBar onSave={onSave} saving={saving} saved={saved} />
    </div>
  );
}

// ─── Tab: Founder Story ───────────────────────────────────────────────────────
function FounderStoryTab({
  data,
  onChange,
  onSave,
  saving,
  saved,
  ownerId,
}: {
  data: AboutFounderStory | undefined;
  onChange: (d: AboutFounderStory) => void;
  onSave: () => void;
  saving: boolean;
  saved: boolean;
  ownerId: string;
}) {
  const [photoOpen, setPhotoOpen] = useState(false);
  const d: AboutFounderStory = data ?? {
    heading: "",
    paragraphs: ["", "", ""],
    quoteText: "",
    quoteAttribution: "",
    photoUrl: "",
    photoAlt: "",
  };

  function updateParagraph(i: number, val: string) {
    const paras = [...d.paragraphs];
    paras[i] = val;
    onChange({ ...d, paragraphs: paras });
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs text-muted-foreground">Section Heading</label>
        <input
          type="text"
          value={d.heading}
          onChange={(e) => onChange({ ...d, heading: e.target.value })}
          className="w-full mt-1 rounded border px-2 py-1.5 text-sm bg-background"
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs text-muted-foreground">
          Story Paragraphs
        </label>
        {d.paragraphs.map((p, i) => (
          <div key={i} className="flex gap-2 items-start">
            <textarea
              rows={3}
              value={p}
              onChange={(e) => updateParagraph(i, e.target.value)}
              placeholder={`Paragraph ${i + 1}`}
              className="flex-1 rounded border px-2 py-1.5 text-sm bg-background"
            />
            <button
              onClick={() =>
                onChange({
                  ...d,
                  paragraphs: d.paragraphs.filter((_, j) => j !== i),
                })
              }
              className="text-red-500 px-2 mt-1"
            >
              ×
            </button>
          </div>
        ))}
        <button
          onClick={() => onChange({ ...d, paragraphs: [...d.paragraphs, ""] })}
          className="px-3 py-1.5 rounded border text-sm hover:bg-muted"
        >
          + Add Paragraph
        </button>
      </div>

      <div>
        <label className="text-xs text-muted-foreground">Quote Text</label>
        <textarea
          rows={3}
          value={d.quoteText}
          onChange={(e) => onChange({ ...d, quoteText: e.target.value })}
          className="w-full mt-1 rounded border px-2 py-1.5 text-sm bg-background"
        />
      </div>
      <div>
        <label className="text-xs text-muted-foreground">
          Quote Attribution
        </label>
        <input
          type="text"
          value={d.quoteAttribution}
          onChange={(e) => onChange({ ...d, quoteAttribution: e.target.value })}
          placeholder="— Prof. Chief Ikechukwu I. Umeh, Founder, DIUSCADI"
          className="w-full mt-1 rounded border px-2 py-1.5 text-sm bg-background"
        />
      </div>

      <div className="flex items-center gap-3">
        {d.photoUrl && (
          <Image
            src={d.photoUrl}
            alt=""
            className="h-16 w-12 object-cover rounded-lg border"
          />
        )}
        <button
          onClick={() => setPhotoOpen(true)}
          className="px-3 py-1.5 rounded border text-sm hover:bg-muted"
        >
          📁 {d.photoUrl ? "Change Photo" : "Upload Founder Photo"}
        </button>
      </div>
      <div>
        <label className="text-xs text-muted-foreground">Photo Alt Text</label>
        <input
          type="text"
          value={d.photoAlt}
          onChange={(e) => onChange({ ...d, photoAlt: e.target.value })}
          placeholder="Prof. Chief Ikechukwu I. Umeh"
          className="w-full mt-1 rounded border px-2 py-1.5 text-sm bg-background"
        />
      </div>

      <SaveBar onSave={onSave} saving={saving} saved={saved} />
      <PhotoUploadModal
        open={photoOpen}
        onClose={() => setPhotoOpen(false)}
        ownerId={ownerId}
        onUploaded={(url) => onChange({ ...d, photoUrl: url })}
      />
    </div>
  );
}

// ─── Shared icon+text list item ───────────────────────────────────────────────
// Used by Values, Focus Areas tabs since they share the same (iconKey, title/label, desc) shape

function IconTextItem({
  iconKey,
  title,
  desc,
  titlePlaceholder,
  onIconChange,
  onTitleChange,
  onDescChange,
  onRemove,
}: {
  iconKey: string;
  title: string;
  desc: string;
  titlePlaceholder: string;
  onIconChange: (v: string) => void;
  onTitleChange: (v: string) => void;
  onDescChange: (v: string) => void;
  onRemove: () => void;
}) {
  return (
    <div className="border rounded-lg p-3 space-y-2">
      <div className="flex gap-2 items-center">
        <select
          value={iconKey}
          onChange={(e) => onIconChange(e.target.value)}
          className="rounded border px-2 py-1.5 text-sm bg-background w-36"
        >
          {ICON_OPTIONS.map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
        </select>
        <input
          type="text"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder={titlePlaceholder}
          className="flex-1 rounded border px-2 py-1.5 text-sm bg-background"
        />
        <button onClick={onRemove} className="text-red-500 px-2 text-lg">
          ×
        </button>
      </div>
      <textarea
        rows={2}
        value={desc}
        onChange={(e) => onDescChange(e.target.value)}
        placeholder="Description…"
        className="w-full rounded border px-2 py-1.5 text-sm bg-background"
      />
    </div>
  );
}

// ─── Tab: Values ──────────────────────────────────────────────────────────────
function ValuesTab({
  items,
  onChange,
  onSave,
  saving,
  saved,
}: {
  items: AboutValueCard[];
  onChange: (items: AboutValueCard[]) => void;
  onSave: () => void;
  saving: boolean;
  saved: boolean;
}) {
  function update(id: string, patch: Partial<AboutValueCard>) {
    onChange(items.map((v) => (v.id === id ? { ...v, ...patch } : v)));
  }
  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <button
          onClick={() =>
            onChange([
              ...items,
              {
                id: nanoid(),
                iconKey: "Target",
                title: "",
                desc: "",
                order: items.length,
              },
            ])
          }
          className="px-3 py-1.5 rounded border text-sm hover:bg-muted"
        >
          + Add Value
        </button>
      </div>
      {items.map((v) => (
        <IconTextItem
          key={v.id}
          iconKey={v.iconKey}
          title={v.title}
          desc={v.desc}
          titlePlaceholder="Value name (e.g. Mission)"
          onIconChange={(val) => update(v.id, { iconKey: val })}
          onTitleChange={(val) => update(v.id, { title: val })}
          onDescChange={(val) => update(v.id, { desc: val })}
          onRemove={() => onChange(items.filter((x) => x.id !== v.id))}
        />
      ))}
      <SaveBar onSave={onSave} saving={saving} saved={saved} />
    </div>
  );
}

// ─── Tab: Focus Areas ─────────────────────────────────────────────────────────
function FocusAreasTab({
  items,
  onChange,
  onSave,
  saving,
  saved,
}: {
  items: AboutFocusArea[];
  onChange: (items: AboutFocusArea[]) => void;
  onSave: () => void;
  saving: boolean;
  saved: boolean;
}) {
  function update(id: string, patch: Partial<AboutFocusArea>) {
    onChange(items.map((v) => (v.id === id ? { ...v, ...patch } : v)));
  }
  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <button
          onClick={() =>
            onChange([
              ...items,
              {
                id: nanoid(),
                iconKey: "Target",
                label: "",
                desc: "",
                order: items.length,
              },
            ])
          }
          className="px-3 py-1.5 rounded border text-sm hover:bg-muted"
        >
          + Add Focus Area
        </button>
      </div>
      {items.map((v) => (
        <IconTextItem
          key={v.id}
          iconKey={v.iconKey}
          title={v.label}
          desc={v.desc}
          titlePlaceholder="Focus area label"
          onIconChange={(val) => update(v.id, { iconKey: val })}
          onTitleChange={(val) => update(v.id, { label: val })}
          onDescChange={(val) => update(v.id, { desc: val })}
          onRemove={() => onChange(items.filter((x) => x.id !== v.id))}
        />
      ))}
      <SaveBar onSave={onSave} saving={saving} saved={saved} />
    </div>
  );
}

// ─── Tab: Timeline ────────────────────────────────────────────────────────────
function TimelineTab({
  items,
  onChange,
  onSave,
  saving,
  saved,
}: {
  items: AboutMilestone[];
  onChange: (items: AboutMilestone[]) => void;
  onSave: () => void;
  saving: boolean;
  saved: boolean;
}) {
  function update(id: string, patch: Partial<AboutMilestone>) {
    onChange(items.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  }
  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <button
          onClick={() =>
            onChange([
              ...items,
              {
                id: nanoid(),
                year: "",
                title: "",
                desc: "",
                order: items.length,
              },
            ])
          }
          className="px-3 py-1.5 rounded border text-sm hover:bg-muted"
        >
          + Add Milestone
        </button>
      </div>
      {items.map((m) => (
        <div key={m.id} className="border rounded-lg p-3 space-y-2">
          <div className="flex gap-2 items-center">
            <input
              type="text"
              value={m.year}
              onChange={(e) => update(m.id, { year: e.target.value })}
              placeholder="2026"
              className="w-20 rounded border px-2 py-1.5 text-sm bg-background"
            />
            <input
              type="text"
              value={m.title}
              onChange={(e) => update(m.id, { title: e.target.value })}
              placeholder="LASCADSS 7.0 — Theme Name"
              className="flex-1 rounded border px-2 py-1.5 text-sm bg-background"
            />
            <button
              onClick={() => onChange(items.filter((x) => x.id !== m.id))}
              className="text-red-500 px-2 text-lg"
            >
              ×
            </button>
          </div>
          <textarea
            rows={2}
            value={m.desc}
            onChange={(e) => update(m.id, { desc: e.target.value })}
            placeholder="Description of this edition…"
            className="w-full rounded border px-2 py-1.5 text-sm bg-background"
          />
        </div>
      ))}
      <SaveBar onSave={onSave} saving={saving} saved={saved} />
    </div>
  );
}

// ─── Tab: SDGs ────────────────────────────────────────────────────────────────
function SDGsTab({
  items,
  onChange,
  onSave,
  saving,
  saved,
}: {
  items: AboutSDG[];
  onChange: (items: AboutSDG[]) => void;
  onSave: () => void;
  saving: boolean;
  saved: boolean;
}) {
  function update(id: string, patch: Partial<AboutSDG>) {
    onChange(items.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }
  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <button
          onClick={() =>
            onChange([
              ...items,
              {
                id: nanoid(),
                num: "",
                label: "",
                desc: "",
                order: items.length,
              },
            ])
          }
          className="px-3 py-1.5 rounded border text-sm hover:bg-muted"
        >
          + Add SDG
        </button>
      </div>
      {items.map((s) => (
        <div key={s.id} className="border rounded-lg p-3 space-y-2">
          <div className="flex gap-2 items-center">
            <input
              type="text"
              value={s.num}
              onChange={(e) => update(s.id, { num: e.target.value })}
              placeholder="17"
              className="w-16 rounded border px-2 py-1.5 text-sm bg-background text-center"
            />
            <input
              type="text"
              value={s.label}
              onChange={(e) => update(s.id, { label: e.target.value })}
              placeholder="SDG label"
              className="flex-1 rounded border px-2 py-1.5 text-sm bg-background"
            />
            <button
              onClick={() => onChange(items.filter((x) => x.id !== s.id))}
              className="text-red-500 px-2 text-lg"
            >
              ×
            </button>
          </div>
          <input
            type="text"
            value={s.desc}
            onChange={(e) => update(s.id, { desc: e.target.value })}
            placeholder="Short description"
            className="w-full rounded border px-2 py-1.5 text-sm bg-background"
          />
        </div>
      ))}
      <SaveBar onSave={onSave} saving={saving} saved={saved} />
    </div>
  );
}

// ─── Tab: Partners ────────────────────────────────────────────────────────────
function PartnersTab({
  items,
  onChange,
  onSave,
  saving,
  saved,
}: {
  items: AboutPartner[];
  onChange: (items: AboutPartner[]) => void;
  onSave: () => void;
  saving: boolean;
  saved: boolean;
}) {
  function update(id: string, patch: Partial<AboutPartner>) {
    onChange(items.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  }
  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Logo URLs are optional — partners without logos show name-only tiles.
      </p>
      <div className="flex justify-end">
        <button
          onClick={() =>
            onChange([
              ...items,
              { id: nanoid(), name: "", order: items.length },
            ])
          }
          className="px-3 py-1.5 rounded border text-sm hover:bg-muted"
        >
          + Add Partner
        </button>
      </div>
      {items.map((p) => (
        <div
          key={p.id}
          className="border rounded-lg p-3 flex items-center gap-3"
        >
          {p.logoUrl && (
            <Image
              src={p.logoUrl}
              alt=""
              className="h-8 w-16 object-contain rounded border"
            />
          )}
          <input
            type="text"
            value={p.name}
            onChange={(e) => update(p.id, { name: e.target.value })}
            placeholder="Partner name"
            className="flex-1 rounded border px-2 py-1.5 text-sm bg-background"
          />
          <input
            type="text"
            value={p.logoUrl ?? ""}
            onChange={(e) =>
              update(p.id, { logoUrl: e.target.value || undefined })
            }
            placeholder="Logo URL (optional)"
            className="flex-1 rounded border px-2 py-1.5 text-sm bg-background"
          />
          <button
            onClick={() => onChange(items.filter((x) => x.id !== p.id))}
            className="text-red-500 px-2 text-lg"
          >
            ×
          </button>
        </div>
      ))}
      <SaveBar onSave={onSave} saving={saving} saved={saved} />
    </div>
  );
}

// ─── Tab: CTA ─────────────────────────────────────────────────────────────────
function CTATab({
  data,
  onChange,
  onSave,
  saving,
  saved,
}: {
  data: AboutCTA | undefined;
  onChange: (d: AboutCTA) => void;
  onSave: () => void;
  saving: boolean;
  saved: boolean;
}) {
  const d: AboutCTA = data ?? {
    heading: "",
    subtitle: "",
    cta1Label: "",
    cta1Href: "",
    cta2Label: "",
    cta2Href: "",
  };
  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs text-muted-foreground">Heading</label>
        <input
          type="text"
          value={d.heading}
          onChange={(e) => onChange({ ...d, heading: e.target.value })}
          placeholder="Ready to shape your future?"
          className="w-full mt-1 rounded border px-2 py-1.5 text-sm bg-background"
        />
      </div>
      <div>
        <label className="text-xs text-muted-foreground">Subtitle</label>
        <textarea
          rows={3}
          value={d.subtitle}
          onChange={(e) => onChange({ ...d, subtitle: e.target.value })}
          className="w-full mt-1 rounded border px-2 py-1.5 text-sm bg-background"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-muted-foreground">CTA 1 Label</label>
          <input
            type="text"
            value={d.cta1Label}
            onChange={(e) => onChange({ ...d, cta1Label: e.target.value })}
            className="w-full mt-1 rounded border px-2 py-1.5 text-sm bg-background"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">CTA 1 Link</label>
          <input
            type="text"
            value={d.cta1Href}
            onChange={(e) => onChange({ ...d, cta1Href: e.target.value })}
            className="w-full mt-1 rounded border px-2 py-1.5 text-sm bg-background"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">CTA 2 Label</label>
          <input
            type="text"
            value={d.cta2Label}
            onChange={(e) => onChange({ ...d, cta2Label: e.target.value })}
            className="w-full mt-1 rounded border px-2 py-1.5 text-sm bg-background"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">CTA 2 Link</label>
          <input
            type="text"
            value={d.cta2Href}
            onChange={(e) => onChange({ ...d, cta2Href: e.target.value })}
            className="w-full mt-1 rounded border px-2 py-1.5 text-sm bg-background"
          />
        </div>
      </div>
      <SaveBar onSave={onSave} saving={saving} saved={saved} />
    </div>
  );
}
