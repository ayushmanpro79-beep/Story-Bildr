import { NextResponse } from "next/server";

type ThemeRequest = {
  title?: string;
  author?: string;
  vibe?: string;
};

const fallbackTheme = (title: string, author: string, vibe: string) => ({
  tagline: "A serialised novel website forged from mood, memory, and cliffhangers.",
  subtitle: author ? `A serialised novel by ${author}` : "A serialised novel",
  cta: "Read the Story",
  introQuote: `"${title || "This story"} opens like a door you are not sure you should touch."`,
  introAttribution: "from the world of the novel",
  episodeLabel: "Episodes",
  emptyState: "No episodes published yet.",
  studioTitle: "Writer's Studio",
  addEpisodeLabel: "Add an Episode",
  manageEpisodeLabel: "Manage Episodes",
  fontHeading: "Cormorant Garamond",
  fontBody: "Inter",
  palette: {
    bg: "#11100f",
    surface: "#1d1915",
    text: "#f5eee6",
    muted: "#bcae9e",
    accent: "#d98a4d",
    accent2: "#7fb7a6",
    danger: "#d36a55",
  },
  motifs: ["serial fiction", "cinematic cover", vibe || "atmospheric"],
});

function cleanJson(text: string) {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  return fenced ? fenced[1].trim() : trimmed;
}

export async function POST(request: Request) {
  const body = (await request.json()) as ThemeRequest;
  const title = String(body.title || "").trim();
  const author = String(body.author || "").trim();
  const vibe = String(body.vibe || "").trim();

  if (!title || !vibe) {
    return NextResponse.json(
      { error: "Title and vibe are required." },
      { status: 400 },
    );
  }

  const local = fallbackTheme(title, author, vibe);
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return NextResponse.json({ theme: local, source: "fallback" });

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-5.4-mini",
        input: [
          {
            role: "system",
            content:
              "You design tasteful serial-novel website themes. Return only strict JSON matching the requested shape. Do not generate HTML, JavaScript, or markdown.",
          },
          {
            role: "user",
            content: JSON.stringify({
              task: "Create theme and copy data for a novel website generator.",
              novelTitle: title,
              author,
              vibe,
              jsonShape: local,
              rules: [
                "Use readable hex colors.",
                "Keep text concise.",
                "Avoid copyrighted lyrics or long quotes.",
                "Do not include code.",
              ],
            }),
          },
        ],
        text: {
          format: {
            type: "json_object",
          },
        },
      }),
    });

    if (!response.ok) {
      return NextResponse.json({ theme: local, source: "fallback" });
    }

    const data = await response.json();
    const output =
      data.output_text ||
      data.output?.flatMap((item: { content?: Array<{ text?: string }> }) =>
        item.content?.map((content) => content.text || ""),
      ).join("") ||
      "";
    const parsed = JSON.parse(cleanJson(output));
    return NextResponse.json({
      theme: { ...local, ...parsed, palette: { ...local.palette, ...parsed.palette } },
      source: "openai",
    });
  } catch {
    return NextResponse.json({ theme: local, source: "fallback" });
  }
}
