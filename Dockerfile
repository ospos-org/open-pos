FROM node:20-alpine AS deps
RUN corepack enable

WORKDIR /app
COPY package.json .
COPY pnpm-lock.yaml .

RUN pnpm install

FROM node:20-alpine AS BUILD_IMAGE
RUN corepack enable

WORKDIR /app
ENV PORT 3000

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN NEXT_PUBLIC_API_URL=APP_NEXT_PUBLIC_API_URL NEXT_PUBLIC_DEMO=APP_NEXT_PUBLIC_DEMO pnpm build

RUN rm -rf node_modules
RUN pnpm install --production  --ignore-scripts --prefer-offline

FROM node:20-alpine

ENV PORT 3000
ENV NODE_ENV production

# RUN addgroup -g 1001 -S nodejs
# RUN adduser -S nextjs -u 1001

WORKDIR /app
COPY --from=BUILD_IMAGE /app .

EXPOSE 3000
ENTRYPOINT ["/app/entrypoint.sh"]

CMD [ "pnpm", "start"]