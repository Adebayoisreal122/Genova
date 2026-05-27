"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import {
  Loader2, Scissors, LayoutGrid, LogOut, Menu, X,
  Download, Sparkles, Upload, ChevronRight, Trash2, Wand2,
  ZoomIn, Info, Copy, Check, Image as ImageIcon,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
type Tab = "generate" | "remove-bg" | "upscale" | "gallery";

interface ImageMeta {
  width?: number;
  height?: number;
  size?: string;
  model?: string;
  prompt?: string;
  createdAt: Date;
}

interface GalleryItem {
  id: string;
  url: string;
  type: "generated" | "bg-removed" | "upscaled";
  meta: ImageMeta;
}

// ─── Nav Config ───────────────────────────────────────────────────────────────
const NAV: { id: Tab; label: string; icon: React.ReactNode; tag?: string; color: string }[] = [
  { id: "generate",  label: "Generate Image",    icon: <Sparkles size={16} />, color: "violet" },
  { id: "remove-bg", label: "Remove Background", icon: <Scissors size={16} />, tag: "Free", color: "emerald" },
  { id: "upscale",   label: "Upscale Image",     icon: <ZoomIn size={16} />,   tag: "Free", color: "amber" },
  { id: "gallery",   label: "My Gallery",        icon: <LayoutGrid size={16} />, color: "rose" },
];

const ACTIVE_CLS: Record<string, string> = {
  violet:  "text-violet-300  bg-violet-500/10  border-violet-500/25",
  emerald: "text-emerald-300 bg-emerald-500/10 border-emerald-500/25",
  amber:   "text-amber-300   bg-amber-500/10   border-amber-500/25",
  rose:    "text-rose-300    bg-rose-500/10    border-rose-500/25",
};

const BTN_CLS: Record<string, string> = {
  violet:  "bg-violet-600  hover:bg-violet-500",
  emerald: "bg-emerald-700 hover:bg-emerald-600",
  amber:   "bg-amber-700   hover:bg-amber-600",
};

const GEN_MODELS = [
  { name: "Stable Diffusion XL",  id: "stabilityai/stable-diffusion-xl-base-1.0" },
  { name: "Stable Diffusion 2.1", id: "stabilityai/stable-diffusion-2-1" },
  { name: "Runwayml SD v1.5",     id: "runwayml/stable-diffusion-v1-5" },
];

const TYPE_LABELS: Record<GalleryItem["type"], { label: string; cls: string }> = {
  generated:    { label: "Generated",  cls: "text-violet-400  bg-violet-500/15" },
  "bg-removed": { label: "BG Removed", cls: "text-emerald-400 bg-emerald-500/15" },
  upscaled:     { label: "Upscaled",   cls: "text-amber-400   bg-amber-500/15" },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const readDataUrl = (f: File): Promise<string> =>
  new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result as string);
    r.onerror = rej;
    r.readAsDataURL(f);
  });

const fmtBytes = (n: number) =>
  n < 1024 ? `${n} B` : n < 1_048_576 ? `${(n / 1024).toFixed(1)} KB` : `${(n / 1_048_576).toFixed(1)} MB`;

const dlBlob = (blob: Blob, name: string) => {
  const url = URL.createObjectURL(blob);
  Object.assign(document.createElement("a"), { href: url, download: name }).click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

const dlUrl = (url: string, name: string) =>
  Object.assign(document.createElement("a"), { href: url, download: name }).click();

// ─── Sub-components ───────────────────────────────────────────────────────────
function DropZone({
  onFile,
  accept = "image/*",
  label = "Drop image here or click to upload",
}: {
  onFile: (f: File) => void;
  accept?: string;
  label?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  return (
    <div
      onClick={() => ref.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDrag(false);
        const f = e.dataTransfer.files[0];
        if (f) onFile(f);
      }}
      className={`flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-10 cursor-pointer transition-all select-none
        ${drag ? "border-white/30 bg-white/5" : "border-white/8 hover:border-white/15 hover:bg-white/3"}`}
    >
      <div className="p-3 rounded-xl bg-white/5">
        <Upload size={20} className="text-white/30" />
      </div>
      <div className="text-center">
        <p className="text-sm text-white/50">{label}</p>
        <p className="text-xs text-white/20 mt-1">PNG · JPG · WEBP — max 10 MB</p>
      </div>
      <input
        ref={ref}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
      />
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-xs font-semibold text-white/35 uppercase tracking-widest mb-1.5">
      {children}
    </label>
  );
}

function InfoBanner({
  color,
  icon,
  title,
  children,
}: {
  color: string;
  icon: string;
  title: string;
  children: React.ReactNode;
}) {
  const cls: Record<string, string> = {
    violet:  "bg-violet-500/5  border-violet-500/15  text-violet-300/80",
    emerald: "bg-emerald-500/5 border-emerald-500/15 text-emerald-300/80",
    amber:   "bg-amber-500/5   border-amber-500/15   text-amber-300/80",
  };
  return (
    <div className={`p-4 rounded-xl border text-xs space-y-1 ${cls[color]}`}>
      <p className="font-semibold opacity-100">{icon} {title}</p>
      <div className="space-y-0.5 opacity-80">{children}</div>
    </div>
  );
}

function StatusBadge({ text, color = "violet" }: { text: string; color?: string }) {
  const cls: Record<string, string> = {
    violet:  "bg-violet-500/8  border-violet-500/15  text-violet-300",
    emerald: "bg-emerald-500/8 border-emerald-500/15 text-emerald-300",
    amber:   "bg-amber-500/8   border-amber-500/15   text-amber-300",
  };
  return (
    <div className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border text-sm ${cls[color]}`}>
      <Loader2 size={14} className="animate-spin shrink-0" />
      {text}
    </div>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-start gap-3 py-2 border-b border-white/4 last:border-0">
      <span className="text-xs text-white/25 w-16 shrink-0">{label}</span>
      <span className="text-xs text-white/60 flex-1 break-all leading-relaxed">{value}</span>
      <button
        onClick={() => {
          navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
        className="text-white/15 hover:text-white/40 transition-colors mt-0.5 shrink-0"
      >
        {copied ? <Check size={11} /> : <Copy size={11} />}
      </button>
    </div>
  );
}

function MetaPanel({ meta }: { meta: ImageMeta }) {
  return (
    <div className="rounded-xl bg-white/3 border border-white/6 px-4 py-1">
      {meta.prompt && <MetaRow label="Prompt" value={meta.prompt} />}
      {meta.model  && <MetaRow label="Model"  value={meta.model} />}
      {meta.width  && <MetaRow label="Size"   value={`${meta.width} × ${meta.height}px`} />}
      {meta.size   && <MetaRow label="File"   value={meta.size} />}
      <MetaRow label="Date" value={meta.createdAt.toLocaleString()} />
    </div>
  );
}

function ResultCard({
  url,
  meta,
  onClear,
  onDownload,
}: {
  url: string;
  meta: ImageMeta;
  onClear?: () => void;
  onDownload: () => void;
}) {
  const [showMeta, setShowMeta] = useState(false);
  return (
    <div className="rounded-2xl border border-white/8 bg-white/3 overflow-hidden">
      <div className="relative group">
        <img src={url} alt="result" className="w-full max-h-100 object-contain checker" />
        <div className="absolute top-3 right-3 flex gap-1.5 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
          {[
            { icon: <Info size={13} />, onClick: () => setShowMeta((v) => !v), title: "Metadata" },
            { icon: <Download size={13} />, onClick: onDownload, title: "Download" },
            ...(onClear ? [{ icon: <X size={13} />, onClick: onClear, title: "Clear" }] : []),
          ].map(({ icon, onClick, title }) => (
            <button
              key={title}
              onClick={onClick}
              title={title}
              className="p-2 rounded-lg bg-black/60 hover:bg-black/80 text-white backdrop-blur-sm transition-colors"
            >
              {icon}
            </button>
          ))}
        </div>
      </div>
      {showMeta && (
        <div className="p-4 border-t border-white/6">
          <MetaPanel meta={meta} />
        </div>
      )}
    </div>
  );
}

// panel

function GeneratePanel({ onAdd }: { onAdd: (i: GalleryItem) => void }) {
  const [prompt, setPrompt] = useState("");
  const [model, setModel] = useState(GEN_MODELS[0].id);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ url: string; meta: ImageMeta } | null>(null);

  const generate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/images/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ prompt, model }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed");
      const url = data.image?.filename
        ? `${process.env.NEXT_PUBLIC_API_URL}${data.image.filename}`
        : "";
      const meta: ImageMeta = {
        prompt,
        model: GEN_MODELS.find((m) => m.id === model)?.name,
        createdAt: new Date(data.image?.createdAt ?? Date.now()),
      };
      setResult({ url, meta });
      // Use the DB _id so delete works against the real record
      onAdd({ id: data.image?._id ?? Date.now().toString(), url, type: "generated", meta });
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <Label>Model</Label>
        <select
          value={model}
          onChange={(e) => setModel(e.target.value)}
          className="w-full bg-white/4 border border-white/8 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-white/20 appearance-none cursor-pointer transition-colors"
        >
          {GEN_MODELS.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <Label> Your Prompt</Label>
        <textarea
          rows={4}
          placeholder="A misty mountain range at golden hour, photorealistic, 8K..."
          className="w-full bg-white/4 border border-white/8 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-white/20 resize-none transition-colors"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) generate(); }}
        />
        <p className="text-xs text-white/20 mt-1">Cmd/Ctrl + Enter to generate</p>
      </div>

      <div className="flex gap-3">
        <button
          onClick={generate}
          disabled={loading || !prompt.trim()}
          className={`flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl ${BTN_CLS.violet} disabled:opacity-35 disabled:cursor-not-allowed font-semibold text-sm text-white transition-all active:scale-[0.98]`}
        >
          {loading ? (
            <><Loader2 size={15} className="animate-spin" /> Generating…</>
          ) : (
            <><Wand2 size={15} /> Generate</>
          )}
        </button>
        <button
          onClick={() => { setPrompt(""); setResult(null); }}
          className="px-4 py-3 rounded-xl bg-white/4 hover:bg-white/8 text-white/35 hover:text-white/65 text-sm transition-all"
        >
          Clear
        </button>
      </div>

      {loading && <StatusBadge text="Generating your image — may take 20–40s on cold start…" />}
      {result && (
        <div className="space-y-3">
          <ResultCard
            url={result.url}
            meta={result.meta}
            onClear={() => setResult(null)}
            onDownload={() => dlUrl(result.url, "generated.png")}
          />
          <div className="flex gap-3">
            <button
              onClick={() => dlUrl(result.url, "generated.png")}
              className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white/4 hover:bg-white/8 text-white/60 hover:text-white text-sm font-medium border border-white/8 hover:border-white/15 transition-all active:scale-[0.98]"
            >
              <Download size={14} /> Save Image
            </button>
            <button
              onClick={() => setResult(null)}
              className="px-4 py-3 rounded-xl bg-white/4 hover:bg-white/8 text-white/25 hover:text-white text-sm transition-all"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      <InfoBanner color="violet" icon="💡" title="Tips for better results">
        <p>Add detail: style, lighting, mood. E.g. <em>"cinematic, golden hour, wide angle lens"</em></p>
        <p>If the model returns an error, wait 30s — it may be cold-starting on Hugging Face.</p>
      </InfoBanner>
    </div>
  );
}


function RemoveBgPanel({ onAdd }: { onAdd: (i: GalleryItem) => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [blob, setBlob] = useState<Blob | null>(null);
  const [resultUrl, setResultUrl] = useState("");
  const [loading, setLoading] = useState(false);

  // ── API key comes from env — users never need to enter it ──────────────────
  const apiKey = process.env.NEXT_PUBLIC_REMOVEBG_KEY ?? "";

  const handleFile = async (f: File) => {
    setFile(f);
    setPreview(await readDataUrl(f));
    setBlob(null);
    setResultUrl("");
  };

  const remove = async () => {
    if (!file) return;
    if (!apiKey) {
      alert("Remove.bg API key is not configured. Add NEXT_PUBLIC_REMOVEBG_KEY to your .env.local file.");
      return;
    }
    setLoading(true);
    try {
      const form = new FormData();
      form.append("image_file", file);
      form.append("size", "auto");
      const res = await fetch("https://api.remove.bg/v1.0/removebg", {
        method: "POST",
        headers: { "X-Api-Key": apiKey },
        body: form,
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.errors?.[0]?.title || "Background removal failed");
      }
      const b = await res.blob();
      const url = URL.createObjectURL(b);
      setBlob(b);
      setResultUrl(url);
      onAdd({
        id: Date.now().toString(),
        url,
        type: "bg-removed",
        meta: { size: fmtBytes(b.size), createdAt: new Date() },
      });
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <InfoBanner color="emerald" icon="✂️" title="Background Removal — remove.bg">
        <p>Upload any image and we'll remove the background instantly. Powered by remove.bg.</p>
      </InfoBanner>

      {!preview ? (
        <DropZone onFile={handleFile} />
      ) : (
        <div className="space-y-4">
          <div className={`grid gap-4 ${resultUrl ? "grid-cols-2" : "grid-cols-1"}`}>
            <div>
              <Label>Original</Label>
              <img src={preview} className="w-full h-52 object-contain rounded-xl border border-white/8 bg-white/3" />
            </div>
            {resultUrl && (
              <div>
                <Label>Result</Label>
                <img src={resultUrl} className="w-full h-52 object-contain rounded-xl border border-white/8 checker" />
              </div>
            )}
          </div>

          {loading && <StatusBadge text="Removing background…" color="emerald" />}
          {blob && <MetaPanel meta={{ size: fmtBytes(blob.size), createdAt: new Date() }} />}

          <div className="flex gap-3">
            <button
              onClick={remove}
              disabled={loading}
              className={`flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl ${BTN_CLS.emerald} disabled:opacity-35 font-semibold text-sm text-white transition-all active:scale-[0.98]`}
            >
              {loading ? (
                <><Loader2 size={15} className="animate-spin" /> Processing…</>
              ) : (
                <><Scissors size={15} /> Remove Background</>
              )}
            </button>
            {blob && (
              <button
                onClick={() => dlBlob(blob, "no-bg.png")}
                className="px-4 py-3 rounded-xl bg-white/4 hover:bg-white/8 text-white/40 hover:text-white text-sm flex items-center gap-2 transition-all"
              >
                <Download size={14} /> Save
              </button>
            )}
            <button
              onClick={() => { setFile(null); setPreview(""); setBlob(null); setResultUrl(""); }}
              className="px-4 py-3 rounded-xl bg-white/4 hover:bg-white/8 text-white/25 hover:text-white text-sm transition-all"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


function UpscalePanel({ onAdd }: { onAdd: (i: GalleryItem) => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [resultUrl, setResultUrl] = useState("");
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [loading, setLoading] = useState(false);
  const [scale, setScale] = useState(2);
  const [orig, setOrig] = useState({ w: 0, h: 0, bytes: 0 });

  const handleFile = async (f: File) => {
    setFile(f);
    setPreview(await readDataUrl(f));
    setResultUrl("");
    setResultBlob(null);
    const img = new window.Image();
    img.onload = () => setOrig({ w: img.naturalWidth, h: img.naturalHeight, bytes: f.size });
    img.src = URL.createObjectURL(f);
  };

  const upscale = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const img = new window.Image();
      await new Promise<void>((res, rej) => {
        img.onload = () => res();
        img.onerror = rej;
        img.src = preview;
      });
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth * scale;
      canvas.height = img.naturalHeight * scale;
      const ctx = canvas.getContext("2d")!;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      await new Promise<void>((res) => {
        canvas.toBlob((b) => {
          if (!b) return;
          const url = URL.createObjectURL(b);
          setResultUrl(url);
          setResultBlob(b);
          onAdd({
            id: Date.now().toString(),
            url,
            type: "upscaled",
            meta: {
              width: canvas.width,
              height: canvas.height,
              size: fmtBytes(b.size),
              createdAt: new Date(),
            },
          });
          res();
        }, "image/png");
      });
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <InfoBanner color="amber" icon="🔍" title="Image Upscaling — Runs in your browser (free, no API key needed)">
        <p>
          High-quality bicubic upscaling via the browser canvas. For AI super-resolution, check out{" "}
          <a href="https://replicate.com/nightmareai/real-esrgan" target="_blank" rel="noreferrer" className="underline">
            Real-ESRGAN on Replicate
          </a>.
        </p>
      </InfoBanner>

      <div>
        <Label>
          Scale Factor{" "}
          {orig.w ? (
            <span className="text-white/50 font-normal">
              — {orig.w}×{orig.h} → {orig.w * scale}×{orig.h * scale}px
            </span>
          ) : ""}
        </Label>
        <div className="flex gap-2">
          {[1.5, 2, 3, 4].map((s) => (
            <button
              key={s}
              onClick={() => setScale(s)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all
                ${scale === s
                  ? "bg-amber-500/15 border-amber-500/30 text-amber-300"
                  : "bg-white/3 border-white/8 text-white/35 hover:text-white/60 hover:border-white/15"}`}
            >
              {s}×
            </button>
          ))}
        </div>
      </div>

      {!preview ? (
        <DropZone onFile={handleFile} />
      ) : (
        <div className="space-y-4">
          <div className={`grid gap-4 ${resultUrl ? "grid-cols-2" : "grid-cols-1"}`}>
            <div>
              <Label>Original {orig.bytes ? `(${fmtBytes(orig.bytes)})` : ""}</Label>
              <img src={preview} className="w-full h-48 object-contain rounded-xl border border-white/8 bg-white/3" />
            </div>
            {resultUrl && (
              <div>
                <Label>Upscaled {resultBlob ? `(${fmtBytes(resultBlob.size)})` : ""}</Label>
                <img src={resultUrl} className="w-full h-48 object-contain rounded-xl border border-white/8 bg-white/3" />
              </div>
            )}
          </div>

          {resultBlob && (
            <MetaPanel
              meta={{
                width: orig.w * scale,
                height: orig.h * scale,
                size: fmtBytes(resultBlob.size),
                createdAt: new Date(),
              }}
            />
          )}

          <div className="flex gap-3">
            <button
              onClick={upscale}
              disabled={loading}
              className={`flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl ${BTN_CLS.amber} disabled:opacity-35 font-semibold text-sm text-white transition-all active:scale-[0.98]`}
            >
              {loading ? (
                <><Loader2 size={15} className="animate-spin" /> Upscaling…</>
              ) : (
                <><ZoomIn size={15} /> Upscale {scale}×</>
              )}
            </button>
            {resultBlob && (
              <button
                onClick={() => dlBlob(resultBlob, `upscaled-${scale}x.png`)}
                className="px-4 py-3 rounded-xl bg-white/4 hover:bg-white/8 text-white/40 hover:text-white text-sm flex items-center gap-2 transition-all"
              >
                <Download size={14} /> Save
              </button>
            )}
            <button
              onClick={() => { setFile(null); setPreview(""); setResultUrl(""); setResultBlob(null); }}
              className="px-4 py-3 rounded-xl bg-white/4 hover:bg-white/8 text-white/25 hover:text-white text-sm transition-all"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

function GalleryPanel({ items, onDelete, loading = false }: { items: GalleryItem[]; onDelete: (id: string) => void; loading?: boolean }) {
  const [filter, setFilter] = useState<GalleryItem["type"] | "all">("all");
  const [selected, setSelected] = useState<GalleryItem | null>(null);

  const shown = filter === "all" ? items : items.filter((i) => i.type === filter);

  if (!items.length) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-white/20">
        {loading
          ? <><Loader2 size={32} strokeWidth={1} className="animate-spin" /><p className="text-sm">Loading your gallery…</p></>
          : <><LayoutGrid size={40} strokeWidth={1} /><p className="text-sm">Your generated content will appear here</p></>
        }
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {(["all", "generated", "bg-removed", "upscaled"] as const).map((f) => {
          const count = f === "all" ? items.length : items.filter((i) => i.type === f).length;
          if (f !== "all" && count === 0) return null;
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all
                ${filter === f
                  ? "bg-white/10 border-white/18 text-white"
                  : "bg-transparent border-white/6 text-white/30 hover:text-white/55 hover:border-white/12"}`}
            >
              {f === "all" ? `All (${count})` : `${TYPE_LABELS[f].label} (${count})`}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {shown.map((item) => (
          <div
            key={item.id}
            onClick={() => setSelected(item)}
            className="group relative rounded-xl overflow-hidden border border-white/8 bg-white/3 aspect-square cursor-pointer transition-all hover:border-white/15"
          >
            <img src={item.url} alt={item.meta.prompt || item.type} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-linear-to-t from-black/75 via-transparent opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3 gap-1.5">
              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded w-fit ${TYPE_LABELS[item.type].cls}`}>
                {TYPE_LABELS[item.type].label}
              </span>
              {item.meta.prompt && <p className="text-xs text-white/65 truncate">{item.meta.prompt}</p>}
              <div className="flex gap-1.5 mt-0.5">
                <a
                  href={item.url}
                  download
                  onClick={(e) => e.stopPropagation()}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                >
                  <Download size={11} />
                </a>
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-red-500/50 text-white transition-colors"
                >
                  <Trash2 size={11} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {selected && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelected(null)}
        >
          <div className="max-w-xl w-full space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center">
              <span className={`text-xs font-semibold px-2 py-1 rounded-md ${TYPE_LABELS[selected.type].cls}`}>
                {TYPE_LABELS[selected.type].label}
              </span>
              <button
                onClick={() => setSelected(null)}
                className="p-2 rounded-xl bg-white/8 hover:bg-white/15 text-white transition-colors"
              >
                <X size={15} />
              </button>
            </div>
            <img src={selected.url} className="w-full rounded-2xl border border-white/10 checker" />
            <MetaPanel meta={selected.meta} />
            <div className="flex gap-3">
              <a
                href={selected.url}
                download
                className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white/8 hover:bg-white/12 text-sm text-white font-medium transition-all"
              >
                <Download size={14} /> Download
              </a>
              <button
                onClick={() => { onDelete(selected.id); setSelected(null); }}
                className="px-4 py-3 rounded-xl bg-red-500/8 hover:bg-red-500/18 text-red-400 text-sm transition-all"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── API helpers ──────────────────────────────────────────────────────────────
const API = process.env.NEXT_PUBLIC_API_URL ?? "";

async function apiFetch(path: string, opts: RequestInit = {}) {
  const token = localStorage.getItem("token") ?? "";
  return fetch(`${API}${path}`, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(opts.headers ?? {}),
    },
  });
}

async function blobUrlToBase64(blobUrl: string): Promise<string> {
  const res = await fetch(blobUrl);
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function dbImageToItem(img: any): GalleryItem {
  return {
    id: img._id,
    url: `${API}${img.filename}`,
    type: (img.type ?? "generated") as GalleryItem["type"],
    meta: {
      prompt: img.prompt ?? undefined,
      model: img.model ?? undefined,
      width: img.width ?? undefined,
      height: img.height ?? undefined,
      createdAt: new Date(img.createdAt),
    },
  };
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function Dashboard() {
  const [tab, setTab] = useState<Tab>("generate");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [loadingGallery, setLoadingGallery] = useState(true);

  // Auth guard + load existing images from DB on mount
  useEffect(() => {
    if (!localStorage.getItem("token")) { window.location.href = "/login"; return; }
    apiFetch("/api/images")
      .then(r => r.json())
      .then(data => { if (data.images) setGallery(data.images.map(dbImageToItem)); })
      .catch(err => console.error("Failed to load gallery:", err))
      .finally(() => setLoadingGallery(false));
  }, []);

  // Save new item to DB then add to local gallery
  const addToGallery = useCallback(async (item: GalleryItem) => {
    if (item.type !== "generated") {
      try {
        const base64 = await blobUrlToBase64(item.url);
        const res = await apiFetch("/api/images/save", {
          method: "POST",
          body: JSON.stringify({
            imageBase64: base64,
            type: item.type,
            meta: { prompt: item.meta.prompt, width: item.meta.width, height: item.meta.height },
          }),
        });
        const data = await res.json();
        if (data.image) {
          setGallery(p => [dbImageToItem(data.image), ...p]);
          return;
        }
      } catch (err) {
        console.error("Failed to save image to DB:", err);
      }
    }
    setGallery(p => [item, ...p]);
  }, []);

  // Delete from DB + local state
  const deleteFromGallery = useCallback(async (id: string) => {
    setGallery(p => p.filter(i => i.id !== id));
    try {
      await apiFetch(`/api/images/${id}`, { method: "DELETE" });
    } catch (err) {
      console.error("Failed to delete from DB:", err);
    }
  }, []);

  const logout = () => { localStorage.removeItem("token"); window.location.href = "/login"; };

  const current = NAV.find((n) => n.id === tab) ?? NAV[0];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; }
        html, body { background: #08080f; height: 100%; overflow: hidden; }
        .checker {
          background-color: #141420;
          background-image:
            linear-gradient(45deg,  #0f0f1a 25%, transparent 25%),
            linear-gradient(-45deg, #0f0f1a 25%, transparent 25%),
            linear-gradient(45deg,  transparent 75%, #0f0f1a 75%),
            linear-gradient(-45deg, transparent 75%, #0f0f1a 75%);
          background-size: 18px 18px;
          background-position: 0 0, 0 9px, 9px -9px, -9px 0;
        }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.07); border-radius: 99px; }
        select option { background: #0c0c18; }
      `}</style>

      
      <div
        className="h-screen w-screen bg-[#08080f] text-white flex overflow-hidden"
        style={{ fontFamily: "'Geist', system-ui, sans-serif" }}
      >
        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/65 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar  */}
        <aside
          className={`
            fixed inset-y-0 left-0 z-40
            w-56 flex flex-col shrink-0
            bg-[#0b0b17] border-r border-white/5
            transition-transform duration-300 ease-in-out
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
            lg:relative lg:translate-x-0 lg:flex
          `}
        >
          {/* Logo */}
          <div className="px-4 py-4 flex items-center justify-between border-b border-white/5 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-lg bg-linear-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center shrink-0">
                <Sparkles size={12} />
              </div>
              <span className="font-semibold text-sm tracking-tight">AI Studio</span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-white/25 hover:text-white/60 p-1 transition-colors"
            >
              <X size={14} />
            </button>
          </div>

          {/* Nav items */}
          <nav className="flex-1 p-2.5 space-y-0.5 overflow-y-auto">
            <p className="text-[10px] font-semibold text-white/18 uppercase tracking-widest px-2.5 py-2">
              Tools
            </p>
            {NAV.map((item) => {
              const active = tab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => { setTab(item.id); setSidebarOpen(false); }}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2.5 rounded-xl text-sm font-medium transition-all text-left border
                    ${active
                      ? ACTIVE_CLS[item.color]
                      : "text-white/35 hover:text-white/65 hover:bg-white/3 border-transparent"}`}
                >
                  <span className={`shrink-0 ${active ? "" : "opacity-40"}`}>{item.icon}</span>
                  <span className="flex-1 leading-none">{item.label}</span>
                  {item.tag && (
                    <span
                      className={`text-[10px] font-semibold px-1.5 py-0.5 rounded
                        ${active ? "bg-white/10" : "bg-white/6 text-white/25"}`}
                    >
                      {item.tag}
                    </span>
                  )}
                  {active && <ChevronRight size={10} className="opacity-30 shrink-0" />}
                </button>
              );
            })}
          </nav>

          {/* Gallery quick-jump */}
          {gallery.length > 0 && (
            <div className="px-2.5 pb-2 shrink-0">
              <button
                onClick={() => { setTab("gallery"); setSidebarOpen(false); }}
                className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl bg-white/3 border border-white/5 text-xs text-white/25 hover:text-white/45 hover:bg-white/5 transition-all"
              >
                <ImageIcon size={12} />
                {gallery.length} item{gallery.length !== 1 ? "s" : ""} saved
              </button>
            </div>
          )}

          {/* Logout */}
          <div className="p-2.5 border-t border-white/5 shrink-0">
            <button
              onClick={logout}
              className="w-full flex items-center gap-2.5 px-2.5 py-2.5 rounded-xl text-sm text-white/22 hover:text-red-400 hover:bg-red-500/5 transition-all"
            >
              <LogOut size={14} /> Logout
            </button>
          </div>
        </aside>

        {/* ── Main content ──────────────────────────────────────── */}
        <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">

          {/* Topbar */}
          <header className="shrink-0 flex items-center gap-3.5 px-5 py-3.5 bg-[#08080f]/80 backdrop-blur border-b border-white/5">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl bg-white/4 hover:bg-white/8 text-white/40 transition-colors"
            >
              <Menu size={16} />
            </button>

            <div className={`p-1.5 rounded-lg border shrink-0 ${ACTIVE_CLS[current.color]}`}>
              {current.icon}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-sm font-semibold leading-none">{current.label}</h1>
              <p className="text-xs text-white/20 mt-0.5">AI Studio</p>
            </div>

            <div className="flex items-center gap-2">
              {gallery.length > 0 && (
                <button
                  onClick={() => setTab("gallery")}
                  className="hidden sm:flex items-center gap-1.5 text-xs text-white/25 hover:text-white/50 bg-white/4 hover:bg-white/7 px-3 py-1.5 rounded-lg border border-white/5 transition-all"
                >
                  <LayoutGrid size={11} /> {gallery.length} saved
                </button>
              )}
              <div className="flex items-center gap-1.5 text-xs text-white/22 bg-white/3 px-3 py-1.5 rounded-lg border border-white/5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Ready
              </div>
            </div>
          </header>

          {/* Scrollable panel area — fills remaining height */}
          <main className="flex-1 overflow-y-auto">
            <div className="max-w-2xl w-full mx-auto px-5 py-6 sm:px-6">
              {tab === "generate"  && <GeneratePanel  onAdd={addToGallery} />}
              {tab === "remove-bg" && <RemoveBgPanel  onAdd={addToGallery} />}
              {tab === "upscale"   && <UpscalePanel   onAdd={addToGallery} />}
              {tab === "gallery"   && <GalleryPanel   items={gallery} onDelete={deleteFromGallery} loading={loadingGallery} />}
            </div>
          </main>
        </div>
      </div>
    </>
  );
}