FROM node:alpine AS base
WORKDIR /app
RUN corepack enable pnpm

FROM base AS build
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm run -r build

FROM build AS api-gateway-build
RUN pnpm deploy --filter=@vivo/api-gateway --prod /prod/api

FROM build AS external-service-build
RUN pnpm deploy --filter=@vivo/external-service --prod /prod/external

FROM build AS invalidation-service-build
RUN pnpm deploy --filter=@vivo/invalidation-service --prod /prod/invalidation

FROM base AS api-gateway
COPY --from=api-gateway-build /prod/api /app
CMD ["node", "dist/index.js"]

FROM base AS external-service
COPY --from=external-service-build /prod/external /app
CMD ["node", "dist/index.js"]

FROM base AS invalidation-service
COPY --from=invalidation-service-build /prod/invalidation /app
CMD ["node", "dist/index.js"]