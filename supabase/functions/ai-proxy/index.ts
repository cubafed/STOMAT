// ============================================================
// Радикс — серверный прокси к OpenAI-совместимому API.
// Зачем: статичный сайт (GitHub Pages) не может ходить в OpenAI напрямую
//   (нет CORS, геоблок РФ). Эта функция держит ключ в секретах,
//   ходит в модель со своей инфраструктуры и отдаёт ответ с CORS.
//
// Секреты функции (Supabase → Edge Functions → Secrets):
//   AI_API_KEY  — ключ OpenAI (или прокси). ОБЯЗАТЕЛЬНО.
//   AI_BASE_URL — базовый URL, по умолчанию https://api.openai.com/v1
//                 (для прокси — например https://api.proxyapi.ru/openai/v1)
//
// Деплой: Verify JWT = OFF (функция публичная, защищена проверкой Origin).
// ============================================================

const ALLOW_ORIGINS = [
  "https://cubafed.github.io",
  "http://localhost:8000",
  "http://localhost:8099",
];

function cors(origin: string | null): Record<string, string> {
  const allow = origin && ALLOW_ORIGINS.includes(origin) ? origin : ALLOW_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Vary": "Origin",
  };
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("origin");
  const headers = { ...cors(origin), "Content-Type": "application/json" };

  if (req.method === "OPTIONS") return new Response("ok", { headers });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: { message: "Method not allowed" } }), { status: 405, headers });
  }

  const API_KEY = Deno.env.get("AI_API_KEY");
  const BASE = (Deno.env.get("AI_BASE_URL") || "https://api.openai.com/v1").replace(/\/+$/, "");
  if (!API_KEY) {
    return new Response(JSON.stringify({ error: { message: "AI_API_KEY не задан в секретах функции" } }), { status: 500, headers });
  }

  let body: string;
  try { body = await req.text(); } catch { body = "{}"; }

  try {
    const upstream = await fetch(BASE + "/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": "Bearer " + API_KEY },
      body,
    });
    const text = await upstream.text();
    return new Response(text, { status: upstream.status, headers });
  } catch (e) {
    return new Response(JSON.stringify({ error: { message: "Upstream fetch failed: " + (e?.message || e) } }), { status: 502, headers });
  }
});
