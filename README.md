# kaspace — web agency

Сайт агентства kaspace: одностраничник на чистом HTML/CSS/JS, без сборки.

## Публикация на GitHub Pages
Settings → Pages → Build and deployment → Source: **Deploy from a branch** → Branch: `main`, папка `/ (root)` → Save.
Через 1–2 минуты сайт будет доступен по адресу `https://<username>.github.io/<repo>/`.

## Свой домен
Settings → Pages → Custom domain → указать домен. У регистратора домена:
- для `www.домен` — CNAME на `<username>.github.io`;
- для корневого домена — A-записи на 185.199.108.153, 185.199.109.153, 185.199.110.153, 185.199.111.153.
После проверки DNS включить **Enforce HTTPS**.

## Что где в `index.html`
- Портфолио — массив `WORKS` в скрипте.
- FAQ — массив `QA`.
- Отправка заявок — функция `sendLead()` (пока заглушка).
