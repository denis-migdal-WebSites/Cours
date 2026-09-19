#!/usr/bin/bash

# ./ds2zip.sh ~/Data/DS\ BDR /tmp/compilatio

DIR="$1"
DST="$2"

rm -r "$DST"
mkdir "$DST"

for f in "$1/"*; do

  filename=$(basename "$f")
  filename="${filename%.*}"

  unzip -c "$f" "answers" > "$DST"/"$filename".txt
done


rm -rf "$TMP"