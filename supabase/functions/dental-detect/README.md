# Радикс — детектор снимков (Roboflow)

Специализированная CV-модель ставит рамки находок (точнее, чем LLM). Функция
держит ключ Roboflow на сервере, ходит в hosted-модель и отдаёт результат с CORS.
LLM при этом продолжает писать тексты/заключения по найденным находкам.

Эндпоинт после деплоя:
`https://ouqzjceshailooyhsssh.supabase.co/functions/v1/dental-detect`

## 1. Аккаунт и ключ Roboflow (бесплатно)
- Зарегистрируйся на roboflow.com → Private API Key: https://app.roboflow.com/settings/api

## 2. Выбрать модель на Roboflow Universe
Нужна модель **object detection** по панорамным/прицельным снимкам с классами
патологий (кариес / периапикальный очаг / убыль кости), НЕ просто сегментация зубов.
Кандидаты для проверки (открой страницу → вкладка **Deploy** → там виден `model_id`
вида `project/version`, напр. `dental-xray-7class/3`):
- `renielaz/dental-caries-x-ray` (кариес)
- `coded-ai/dental-x-ray-panoramic-dataset-kgqvj`
- `ansanailab-cheue/dental-panorama-xray-3`
- модели с классами «Caries / Periapical lesion / Bone Loss»

> Классы модели маппятся на типы приложения автоматически (caries, periap,
> periodontitis, tartar, resorption, cyst, impacted, resto). Неизвестные классы
> (напр. просто «tooth») отбрасываются. После выбора модели я подстрою маппинг.

## 3. Секреты функции
Supabase → Edge Functions → Secrets (https://supabase.com/dashboard/project/ouqzjceshailooyhsssh/settings/functions):

| Имя | Значение |
|---|---|
| `ROBOFLOW_API_KEY` | приватный ключ Roboflow |
| `ROBOFLOW_MODEL` | `project/version` со страницы модели (вкладка Deploy) |

## 4. Деплой функции
Edge Functions → Deploy a new function → via Editor → имя `dental-detect` →
вставить `index.ts` → **Verify JWT: OFF** → Deploy.

## 5. Включить в приложении
Настройки → «Подключение AI» → поле **«Детектор снимков (Roboflow Edge Function)»**:
```
https://ouqzjceshailooyhsssh.supabase.co/functions/v1/dental-detect
```
Сохранить. Теперь «Анализ снимков» → загрузка снимка → рамки ставит Roboflow
(бейдж «Roboflow детектор»), а кнопки «AI-заключение / Объяснить пациенту» —
по-прежнему LLM.

## Примечание про окружение разработки
Сеть песочницы Claude Code блокирует хосты Roboflow — поэтому подбор/тест модели
через Roboflow MCP требует добавить в network-allowlist окружения:
`mcp.roboflow.com`, `api.roboflow.com`, `detect.roboflow.com`, `app.roboflow.com`.
На РАБОТУ приложения это не влияет: в проде Roboflow зовёт Supabase-функция, а не
песочница.
