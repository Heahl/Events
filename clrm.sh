#!/usr/bin/env bash
set -euo pipefail

if [ "$#" -eq 0 ]; then
  echo "Usage: $0 <path1> [path2 ...]"
  exit 1
fi

# ------------------------------------------------------------------
# Accumulator file in /tmp; one number per line.
# ------------------------------------------------------------------
acc=$(mktemp)
echo 0 > "$acc"

process_file() {
  local file=$1
  local tmp=$(mktemp)

  awk -v file="$file" '
    {
      if ($0 ~ /console\.log/ &&
          $0 !~ /\/\// &&
          $0 !~ /\/\*/ &&
          $0 !~ /\*/) {

        printf "DELETED: %s:%d: %s\n", file, NR, $0 > "/dev/stderr"
        deleted++
        next
      }
      print
    }
    END {
      if (deleted > 0) {
        printf "__COUNT__ %d\n", deleted
      }
    }
  ' "$file" > "$tmp"

  if grep -q "__COUNT__" "$tmp"; then
    count=$(grep "__COUNT__" "$tmp" | awk '{print $2}')
    # add to global accumulator
    awk -v c="$count" '{print $0+c}' "$acc" > "${acc}.new" && mv "${acc}.new" "$acc"
    grep -v "__COUNT__" "$tmp" > "$file"
  fi
  rm -f "$tmp"
}

export -f process_file
export acc

for path in "$@"; do
  # use a single bash shell per file so the function sees the variables
  find "$path" -type f \( -name '*.js' -o -name '*.ts' -o -name '*.jsx' -o -name '*.tsx' \) \
       -exec bash -c 'process_file "$0"' {} \;
done

total=$(cat "$acc")
rm -f "$acc"

echo
echo "===================================="
echo "Gelöschte Zeilen insgesamt: $total"
echo "===================================="