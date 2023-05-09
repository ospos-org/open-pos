#!/bin/sh

echo "Check that we have NEXT_PUBLIC_API_URL vars"
test -n "$NEXT_PUBLIC_API_URL"

echo "Check that we have NEXT_PUBLIC_DEMO vars"
test -n "$NEXT_PUBLIC_DEMO"

find /app/.next \( -type d -name .git -prune \) -o -type f -print0 | xargs -0 sed -i "s#APP_NEXT_PUBLIC_API_URL#$NEXT_PUBLIC_API_URL#g"
find /app/.next \( -type d -name .git -prune \) -o -type f -print0 | xargs -0 sed -i "s#APP_NEXT_PUBLIC_DEMO#$NEXT_PUBLIC_DEMO#g"

echo "Starting Nextjs"
exec "$@"