# ⚠️ Rename this folder to `.github`

Replit's GitHub integration cannot write to the `.github` folder directly,
so this folder was committed as `_github` instead.

## Steps to activate GitHub Actions

1. Push this repository to GitHub (Replit will commit and push `_github/` for you).
2. On GitHub, open your repository and go to **Code**.
3. Click the pencil (edit) icon on any file inside `_github/workflows/deploy.yml`
   — this puts GitHub's file editor into edit mode.
4. In the file path at the top, change `_github` → `.github` and save/commit.
   GitHub will automatically create the `.github/workflows/` folder structure.
5. Alternatively, clone the repo locally, rename the folder with:
   ```bash
   mv _github .github
   git add .github _github
   git commit -m "activate GitHub Actions"
   git push
   ```
6. Once `.github/workflows/deploy.yml` exists, go to your repo **Settings →
   Pages** and set:
   - **Source**: GitHub Actions
7. Any push to `main` will now automatically build and deploy DynoGo.

## What the workflow does

- Installs pnpm + Node.js 24
- Runs `pnpm --filter @workspace/dynago run build` with `BASE_PATH=/`
  so all assets are served from the site root
- Uploads `artifacts/dynago/dist/public/` directly to GitHub Pages
- Your site will be live at `https://<your-username>.github.io/<repo-name>/`
