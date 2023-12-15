FROM node:20-alpine

RUN npm i -g pnpm

# Install CUPS/AVAHI
RUN apk update --no-cache && apk add --no-cache cups cups-filters avahi inotify-tools

WORKDIR /app

# pnpm fetch does require only lockfile
COPY patches ./patches
COPY pnpm-lock.yaml .npmrc ./
RUN pnpm fetch --prod

COPY package.json pnpm-workspace.yaml ./

COPY _project/models/package.json ./_project/models/
COPY _project/resources/package.json ./_project/resources/
COPY _project/messages/package.json ./_project/messages/
#COPY _project/core/package.json ./_project/core/
COPY _project/api/package.json ./_project/api/

# As we're going to deploy, we want only the minimal production dependencies.
# TODO
RUN pnpm install --frozen-lockfile --prod
#RUN --mount=type=cache,target=/root/.pnpm pnpm_CACHE_FOLDER=/root/.pnpm pnpm install --frozen-lockfile --prod

COPY _project/models/dist ./_project/models/dist
COPY _project/resources/dist ./_project/resources/dist
COPY _project/messages/dist ./_project/messages/dist
#COPY _project/core/dist ./_project/core/dist
COPY _project/api/dist ./_project/api/dist

#COPY data ./data

WORKDIR /app/_project/api
ENV NODE_ENV production
EXPOSE 3610
ENV PORT=3610
ENV TZ=Europe/Berlin
ARG API_VERSION
ENV API_VERSION=${API_VERSION:-docker_default}
ENV SENTRY_RELEASE=${API_VERSION:-docker_default}

CMD ["pnpm", "start"]
