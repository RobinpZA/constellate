# Getting started

Setting up the repository from the exported files on Windows with PowerShell.

## Prerequisites

| Tool | Install | Check |
| --- | --- | --- |
| Git | `winget install --id Git.Git -e` | `git --version` |
| GitHub CLI | `winget install --id GitHub.cli -e` | `gh --version` |
| Node.js 18+ | `winget install --id OpenJS.NodeJS.LTS -e` | `node --version` |

Node is only needed for the validator and local server. The site itself has no build step.

Sign the GitHub CLI in once:

```powershell
gh auth login
```

## 1. Create the local repository

Extract the zip, then from inside the folder:

```powershell
Set-Location "$HOME\source\constellate"   # wherever you extracted it
git init -b main
git add .
git commit -m "Initial commit: Constellate prototype"
npm run validate
```

## 2. Create the GitHub repository and push

Personal account:

```powershell
gh repo create constellate --private --source . --remote origin --push `
  --description "Constellate: an interactive star chart of Microsoft 365 services, licensing and docs"
```

Organisation account (for example, an enterprise org):

```powershell
gh repo create <org-name>/constellate --private --source . --remote origin --push
```

> [!NOTE]
> GitHub Pages on a private repository needs a paid plan (Pro, Team or Enterprise). On a free personal account, either make the repo public or skip Pages and share the files directly.

### Mirroring to a second remote

If you keep a copy in both a personal and an enterprise account:

```powershell
git remote add enterprise https://github.com/<org-name>/constellate.git
git push enterprise main
```

To push to both with one command, add a second push URL to `origin`:

```powershell
git remote set-url --add --push origin https://github.com/<your-account>/constellate.git
git remote set-url --add --push origin https://github.com/<org-name>/constellate.git
git push origin main
```

## 3. Turn on GitHub Pages

```powershell
gh api -X POST "repos/{owner}/{repo}/pages" -f build_type=workflow
```

Or in the browser: **Settings → Pages → Source → GitHub Actions**.

Then trigger the first deployment:

```powershell
gh workflow run pages.yml
gh run watch
```

The site URL appears in the run output and under **Settings → Pages**.

## 4. Create labels used by the workflows

```powershell
gh label create data  --color 8FB3FF --description "Content in data/services.js"
gh label create links --color FF8B7B --description "Broken or moved documentation links"
```

## 5. Protect `main` (optional)

Require the validator to pass before merging:

```powershell
gh api -X PUT "repos/{owner}/{repo}/branches/main/protection" `
  -H "Accept: application/vnd.github+json" `
  --input - @"
{
  "required_status_checks": { "strict": true, "contexts": ["validate"] },
  "enforce_admins": false,
  "required_pull_request_reviews": null,
  "restrictions": null
}
"@
```

## Day-to-day

```powershell
git switch -c data/<short-description>
# edit data/services.js
npm run validate
npm start                      # check it in the browser
git commit -am "Update <item>"
git push -u origin HEAD
gh pr create --fill
```
