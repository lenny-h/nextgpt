ARG PG_MAJOR=18
FROM pgvector/pgvector:pg${PG_MAJOR}

# Install pg_cron for the specified Postgres major version
RUN set -eux; \
    apt-get update; \
    apt-get install -y --no-install-recommends \
    postgresql-${PG_MAJOR}-cron; \
    rm -rf /var/lib/apt/lists/*