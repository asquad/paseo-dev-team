#!/bin/sh
# Installs or updates paseo-dev-team on macOS and Linux. Options: ./install.sh --help
set -eu

script_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
installer="$script_dir/scripts/install.mjs"

if [ -n "${PASEO_DEV_TEAM_NODE:-}" ]; then
  exec "$PASEO_DEV_TEAM_NODE" "$installer" "$@"
fi

if command -v node >/dev/null 2>&1; then
  exec node "$installer" "$@"
fi

for app in \
  "/Applications/Paseo.app/Contents/MacOS/Paseo" \
  "$HOME/Applications/Paseo.app/Contents/MacOS/Paseo" \
  "/opt/Paseo/paseo" \
  "/usr/lib/paseo/paseo"; do
  if [ -x "$app" ]; then
    ELECTRON_RUN_AS_NODE=1 exec "$app" "$installer" "$@"
  fi
done

echo "Node.js was not found and no Paseo app runtime was detected." >&2
echo "Install Node.js 18+ or set PASEO_DEV_TEAM_NODE to a node executable." >&2
exit 1
