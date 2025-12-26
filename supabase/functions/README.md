# KARZOUN LOKANTASI - Supabase Edge Functions

## 1) Secrets
Supabase Dashboard > Project Settings > Edge Functions > Secrets

- OPENAI_API_KEY = your OpenAI key
- TELEGRAM_BOT_TOKEN = your Telegram bot token (optional)
- TELEGRAM_CHAT_ID = your chat id (optional)

## 2) Deploy (CLI)
```bash
supabase login
supabase link --project-ref <YOUR_PROJECT_REF>

supabase functions deploy assistant
supabase functions deploy telegram
```

## 3) CORS
This functions code already includes simple CORS headers.

## 4) Front-end config
Edit:
- `js/config.js` -> set SUPABASE_ANON_KEY (full) and (if needed) SUPABASE_URL
