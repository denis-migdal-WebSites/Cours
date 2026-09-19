#!/usr/bin/bash

# ./ds2zip.sh ~/Data/DS\ BDR /tmp/test.zip

DIR="$1"
DST="$2"

TMP=$(mktemp -d -t)

for f in "$1/"*; do

  filename=$(basename "$f")
  filename="${filename%.*}"

  mkdir "$TMP"/"$filename"
  cp "$f" "$TMP"/"$filename"/rendu.zip
done

rm "$DST"

cd "$TMP"
zip -r -p "$DST" *
cd -

rm -rf "$TMP"