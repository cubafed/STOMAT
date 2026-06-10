/* ============================================================
   Радикс AI — интеграция с OpenAI
   · Анализ снимков и заключения  → GPT-5.5 (премиум-модель)
   · Общий чат-ассистент          → GPT-4o (общий доступ)
   Ключ API хранится только в localStorage браузера врача.
   ============================================================ */
(function () {
  "use strict";
  var LS_KEY = "radix_ai_key", LS_AM = "radix_ai_model_analysis", LS_CM = "radix_ai_model_chat";
  var DEF_ANALYSIS = "gpt-5.5", DEF_CHAT = "gpt-4o";

  function ls(k, v) {
    try {
      if (v === undefined) return localStorage.getItem(k);
      if (v === null || v === "") localStorage.removeItem(k); else localStorage.setItem(k, v);
    } catch (e) { return null; }
  }
  function models() { return { analysis: ls(LS_AM) || DEF_ANALYSIS, chat: ls(LS_CM) || DEF_CHAT }; }
  function getKey() { return ls(LS_KEY) || ""; }
  function hasKey() { return !!getKey(); }
  function configure(key, analysisModel, chatModel) {
    ls(LS_KEY, key); ls(LS_AM, analysisModel); ls(LS_CM, chatModel);
  }

  function complete(model, messages, maxTokens) {
    if (!hasKey()) return Promise.reject(new Error("Ключ API не задан — добавьте его в Настройках"));
    return fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": "Bearer " + getKey() },
      body: JSON.stringify({ model: model, messages: messages, temperature: 0.4, max_tokens: maxTokens || 700 })
    }).then(function (r) {
      if (!r.ok) return r.json().catch(function () { return {}; }).then(function (j) {
        throw new Error((j.error && j.error.message) || ("HTTP " + r.status));
      });
      return r.json();
    }).then(function (j) { return j.choices[0].message.content.trim(); });
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

  function ping() { return complete(models().chat, [{ role: "user", content: "ok" }], 5); }

  /* Vision-анализ загруженного снимка (модель анализа — GPT-5.5).
     Возвращает массив находок в формате приложения. */
  var FIND_TYPES = ["caries", "cariesE", "tartar", "periap", "resto"];
  function parseFindings(text) {
    var m = text.match(/\{[\s\S]*\}/);
    if (!m) throw new Error("Модель не вернула JSON");
    var j = JSON.parse(m[0]);
    var arr = j.findings || j["находки"] || [];
    if (!arr.length) return [];
    return arr.slice(0, 12).map(function (f) {
      var b = f.box || {};
      function cl(v, max) { v = +v || 0; return Math.max(0, Math.min(max, v)); }
      return {
        type: FIND_TYPES.indexOf(f.type) > -1 ? f.type : "caries",
        tooth: f.tooth != null ? f.tooth : "—",
        loc: f.loc || "",
        pc: Math.max(50, Math.min(99, Math.round(+f.pc || 75))),
        box: { x: cl(b.x, 88), y: cl(b.y, 84), w: Math.max(4, cl(b.w, 30)), h: Math.max(4, cl(b.h, 30)) }
      };
    });
  }
  function analyzeImage(dataUrl) {
    return complete(models().analysis, [
      { role: "system", content: SYS },
      {
        role: "user", content: [
          { type: "text", text: "Проанализируй этот стоматологический рентгеновский снимок. Найди патологии и верни СТРОГО JSON без пояснений:\n{\"findings\":[{\"type\":\"caries|cariesE|tartar|periap|resto\",\"tooth\":\"номер зуба по FDI или описание\",\"loc\":\"локализация по-русски\",\"pc\":число 50-99 (уверенность),\"box\":{\"x\":0-100,\"y\":0-100,\"w\":4-30,\"h\":4-30}}]}\nbox — рамка находки в процентах от размеров изображения (x,y — левый верхний угол). Типы: caries — кариес дентина, cariesE — кариес эмали, tartar — зубной камень, periap — периапикальный очаг, resto — реставрация/пломба. Если патологий нет — пустой массив." },
          { type: "image_url", image_url: { url: dataUrl } }
        ]
      }
    ], 1400).then(parseFindings);
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

  window.RadixAI = { models: models, getKey: getKey, hasKey: hasKey, configure: configure, report: report, explain: explain, ask: ask, ping: ping, analyzeImage: analyzeImage, command: command, planAdvice: planAdvice, secondOpinion: secondOpinion, patientMessage: patientMessage, dynamics: dynamics, formatDictation: formatDictation };
})();
