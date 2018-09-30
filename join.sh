#!/usr/bin/env bash

perl -Mfeature=say -ne 'm|^tripReport\((.*)\);$| or die; print $1' "$@" \
| jq -r -s -c '{photos: [(.[].photos // [])[]], points: [(.[].points // [])[]], tracks: [(.[].tracks // [])[]]} | tojson | "tripReport(\(.))"'
