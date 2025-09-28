# Kong API Gateway for Cloud Run
FROM kong:3.9.1

# Copy Kong configuration template
COPY apps/supabase/volumes/api/kong.yml /home/kong/kong.yml.template

# Temporarily switch to root to change file ownership
USER root
RUN chown -R kong:kong /home/kong

# Expose http port
EXPOSE 8000

# Install gettext for envsubst
RUN apt-get update && apt-get install -y gettext && rm -rf /var/lib/apt/lists/*

# Custom entrypoint to substitute environment variables and start Kong
ENTRYPOINT ["bash", "-c", "envsubst < /home/kong/kong.yml.template > /home/kong/kong.yml && /docker-entrypoint.sh kong docker-start"]
