set -a
source .env
set +a

sftp "$ALIAS" <<EOF
put $LOCAL_DB_PATH $REMOTE_PATH
bye
EOF

if [ $? -ne 0 ]; then
  echo "SFTP upload failed!"
  exit 1
fi

if ! curl -X POST "$INVALIDATE_URL" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json"; then
  echo "Cache invalidate request failed!"
  exit 1
fi

echo "Upload and cache invalidate succeeded."
