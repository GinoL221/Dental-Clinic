#!/bin/sh
set -eu
ROOT=$(git rev-parse --show-toplevel) || { echo 'Run from a Git repository.' >&2; exit 1; }
HOOKS_DIR=$(git -C "$ROOT" rev-parse --git-path hooks)
case "$HOOKS_DIR" in
  /*) ;;
  *) HOOKS_DIR="$ROOT/$HOOKS_DIR" ;;
esac
mkdir -p "$HOOKS_DIR"
HOOKS_DIR=$(CDPATH= cd -- "$HOOKS_DIR" && pwd -P)
if git -C "$ROOT" config --get core.hooksPath >/dev/null 2>&1; then
  echo 'core.hooksPath is configured; refusing to change Git hook configuration.' >&2
  exit 1
fi
TARGET="$HOOKS_DIR/pre-commit"
if [ -e "$TARGET" ] || [ -L "$TARGET" ]; then
  if [ -f "$TARGET" ] && [ -x "$TARGET" ] && printf '%s\n' '#!/bin/sh' 'set -eu' 'ROOT=$(git rev-parse --show-toplevel) || exit 1' 'exec sh "$ROOT/.githooks/pre-commit" "$@"' | cmp -s "$TARGET" -; then
    echo 'Pre-commit hook is already installed.'
    exit 0
  fi
  echo "Existing hook found at $TARGET; refusing to overwrite it." >&2
  exit 1
fi
cat > "$TARGET" <<'HOOK'
#!/bin/sh
set -eu
ROOT=$(git rev-parse --show-toplevel) || exit 1
exec sh "$ROOT/.githooks/pre-commit" "$@"
HOOK
chmod +x "$TARGET"
echo "Installed pre-commit hook in $TARGET"
