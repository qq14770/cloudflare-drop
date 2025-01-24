#!/usr/bin/env bash

set +e

# Create wrangler.toml file
cat ./wrangler.example.toml > ./wrangler.toml

if [ -n "$CUSTOM_DOMAIN" ]; then
  echo "route = { pattern = \"${CUSTOM_DOMAIN}\", custom_domain = true }" >> ./wrangler.toml
else
  echo  "workers_dev = true" >> ./wrangler.toml
fi

if [ -n "$D1_ID" ] && [ -n "$D1_NAME" ]; then
  echo -e "d1_databases = [{ binding = \"DB\", database_name = \"$D1_NAME\", database_id = \"$D1_ID\", migrations_dir = \"data/migrations\" }]" >> ./wrangler.toml
fi

if [ -n "$KV_ID" ]; then
  echo -e  "kv_namespaces = [{ binding = \"file_drops\", id = \"$KV_ID\" }]" >> ./wrangler.toml
fi

if [ -n "$RATE_LIMIT" ]; then
  echo -e  "unsafe = { bindings = [{ name = \"UPLOAD_LIMIT\", type = \"ratelimit\", namespace_id = \"1001\", simple = { limit = 1, period = 10 } }] }" >> ./wrangler.toml
fi

if [ -n "$SHARE_DURATION" ] && [ -n "$SHARE_MAX_SIZE_IN_MB" ]; then
  echo -e  "vars = { SHARE_DURATION = \"$SHARE_DURATION\", SHARE_MAX_SIZE_IN_MB = \"$SHARE_MAX_SIZE_IN_MB\" }" >> ./wrangler.toml
elif [ -n "$SHARE_DURATION" ]; then
  echo -e  "vars = { SHARE_DURATION = \"$SHARE_DURATION\" }" >> ./wrangler.toml
elif [ -n "$SHARE_MAX_SIZE_IN_MB" ]; then
  echo -e  "vars = { SHARE_MAX_SIZE_IN_MB = \"$SHARE_MAX_SIZE_IN_MB\" }" >> ./wrangler.toml
fi

# Generate migration
npm run generate

# Build web
npm run build:web

if [ -n "$D1_ID" ] && [ -n "$D1_NAME" ]; then
  yes | npx wrangler d1 migrations apply "$D1_NAME" --remote --env production
fi
