# Deployment

Two deployment options: manual or automated via GitHub Actions.

## Manual Deployment

### Prerequisites

- Firebase CLI installed and logged in
- `config.js` configured with production values
- Code tested locally

### Steps

**1. Build for production:**

```bash
npm run build
```

Vite creates optimized bundle in `/dist` folder.

**2. Preview build locally:**

```bash
npm run preview
```

Test at `http://localhost:4173` - verify map loads, filters work, no console errors.

**3. Deploy to Firebase:**

```bash
firebase deploy --only hosting
```

Uploads `/dist` folder to Firebase CDN. New version goes live immediately.

**4. Verify deployment:**

Visit production URL and test:

- Map loads with neighborhoods
- Filters and search work
- Details panel shows data
- Mobile responsive layout
- No console errors

**5. Tag release (optional):**

```bash
git tag -a v1.0.0 -m "Description"
git push origin v1.0.0
```

### Rollback

If deployment has issues:

**Option 1 - Firebase Console:**

1. Go to [Firebase Console](https://console.firebase.google.com/) → Hosting
2. Click **Release history**
3. Find previous version → **⋮** → **Rollback**

**Option 2 - Deploy previous version:**

```bash
git checkout v1.0.0
npm install
npm run build
firebase deploy --only hosting
```

### Troubleshooting

**Build fails:**

```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

**Deployment fails (403 Forbidden):**

```bash
firebase logout
firebase login
firebase deploy
```

**Site not updating:**

- Hard refresh: Ctrl+Shift+R
- Wait 5-10 minutes for CDN propagation
- Test in incognito mode

## Automated Deployment (CI/CD)

Automatically deploy to Firebase when pushing to `main` branch.

### Setup

**1. Generate Firebase token:**

```bash
firebase login:ci
```

Copy the token from terminal output.

**2. Add secrets to GitHub:**

Go to GitHub repository → Settings → Secrets and variables → Actions

Add two secrets:

- `FIREBASE_TOKEN` - Token from step 1
- `MAPBOX_ACCESS_TOKEN` - Your production Mapbox token

**3. Workflow file already exists:**

The repository includes `.github/workflows/deploy.yml` which:

- Triggers on push to `main` branch
- Runs `npm ci` to install dependencies
- Creates `config.js` with Mapbox token from secrets and Wix Client ID
- Runs `npm run build`
- Deploys to Firebase Hosting

**4. Verify workflow:**

Push a change to `main`:

```bash
git add .
git commit -m "Test deployment"
git push origin main
```

Monitor at: GitHub → Actions tab

### Workflow Structure

```yaml
on:
  push:
    branches: [main]
  workflow_dispatch:  # Manual trigger

jobs:
  build_and_deploy:
    runs-on: ubuntu-latest
    steps:
      - Checkout code
      - Setup Node.js 18
      - Install dependencies
      - Create config.js (with Mapbox token + Wix Client ID)
      - Build project
      - Deploy to Firebase
```

### Monitoring

**View logs:**

1. GitHub → Actions tab
2. Click workflow run
3. Expand steps to debug

**Check deployment:**

- ✅ Green checkmark = success
- ❌ Red X = failure (check logs)

### CI/CD Troubleshooting

**Firebase deploy fails (permission error):**

Token expired. Generate new token:

```bash
firebase login:ci
```

Update `FIREBASE_TOKEN` secret in GitHub.

**Build fails (missing config.js):**

Check `MAPBOX_ACCESS_TOKEN` secret is set in GitHub.

**Workflow doesn't trigger:**

- Verify pushing to `main` branch (not `master`)
- Check `.github/workflows/deploy.yml` exists
- Validate YAML syntax

### Rollback with CI/CD

**Option 1 - Revert commit:**

```bash
git revert HEAD
git push origin main
```

Triggers automatic deployment with previous code.

**Option 2 - Firebase Console:**

Use rollback from Firebase Console (see Manual Deployment section).

## Deployment Checklist

Before every deployment:

- [ ] Code tested locally
- [ ] Production `config.js` configured
- [ ] Build successful (`npm run build`)
- [ ] Preview tested (`npm run preview`)
- [ ] No console errors
- [ ] All changes committed to Git

## Security Checklist

- [ ] `config.js` not committed to Git
- [ ] Mapbox token has URL restrictions
- [ ] postMessage origins restricted to production domains
- [ ] No console.log() with sensitive data
- [ ] No hardcoded passwords or secrets

## Firebase Hosting Limits

**Free tier:**

- 10 GB storage
- 360 MB/day bandwidth
- 1 GB/month bandwidth

Monitor usage: Firebase Console → Usage tab

## Quick Reference

### Manual Deployment Flow

```bash
1. git pull
2. npm install
3. npm run build
4. npm run preview  # Test locally
5. firebase deploy --only hosting
6. Test production URL
7. git tag vX.X.X && git push --tags
```

### Automated Deployment Flow

```bash
1. Make changes
2. git add . && git commit -m "message"
3. git push origin main
4. GitHub Actions builds and deploys automatically
5. Monitor at GitHub → Actions tab
```

### Essential Commands

```bash
# Build for production
npm run build

# Preview build locally
npm run preview

# Manual deploy
firebase deploy --only hosting

# View deployment history
firebase hosting:releases:list

# Generate CI token
firebase login:ci
```
