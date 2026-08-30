FROM node:22-bookworm-slim AS web-build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts
COPY index.html tsconfig.json vite.config.ts ./
COPY src ./src
COPY public ./public
COPY scripts ./scripts
COPY assets ./assets
RUN npm run build:site

FROM rust:1-slim AS server-build
WORKDIR /build
RUN apt-get update && apt-get install -y --no-install-recommends pkg-config libsqlite3-dev ca-certificates && rm -rf /var/lib/apt/lists/*
COPY server ./server
RUN cargo build --manifest-path server/Cargo.toml --release --locked

FROM debian:bookworm-slim AS runtime
ARG BUILD_SHA=dev
ARG GIT_SHA=dev
ARG SOURCE_COMMIT=dev
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates libsqlite3-0 && rm -rf /var/lib/apt/lists/* \
  && useradd --system --uid 10001 --create-home appuser \
  && mkdir -p /app/dist/site /data \
  && chown -R appuser:appuser /app /data
COPY --from=web-build --chown=appuser:appuser /app/dist/site /app/dist/site
COPY --from=server-build --chown=appuser:appuser /build/server/target/release/worklog-approval-bridge-server /app/worklog-approval-bridge-server
USER appuser
ENV STATIC_DIR=/app/dist/site
ENV APP_DATA_DIR=/data
ENV PORT=8080
ENV BUILD_SHA=${BUILD_SHA}
ENV GIT_SHA=${GIT_SHA}
ENV SOURCE_COMMIT=${SOURCE_COMMIT}
EXPOSE 8080
CMD ["/app/worklog-approval-bridge-server"]
