# Радикс — AI-прокси (Supabase Edge Function)

Серверный прокси к OpenAI-совместимому API. Ключ хранится в секретах функции
(не в браузере и не в репозитории), функция ходит в модель со своей
инфраструктуры (обходит геоблок РФ) и отдаёт ответ с CORS-заголовками.

Эндпоинт после деплоя:
`https://ouqzjceshailooyhsssh.supabase.co/functions/v1/ai-proxy`

## 1. Задать секреты
Supabase → ваш проект → **Edge Functions → Secrets** (или Project Settings →
Edge Functions → Secrets) → добавить:

| Имя           | Значение                                                            |
|---------------|--------------------------------------------------------------------|
| `AI_API_KEY`  | **свежий** ключ OpenAI (`sk-…`) или ключ вашего прокси              |
| `AI_BASE_URL` | `https://api.openai.com/v1` (или базовый URL прокси, напр. `https://api.proxyapi.ru/openai/v1`) |

## 2. Задеплоить функцию
**Вариант A — через дашборд (без CLI):**
Edge Functions → **Deploy a new function → via Editor** → имя `ai-proxy` →
вставить содержимое `index.ts` → **Verify JWT: OFF** → Deploy.

**Вариант B — через CLI:**
```bash
supabase functions deploy ai-proxy --no-verify-jwt --project-ref ouqzjceshailooyhsssh
supabase secrets set AI_API_KEY=sk-... AI_BASE_URL=https://api.openai.com/v1 --project-ref ouqzjceshailooyhsssh
```

> Важно: **Verify JWT = OFF**. Функция публичная, но защищена проверкой Origin
> (только `cubafed.github.io`) внутри `index.ts`.

## 3. Включить прокси в приложении
Кабинет → Настройки → «Подключение AI» → поле **«Серверный прокси»**:
```
https://ouqzjceshailooyhsssh.supabase.co/functions/v1/ai-proxy
```
Поля «Ключ API» и «Адрес API» можно очистить — ключ теперь на сервере.
Нажать «Сохранить» → «Проверить соединение» → ✓.

Либо одной строкой в консоли браузера:
```js
localStorage.setItem("radix_ai_proxy","https://ouqzjceshailooyhsssh.supabase.co/functions/v1/ai-proxy"); location.reload();
```

## Проверка
«Анализ снимков» → загрузить снимок → бейдж `gpt-5-chat-latest vision`,
находки реальные. Заключения/планы идут через `gpt-5-nano`.
