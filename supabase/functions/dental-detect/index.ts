// ============================================================
// Радикс — детектор патологий на снимке через Roboflow.
// Принимает base64-картинку, шлёт в hosted-модель Roboflow,
// возвращает предсказания (рамки) с CORS. Ключ — в секретах.
//
// Секреты (Supabase → Edge Functions → Secrets):
//   ROBOFLOW_API_KEY — приватный ключ Roboflow (app.roboflow.com/settings/api)
//   ROBOFLOW_MODEL   — "project/version", напр. "dental-xray-7class/3"
//                      (берётся со страницы модели на Universe → Deploy)
//
// Деплой: Verify JWT = OFF (защита по Origin внутри).
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
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers });
  }

  const KEY = Deno.env.get("ROBOFLOW_API_KEY");
  const MODEL = Deno.env.get("ROBOFLOW_MODEL"); // "project/version"
  if (!KEY || !MODEL) {
    return new Response(JSON.stringify({ error: "ROBOFLOW_API_KEY / ROBOFLOW_MODEL не заданы в секретах функции" }), { status: 500, headers });
  }

  let payload: { image?: string; confidence?: number; overlap?: number } = {};
  try { payload = await req.json(); } catch { /* ignore */ }

  let img = payload.image || "";
  const i = img.indexOf("base64,");
  if (i > -1) img = img.slice(i + 7); // убрать префикс data:image/...;base64,
  if (!img) return new Response(JSON.stringify({ error: "Пустое изображение" }), { status: 400, headers });

  const conf = payload.confidence != null ? payload.confidence : 30;
  const overlap = payload.overlap != null ? payload.overlap : 40;
  const url = `https://detect.roboflow.com/${MODEL}?api_key=${encodeURIComponent(KEY)}&format=json&confidence=${conf}&overlap=${overlap}`;

  try {
    const up = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: img,
    });
    const text = await up.text();
    return new Response(text, { status: up.status, headers });
  } catch (e) {
    return new Response(JSON.stringify({ error: "Roboflow fetch failed: " + (e?.message || e) }), { status: 502, headers });
  }
});
