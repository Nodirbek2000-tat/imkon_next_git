# Imkon frontend — Next.js 16 (standalone)
#
# Uch bosqichli: kutubxonalar -> build -> ishga tushirish.
# Yakuniy образga faqat build natijasi tushadi, `node_modules` to'liq emas.

# ---------------------------------------------------------------- 1. deps
FROM node:22-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json ./
# `npm ci` — lock fayl bo'yicha aniq o'rnatish. Build takrorlanuvchi bo'ladi.
RUN npm ci

# ---------------------------------------------------------------- 2. build
FROM node:22-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# NEXT_PUBLIC_* o'zgaruvchilari brauzer kodiga BUILD paytida yoziladi —
# konteyner ishga tushganda berilsa kech bo'ladi. Shuning uchun ular
# `docker compose` da `build.args` orqali keladi.
ARG NEXT_PUBLIC_TELEGRAM_BOT_USERNAME=""
ARG NEXT_PUBLIC_GOOGLE_CLIENT_ID=""
ENV NEXT_PUBLIC_TELEGRAM_BOT_USERNAME=$NEXT_PUBLIC_TELEGRAM_BOT_USERNAME \
    NEXT_PUBLIC_GOOGLE_CLIENT_ID=$NEXT_PUBLIC_GOOGLE_CLIENT_ID \
    NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# ---------------------------------------------------------------- 3. runner
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

RUN addgroup -g 1001 nodejs && adduser -u 1001 -G nodejs -S nextjs

# `standalone` ichida minimal server va faqat kerakli modullar bor
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
    CMD node -e "fetch('http://localhost:3000/').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.js"]
