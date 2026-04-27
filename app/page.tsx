"use client";

import { useMemo, useState } from "react";
import {
  BookOpen,
  Download,
  Eye,
  FileArchive,
  Heart,
  Image as ImageIcon,
  Loader2,
  Sparkles,
} from "lucide-react";
import {
  BuilderInput,
  generateNovelHtml,
  generateSetupReadme,
  namesForTitle,
  ThemeData,
} from "@/lib/site-template";
import { createZip } from "@/lib/zip";

const defaultTheme: ThemeData = {
  tagline: "A serialised novel website made for late-night readers.",
  subtitle: "A serialised novel",
  cta: "Read the Story",
  introQuote: "\"Every chapter should feel like opening a locked room.\"",
  introAttribution: "from the generated world",
  episodeLabel: "Episodes",
  emptyState: "No episodes published yet.",
  studioTitle: "Writer's Studio",
  addEpisodeLabel: "Add an Episode",
  manageEpisodeLabel: "Manage Episodes",
  fontHeading: "Cormorant Garamond",
  fontBody: "Inter",
  palette: {
    bg: "#11100f",
    surface: "#1e1a17",
    text: "#f5efe8",
    muted: "#b9aa9b",
    accent: "#d98a4d",
    accent2: "#80c7b2",
    danger: "#d86d5d",
  },
  motifs: ["cinematic", "serial", "immersive"],
};

const donationLinks = [
  { label: "UPI", href: "upi://pay?pa=6291873663@ybl&pn=Story-Bildr&cu=INR" },
];

function validSupabaseUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname.includes("supabase.co");
  } catch {
    return false;
  }
}

function normalizedCoverName(file: File) {
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  return `cover.${ext.replace(/[^a-z0-9]/g, "") || "jpg"}`;
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<"builder" | "donations">("builder");
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [vibe, setVibe] = useState("");
  const [supabaseUrl, setSupabaseUrl] = useState("");
  const [supabaseAnonKey, setSupabaseAnonKey] = useState("");
  const [studioPassword, setStudioPassword] = useState("");
  const [cover, setCover] = useState<File | null>(null);
  const [theme, setTheme] = useState<ThemeData>(defaultTheme);
  const [generatedHtml, setGeneratedHtml] = useState("");
  const [source, setSource] = useState<"openai" | "fallback" | "draft">("draft");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const names = useMemo(() => namesForTitle(title || "novel"), [title]);
  const coverName = cover ? normalizedCoverName(cover) : "cover.jpg";

  const input: BuilderInput = {
    title,
    author,
    vibe,
    supabaseUrl,
    supabaseAnonKey,
    studioPassword,
    coverFileName: coverName,
    companyLogoFileName: "soul-logo.png",
  };

  function validate() {
    if (!title.trim()) return "Add the novel title.";
    if (!vibe.trim()) return "Describe the vibe of the novel website.";
    if (!cover) return "Upload the cover or concept art.";
    if (!validSupabaseUrl(supabaseUrl)) return "Add a valid Supabase project URL.";
    if (supabaseAnonKey.trim().length < 40) return "Add the Supabase anon key.";
    if (studioPassword.trim().length < 4) return "Use a Writer's Studio password with at least 4 characters.";
    return "";
  }

  async function generateTheme() {
    const validation = validate();
    if (validation) {
      setError(validation);
      return null;
    }
    setBusy(true);
    setError("");
    setStatus("Creating a theme and copy set...");
    try {
      const response = await fetch("/api/theme", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, author, vibe }),
      });
      const data = await response.json();
      const nextTheme = data.theme as ThemeData;
      setTheme(nextTheme);
      setSource(data.source || "fallback");
      const html = generateNovelHtml(input, nextTheme);
      setGeneratedHtml(html);
      setStatus(data.source === "openai" ? "Generated with AI." : "Generated with the local fallback theme.");
      return { html, theme: nextTheme };
    } catch {
      const html = generateNovelHtml(input, defaultTheme);
      setGeneratedHtml(html);
      setTheme(defaultTheme);
      setSource("fallback");
      setStatus("Generated with the local fallback theme.");
      return { html, theme: defaultTheme };
    } finally {
      setBusy(false);
    }
  }

  async function downloadFolder() {
    const validation = validate();
    if (validation) {
      setError(validation);
      return;
    }
    const result = generatedHtml ? { html: generatedHtml, theme } : await generateTheme();
    if (!result || !cover) return;

    const folder = names.folder;
    const zip = createZip([
      { name: `${folder}/index.html`, data: result.html },
      { name: `${folder}/${coverName}`, data: await cover.arrayBuffer() },
      { name: `${folder}/soul-logo.png`, data: await (await fetch("/soul-logo.png")).arrayBuffer() },
      { name: `${folder}/README-SETUP.txt`, data: generateSetupReadme(input) },
    ]);
    const link = document.createElement("a");
    link.href = URL.createObjectURL(zip);
    link.download = `${folder}.zip`;
    link.click();
    URL.revokeObjectURL(link.href);
    setStatus("Downloaded the website folder.");
  }

  function previewGeneratedSite() {
    const html = generatedHtml || generateNovelHtml(input, theme);
    const preview = window.open("", "_blank", "noopener,noreferrer");
    if (!preview) return;
    preview.document.open();
    preview.document.write(html);
    preview.document.close();
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
          <div className="brand">
            <div className="brand-mark">
              <img src="/soul-logo.png" alt="" />
            </div>
            <div>
              <strong>Story-Bildr</strong>
              <span>by SOUL Productions</span>
            </div>
          </div>
        <nav className="tabs" aria-label="Builder sections">
          <button className={activeTab === "builder" ? "active" : ""} onClick={() => setActiveTab("builder")}>
            <BookOpen size={18} /> Builder
          </button>
          <button className={activeTab === "donations" ? "active" : ""} onClick={() => setActiveTab("donations")}>
            <Heart size={18} /> Donations
          </button>
        </nav>
        <div className="setup-card">
          <span>Suggested Supabase names</span>
          <code>{names.table}</code>
          <code>{names.bucket}</code>
        </div>
      </aside>

      {activeTab === "builder" ? (
        <section className="workspace">
          <div className="topbar">
            <div>
              <h1>Generate a novel-series website folder</h1>
              <p>
                The builder creates a themed static site with the same core PDF reader and Writer's Studio flow as your
                examples.
              </p>
            </div>
            <div className="actions">
              <button className="icon-button" onClick={generateTheme} disabled={busy}>
                {busy ? <Loader2 className="spin" size={18} /> : <Sparkles size={18} />}
                Generate
              </button>
              <button className="icon-button secondary" onClick={previewGeneratedSite} disabled={!title || !vibe}>
                <Eye size={18} />
                Preview
              </button>
              <button className="icon-button primary" onClick={downloadFolder} disabled={busy}>
                <Download size={18} />
                Download
              </button>
            </div>
          </div>

          <div className="grid">
            <section className="panel">
              <h2>Story Inputs</h2>
              <label>
                Novel title
                <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="VOID" />
              </label>
              <label>
                Author or brand
                <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="Ayushman Gouda, SOUL Productions" />
              </label>
              <label>
                Vibe prompt
                <textarea
                  value={vibe}
                  onChange={(e) => setVibe(e.target.value)}
                  placeholder="Dark mythic sci-fi, sharp yellow accents, ancient power awakening in a modern city..."
                />
              </label>
              <label className="file-box">
                <ImageIcon size={22} />
                <span>{cover ? cover.name : "Upload cover or concept art"}</span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(e) => setCover(e.target.files?.[0] || null)}
                />
              </label>
            </section>

            <section className="panel">
              <h2>Website Engine</h2>
              <label>
                Supabase project URL
                <input
                  value={supabaseUrl}
                  onChange={(e) => setSupabaseUrl(e.target.value)}
                  placeholder="https://your-project.supabase.co"
                />
              </label>
              <label>
                Supabase anon key
                <input value={supabaseAnonKey} onChange={(e) => setSupabaseAnonKey(e.target.value)} placeholder="eyJ..." />
              </label>
              <label>
                Writer's Studio password
                <input
                  value={studioPassword}
                  onChange={(e) => setStudioPassword(e.target.value)}
                  placeholder="Private access code"
                />
              </label>
              <div className="notice">
                The exported site references <strong>{coverName}</strong> and <strong>soul-logo.png</strong> beside{" "}
                <strong>index.html</strong>. Supabase setup is written into the generated README.
              </div>
            </section>

            <section className="panel preview-panel">
              <h2>Generated Direction</h2>
              <div className="theme-preview" style={{ background: theme.palette.bg, color: theme.palette.text }}>
                <span style={{ color: theme.palette.accent2 }}>{theme.tagline}</span>
                <strong>{title || "Novel Title"}</strong>
                <p>{theme.subtitle}</p>
                <button style={{ background: theme.palette.accent }}>{theme.cta}</button>
              </div>
              <dl>
                <div>
                  <dt>AI source</dt>
                  <dd>{source}</dd>
                </div>
                <div>
                  <dt>Output</dt>
                  <dd>
                    <FileArchive size={16} /> {names.folder}.zip
                  </dd>
                </div>
              </dl>
              {error && <p className="error">{error}</p>}
              {status && <p className="status">{status}</p>}
            </section>
          </div>
        </section>
      ) : (
        <section className="workspace">
          <div className="topbar">
            <div>
              <h1>Donations</h1>
              <p>Story-Bildr stays free. These buttons are simple external links with no accounts or backend billing.</p>
            </div>
          </div>
          <div className="donation-grid">
            {donationLinks.map((link) => (
              <a key={link.label} href={link.href} target="_blank" rel="noreferrer" className="donation-card">
                <Heart size={20} />
                <strong>{link.label}</strong>
                <span>Support the project</span>
              </a>
            ))}
          </div>
          <p className="donation-note">
            Replace these placeholder links in <code>app/page.tsx</code> with your real donation URLs before launch.
          </p>
        </section>
      )}
    </main>
  );
}
