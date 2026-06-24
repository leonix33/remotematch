# Contributing / Git workflow

Use a **feature branch** for every change. Do not commit directly to `main`.

## Standard flow

```bash
git checkout main && git pull origin main
git checkout -b feat/short-description

# edit, then stage source files only
git add path/to/files
git commit -m "Why this change exists."

git push -u origin feat/short-description

git checkout main && git pull origin main
git merge feat/short-description
git push origin main

git branch -d feat/short-description
```

## Branch prefixes

- `feat/` — new features
- `fix/` — bug fixes
- `chore/` — docs, tooling, config
- `refactor/` — structure only

## Do not commit

- `.env`, `node_modules/`, `dist/`
- `*.log`

## Related repo

Python job agent lives in [remote-job-agent](https://github.com/leonix33/remote-job-agent) — same branch → main workflow.
