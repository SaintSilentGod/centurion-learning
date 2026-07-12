# Размещение в production

Чеклист перед выкладкой Centurion Learning.

## 1. Сборка

```bash
npm run build
```

Убедитесь, что TypeScript и Next.js проходят без ошибок.

## 2. База данных

### Миграции (рекомендуется для production)

Перед переключением на новую версию приложения выполните **один раз**:

```bash
npm run db:migrate:deploy
```

Для первого развёртывания создайте baseline-миграцию из текущей схмы:

```bash
npx prisma migrate dev --name init
```

Затем в CI/CD и на сервере используйте только `prisma migrate deploy`, не `db push`.

### Пул соединений

По умолчанию в production используется `max: 3` соединения на инстанс (serverless).

На одной VM можно задать:

```env
DATABASE_POOL_MAX=15
```

## 3. Health check

Эндпоинт для мониторинга:

```
GET /api/health
```

Ответ `200` — БД доступна, `503` — проблема с подключением.

## 4. Переменные окружения

| Переменная | Назначение |
|---|---|
| `DATABASE_URL` | PostgreSQL |
| `AUTH_SECRET` | Подпись сессий (мин. 32 символа) |
| `PASSWORD_STORAGE_SECRET` | Ключ шифрования `passwordEncrypted` (отдельно от `AUTH_SECRET`) |
| `DATABASE_POOL_MAX` | Лимит соединений pg Pool (опционально) |
| `SEED_ADMIN_PASSWORD` | Пароль админа при seed (не логируется в production) |

## 5. Резервное копирование

Ежедневный дамп:

```bash
DATABASE_URL=postgres://... ./scripts/backup-db.sh
```

- Храните архивы в object storage с шифрованием
- Периодически проверяйте восстановление из бэкапа

## 6. Логирование

**Не логировать:**

- пароли и `passwordEncrypted`
- токены сессий / cookies
- снимки прокторинга (base64 webcam)

В seed пароль админа выводится только в `NODE_ENV=development`.

## 7. `passwordEncrypted`

Поле хранит пароль клиента в зашифрованном виде для показа администратору.
Используйте отдельный `PASSWORD_STORAGE_SECRET`, ротируйте ключи по процедуре
вашей организации и ограничьте доступ к расшифровке.

## 8. Типичный pipeline

```bash
npm ci
npm run db:migrate:deploy
npm run build
npm run start
```

Или через Docker/PM2 — главное: **migrate deploy до** переключения трафика на новую версию.
