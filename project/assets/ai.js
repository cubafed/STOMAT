/* ============================================================
   Радикс AI — интеграция с OpenAI
   · Анализ снимков (vision)        → gpt-5-chat-latest (мультимодальная)
   · Отчёты, заключения, ассистент  → gpt-5-nano (быстрая/экономная)
   Ключ API хранится только в localStorage браузера врача.
   ============================================================ */
(function () {
  "use strict";
  var LS_KEY = "radix_ai_key", LS_AM = "radix_ai_model_analysis", LS_CM = "radix_ai_model_chat", LS_VM = "radix_ai_model_vision", LS_BASE = "radix_ai_base", LS_PROXY = "radix_ai_proxy", LS_SYS = "radix_ai_sys", LS_DETECT = "radix_detect_url";
  var DEF_ANALYSIS = "gpt-5-nano", DEF_CHAT = "gpt-5-nano", DEF_VISION = "gpt-5-chat-latest";
  var DEF_BASE = "https://api.openai.com/v1";

  function ls(k, v) {
    try {
      if (v === undefined) return localStorage.getItem(k);
      if (v === null || v === "") localStorage.removeItem(k); else localStorage.setItem(k, v);
    } catch (e) { return null; }
  }
  function models() { return { analysis: ls(LS_AM) || DEF_ANALYSIS, chat: ls(LS_CM) || DEF_CHAT, vision: ls(LS_VM) || DEF_VISION }; }
  function getKey() { return ls(LS_KEY) || ""; }
  // Прокси (Supabase Edge Function): ключ живёт на сервере, браузер ключа не знает
  function proxyUrl() { return (ls(LS_PROXY) || "").replace(/\/+$/, ""); }
  function usingProxy() { return !!proxyUrl(); }
  function hasKey() { return !!getKey() || usingProxy(); }
  // База API: OpenAI по умолчанию; для прокси/шлюза (если ключ не sk-…) — задаётся в Настройках
  function baseUrl() { return (ls(LS_BASE) || DEF_BASE).replace(/\/+$/, ""); }
  // Доп. инструкция клиники: подмешивается в системный промпт всех запросов
  function getSys() { return ls(LS_SYS) || ""; }
  function configure(key, analysisModel, chatModel, visionModel, base, proxy, sys, detectUrl) {
    ls(LS_KEY, key); ls(LS_AM, analysisModel); ls(LS_CM, chatModel);
    if (visionModel !== undefined) ls(LS_VM, visionModel);
    if (base !== undefined) ls(LS_BASE, base);
    if (proxy !== undefined) ls(LS_PROXY, proxy);
    if (sys !== undefined) ls(LS_SYS, sys);
    if (detectUrl !== undefined) ls(LS_DETECT, detectUrl);
  }

  // Вставить доп.инструкцию врача в первый system-месседж (или добавить новый)
  function injectSys(messages) {
    var extra = (ls(LS_SYS) || "").trim();
    if (!extra) return messages;
    var out = messages.slice(), done = false;
    for (var i = 0; i < out.length; i++) {
      if (out[i].role === "system" && typeof out[i].content === "string") {
        out[i] = { role: "system", content: out[i].content + "\n\n[Дополнительная инструкция клиники — соблюдай её]\n" + extra };
        done = true; break;
      }
    }
    if (!done) out = [{ role: "system", content: extra }].concat(out);
    return out;
  }

  function complete(model, messages, maxTokens, effort) {
    var viaProxy = usingProxy();
    if (!viaProxy && !getKey()) return Promise.reject(new Error("AI не подключён — задайте ключ или прокси в Настройках"));
    messages = injectSys(messages);
    // gpt-5 / o-серия: max_completion_tokens вместо max_tokens, без кастомной temperature.
    // Reasoning-модели (gpt-5, gpt-5-mini, gpt-5-nano, o*) при дефолтном reasoning_effort
    // тратят весь бюджет на «размышления» → пустой ответ. Ставим minimal, чтобы осталось
    // место под текст. gpt-5-chat-latest — НЕ reasoning, параметр не шлём.
    var m = (model || "").toLowerCase();
    var newGen = /^(gpt-5|o\d)/.test(m);
    var isChat = m.indexOf("chat") > -1;
    // level 0 — с reasoning_effort; level 1 — без него; level 2 — классический max_tokens
    function buildBody(level) {
      var b = { model: model, messages: messages };
      if (newGen && level < 2) {
        b.max_completion_tokens = maxTokens || 700;
        if (!isChat && level === 0) b.reasoning_effort = effort || "minimal";
      } else {
        b.max_tokens = maxTokens || 700;
        b.temperature = 0.4;
      }
      return b;
    }
    var url, headers;
    if (viaProxy) {
      // Ходим в свою Edge Function; ключ OpenAI — на сервере, не в браузере
      var anon = (window.RADIX_CFG || {}).supabaseAnonKey || "";
      url = proxyUrl();
      headers = { "Content-Type": "application/json", "apikey": anon, "Authorization": "Bearer " + anon };
    } else {
      url = baseUrl() + "/chat/completions";
      headers = { "Content-Type": "application/json", "Authorization": "Bearer " + getKey() };
    }
    function send(level) {
      return fetch(url, { method: "POST", headers: headers, body: JSON.stringify(buildBody(level)) }).then(function (r) {
        if (!r.ok) return r.json().catch(function () { return {}; }).then(function (j) {
          var e = new Error((j.error && j.error.message) || ("HTTP " + r.status));
          e.status = r.status; throw e;
        });
        return r.json();
      });
    }
    // Если апстрим/модель отклоняет параметры (reasoning_effort, max_completion_tokens
    // и т.п.) — повторяем запрос упрощённым телом, чтобы работало с любой моделью.
    function paramIssue(e) {
      var s = (e && e.message || "").toLowerCase();
      return (e && e.status === 400) || /reasoning|max_completion|max_tokens|unsupported|parameter|формат|format|invalid|temperature/.test(s);
    }
    return send(0)
      .catch(function (e) { if (newGen && !isChat && paramIssue(e)) return send(1); throw e; })
      .catch(function (e) { if (newGen && paramIssue(e)) return send(2); throw e; })
      .then(function (j) {
        var c = j && j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content;
        if (!c) throw new Error("Пустой ответ модели (" + model + ")");
        return c.trim();
      });
  }

  function findingsBrief(patient) {
    if (!patient.findings.length) return "Патологий на снимке не выявлено.";
    return patient.findings.map(function (f) {
      var info = window.findingInfo ? window.findingInfo(f) : { tooth: f.tooth, label: f.type, loc: "" };
      return "- Зуб " + info.tooth + ": " + info.label + (info.loc ? " (" + info.loc + ")" : "") + ", уверенность ИИ " + f.pc + "%";
    }).join("\n");
  }

  var SYS = "Ты — Радикс, клинический AI-ассистент врача-стоматолога. Отвечай по-русски, кратко, структурированно и профессионально. Ты опираешься на находки компьютерного зрения Радикс-Vision по рентгеновскому снимку. Ты ассистент: окончательное решение всегда принимает врач — не выноси категоричных диагнозов и не назначай препараты.";

  /* Структурированное заключение по снимку (модель анализа — GPT-5.5) */
  function report(patient) {
    return complete(models().analysis, [
      { role: "system", content: SYS },
      { role: "user", content: "Составь заключение по рентгеновскому снимку пациента " + patient.name + ".\n\nНаходки Радикс-Vision:\n" + findingsBrief(patient) + "\n\nФормат строго:\n1. Описание снимка\n2. Находки по клиническому приоритету\n3. Рекомендации по лечению\n4. Контроль и наблюдение\nБез преамбулы и дисклеймеров." }
    ], 900);
  }

  /* Объяснение для пациента простыми словами (модель анализа — GPT-5.5) */
  function explain(patient) {
    return complete(models().analysis, [
      { role: "system", content: SYS },
      { role: "user", content: "Объясни пациенту по имени " + patient.name.split(" ")[0] + " простыми словами — без терминов, доброжелательно, 4–6 предложений — что найдено на снимке и почему лечение лучше не откладывать:\n" + findingsBrief(patient) }
    ], 500);
  }

  /* Живой чат-ассистент (общая модель — GPT-4o); history уже содержит последний вопрос */
  function ask(patient, history) {
    var msgs = [{ role: "system", content: SYS + "\nТекущий пациент: " + patient.name + ".\nНаходки на последнем снимке:\n" + findingsBrief(patient) }];
    history.slice(-10).forEach(function (m) {
      msgs.push({ role: m.who === "ai" ? "assistant" : "user", content: m.text });
    });
    return complete(models().chat, msgs, 600);
  }

  function ping() { return complete(models().chat, [{ role: "user", content: "Ответь одним словом: ок" }], 256); }

  /* Vision-анализ загруженного снимка (модель анализа — GPT-5.5).
     Возвращает массив находок в формате приложения. */
  var FIND_TYPES = ["caries", "cariesE", "tartar", "periap", "periodontitis", "resorption", "cyst", "crowding", "impacted", "resto"];
  function parseFindings(text) {
    var m = text.match(/\{[\s\S]*\}/);
    if (!m) throw new Error("Модель не вернула JSON");
    var j = JSON.parse(m[0]);
    var arr = j.findings || j["находки"] || [];
    if (!arr.length) return [];
    return arr.slice(0, 20).map(function (f) {
      var b = f.box || {};
      function cl(v, max) { v = +v || 0; return Math.max(0, Math.min(max, v)); }
      return {
        type: FIND_TYPES.indexOf(f.type) > -1 ? f.type : "caries",
        tooth: f.tooth != null ? f.tooth : "—",
        loc: f.loc || "",
        pc: Math.max(50, Math.min(99, Math.round(+f.pc || 75))),
        severity: [1, 2, 3].indexOf(+f.severity) > -1 ? +f.severity : 2,
        mm: f.mm != null ? Math.round(+f.mm * 10) / 10 : null,
        box: { x: cl(b.x, 96), y: cl(b.y, 94), w: Math.max(2, cl(b.w, 45)), h: Math.max(2, cl(b.h, 45)) }
      };
    });
  }
  var VISION_SYS = SYS + " Сейчас ты — внимательный челюстно-лицевой рентгенолог. Точность важнее количества: не выдумывай патологию и не пропускай явную. Перед каждой рамкой мысленно определи, ГДЕ на снимке находится нужный зуб, и ставь рамку именно на него.";
  function analyzeImage(dataUrl) {
    return complete(models().vision, [
      { role: "system", content: VISION_SYS },
      {
        role: "user", content: [
          { type: "text", text:
            "Проанализируй стоматологический рентген и размечай находки с ТОЧНЫМИ координатами рамок.\n\n" +
            "ГЛАВНОЕ ПРАВИЛО: ищи ПАТОЛОГИЮ (кариес, периапикальные очаги, убыль кости/периодонтит, резорбция, кисты, ретенция). НЕ перечисляй каждую коронку, имплант, пломбу, мост или абатмент как находку! Существующую реставрацию (type=resto) указывай ТОЛЬКО если с ней проблема (вторичный кариес под ней, нависающий край, скол, негерметичность, периимплантит). Здоровый восстановленный зуб — ПРОПУСКАЙ. Лучше 3-5 точных находок патологии, чем 20 «реставраций».\n\n" +
            "СИСТЕМА КООРДИНАТ (критично!): изображение — сетка 100×100. x: 0 — левый край, 100 — правый. y: 0 — самый ВЕРХ, 100 — самый НИЗ. box.x/box.y — ЛЕВЫЙ ВЕРХНИЙ угол рамки в этих процентах; w/h — её ширина/высота в процентах.\n\n" +
            "АНАТОМИЧЕСКАЯ КАРТА (как ориентироваться):\n" +
            "• Панорама-ОПТГ: ВЕРХНЯЯ челюсть (зубы 1x, 2x) — в верхней половине; НИЖНЯЯ (3x, 4x) — в нижней. Линия смыкания зубов (окклюзия) — примерно по центру по вертикали.\n" +
            "• Срединная линия — x≈50. ВАЖНО: правая сторона ПАЦИЕНТА = ЛЕВАЯ часть снимка (x<50) → квадранты 1 (сверху) и 4 (снизу). Левая сторона пациента = правая часть (x>50) → квадранты 2 (сверху) и 3 (снизу).\n" +
            "• У ВЕРХНИХ зубов коронки книзу, корни и верхушки — кверху (меньше y). У НИЖНИХ зубов коронки кверху, корни и верхушки — книзу (больше y), но НЕ ниже края нижней челюсти.\n\n" +
            "ПОРЯДОК: 1) определи тип снимка; 2) системно по квадрантам FDI, зуб за зубом; 3) для КАЖДОЙ находки сначала найди зуб (квадрант → примерные x,y), затем ставь УЗКУЮ рамку точно на поражённую структуру.\n\n" +
            "КУДА СТАВИТЬ РАМКУ:\n" +
            "• caries/cariesE (кариес) — на КОРОНКЕ зуба (контактная или жевательная поверхность), не на корне.\n" +
            "• periap (периапикальный очаг), cyst (киста) — строго на ВЕРХУШКЕ корня (у верхних — над коронкой, у нижних — под коронкой), небольшая округлая рамка.\n" +
            "• periodontitis (убыль кости), tartar (камень) — на уровне шейки зуба / межзубной перегородки.\n" +
            "• resorption — на корне; impacted (ретенция) — на непрорезавшемся зубе (обычно 8-е, угол челюсти).\n" +
            "Рамка ПЛОТНО по очагу и УЗКАЯ: для одного зуба обычно w 3–8, h 4–10. НЕ делай гигантских рамок и НЕ выноси их в воздух за пределы зубного ряда, за кость или за край челюсти.\n\n" +
            "КАЛИБРОВКА pc: 90–99 — явные несомненные признаки; 70–89 — вероятно; 50–69 — спорно. Не ставь всем одинаковое число.\n" +
            "НЕ патология (не раздувай список): коронки, импланты, пломбы, штифты, мосты — это type=resto, и только если нужно.\n\n" +
            "Верни СТРОГО JSON без пояснений:\n" +
            "{\"findings\":[{\"type\":\"caries|cariesE|tartar|periap|periodontitis|resorption|cyst|crowding|impacted|resto\",\"tooth\":\"номер по FDI\",\"loc\":\"локализация по-русски\",\"pc\":50-99,\"severity\":1|2|3,\"mm\":число|null,\"box\":{\"x\":0-100,\"y\":0-100,\"w\":2-12,\"h\":3-14}}]}\n" +
            "severity: 1 начальная, 2 умеренная, 3 выраженная. mm — размер очага в мм или null. Если патологий нет — пустой массив findings." },
          { type: "image_url", image_url: { url: dataUrl, detail: "high" } }
        ]
      }
    ], 4000, "medium").then(parseFindings);
  }

  /* ---- Детектор Roboflow (специализированная CV-модель) ---- */
  function detectorUrl() { return (ls(LS_DETECT) || "").replace(/\/+$/, ""); }
  function detectorOn() { return !!detectorUrl(); }
  // класс Roboflow → тип находки приложения; неизвестное → null (пропускаем)
  function mapClass(name) {
    var s = (name || "").toLowerCase();
    if (/enamel|эмал/.test(s) && /car|кари/.test(s)) return "cariesE";
    if (/cari|cavit|decay|кари/.test(s)) return "caries";
    if (/peri.?apical|peri.?ap|\bpai\b|очаг/.test(s)) return "periap";
    if (/bone.?loss|periodont|пародонт|убыл/.test(s)) return "periodontitis";
    if (/calculus|tartar|камень/.test(s)) return "tartar";
    if (/resorption|резорб/.test(s)) return "resorption";
    if (/cyst|granulom|киста|гранул/.test(s)) return "cyst";
    if (/impact|retain|ретен/.test(s)) return "impacted";
    if (/crowd|скучен/.test(s)) return "crowding";
    if (/crown|fillin|restor|implant|пломб|коронк|реставр|имплан/.test(s)) return "resto";
    return null;
  }
  // Прогнать снимок через детектор → массив находок в формате приложения
  function detect(dataUrl) {
    var anon = (window.RADIX_CFG || {}).supabaseAnonKey || "";
    return fetch(detectorUrl(), {
      method: "POST",
      headers: { "Content-Type": "application/json", "apikey": anon, "Authorization": "Bearer " + anon },
      body: JSON.stringify({ image: dataUrl, confidence: 25 })
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) {
        if (!r.ok) throw new Error((j && j.error && (j.error.message || j.error)) || ("HTTP " + r.status));
        return j;
      });
    }).then(function (j) {
      var iw = (j.image && j.image.width) || 1, ih = (j.image && j.image.height) || 1;
      var preds = j.predictions || [];
      function cl(v, max) { return Math.max(0, Math.min(max, v)); }
      return preds.map(function (p) {
        var type = mapClass(p.class);
        if (!type) return null; // неизвестный класс (напр. просто «зуб») — не показываем как патологию
        var w = (p.width || 0) / iw * 100, h = (p.height || 0) / ih * 100;
        var x = ((p.x || 0) - (p.width || 0) / 2) / iw * 100, y = ((p.y || 0) - (p.height || 0) / 2) / ih * 100;
        return {
          type: type, tooth: p.tooth != null ? p.tooth : "—", loc: p.class || "",
          pc: Math.max(50, Math.min(99, Math.round((p.confidence || 0) * 100))),
          severity: 2, mm: null,
          box: { x: cl(x, 98), y: cl(y, 98), w: Math.max(1, cl(w, 60)), h: Math.max(1, cl(h, 60)) }
        };
      }).filter(Boolean).slice(0, 30);
    });
  }

  /* Парсер команд для ⌘K (общая модель — GPT-4o):
     «открой план Анны», «покажи пациентов с кариесом» → действие интерфейса */
  function command(q, patients) {
    var plist = patients.map(function (p) {
      var types = p.findings.map(function (f) { return f.type; }).join(",");
      return p.id + ": " + p.name + " [" + types + "]";
    }).join("; ");
    var sys = "Ты — парсер команд интерфейса стоматологической платформы Радикс. " +
      "Доступные действия:\n" +
      "- open_view — открыть раздел (view: dashboard|patients|crm|calendar|assistant|analysis|plan|analytics|community|notifications|billing|settings)\n" +
      "- open_patient | open_analysis | open_plan — открыть карточку/анализ/план пациента (patientId — число из списка)\n" +
      "- answer — короткий текстовый ответ по данным (text)\n" +
      "Пациенты (id: имя [типы находок: caries=кариес, cariesE=кариес эмали, tartar=камень, periap=эндо, resto=пломба]):\n" + plist +
      "\nОтветь СТРОГО одним JSON-объектом: {\"action\":\"...\",\"view\":\"...\",\"patientId\":0,\"text\":\"...\"} — лишние поля опусти.";
    return complete(models().chat, [
      { role: "system", content: sys },
      { role: "user", content: q }
    ], 300).then(function (t) {
      var m = t.match(/\{[\s\S]*\}/);
      if (!m) throw new Error("Модель не вернула команду");
      return JSON.parse(m[0]);
    });
  }

  /* Приоритизация плана лечения (модель анализа — GPT-5.5) */
  function planAdvice(patient, items) {
    var list = items.map(function (it, i) {
      return (i + 1) + ". " + it.label + " · зуб " + it.tooth + " · " + it.price + " ₽ · приоритет " + it.sev + " · уверенность " + it.pc + "%";
    }).join("\n");
    return complete(models().analysis, [
      { role: "system", content: SYS },
      { role: "user", content: "План лечения пациента " + patient.name + " (этапы в произвольном порядке):\n" + list + "\n\nЗадача:\n1. ПОРЯДОК — оптимальная последовательность этапов (номерами) с кратким клиническим обоснованием каждого шага.\n2. АЛЬТЕРНАТИВА — как удешевить план без вреда (1-2 предложения).\n3. РИСКИ ОТКЛАДЫВАНИЯ — что будет, если отложить на полгода (1-2 предложения).\nКоротко, без преамбулы." }
    ], 700);
  }

  /* Второе мнение — независимая рецензия находок (модель анализа — GPT-5.5) */
  function secondOpinion(patient) {
    return complete(models().analysis, [
      { role: "system", content: "Ты — независимый врач-рентгенолог, дающий второе мнение по разметке другой AI-модели. Отвечай по-русски, кратко и критично. Окончательное решение за лечащим врачом." },
      { role: "user", content: "Первичная модель разметила снимок пациента " + patient.name + " так:\n" + findingsBrief(patient) + "\n\nДай второе мнение:\n1. По каждой находке — СОГЛАСЕН или СОМНЕВАЮСЬ, с одним предложением почему.\n2. ЧТО ПЕРЕПРОВЕРИТЬ клинически (зондирование, термопроба, прицельный снимок).\n3. ЧТО МОГЛО БЫТЬ ПРОПУЩЕНО на таком снимке.\nБез преамбулы." }
    ], 700);
  }

  /* Сообщение пациенту в мессенджер по итогам плана (общая модель — GPT-4o) */
  function patientMessage(patient, items, total) {
    var list = items.map(function (it) { return it.label + " (зуб " + it.tooth + ")"; }).join(", ");
    return complete(models().chat, [
      { role: "system", content: SYS },
      { role: "user", content: "Напиши короткое сообщение пациенту " + patient.name.split(" ")[0] + " в WhatsApp от клиники «Радикс»: дружелюбно, без медицинских терминов. По снимку предложен план лечения: " + list + ", итого " + total.toLocaleString("ru-RU") + " ₽. Предложи выбрать удобное время и задать вопросы. 3-5 предложений, 1-2 уместных эмодзи, без приветствия «Здравствуйте, уважаемый»." }
    ], 350);
  }

  /* Динамика между двумя снимками (модель анализа — GPT-5.5) */
  function dynamics(patient, beforeFinds, afterFinds) {
    return complete(models().analysis, [
      { role: "system", content: SYS },
      { role: "user", content: "Сравни находки на двух снимках пациента " + patient.name + " (хронологический порядок).\n\nСНИМОК 1 (ранний):\n" + findingsBrief({ findings: beforeFinds }) + "\n\nСНИМОК 2 (поздний):\n" + findingsBrief({ findings: afterFinds }) + "\n\nОпиши:\n1. ДИНАМИКА — что улучшилось, что ухудшилось, что без изменений.\n2. НОВЫЕ НАХОДКИ и исчезнувшие.\n3. ВЫВОД — рекомендация врачу одним-двумя предложениями.\nБез преамбулы." }
    ], 600);
  }

  /* Оформление голосовой диктовки врача в заключение (модель анализа — GPT-5.5) */
  function formatDictation(text, patient) {
    return complete(models().analysis, [
      { role: "system", content: SYS },
      { role: "user", content: "Врач надиктовал голосом черновик заключения по пациенту " + patient.name + " (распознанная речь, могут быть огрехи распознавания):\n\n«" + text + "»\n\nОформи это в аккуратное структурированное заключение: исправь очевидные ошибки распознавания, расставь разделы (Описание / Находки / Рекомендации), сохрани все клинические детали врача, ничего не выдумывай сверх сказанного. Без преамбулы." }
    ], 800);
  }

  /* Утренний брифинг по клинике (общая модель — GPT-4o) */
  function briefing(summary) {
    return complete(models().chat, [
      { role: "system", content: SYS },
      { role: "user", content: "Ты — операционный ассистент клиники. Вот сводка на сегодня:\n" + summary + "\n\nСделай короткий брифинг для врача: 3-5 пунктов маркером «•» (самое важное: приёмы, заявки, деньги, проблемные пациенты) и в конце одну строку «Рекомендация: …» с самым полезным действием дня. Без приветствий и преамбулы." }
    ], 450);
  }

  /* Напоминание пациенту о приёме (общая модель — GPT-4o) */
  function remind(name, work, when) {
    return complete(models().chat, [
      { role: "system", content: SYS },
      { role: "user", content: "Напиши короткое напоминание пациенту " + name.split(" ")[0] + " в WhatsApp от клиники «Радикс» о приёме: " + work + ", " + when + ". Дружелюбно, 2-3 предложения, попроси подтвердить визит или предупредить о переносе, 1 уместный эмодзи." }
    ], 220);
  }

  /* Скоринг сделки в воронке (общая модель — GPT-4o) */
  function dealAdvice(card, stageTitle) {
    return complete(models().chat, [
      { role: "system", content: "Ты — опытный администратор стоматологической клиники, который помогает закрывать сделки. Отвечай по-русски, конкретно, 2-3 предложения." },
      { role: "user", content: "Сделка: " + card.name + " · " + card.work + " · " + card.val.toLocaleString("ru-RU") + " ₽ · стадия «" + stageTitle + "» · вероятность " + card.prob + "% · источник: " + card.src + " · " + card.date + ".\nОцени перспективы и назови ОДИН следующий конкретный шаг, чтобы продвинуть сделку." }
    ], 220);
  }

  /* Тексты для отчёта пациента (модель анализа — GPT-5.5), один вызов → JSON */
  function patientReportTexts(patient, findings, upsells) {
    var ups = upsells.map(function (u) { return u.id + " = " + u.label + " (" + u.desc + ")"; }).join("\n");
    return complete(models().analysis, [
      { role: "system", content: SYS + " Сейчас ты пишешь тексты для красивого отчёта ПАЦИЕНТУ: тёплый заботливый тон, никакого медицинского жаргона, без запугивания, но с мягкой мотивацией не откладывать." },
      { role: "user", content: "Пациент: " + patient.name + ".\nНаходки на снимке:\n" + findingsBrief(patient) +
        "\n\nРекомендуемые клиникой дополнительные услуги:\n" + ups +
        "\n\nВерни СТРОГО JSON без пояснений:\n{\"greeting\": \"тёплое вступление 2-3 предложения с именем\", \"findings\": [{\"tooth\": \"номер\", \"text\": \"объяснение находки простыми словами, 1-2 предложения\"}], \"whyNow\": \"почему лечить сейчас выгоднее, 2-3 предложения, мягко\", \"upsell\": {\"id услуги\": \"персональная подводка, почему именно этому пациенту это подойдёт, 1-2 предложения\"}}" }
    ], 1100).then(function (t) {
      var m = t.match(/\{[\s\S]*\}/);
      if (!m) throw new Error("Модель не вернула JSON");
      var j = JSON.parse(m[0]);
      if (!j.greeting || !j.findings) throw new Error("Неполный ответ модели");
      return j;
    });
  }

  /* Сводный риск-балл по пациенту (детерминированная эвристика, без сети) */
  function riskScore(patient) {
    var fs = patient.findings || [];
    var cariesW = { caries: 22, cariesE: 12, resorption: 18, cyst: 16, periap: 14 };
    var perioW = { tartar: 16, periodontitis: 26 };
    var caries = 0, perio = 0;
    fs.forEach(function (f) {
      var sev = f.severity || 2, k = (f.pc || 75) / 100;
      if (cariesW[f.type]) caries += cariesW[f.type] * (sev / 2) * k;
      if (perioW[f.type]) perio += perioW[f.type] * (sev / 2) * k;
    });
    caries = Math.min(100, Math.round(caries));
    perio = Math.min(100, Math.round(perio));
    var overall = Math.min(100, Math.round(caries * 0.6 + perio * 0.55));
    function band(v) { return v < 25 ? { t: "низкий", c: "#18A06E" } : v < 55 ? { t: "умеренный", c: "#E8941F" } : { t: "высокий", c: "#ED4422" }; }
    return { caries: caries, perio: perio, overall: overall, bandCaries: band(caries), bandPerio: band(perio), bandOverall: band(overall) };
  }

  /* Прогноз выручки на месяц (общая модель — GPT-4o) */
  function forecast(a) {
    return complete(models().chat, [
      { role: "system", content: "Ты — финансовый аналитик стоматологической клиники. Отвечай по-русски, кратко, конкретными цифрами." },
      { role: "user", content: "Данные клиники:\n- Выручка за текущий месяц: " + a.monthRevenue + " ₽\n- Всего оплат: " + a.paymentsCount + " на " + a.totalRevenue + " ₽\n- Средний чек: " + a.avgCheck + " ₽\n- Активный пайплайн (взвешенный): " + a.weighted + " ₽\n- Конверсия лид→лечение: " + a.conv + "%\n- Лидов в воронке: " + a.leads + "\n\nДай прогноз выручки на следующий месяц одним числом-диапазоном и 2-3 коротких пункта, что на него влияет и что сделать для роста. Без преамбулы." }
    ], 350);
  }

  window.RadixAI = { models: models, getKey: getKey, hasKey: hasKey, baseUrl: baseUrl, proxyUrl: proxyUrl, usingProxy: usingProxy, getSys: getSys, detect: detect, detectorUrl: detectorUrl, detectorOn: detectorOn, configure: configure, report: report, explain: explain, ask: ask, ping: ping, analyzeImage: analyzeImage, command: command, planAdvice: planAdvice, secondOpinion: secondOpinion, patientMessage: patientMessage, dynamics: dynamics, formatDictation: formatDictation, briefing: briefing, remind: remind, dealAdvice: dealAdvice, patientReportTexts: patientReportTexts, riskScore: riskScore, forecast: forecast };
})();
