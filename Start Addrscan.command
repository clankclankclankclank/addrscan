#!/bin/sh
set -eu
cd "$(dirname "$0")"

# Check Terminal, common macOS install locations, and ChatGPT's bundled runtime.
for candidate in "$(command -v node || true)" /opt/homebrew/bin/node /usr/local/bin/node \
    '/Applications/ChatGPT.app/Contents/Resources/node' \
    "$HOME/Applications/ChatGPT.app/Contents/Resources/node"; do
    [ -n "$candidate" ] && [ -x "$candidate" ] || continue
    if "$candidate" -e 'const [major, minor] = process.versions.node.split(".").map(Number); process.exit(major > 22 || (major === 22 && minor >= 9) ? 0 : 1)'; then
        if [ "${1:-}" = "--nfts" ]; then
            shift
            exec "$candidate" --env-file-if-exists=.env alchemy-nfts.js "$@"
        fi
        if [ "$#" -eq 0 ]; then
            set -- --open
        fi
        exec "$candidate" --env-file-if-exists=.env server.js "$@"
    fi
done

printf '%s\n' 'Addrscan needs Node.js 22.9 or newer.' \
    'Install it from https://nodejs.org and double-click this launcher again.' >&2
exit 1
