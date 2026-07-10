FROM node:20-alpine AS builder

WORKDIR /app/server

COPY server/package.json server/package-lock.json ./

RUN npm ci --only=production

COPY server/prisma ./prisma

RUN npx prisma generate

COPY server/tsconfig.json ./
COPY server/src ./src

RUN npm run build

FROM node:20-alpine

WORKDIR /app/server

RUN apk add --no-cache tini

COPY --from=builder /app/server/node_modules ./node_modules
COPY --from=builder /app/server/dist ./dist
COPY --from=builder /app/server/prisma ./prisma

EXPOSE 3001

USER node

ENTRYPOINT ["/sbin/tini", "--"]

CMD ["node", "dist/index.js"]
