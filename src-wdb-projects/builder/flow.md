### global-libs

- global-libs

###

- each project
- each version

- each resource

  - glob find all `src/**/*.content.ts`, `src/**/*.meta.ts` SHOULD BE exists & validate format in meta info
  - esbuild `src/**/*.content.ts` -> `dist/**/*.content.js`
  - fill the full infos into meta (`project`, `version`, `fullId`, `content hash`), and generate `src/**/*.meta.ts` -> `dist/**/*.meta.json`.

- summary file
