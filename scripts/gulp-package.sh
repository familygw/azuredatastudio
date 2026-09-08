#!/usr/bin/env bash
# Run gulp packaging with Node 20 for this process only.
# Does not change the current shell PATH.
#
# Usage:
#   ./scripts/gulp-package.sh
#   ./scripts/gulp-package.sh vscode-darwin-arm64-min
#   ./scripts/gulp-package.sh vscode-darwin-arm64-min-ci
#   yarn gulp-package vscode-win32-x64-min

set -euo pipefail

if [[ "$OSTYPE" == "darwin"* ]]; then
	realpath() { [[ $1 = /* ]] && echo "$1" || echo "$PWD/${1#./}"; }
	ROOT=$(dirname "$(dirname "$(realpath "$0")")")
else
	ROOT=$(dirname "$(dirname "$(readlink -f "$0")")")
fi

find_node20() {
	local candidate

	if command -v brew >/dev/null 2>&1; then
		candidate="$(brew --prefix node@20 2>/dev/null)/bin/node"
		if [[ -x "$candidate" ]]; then
			echo "$candidate"
			return 0
		fi
	fi

	for candidate in \
		/opt/homebrew/opt/node@20/bin/node \
		/usr/local/opt/node@20/bin/node
	do
		if [[ -x "$candidate" ]]; then
			echo "$candidate"
			return 0
		fi
	done

	if [[ -s "${NVM_DIR:-$HOME/.nvm}/nvm.sh" ]]; then
		# shellcheck disable=SC1090
		. "${NVM_DIR:-$HOME/.nvm}/nvm.sh"
		if nvm which 20 >/dev/null 2>&1; then
			nvm which 20
			return 0
		fi
	fi

	if command -v node >/dev/null 2>&1; then
		local version
		version="$(node -v)"
		if [[ "$version" == v20.* ]]; then
			command -v node
			return 0
		fi
	fi

	return 1
}

default_task() {
	local os arch
	os="$(uname -s)"
	arch="$(uname -m)"
	case "$os-$arch" in
		Darwin-arm64) echo "vscode-darwin-arm64-min" ;;
		Darwin-x86_64) echo "vscode-darwin-x64-min" ;;
		Linux-x86_64) echo "vscode-linux-x64-min" ;;
		Linux-aarch64) echo "vscode-linux-arm64-min" ;;
		*) echo "vscode-darwin-arm64-min" ;;
	esac
}

NODE20="$(find_node20)" || {
	echo "Node.js 20 is required for gulp packaging." >&2
	echo "This does not change your default Node. Install a side-by-side Node 20:" >&2
	echo "  brew install node@20" >&2
	echo "Then re-run this script. Do not export PATH in your shell." >&2
	exit 1
}

NODE20_BIN="$(dirname "$NODE20")"
export PATH="$NODE20_BIN:$PATH"

if [[ "$#" -eq 0 ]]; then
	set -- "$(default_task)"
fi

echo "Using $($NODE20 -v) ($NODE20)"
echo "Running: yarn gulp $*"

cd "$ROOT"
exec yarn gulp "$@"
