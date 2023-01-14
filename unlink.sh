sed -E -i '' 's"  - (.*) # link"  #- \1 # link"g' pnpm-workspace.yaml
pnpm i
