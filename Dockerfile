FROM oven/bun:1

RUN bun install -g pnpm

WORKDIR /app

ENV NODE_ENV production

# pnpm fetch does require only lockfile
COPY patches ./patches
COPY pnpm-lock.yaml .npmrc ./
RUN bunx pnpm fetch --prod

COPY package.json pnpm-workspace.yaml ./

COPY api/package.json ./api/

# As we're going to deploy, we want only the minimal production dependencies.
# TODO
RUN bunx pnpm install --frozen-lockfile --prod
#RUN --mount=type=cache,target=/root/.pnpm pnpm_CACHE_FOLDER=/root/.pnpm pnpm install --frozen-lockfile --prod

COPY api/dist ./api/dist

#COPY data ./data

WORKDIR /app/api
EXPOSE 3610
ENV PORT=3610
ENV TZ=Europe/Berlin
ARG API_VERSION
ENV API_VERSION=${API_VERSION:-docker_default}
ENV SENTRY_RELEASE=${API_VERSION:-docker_default}

CMD ["bunx", "pnpm", "start"]
