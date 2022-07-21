# effect-ts-app boilerplate

## Setup

1. `yarn` from root
2. open a typescript file, and set VSCode's Typescript version to use the workspace version:
   - TypeScript: Select TypeScript version: Use workspace version

## Run

(VSCode tasks.json in progress)

### API & Libs

a) `yarn build -w`
b) `cd apps/api && yarn dev`

Visit: http://localhost:3540/docs
The API is also proxied in the frontend on /api


### Frontend (Nuxt)

- `cd apps/frontend-nuxt && yarn dev -o`

Visit: http://localhost:5174
API Docs: http://localhost:5174/api/docs

Notes

- Make sure you don't have the old Vue/Vetur vs code plugin installed, but the new ones only: "Vue.volar", "Vue.vscode-typescript-vue-plugin"

### Frontend (Vue)

- `cd apps/frontend-vue && yarn dev`

Visit: http://localhost:5173/about
API Docs: http://localhost:5173/api/docs

Notes

- Make sure you don't have the old Vue/Vetur vs code plugin installed, but the new ones only: "Vue.volar", "Vue.vscode-typescript-vue-plugin"
