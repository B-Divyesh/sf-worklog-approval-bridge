#!/bin/sh
set -eu

repo="B-Divyesh/sf-worklog-approval-bridge"
api="https://api.github.com/repos/$repo/releases/latest"
tmp_dir="$(mktemp -d)"
trap 'rm -rf "$tmp_dir"' EXIT INT TERM

os="$(uname -s)"
case "$os" in
  Linux) pattern='\.AppImage$' ;;
  Darwin) pattern='\.dmg$' ;;
  *) printf '%s\n' "Worklog Bridge supports this installer on macOS and Linux." >&2; exit 1 ;;
esac

json="$(curl -fsSL "$api")"
url="$(printf '%s' "$json" | tr ',' '\n' | sed -n 's/.*"browser_download_url": *"\([^"]*\)".*/\1/p' | grep -E "$pattern" | head -n 1)"
[ -n "$url" ] || { printf '%s\n' "No matching release file is published yet." >&2; exit 1; }
name="${url##*/}"
curl -fL "$url" -o "$tmp_dir/$name"
curl -fL "https://github.com/$repo/releases/latest/download/SHA256SUMS" -o "$tmp_dir/SHA256SUMS"
expected="$(grep "  $name$" "$tmp_dir/SHA256SUMS" | cut -d ' ' -f 1)"
actual="$(shasum -a 256 "$tmp_dir/$name" | cut -d ' ' -f 1)"
[ "$expected" = "$actual" ] || { printf '%s\n' "Checksum verification failed." >&2; exit 1; }

if [ "$os" = "Linux" ]; then
  install_dir="${XDG_BIN_HOME:-$HOME/.local/bin}"
  mkdir -p "$install_dir"
  install -m 755 "$tmp_dir/$name" "$install_dir/worklog-bridge"
  printf '%s\n' "Installed Worklog Bridge at $install_dir/worklog-bridge"
else
  destination="$HOME/Downloads/$name"
  cp "$tmp_dir/$name" "$destination"
  printf '%s\n' "Verified and saved Worklog Bridge at $destination"
  printf '%s\n' "Open the DMG, then drag Worklog Bridge into Applications. The preview is unsigned."
fi
