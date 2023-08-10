FROM node:20-alpine AS deps
RUN corepack enable

WORKDIR /app
COPY package.json .
COPY pnpm-lock.yaml .

RUN pnpm install

FROM node:20-alpine AS BUILD_IMAGE
RUN corepack enable

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN NEXT_PUBLIC_API_URL=APP_NEXT_PUBLIC_API_URL NEXT_PUBLIC_DEMO=APP_NEXT_PUBLIC_DEMO pnpm build

RUN rm -rf node_modules
RUN pnpm install --production  --ignore-scripts --prefer-offline

FROM node:20-alpine
RUN corepack enable
RUN corepack prepare pnpm@latest --activate

ARG PORT=8080
ARG DEFAULT_PORT=3000
ENV NODE_ENV production
ENV PORT ${PORT}

# RUN addgroup -g 1001 -S nodejs
# RUN adduser -S nextjs -u 1001

WORKDIR /app
COPY --from=BUILD_IMAGE /app .

EXPOSE ${PORT}
EXPOSE ${DEFAULT_PORT}

ENTRYPOINT ["/app/entrypoint.sh"]

CMD [ "pnpm", "start" ]