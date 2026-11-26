#!/bin/sh
set -eu
TEST_SH=${TEST_SH:-sh}
ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/../.." && pwd)
TMP=$(mktemp -d "${TMPDIR:-/tmp}/pre-commit-test.XXXXXX")
case "$TMP" in "${TMPDIR:-/tmp}"/pre-commit-test.*) ;; *) echo 'unsafe test temp directory' >&2; exit 1 ;; esac
trap 'rm -rf -- "$TMP"' EXIT HUP INT TERM
mkdir -p "$TMP/bin" "$TMP/work"
cat > "$TMP/bin/npm" <<'EOF'
#!/bin/sh
printf '%s|%s\n' "$*" "$PWD" >> "$LOG"
[ "${FAIL_ON:-}" != "$*" ]
EOF
chmod +x "$TMP/bin/npm"
run_gate() {
  : > "$TMP/log"
  (cd "$TMP/work" && LOG="$TMP/log" PATH="$TMP/bin:$PATH" "$TEST_SH" "$ROOT/frontend/scripts/pre-commit.sh")
}
expect() { [ "$(cat "$TMP/log")" = "$1" ] || { echo "unexpected npm calls: $(cat "$TMP/log")" >&2; exit 1; }; }
# Gate steps in the exact order frontend/scripts/pre-commit.sh runs them.
STEPS='run format:check
run lint
test
run check
run typecheck'
# Prints the expected npm call log up to and including step $1 (all steps when empty).
expected_until() {
  printf '%s\n' "$STEPS" | while IFS= read -r step; do
    printf '%s|%s\n' "$step" "$ROOT/frontend"
    if [ "$step" = "$1" ]; then
      break
    fi
  done
}
run_gate
expect "$(expected_until '')"
printf '%s\n' "$STEPS" | while IFS= read -r failure; do
  : > "$TMP/log"
  if (cd "$TMP/work" && LOG="$TMP/log" FAIL_ON="$failure" PATH="$TMP/bin:$PATH" "$TEST_SH" "$ROOT/frontend/scripts/pre-commit.sh"); then
    echo "gate unexpectedly passed at $failure" >&2; exit 1
  fi
  expect "$(expected_until "$failure")"
done
installer=$ROOT/tools/scripts/install-pre-commit.sh
mkdir -p "$TMP/repo" "$TMP/conflict" "$TMP/configured" "$TMP/hooksconfig" "$TMP/worktree"
git -C "$TMP/repo" init -q
git -C "$TMP/conflict" init -q
git -C "$TMP/configured" init -q
git -C "$TMP/hooksconfig" init -q
(cd "$TMP/repo" && "$TEST_SH" "$installer")
HOOKS=$(git -C "$TMP/repo" rev-parse --git-path hooks)
case "$HOOKS" in /*) ;; *) HOOKS="$TMP/repo/$HOOKS" ;; esac
[ -x "$HOOKS/pre-commit" ]
(cd "$TMP/repo" && "$TEST_SH" "$installer")
printf '#!/bin/sh\nset -eu\nROOT=$(git rev-parse --show-toplevel) || exit 1\nexec sh "$ROOT/.githooks/pre-commit" "$@"\n' | cmp -s "$HOOKS/pre-commit" -
printf 'unrelated but containing exec sh and /.githooks/pre-commit\n' > "$TMP/conflict/.git/hooks/pre-commit"
if (cd "$TMP/conflict" && "$TEST_SH" "$installer"); then echo 'installer accepted a lookalike hook' >&2; exit 1; fi
[ "$(cat "$TMP/conflict/.git/hooks/pre-commit")" = 'unrelated but containing exec sh and /.githooks/pre-commit' ]
printf '#!/bin/sh\nset -eu\nROOT=$(git rev-parse --show-toplevel) || exit 1\nexec sh "$ROOT/.githooks/pre-commit" "$@"\n' > "$TMP/configured/.git/hooks/pre-commit"
chmod 644 "$TMP/configured/.git/hooks/pre-commit"
if (cd "$TMP/configured" && "$TEST_SH" "$installer"); then echo 'installer accepted a non-executable managed hook' >&2; exit 1; fi
[ ! -x "$TMP/configured/.git/hooks/pre-commit" ]
if [ -x "$TMP/configured/.git/hooks/pre-commit" ]; then echo 'installer changed non-executable hook permissions' >&2; exit 1; fi
git -C "$TMP/hooksconfig" config core.hooksPath custom
if (cd "$TMP/hooksconfig" && "$TEST_SH" "$installer"); then echo 'installer ignored configured hooksPath' >&2; exit 1; fi
[ ! -e "$TMP/hooksconfig/.git/hooks/pre-commit" ]
printf 'fixture\n' > "$TMP/repo/fixture"
git -C "$TMP/repo" -c user.name=Test -c user.email=test@example.invalid add fixture
git -C "$TMP/repo" -c user.name=Test -c user.email=test@example.invalid -c commit.gpgsign=false -c core.hooksPath=/dev/null commit -qm fixture
git -C "$TMP/repo" worktree add -q -b linked "$TMP/worktree"
(cd "$TMP/worktree" && "$TEST_SH" "$installer")
LINKED_HOOKS=$(git -C "$TMP/worktree" rev-parse --git-path hooks)
case "$LINKED_HOOKS" in /*) ;; *) LINKED_HOOKS="$TMP/worktree/$LINKED_HOOKS" ;; esac
[ -x "$LINKED_HOOKS/pre-commit" ]
(cd "$TMP/worktree" && "$TEST_SH" "$installer")
printf 'all pre-commit tests passed\n'
