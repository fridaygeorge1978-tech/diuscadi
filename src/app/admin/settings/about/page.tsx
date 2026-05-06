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
  AboutTeamMember,
  TeamTier,
} from "@/lib/models/aboutPageConfig";
import Image from "next/image";
import { useAdmin } from "@/context/AdminContext";
import { cn } from "../../../../lib/utils";

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

const HEAD_ROLE_KEYWORDS = [
  "head",
  "lead",
  "director",
  "coordinator",
  "president",
  "chair",
  "convener",
  "founder",
  "manager",
  "officer",
];

function isHeadPosition(committeeRole: string | null | undefined): boolean {
  if (!committeeRole) return false;
  const lower = committeeRole.toLowerCase();
  return HEAD_ROLE_KEYWORDS.some((kw) => lower.includes(kw));
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
  { key: "team", label: "👥 Team" },
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
  team?: { items: AboutTeamMember[] };
  cta?: AboutCTA;
}

interface EligibleUser {
  id: string;
  fullName: { firstname: string; secondname?: string; lastname?: string }; // ✅ lastname optional
  email: string;
  role: string;
  committee: string | null;
  avatar: { imageUrl?: string } | string | null;
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
    <div className={cn('flex', 'items-center', 'justify-end', 'gap-3', 'pt-4', 'border-t')}>
      {saved && (
        <span className={cn('text-sm', 'text-green-600', 'font-medium')}>✓ Saved</span>
      )}
      <button
        onClick={onSave}
        disabled={saving}
        className={cn('px-5', 'py-2', 'rounded-md', 'bg-primary', 'text-primary-foreground', 'text-sm', 'font-medium', 'disabled:opacity-50')}
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
      className={cn('fixed', 'inset-0', 'z-50', 'flex', 'items-center', 'justify-center', 'bg-black/60', 'backdrop-blur-sm')}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={cn('relative', 'bg-background', 'rounded-2xl', 'shadow-2xl', 'border', 'border-border', 'p-6', 'w-full', 'max-w-md', 'mx-4')}>
        <button
          onClick={onClose}
          className={cn('absolute', 'top-4', 'right-4', 'p-1', 'rounded-full', 'hover:bg-muted')}
        >
          <X className={cn('w-4', 'h-4')} />
        </button>
        <h3 className={cn('font-bold', 'text-lg', 'mb-1')}>Upload Photo</h3>
        <p className={cn('text-xs', 'text-muted-foreground', 'mb-4')}>
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
      <div className={cn('flex', 'items-center', 'justify-center', 'h-64', 'text-muted-foreground', 'text-sm')}>
        Loading about page config…
      </div>
    );

  const ownerId = user?.id ?? "about-cms";

  return (
    <div className={cn('max-w-4xl', 'mx-auto', 'mt-20', 'p-6', 'space-y-6')}>
      <div>
        <h1 className={cn('text-2xl', 'font-bold')}>About Page Settings</h1>
        <p className={cn('text-muted-foreground', 'text-sm', 'mt-1')}>
          Manage every section of the public About page. Changes go live within
          60 seconds.
        </p>
      </div>

      {/* Tab bar */}
      <div className={cn('flex', 'flex-wrap', 'gap-2', 'border-b', 'pb-3')}>
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
      {activeTab === "team" && (
  <TeamTab
    items={config.team?.items ?? []}
    onChange={(items) => setConfig((p) => ({ ...p, team: { items } }))}
    onSave={() => save("team", config.team ?? { items: [] })}
    saving={saving}
    saved={saved}
    ownerId={ownerId}
    isWebmaster={user?.role === "webmaster"}
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
      <div className={cn('grid', 'grid-cols-2', 'gap-4')}>
        <div>
          <label className={cn('text-xs', 'text-muted-foreground')}>
            Headline (plain text)
          </label>
          <input
            type="text"
            value={d.headline}
            onChange={(e) => onChange({ ...d, headline: e.target.value })}
            placeholder="Shaping the Young for"
            className={cn('w-full', 'mt-1', 'rounded', 'border', 'px-2', 'py-1.5', 'text-sm', 'bg-background')}
          />
        </div>
        <div>
          <label className={cn('text-xs', 'text-muted-foreground')}>
            Headline Accent (coloured)
          </label>
          <input
            type="text"
            value={d.headlineAccent}
            onChange={(e) => onChange({ ...d, headlineAccent: e.target.value })}
            placeholder="Future Career Success"
            className={cn('w-full', 'mt-1', 'rounded', 'border', 'px-2', 'py-1.5', 'text-sm', 'bg-background')}
          />
        </div>
      </div>
      <div>
        <label className={cn('text-xs', 'text-muted-foreground')}>Subtitle</label>
        <textarea
          rows={4}
          value={d.subtitle}
          onChange={(e) => onChange({ ...d, subtitle: e.target.value })}
          className={cn('w-full', 'mt-1', 'rounded', 'border', 'px-2', 'py-1.5', 'text-sm', 'bg-background')}
        />
      </div>
      <div className={cn('grid', 'grid-cols-2', 'gap-4')}>
        <div>
          <label className={cn('text-xs', 'text-muted-foreground')}>CTA 1 Label</label>
          <input
            type="text"
            value={d.cta1Label}
            onChange={(e) => onChange({ ...d, cta1Label: e.target.value })}
            placeholder="Our Mission"
            className={cn('w-full', 'mt-1', 'rounded', 'border', 'px-2', 'py-1.5', 'text-sm', 'bg-background')}
          />
        </div>
        <div>
          <label className={cn('text-xs', 'text-muted-foreground')}>CTA 1 Link</label>
          <input
            type="text"
            value={d.cta1Href}
            onChange={(e) => onChange({ ...d, cta1Href: e.target.value })}
            placeholder="#mission"
            className={cn('w-full', 'mt-1', 'rounded', 'border', 'px-2', 'py-1.5', 'text-sm', 'bg-background')}
          />
        </div>
        <div>
          <label className={cn('text-xs', 'text-muted-foreground')}>CTA 2 Label</label>
          <input
            type="text"
            value={d.cta2Label}
            onChange={(e) => onChange({ ...d, cta2Label: e.target.value })}
            placeholder="LASCADSS Programme"
            className={cn('w-full', 'mt-1', 'rounded', 'border', 'px-2', 'py-1.5', 'text-sm', 'bg-background')}
          />
        </div>
        <div>
          <label className={cn('text-xs', 'text-muted-foreground')}>CTA 2 Link</label>
          <input
            type="text"
            value={d.cta2Href}
            onChange={(e) => onChange({ ...d, cta2Href: e.target.value })}
            placeholder="#lascadss"
            className={cn('w-full', 'mt-1', 'rounded', 'border', 'px-2', 'py-1.5', 'text-sm', 'bg-background')}
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
      <p className={cn('text-xs', 'text-muted-foreground')}>
        These 4 stats appear in the glass bar below the hero.
      </p>
      {items.map((s, i) => (
        <div key={i} className={cn('grid', 'grid-cols-2', 'gap-3', 'border', 'rounded-lg', 'p-3')}>
          <div>
            <label className={cn('text-xs', 'text-muted-foreground')}>Value</label>
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
              className={cn('w-full', 'mt-1', 'rounded', 'border', 'px-2', 'py-1.5', 'text-sm', 'bg-background')}
            />
          </div>
          <div>
            <label className={cn('text-xs', 'text-muted-foreground')}>Label</label>
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
              className={cn('w-full', 'mt-1', 'rounded', 'border', 'px-2', 'py-1.5', 'text-sm', 'bg-background')}
            />
          </div>
        </div>
      ))}
      {items.length < 4 && (
        <button
          onClick={() => onChange([...items, { value: "", label: "" }])}
          className={cn('px-3', 'py-1.5', 'rounded', 'border', 'text-sm', 'hover:bg-muted')}
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
        <label className={cn('text-xs', 'text-muted-foreground')}>Section Heading</label>
        <input
          type="text"
          value={d.heading}
          onChange={(e) => onChange({ ...d, heading: e.target.value })}
          className={cn('w-full', 'mt-1', 'rounded', 'border', 'px-2', 'py-1.5', 'text-sm', 'bg-background')}
        />
      </div>

      <div className="space-y-2">
        <label className={cn('text-xs', 'text-muted-foreground')}>
          Story Paragraphs
        </label>
        {d.paragraphs.map((p, i) => (
          <div key={i} className={cn('flex', 'gap-2', 'items-start')}>
            <textarea
              rows={3}
              value={p}
              onChange={(e) => updateParagraph(i, e.target.value)}
              placeholder={`Paragraph ${i + 1}`}
              className={cn('flex-1', 'rounded', 'border', 'px-2', 'py-1.5', 'text-sm', 'bg-background')}
            />
            <button
              onClick={() =>
                onChange({
                  ...d,
                  paragraphs: d.paragraphs.filter((_, j) => j !== i),
                })
              }
              className={cn('text-red-500', 'px-2', 'mt-1')}
            >
              ×
            </button>
          </div>
        ))}
        <button
          onClick={() => onChange({ ...d, paragraphs: [...d.paragraphs, ""] })}
          className={cn('px-3', 'py-1.5', 'rounded', 'border', 'text-sm', 'hover:bg-muted')}
        >
          + Add Paragraph
        </button>
      </div>

      <div>
        <label className={cn('text-xs', 'text-muted-foreground')}>Quote Text</label>
        <textarea
          rows={3}
          value={d.quoteText}
          onChange={(e) => onChange({ ...d, quoteText: e.target.value })}
          className={cn('w-full', 'mt-1', 'rounded', 'border', 'px-2', 'py-1.5', 'text-sm', 'bg-background')}
        />
      </div>
      <div>
        <label className={cn('text-xs', 'text-muted-foreground')}>
          Quote Attribution
        </label>
        <input
          type="text"
          value={d.quoteAttribution}
          onChange={(e) => onChange({ ...d, quoteAttribution: e.target.value })}
          placeholder="— Prof. Chief Ikechukwu I. Umeh, Founder, DIUSCADI"
          className={cn('w-full', 'mt-1', 'rounded', 'border', 'px-2', 'py-1.5', 'text-sm', 'bg-background')}
        />
      </div>

      <div className={cn('flex', 'items-center', 'gap-3')}>
        {d.photoUrl && (
          <Image
    src={d.photoUrl}
    alt=""
    width={48}
    height={64}
    className={cn('h-16', 'w-12', 'object-cover', 'rounded-lg', 'border')}
  />
        )}
        <button
          onClick={() => setPhotoOpen(true)}
          className={cn('px-3', 'py-1.5', 'rounded', 'border', 'text-sm', 'hover:bg-muted')}
        >
          📁 {d.photoUrl ? "Change Photo" : "Upload Founder Photo"}
        </button>
      </div>
      <div>
        <label className={cn('text-xs', 'text-muted-foreground')}>Photo Alt Text</label>
        <input
          type="text"
          value={d.photoAlt}
          onChange={(e) => onChange({ ...d, photoAlt: e.target.value })}
          placeholder="Prof. Chief Ikechukwu I. Umeh"
          className={cn('w-full', 'mt-1', 'rounded', 'border', 'px-2', 'py-1.5', 'text-sm', 'bg-background')}
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
    <div className={cn('border', 'rounded-lg', 'p-3', 'space-y-2')}>
      <div className={cn('flex', 'gap-2', 'items-center')}>
        <select
          value={iconKey}
          onChange={(e) => onIconChange(e.target.value)}
          className={cn('rounded', 'border', 'px-2', 'py-1.5', 'text-sm', 'bg-background', 'w-36')}
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
          className={cn('flex-1', 'rounded', 'border', 'px-2', 'py-1.5', 'text-sm', 'bg-background')}
        />
        <button onClick={onRemove} className={cn('text-red-500', 'px-2', 'text-lg')}>
          ×
        </button>
      </div>
      <textarea
        rows={2}
        value={desc}
        onChange={(e) => onDescChange(e.target.value)}
        placeholder="Description…"
        className={cn('w-full', 'rounded', 'border', 'px-2', 'py-1.5', 'text-sm', 'bg-background')}
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
      <div className={cn('flex', 'justify-end')}>
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
          className={cn('px-3', 'py-1.5', 'rounded', 'border', 'text-sm', 'hover:bg-muted')}
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
      <div className={cn('flex', 'justify-end')}>
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
          className={cn('px-3', 'py-1.5', 'rounded', 'border', 'text-sm', 'hover:bg-muted')}
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
      <div className={cn('flex', 'justify-end')}>
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
          className={cn('px-3', 'py-1.5', 'rounded', 'border', 'text-sm', 'hover:bg-muted')}
        >
          + Add Milestone
        </button>
      </div>
      {items.map((m) => (
        <div key={m.id} className={cn('border', 'rounded-lg', 'p-3', 'space-y-2')}>
          <div className={cn('flex', 'gap-2', 'items-center')}>
            <input
              type="text"
              value={m.year}
              onChange={(e) => update(m.id, { year: e.target.value })}
              placeholder="2026"
              className={cn('w-20', 'rounded', 'border', 'px-2', 'py-1.5', 'text-sm', 'bg-background')}
            />
            <input
              type="text"
              value={m.title}
              onChange={(e) => update(m.id, { title: e.target.value })}
              placeholder="LASCADSS 7.0 — Theme Name"
              className={cn('flex-1', 'rounded', 'border', 'px-2', 'py-1.5', 'text-sm', 'bg-background')}
            />
            <button
              onClick={() => onChange(items.filter((x) => x.id !== m.id))}
              className={cn('text-red-500', 'px-2', 'text-lg')}
            >
              ×
            </button>
          </div>
          <textarea
            rows={2}
            value={m.desc}
            onChange={(e) => update(m.id, { desc: e.target.value })}
            placeholder="Description of this edition…"
            className={cn('w-full', 'rounded', 'border', 'px-2', 'py-1.5', 'text-sm', 'bg-background')}
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
      <div className={cn('flex', 'justify-end')}>
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
          className={cn('px-3', 'py-1.5', 'rounded', 'border', 'text-sm', 'hover:bg-muted')}
        >
          + Add SDG
        </button>
      </div>
      {items.map((s) => (
        <div key={s.id} className={cn('border', 'rounded-lg', 'p-3', 'space-y-2')}>
          <div className={cn('flex', 'gap-2', 'items-center')}>
            <input
              type="text"
              value={s.num}
              onChange={(e) => update(s.id, { num: e.target.value })}
              placeholder="17"
              className={cn('w-16', 'rounded', 'border', 'px-2', 'py-1.5', 'text-sm', 'bg-background', 'text-center')}
            />
            <input
              type="text"
              value={s.label}
              onChange={(e) => update(s.id, { label: e.target.value })}
              placeholder="SDG label"
              className={cn('flex-1', 'rounded', 'border', 'px-2', 'py-1.5', 'text-sm', 'bg-background')}
            />
            <button
              onClick={() => onChange(items.filter((x) => x.id !== s.id))}
              className={cn('text-red-500', 'px-2', 'text-lg')}
            >
              ×
            </button>
          </div>
          <input
            type="text"
            value={s.desc}
            onChange={(e) => update(s.id, { desc: e.target.value })}
            placeholder="Short description"
            className={cn('w-full', 'rounded', 'border', 'px-2', 'py-1.5', 'text-sm', 'bg-background')}
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
      <p className={cn('text-xs', 'text-muted-foreground')}>
        Logo URLs are optional — partners without logos show name-only tiles.
      </p>
      <div className={cn('flex', 'justify-end')}>
        <button
          onClick={() =>
            onChange([
              ...items,
              { id: nanoid(), name: "", order: items.length },
            ])
          }
          className={cn('px-3', 'py-1.5', 'rounded', 'border', 'text-sm', 'hover:bg-muted')}
        >
          + Add Partner
        </button>
      </div>
      {items.map((p) => (
        <div
          key={p.id}
          className={cn('border', 'rounded-lg', 'p-3', 'flex', 'items-center', 'gap-3')}
        >
          {p.logoUrl && (
            <Image
              src={p.logoUrl}
              alt=""
              width={64}
    height={32}
              className={cn('h-8', 'w-16', 'object-contain', 'rounded', 'border')}
            />
          )}
          <input
            type="text"
            value={p.name}
            onChange={(e) => update(p.id, { name: e.target.value })}
            placeholder="Partner name"
            className={cn('flex-1', 'rounded', 'border', 'px-2', 'py-1.5', 'text-sm', 'bg-background')}
          />
          <input
            type="text"
            value={p.logoUrl ?? ""}
            onChange={(e) =>
              update(p.id, { logoUrl: e.target.value || undefined })
            }
            placeholder="Logo URL (optional)"
            className={cn('flex-1', 'rounded', 'border', 'px-2', 'py-1.5', 'text-sm', 'bg-background')}
          />
          <button
            onClick={() => onChange(items.filter((x) => x.id !== p.id))}
            className={cn('text-red-500', 'px-2', 'text-lg')}
          >
            ×
          </button>
        </div>
      ))}
      <SaveBar onSave={onSave} saving={saving} saved={saved} />
    </div>
  );
}

// ─── User Picker Modal ────────────────────────────────────────────────────────
function UserPickerModal({
  open,
  onClose,
  onSelect,
  eligibleUsers,
  loadingUsers,
  alreadyAddedIds,
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (user: EligibleUser) => void;
  eligibleUsers: EligibleUser[];
  loadingUsers: boolean;
  alreadyAddedIds: Set<string>;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "admin" | "moderator">(
    "all",
  );

  const filtered = eligibleUsers.filter((u) => {
    if (alreadyAddedIds.has(u.id)) return false; // already in team

    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    const matchesSearch =
      searchQuery.trim() === "" ||
      `${u.fullName.firstname} ${u.fullName.lastname} ${u.email}`
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

    return matchesRole && matchesSearch;
  });

  if (!open || typeof window === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative bg-background rounded-2xl shadow-2xl border border-border p-6 w-full max-w-lg mx-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-lg">Select Team Member</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Showing admins, webmasters, and committee heads. Already-added
              members are hidden.
            </p>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-muted">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search + role filter */}
        <div className="flex gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name or email…"
            autoFocus
            className="flex-1 rounded border px-3 py-2 text-sm bg-background"
          />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as typeof roleFilter)}
            className="rounded border px-2 py-2 text-sm bg-background"
          >
            <option value="all">All</option>
            <option value="admin">Admin</option>
            <option value="moderator">Moderator</option>
          </select>
        </div>

        {/* User list */}
        <div className="max-h-72 overflow-y-auto rounded-lg border border-border divide-y divide-border">
          {loadingUsers ? (
            <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
              Loading eligible users…
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2 text-center">
              <p className="text-sm text-muted-foreground">
                {eligibleUsers.length === 0
                  ? "No admin or moderator users found."
                  : alreadyAddedIds.size > 0 && searchQuery === ""
                    ? "All eligible users have already been added."
                    : "No users match your search."}
              </p>
            </div>
          ) : (
            filtered.map((u) => {
              const avatarUrl = u.avatar
                ? typeof u.avatar === "string"
                  ? u.avatar
                  : (u.avatar.imageUrl ?? "")
                : "";
              const fullName = [
                u.fullName.firstname,
                u.fullName.secondname,
                u.fullName.lastname,
              ]
                .filter(Boolean)
                .join(" ");

              return (
                <button
                  key={u.id}
                  onClick={() => {
                    onSelect(u);
                    onClose();
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-muted text-left transition-colors"
                >
                  {/* Avatar */}
                  <div className="w-9 h-9 rounded-xl bg-primary/10 overflow-hidden shrink-0 flex items-center justify-center">
                    {avatarUrl ? (
                      <Image
                        src={avatarUrl}
                        alt=""
                        width={36}
                        height={36}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <span className="text-primary text-sm font-black">
                        {u.fullName.firstname.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {fullName}
                    </p>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {u.email}
                    </p>
                  </div>

                  {/* Badges */}
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-bold uppercase tracking-wider">
                      {u.role}
                    </span>
                    {u.committee && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground font-medium truncate max-w-[100px]">
                        {u.committee}
                      </span>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>

        <p className="text-[10px] text-muted-foreground">
          {filtered.length} of {eligibleUsers.length} eligible users shown
          {alreadyAddedIds.size > 0 &&
            ` · ${alreadyAddedIds.size} already added`}
        </p>
      </div>
    </div>,
    document.body,
  );
}

// ─── Tab: Team ────────────────────────────────────────────────────────────────
function TeamTab({
  items,
  onChange,
  onSave,
  saving,
  saved,
  ownerId,
  isWebmaster,
}: {
  items: AboutTeamMember[];
  onChange: (items: AboutTeamMember[]) => void;
  onSave: () => void;
  saving: boolean;
  saved: boolean;
  ownerId: string;
  isWebmaster: boolean;
}) {
  const { token } = useAuth();

  const { loadUsersMultiRole, users, loadingUsers } = useAdmin();

  const [uploadFor, setUploadFor] = useState<string | null>(null);
  const [pickerFor, setPickerFor] = useState<string | null>(null);
  const [hasFetched, setHasFetched] = useState(false);

  // Set of userIds already in the team — used to filter the picker
  const alreadyAddedIds = new Set(
    items.map((m) => m.userId).filter(Boolean) as string[],
  );

  // ✅ New: derive eligible users from context users array
  const eligibleUsers: EligibleUser[] = users
    .filter((u) => {
      if (u.role === "admin" || u.role === "webmaster") return true;
      return isHeadPosition(u.committee);
    })
    .map((u) => ({
      id: u.id,
      fullName: u.fullName,
      email: u.email,
      role: u.role,
      committee: u.committee,
      avatar: u.avatar,
    }));

 function openPicker(memberId: string) {
   setPickerFor(memberId);
   if (!hasFetched) {
     loadUsersMultiRole(["admin", "moderator"], token ?? undefined).finally(
       () => setHasFetched(true),
     );
   }
 }

  // async function fetchEligibleUsers(tkn: string) {
  //   setLoadingUsers(true);
  //   try {
  //     const headers: HeadersInit = {
  //       "Content-Type": "application/json",
  //       Authorization: `Bearer ${tkn}`,
  //     };

  //     // Fetch admins and moderators separately — route only accepts one role at a time
  //     const [adminRes, modRes] = await Promise.all([
  //       fetch("/api/admin/users?role=admin&limit=100&page=1", { headers }),
  //       fetch("/api/admin/users?role=moderator&limit=100&page=1", { headers }),
  //     ]);

  //     if (!adminRes.ok)
  //       throw new Error(`Admin fetch failed: ${adminRes.status}`);
  //     if (!modRes.ok)
  //       throw new Error(`Moderator fetch failed: ${modRes.status}`);

  //     const [adminData, modData] = await Promise.all([
  //       adminRes.json(),
  //       modRes.json(),
  //     ]);

  //     const allUsers: EligibleUser[] = [
  //       ...(adminData.users ?? []),
  //       ...(modData.users ?? []),
  //     ];

  //     // Filter: keep admins/webmasters always, plus moderators with head positions
  //     const filtered = allUsers.filter((u) => {
  //       if (u.role === "admin" || u.role === "webmaster") return true;
  //       // Moderators only if they hold a head/lead committee position
  //       return isHeadPosition(u.committee);
  //     });

  //     // Deduplicate by id
  //     const seen = new Set<string>();
  //     const deduped = filtered.filter((u) => {
  //       if (seen.has(u.id)) return false;
  //       seen.add(u.id);
  //       return true;
  //     });

  //     setEligibleUsers(deduped);
  //     setHasFetched(true);
  //   } catch (err) {
  //     console.error("[TeamTab] fetchEligibleUsers failed:", err);
  //   } finally {
  //     setLoadingUsers(false);
  //   }
  // }

  function addBlankMember() {
    onChange([
      ...items,
      {
        id: nanoid(),
        displayName: "",
        professionalTitle: "",
        shortBio: "",
        photoUrl: "",
        tier: "core",
        visible: true,
        order: items.length,
      },
    ]);
  }

  function populateFromUser(memberId: string, user: EligibleUser) {
    const displayName = [
      user.fullName.firstname,
      user.fullName.secondname,
      user.fullName.lastname,
    ]
      .filter(Boolean)
      .join(" ");

    const photoUrl = user.avatar
      ? typeof user.avatar === "string"
        ? user.avatar
        : (user.avatar.imageUrl ?? "")
      : "";

    // Pre-fill professional title from committee role if available
    const professionalTitle = user.committee
      ? `${user.committee}`
      : user.role.charAt(0).toUpperCase() + user.role.slice(1);

    onChange(
      items.map((m) =>
        m.id === memberId
          ? { ...m, userId: user.id, displayName, photoUrl, professionalTitle }
          : m,
      ),
    );
  }

  function update(id: string, patch: Partial<AboutTeamMember>) {
    onChange(items.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  }

  function remove(id: string) {
    onChange(items.filter((m) => m.id !== id));
  }

  if (!isWebmaster) {
    return (
      <div
        className={cn(
          "flex",
          "flex-col",
          "items-center",
          "justify-center",
          "py-16",
          "text-center",
          "space-y-3",
        )}
      >
        <div
          className={cn(
            "w-12",
            "h-12",
            "rounded-2xl",
            "bg-muted",
            "flex",
            "items-center",
            "justify-center",
            "text-muted-foreground",
            "text-2xl",
          )}
        >
          🔒
        </div>
        <p className={cn("font-bold", "text-foreground")}>
          Webmaster Access Required
        </p>
        <p className={cn("text-sm", "text-muted-foreground", "max-w-xs")}>
          The team section can only be edited by webmasters to protect the
          privacy of team members.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className={cn("flex", "items-center", "justify-between")}>
        <p className={cn("text-sm", "text-muted-foreground")}>
          Add team members manually or link them to platform users. Only{" "}
          <strong>visible</strong> members appear on the public About page.
        </p>
        <button
          onClick={addBlankMember}
          className={cn(
            "px-3",
            "py-1.5",
            "rounded",
            "border",
            "text-sm",
            "hover:bg-muted",
            "shrink-0",
          )}
        >
          + Add Member
        </button>
      </div>

      <div className="space-y-4">
        {items.length === 0 && (
          <div
            className={cn(
              "text-center",
              "py-10",
              "text-sm",
              "text-muted-foreground",
              "border",
              "rounded-xl",
            )}
          >
            No team members yet. Click <strong>+ Add Member</strong> to get
            started.
          </div>
        )}
        {items.map((member) => (
          <div
            key={member.id}
            className={`border rounded-xl p-4 space-y-3 transition-opacity ${!member.visible ? "opacity-50" : ""}`}
          >
            {/* Header row */}
            <div className={cn("flex", "items-center", "justify-between")}>
              <div className={cn("flex", "items-center", "gap-2")}>
                {member.photoUrl ? (
                  <Image
                    src={member.photoUrl}
                    alt=""
                    width={32}
                    height={32}
                    className={cn(
                      "w-8",
                      "h-8",
                      "rounded-lg",
                      "object-cover",
                      "border",
                    )}
                  />
                ) : (
                  <div
                    className={cn(
                      "w-8",
                      "h-8",
                      "rounded-lg",
                      "bg-primary/10",
                      "flex",
                      "items-center",
                      "justify-center",
                      "text-primary",
                      "text-xs",
                      "font-black",
                    )}
                  >
                    {member.displayName.charAt(0).toUpperCase() || "?"}
                  </div>
                )}
                <span
                  className={cn("text-sm", "font-medium", "text-foreground")}
                >
                  {member.displayName || "Unnamed member"}
                </span>
                {member.userId && (
                  <span
                    className={cn(
                      "text-[9px]",
                      "px-1.5",
                      "py-0.5",
                      "rounded-full",
                      "bg-primary/10",
                      "text-primary",
                      "font-bold",
                      "uppercase",
                      "tracking-wider",
                    )}
                  >
                    Linked
                  </span>
                )}
                <span
                  className={cn(
                    "text-[9px]",
                    "px-1.5",
                    "py-0.5",
                    "rounded-full",
                    "bg-muted",
                    "text-muted-foreground",
                    "font-medium",
                    "uppercase",
                  )}
                >
                  {member.tier}
                </span>
              </div>
              <div className={cn("flex", "items-center", "gap-2")}>
                <button
                  onClick={() =>
                    update(member.id, { visible: !member.visible })
                  }
                  className={cn(
                    "text-xs",
                    "px-2",
                    "py-1",
                    "rounded",
                    "border",
                    "hover:bg-muted",
                  )}
                >
                  {member.visible ? "Hide" : "Show"}
                </button>
                <button
                  onClick={() => remove(member.id)}
                  className={cn(
                    "text-xs",
                    "px-2",
                    "py-1",
                    "rounded",
                    "border",
                    "border-red-300",
                    "text-red-500",
                    "hover:bg-red-50",
                  )}
                >
                  Remove
                </button>
              </div>
            </div>

            {/* Link to platform user */}
            <div
              className={cn(
                "p-2.5",
                "rounded-lg",
                "bg-muted",
                "border",
                "border-border",
                "flex",
                "items-center",
                "justify-between",
                "gap-3",
              )}
            >
              <div>
                <p
                  className={cn(
                    "text-[10px]",
                    "font-bold",
                    "text-muted-foreground",
                    "uppercase",
                    "tracking-wider",
                  )}
                >
                  {member.userId
                    ? "Linked to platform user"
                    : "Not linked to a platform user"}
                </p>
                {member.userId && (
                  <p
                    className={cn(
                      "text-[10px]",
                      "text-muted-foreground",
                      "mt-0.5",
                    )}
                  >
                    Name, photo & title were auto-populated. You can still edit
                    them below.
                  </p>
                )}
              </div>
              <button
                onClick={() => openPicker(member.id)}
                className={cn(
                  "text-xs",
                  "px-2.5",
                  "py-1.5",
                  "rounded",
                  "border",
                  "hover:bg-background",
                  "whitespace-nowrap",
                  "shrink-0",
                )}
              >
                {member.userId ? "Change user →" : "Link platform user →"}
              </button>
            </div>

            {/* Editable fields */}
            <div className={cn("grid", "grid-cols-2", "gap-3")}>
              <div>
                <label className={cn("text-xs", "text-muted-foreground")}>
                  Display Name
                </label>
                <input
                  type="text"
                  value={member.displayName}
                  onChange={(e) =>
                    update(member.id, { displayName: e.target.value })
                  }
                  placeholder="Full name"
                  className={cn(
                    "w-full",
                    "mt-1",
                    "rounded",
                    "border",
                    "px-2",
                    "py-1.5",
                    "text-sm",
                    "bg-background",
                  )}
                />
              </div>
              <div>
                <label className={cn("text-xs", "text-muted-foreground")}>
                  Professional Title
                </label>
                <input
                  type="text"
                  value={member.professionalTitle}
                  onChange={(e) =>
                    update(member.id, { professionalTitle: e.target.value })
                  }
                  placeholder="e.g. Head of Publicity · UX Designer"
                  className={cn(
                    "w-full",
                    "mt-1",
                    "rounded",
                    "border",
                    "px-2",
                    "py-1.5",
                    "text-sm",
                    "bg-background",
                  )}
                />
              </div>
            </div>

            <div>
              <label className={cn("text-xs", "text-muted-foreground")}>
                Short Bio
              </label>
              <textarea
                rows={2}
                value={member.shortBio}
                onChange={(e) =>
                  update(member.id, { shortBio: e.target.value })
                }
                placeholder="One or two sentences about this person…"
                className={cn(
                  "w-full",
                  "mt-1",
                  "rounded",
                  "border",
                  "px-2",
                  "py-1.5",
                  "text-sm",
                  "bg-background",
                )}
              />
            </div>

            <div className={cn("grid", "grid-cols-2", "gap-3")}>
              <div>
                <label className={cn("text-xs", "text-muted-foreground")}>
                  Tier
                </label>
                <select
                  value={member.tier}
                  onChange={(e) =>
                    update(member.id, { tier: e.target.value as TeamTier })
                  }
                  className={cn(
                    "w-full",
                    "mt-1",
                    "rounded",
                    "border",
                    "px-2",
                    "py-1.5",
                    "text-sm",
                    "bg-background",
                  )}
                >
                  <option value="leadership">Leadership</option>
                  <option value="core">Core Team</option>
                  <option value="volunteer">Volunteer Team</option>
                </select>
              </div>
              <div>
                <label className={cn("text-xs", "text-muted-foreground")}>
                  Photo
                </label>
                <div className={cn("flex", "items-center", "gap-2", "mt-1")}>
                  {member.photoUrl && (
                    <Image
                      src={member.photoUrl}
                      alt=""
                      width={32}
                      height={32}
                      className={cn(
                        "h-8",
                        "w-8",
                        "rounded-lg",
                        "object-cover",
                        "border",
                      )}
                    />
                  )}
                  <button
                    onClick={() => setUploadFor(member.id)}
                    className={cn(
                      "px-2",
                      "py-1.5",
                      "rounded",
                      "border",
                      "text-xs",
                      "hover:bg-muted",
                    )}
                  >
                    {member.photoUrl ? "Change" : "Upload Photo"}
                  </button>
                  {member.photoUrl && (
                    <button
                      onClick={() => update(member.id, { photoUrl: "" })}
                      className={cn(
                        "text-xs",
                        "text-red-500",
                        "hover:underline",
                      )}
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <SaveBar onSave={onSave} saving={saving} saved={saved} />

      {/* User picker modal */}
      <UserPickerModal
        open={pickerFor !== null}
        onClose={() => setPickerFor(null)}
        eligibleUsers={eligibleUsers}
        loadingUsers={loadingUsers}
        alreadyAddedIds={alreadyAddedIds}
        onSelect={(user) => {
          if (pickerFor) populateFromUser(pickerFor, user);
          setPickerFor(null);
        }}
      />

      {/* Photo upload modal */}
      <PhotoUploadModal
        open={uploadFor !== null}
        onClose={() => setUploadFor(null)}
        ownerId={ownerId}
        onUploaded={(url) => {
          if (uploadFor) update(uploadFor, { photoUrl: url });
          setUploadFor(null);
        }}
      />
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
        <label className={cn('text-xs', 'text-muted-foreground')}>Heading</label>
        <input
          type="text"
          value={d.heading}
          onChange={(e) => onChange({ ...d, heading: e.target.value })}
          placeholder="Ready to shape your future?"
          className={cn('w-full', 'mt-1', 'rounded', 'border', 'px-2', 'py-1.5', 'text-sm', 'bg-background')}
        />
      </div>
      <div>
        <label className={cn('text-xs', 'text-muted-foreground')}>Subtitle</label>
        <textarea
          rows={3}
          value={d.subtitle}
          onChange={(e) => onChange({ ...d, subtitle: e.target.value })}
          className={cn('w-full', 'mt-1', 'rounded', 'border', 'px-2', 'py-1.5', 'text-sm', 'bg-background')}
        />
      </div>
      <div className={cn('grid', 'grid-cols-2', 'gap-4')}>
        <div>
          <label className={cn('text-xs', 'text-muted-foreground')}>CTA 1 Label</label>
          <input
            type="text"
            value={d.cta1Label}
            onChange={(e) => onChange({ ...d, cta1Label: e.target.value })}
            className={cn('w-full', 'mt-1', 'rounded', 'border', 'px-2', 'py-1.5', 'text-sm', 'bg-background')}
          />
        </div>
        <div>
          <label className={cn('text-xs', 'text-muted-foreground')}>CTA 1 Link</label>
          <input
            type="text"
            value={d.cta1Href}
            onChange={(e) => onChange({ ...d, cta1Href: e.target.value })}
            className={cn('w-full', 'mt-1', 'rounded', 'border', 'px-2', 'py-1.5', 'text-sm', 'bg-background')}
          />
        </div>
        <div>
          <label className={cn('text-xs', 'text-muted-foreground')}>CTA 2 Label</label>
          <input
            type="text"
            value={d.cta2Label}
            onChange={(e) => onChange({ ...d, cta2Label: e.target.value })}
            className={cn('w-full', 'mt-1', 'rounded', 'border', 'px-2', 'py-1.5', 'text-sm', 'bg-background')}
          />
        </div>
        <div>
          <label className={cn('text-xs', 'text-muted-foreground')}>CTA 2 Link</label>
          <input
            type="text"
            value={d.cta2Href}
            onChange={(e) => onChange({ ...d, cta2Href: e.target.value })}
            className={cn('w-full', 'mt-1', 'rounded', 'border', 'px-2', 'py-1.5', 'text-sm', 'bg-background')}
          />
        </div>
      </div>
      <SaveBar onSave={onSave} saving={saving} saved={saved} />
    </div>
  );
}
