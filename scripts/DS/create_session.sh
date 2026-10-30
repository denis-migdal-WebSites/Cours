#!/usr/bin/bash

# Requires :
# - subject URL in parameters.
# - ./raw.zip
# - ./solution.answers

DIR=$(mktemp -d)

unzip ./raw.zip -d "$DIR"

cp ./solution.answers -t "$DIR"
echo "$1" > "$DIR"/subject.url

zip -j ./rendus.zip "$DIR"/*