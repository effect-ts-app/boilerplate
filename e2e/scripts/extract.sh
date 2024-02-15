#!/usr/bin/env bash

SRC_SELECTORS=$(grep -hro 'data-test="[^"]*"' ../frontend/src | cut -d \" -f2 | sort | uniq)
echo $SRC_SELECTORS | sed 's/ /"\n  | "/g; s/^/&export type Selectors =\n  | "/; s/.$/&"/;' | cat > helpers/@types/selectors.d.ts
