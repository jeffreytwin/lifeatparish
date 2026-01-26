# Project Handover Guide

**Project:** Parrish Map - Interactive Neighborhood Explorer
**Live URL:** <https://lifeatparrish.web.app>
**Last Updated:** October 2025

This document guides you through taking ownership of the Parrish Map application, including GitHub repository, Firebase hosting, and ongoing maintenance.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Taking Ownership](#taking-ownership)
3. [GitHub Repository](#github-repository)
4. [Firebase Hosting](#firebase-hosting)
5. [GitHub Actions (CI/CD)](#github-actions-cicd)
6. [Configuration Management](#configuration-management)
7. [Deployment Guide](#deployment-guide)
8. [Updating Content](#updating-content)
9. [Monitoring & Analytics](#monitoring--analytics)
10. [Cost & Usage](#cost--usage)
11. [Troubleshooting](#troubleshooting)
12. [Support & Resources](#support--resources)

---

## Project Overview

### What is Parrish Map?

An interactive web application that helps home buyers explore neighborhoods in Parrish, FL. Users can:

- View neighborhood boundaries on an interactive map
- Filter by price, bedrooms, bathrooms, home type
- Search for specific neighborhoods
- View details about each community (homes for sale, amenities, floor plans)
- Access on desktop and mobile devices

### Technology Stack

- **Frontend:** Vanilla JavaScript (ES modules), Tailwind CSS v4
- **Map:** Mapbox GL JS (interactive vector maps)
- **Data:** Wix Data API (neighborhoods, houses, floor plans)
- **Build:** Vite (development server and production builds)
- **Hosting:** Firebase Hosting (CDN-backed static hosting)
- **CI/CD:** GitHub Actions (automated deployments)

### Key Features

- Real-time data from Wix CMS
- GeoJSON-based neighborhood boundaries
- Responsive design (mobile, tablet, desktop)
- Automated deployments on code changes
- Fast CDN delivery via Firebase

---

## Taking Ownership

### Prerequisites

You'll need accounts for:

- **Google Account** (for Firebase access)
- **GitHub Account** (for code repository access)
- **Wix Account** (if you need to modify data collections)
- **Mapbox Account** (if you need to change map settings)

### Ownership Transfer Checklist

- [ ] Accept GitHub repository ownership/collaboration invite
- [ ] Accept Firebase project ownership invite
- [ ] Verify access to Firebase Console
- [ ] Verify access to GitHub repository
- [ ] Review GitHub Secrets configuration
- [ ] Test manual deployment (optional)
- [ ] Review Wix data collections (optional)
- [ ] Set up billing alerts (recommended)

---

## GitHub Repository

### Repository Details

- **Repository:** <https://github.com/Muthanga-Shem/lifeatparish>
- **Default Branch:** `main`
- **Deployment:** Automatic on push to `main`

### Accepting Repository Access

1. Check your email for GitHub invitation
2. Click **Accept invitation** link
3. You'll be added as a collaborator or owner
4. Visit the repository URL to confirm access

### Repository Structure

```
parrish-map/
├── .github/
│   └── workflows/
│       └── deploy.yml          # CI/CD automation
├── docs/                       # Documentation
│   ├── architecture.md         # Technical architecture
│   ├── deployment.md           # Deployment guide
│   ├── maintenance.md          # Maintenance & troubleshooting
│   ├── reference.md            # Quick reference
│   └── setup.md                # Local development setup
├── public/
│   └── config.js               # Configuration (Mapbox, Wix)
├── src/
│   ├── assets/
│   │   ├── css/                # Styles
│   │   └── js/
│   │       ├── main.js         # Application entry point
│   │       └── modules/        # Modular JavaScript
│   └── index.html              # HTML template
├── .firebaserc                 # Firebase project config
├── firebase.json               # Firebase hosting config
├── package.json                # Dependencies
└── vite.config.js              # Build configuration
```

### Important Files

| File | Purpose | Edit? |
|------|---------|-------|
| `public/config.js` | Mapbox token, Wix Client ID | Rarely |
| `.github/workflows/deploy.yml` | CI/CD automation | Rarely |
| `.firebaserc` | Firebase project ID | No |
| `firebase.json` | Hosting configuration | Rarely |
| `docs/` | All documentation | When needed |

### Cloning Repository Locally

```bash
# Clone repository
git clone https://github.com/Muthanga-Shem/lifeatparish.git
cd lifeatparish

# Install dependencies
npm install

# Copy config template
cp config.example.js public/config.js

# Edit public/config.js with your Mapbox token (if needed)

# Start development server
npm run dev

# Visit http://localhost:5173
```

---

## Firebase Hosting

### Firebase Project Details

- **Project Name:** lifeatparrish
- **Project ID:** `lifeatparrish`
- **Hosting URL:** <https://lifeatparrish.web.app>
- **Console:** <https://console.firebase.google.com/project/lifeatparrish>

### Accepting Firebase Ownership

1. Check your email for Firebase invitation
2. Click **Accept invitation** link
3. You'll be added as Owner to the project
4. Visit Firebase Console to confirm access

### What You Can Do in Firebase Console

**Hosting (Main Tab):**

- View deployment history
- See current live version
- Rollback to previous versions
- Monitor bandwidth usage
- Add custom domain

**Usage & Billing:**

- Monitor monthly usage
- Set up billing alerts
- View cost breakdown
- Upgrade plan if needed

**Settings:**

- Manage team members
- Generate service accounts
- View project details
- Configure integrations

### Firebase Hosting Features

- **CDN:** Global content delivery network
- **SSL:** Automatic HTTPS certificates
- **Rollback:** Easy revert to previous versions
- **Preview:** Test deployments before going live
- **Analytics:** Track page views and performance

---

## GitHub Actions (CI/CD)

### How Automated Deployment Works

Every time you push code to the `main` branch:

1. **GitHub Actions triggers** (within seconds)
2. **Workflow runs** (2-3 minutes):
   - Installs dependencies
   - Creates `config.js` with secrets
   - Builds production bundle
   - Deploys to Firebase Hosting
3. **Site updates** automatically
4. **Email notification** sent on success/failure

### Viewing Deployment Status

1. Go to repository: <https://github.com/Muthanga-Shem/lifeatparish>
2. Click **Actions** tab
3. See list of workflow runs
4. Click any run to view detailed logs

**Status Indicators:**

- 🟢 Green checkmark = Success
- 🔴 Red X = Failed (check logs)
- 🟡 Yellow circle = Running

### Workflow File Location

`.github/workflows/deploy.yml`

**Do not edit unless necessary** - it's preconfigured and working.

### Manual Workflow Trigger

You can trigger deployment without pushing code:

1. Go to **Actions** tab
2. Click **Deploy to Firebase Hosting** (left sidebar)
3. Click **Run workflow** button
4. Select branch: `main`
5. Click **Run workflow**

---

## Configuration Management

### GitHub Secrets

GitHub Secrets store sensitive credentials securely. Your repository has:

| Secret Name | Purpose | How to Get |
|-------------|---------|------------|
| `FIREBASE_SERVICE_ACCOUNT` | Firebase deployment authentication | Firebase Console → Settings → Service accounts → Generate key |
| `MAPBOX_ACCESS_TOKEN` | Map rendering | Mapbox Account → Access tokens |
| `GITHUB_TOKEN` | Automatic (provided by GitHub) | N/A |

### Viewing GitHub Secrets

1. Go to repository → **Settings**
2. **Secrets and variables** → **Actions**
3. See list of secrets (values are hidden)

### Updating Secrets

**If Firebase deployment fails:**

1. Go to [Firebase Console](https://console.firebase.google.com/project/lifeatparrish)
2. **⚙️ Settings** → **Service accounts**
3. Click **Generate new private key**
4. Download JSON file
5. Go to GitHub → Settings → Secrets → Actions
6. Click **FIREBASE_SERVICE_ACCOUNT** → **Update secret**
7. Paste entire JSON content → **Update secret**

**If map doesn't load:**

1. Go to [Mapbox Account](https://account.mapbox.com/access-tokens/)
2. Copy your token (starts with `pk.`)
3. Go to GitHub → Settings → Secrets → Actions
4. Click **MAPBOX_ACCESS_TOKEN** → **Update secret**
5. Paste token → **Update secret**

### Local Configuration (`public/config.js`)

This file is **NOT** committed to Git (it's in `.gitignore`).

**For local development:**

```javascript
window.config = {
    mapboxAccessToken: 'pk.your-token-here',
    wixClientId: '7cbe278c-f794-4ac6-8261-404022bb5625',
    appName: 'Parrish Map',
    appVersion: '1.0.0',
};
```

**For production deployment:**

GitHub Actions creates this file automatically using secrets.

---

## Deployment Guide

### Automated Deployment (Recommended)

**Simply push to `main` branch:**

```bash
# Make changes to code
git add .
git commit -m "Description of changes"
git push origin main

# GitHub Actions automatically builds and deploys
# Check Actions tab for status
# Site updates in 2-3 minutes
```

### Manual Deployment

**If you need to deploy manually:**

1. **Install Firebase CLI** (one-time):

   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase:**

   ```bash
   firebase login
   ```

3. **Build the project:**

   ```bash
   npm run build
   ```

4. **Deploy to Firebase:**

   ```bash
   firebase deploy --only hosting
   ```

5. **Verify deployment:**
   - Visit: <https://lifeatparrish.web.app>
   - Test map, filters, search

### Rolling Back a Deployment

**If new deployment has issues:**

**Option 1 - Firebase Console:**

1. Go to Firebase Console → Hosting
2. Click **Release history**
3. Find previous working version
4. Click **⋮** → **Rollback**

**Option 2 - Git:**

```bash
# Revert last commit
git revert HEAD
git push origin main

# This triggers automatic deployment of previous version
```

### Deployment Checklist

Before deploying major changes:

- [ ] Test locally with `npm run dev`
- [ ] Build succeeds with `npm run build`
- [ ] Preview works with `npm run preview`
- [ ] No console errors in browser
- [ ] Mobile layout works
- [ ] All filters work
- [ ] Map loads correctly

---

## Updating Content

### Updating Neighborhood Boundaries (GeoJSON)

**Neighborhood polygons are stored in Wix Media Manager.**

**Current URL:** Configured in `src/assets/js/modules/map.js`

```javascript
export async function fetchNeighborhoodGeojson() {
  const response = await fetch('https://d4ab3c8b-a6bd-41c2-be01-9df7d7d13631.usrfiles.com/ugd/d4ab3c_2ee50ed343dc4840ad74e76c82c08883.json');
  return await response.json();
}
```

**To update:**

1. **Edit GeoJSON file** using [geojson.io](https://geojson.io)
2. **Save as** `neighborhoods.geojson.json` (Wix requires `.json` extension)
3. **Upload to Wix Media Manager:**
   - Go to Wix Dashboard → Media Manager
   - Replace existing file with same filename
   - Keep the same filename to avoid code changes
4. **Map updates automatically** - no code changes needed

**GeoJSON Requirements:**

- Must be valid GeoJSON (validate at [geojsonlint.com](https://geojsonlint.com))
- Each feature needs `neighborhood` property
- Polygon coordinates in `[longitude, latitude]` format

**Example:**

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Polygon",
        "coordinates": [[
          [-82.51234, 27.58123],
          [-82.51456, 27.58234],
          [-82.51234, 27.58123]
        ]]
      },
      "properties": {
        "neighborhood": "Silverleaf"
      }
    }
  ]
}
```

### Updating Wix Data

**Three Wix collections power the application:**

**1. Neighborhoods Collection:**

- `title` - Neighborhood name (must match GeoJSON)
- `amenitiesTags` - Array of amenities
- `description`, `websiteUrl`, `floorPlansUrl`, `tourUrl`

**2. HousesforSale Collection:**

- `village` - Neighborhood name
- `listingPrice`, `bedrooms`, `bathrooms`, `homeType`
- `squareFeet`, `address`, `imageUrl`, `listingUrl`

**3. FloorPlans Collection:**

- `villages` - Neighborhood name
- `planName`, `bedrooms`, `bathrooms`, `squareFeet`
- `floorPlanUrl`

**To edit Wix data:**

1. Go to [Wix Dashboard](https://www.wix.com/)
2. Select your site
3. **Content Manager** → Select collection
4. Edit, add, or delete items
5. Changes appear on map immediately (data fetched in real-time)

**Name Matching Important:**

GeoJSON `neighborhood` property must match Wix data `village`/`title` fields (case-insensitive).

**If names don't match**, add mapping in `src/assets/js/modules/map.js`:

```javascript
const NEIGHBORHOOD_NAME_MAPPING = {
  'Oakfield': 'Oakfield Lakes',
  'Del Webb BayView': 'Del Webb at Bayview',
};
```

### Updating Mapbox Token

**If you need a new Mapbox token:**

1. Go to [Mapbox Account](https://account.mapbox.com/access-tokens/)
2. Create new token or copy existing
3. Update in **two places:**

**For local development:**
Edit `public/config.js`:

```javascript
window.config = {
  mapboxAccessToken: 'pk.NEW_TOKEN_HERE',
  // ...
};
```

**For production deployment:**
Update GitHub Secret (see [Configuration Management](#configuration-management))

---

## Monitoring & Analytics

### Firebase Hosting Metrics

**View in Firebase Console → Hosting:**

- **Requests:** Page views over time
- **Bandwidth:** Data transferred
- **Response Time:** Performance metrics
- **Geography:** Where users are located

### Mapbox Usage

**View at [Mapbox Account](https://account.mapbox.com/):**

- **Map Loads:** Monthly count (50,000 free)
- **API Requests:** Geocoding, directions, etc.
- **Overage:** Additional charges if limits exceeded

### Setting Up Alerts

**Firebase Billing Alert:**

1. Firebase Console → **⚙️** → **Usage and billing**
2. Click **Details & settings**
3. **Set budget alert**
4. Enter amount (e.g., $10)
5. Add email for notifications

**Mapbox Usage Alert:**

1. Mapbox Account → **Usage**
2. Enable email notifications
3. Get alerted at 75%, 90%, 100% of free tier

### Performance Monitoring

**Check site performance:**

1. Open DevTools (F12) → **Network** tab
2. Reload page
3. Check load time (should be < 3 seconds)
4. Check total size (should be < 2 MB)

**Run Lighthouse audit:**

1. Open DevTools → **Lighthouse** tab
2. Click **Generate report**
3. Review Performance, Accessibility, Best Practices scores
4. Aim for 90+ in all categories

---

## Cost & Usage

### Free Tier Limits

**Firebase Hosting (Free Spark Plan):**

- ✅ 10 GB storage
- ✅ 360 MB/day bandwidth
- ✅ Custom domain (1 free)
- ✅ SSL certificates
- **Overage:** Automatic upgrade to paid plan or service stops

**Mapbox (Free Tier):**

- ✅ 50,000 map loads/month
- ✅ Unlimited zoom/pan (no extra cost)
- **Overage:** $5 per 1,000 additional loads

**Wix (Depends on your plan):**

- Varies based on Wix subscription
- Business plan required for API access

### Expected Monthly Costs

**Typical small business usage:**

| Service | Free Tier | Expected Usage | Cost |
|---------|-----------|----------------|------|
| Firebase Hosting | 360 MB/day | 100-200 MB/day | $0 |
| Mapbox | 50,000 loads | 5,000-15,000 | $0 |
| **Total** | | | **$0/month** |

**High traffic scenario (1,000 visitors/day):**

| Service | Free Tier | Expected Usage | Cost |
|---------|-----------|----------------|------|
| Firebase Hosting | 360 MB/day | 300 MB/day | $0 |
| Mapbox | 50,000 loads | 30,000/month | $0 |
| **Total** | | | **$0/month** |

**Overage scenario:**

If you exceed 50,000 map loads:

- 60,000 loads = 10,000 overage
- Cost: 10,000 ÷ 1,000 × $5 = **$50**

### Cost Optimization Tips

1. **Enable caching** - Already configured
2. **Optimize images** - Use WebP format
3. **Monitor usage weekly** - Set up alerts
4. **Use CDN effectively** - Served from nearest location
5. **Lazy load data** - Only fetch when needed

### Upgrading Plans

**When to upgrade Firebase:**

- Consistently hitting bandwidth limits
- Need more storage
- Want advanced features

**When to upgrade Mapbox:**

- Exceeding 50,000 loads/month regularly
- Need higher rate limits
- Want premium map styles

---

## Troubleshooting

### Common Issues

**Map not loading:**

1. Check Mapbox token is valid
2. Verify token URL restrictions allow your domain
3. Check browser console for errors
4. Try in incognito mode (clear cache)

**Solution:**

```bash
# Check token in browser console
console.log(window.config.mapboxAccessToken)

# Should start with 'pk.'
```

**No neighborhoods showing:**

1. Check GeoJSON URL is accessible
2. Verify file uploaded to Wix Media Manager
3. Validate GeoJSON syntax

**Solution:**

```bash
# Test GeoJSON URL in browser
# Should return JSON data
```

**Wix data not loading:**

1. Check Wix collections exist
2. Verify collection names match code
3. Check OAuth Client ID is correct

**Solution:**

```javascript
// Check in browser console
console.log(window.config.wixClientId)
```

**GitHub Actions fails:**

1. Check secrets are set correctly
2. Verify Firebase service account is valid
3. Review workflow logs in Actions tab

**Solution:**

- Regenerate Firebase service account
- Update GitHub secret
- Re-run workflow

**Deployment succeeds but site doesn't update:**

1. Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
2. Try incognito/private mode
3. Wait 5-10 minutes for CDN propagation
4. Check Firebase Console for deployment time

**Mobile layout broken:**

1. Check viewport meta tag in `index.html`
2. Test at different breakpoints
3. Verify `mobile.css` is imported

**Solution:**

```html
<!-- Should be in index.html -->
<meta name="viewport" content="width=device-width, initial-scale=1.0">
```

### Getting Help

**Documentation:**

- Check `docs/` folder in repository
- `docs/maintenance.md` - Detailed troubleshooting
- `docs/reference.md` - Quick reference
- `docs/setup.md` - Local development

**External Resources:**

- [Mapbox GL JS Docs](https://docs.mapbox.com/mapbox-gl-js/)
- [Firebase Hosting Docs](https://firebase.google.com/docs/hosting)
- [Wix SDK Docs](https://dev.wix.com/docs/sdk)
- [Vite Docs](https://vitejs.dev/)

**Community Support:**

- [Mapbox Community](https://community.mapbox.com/)
- [Firebase Discord](https://discord.gg/firebase)
- [Stack Overflow](https://stackoverflow.com/) - Tag questions with `mapbox`, `firebase`, `vite`

---

## Support & Resources

### Quick Reference

**Important URLs:**

| Resource | URL |
|----------|-----|
| Live Site | <https://lifeatparrish.web.app> |
| GitHub Repo | <https://github.com/Muthanga-Shem/lifeatparish> |
| Firebase Console | <https://console.firebase.google.com/project/lifeatparrish> |
| Mapbox Account | <https://account.mapbox.com/> |
| Wix Dashboard | <https://www.wix.com/dashboard> |

**Important Commands:**

```bash
# Local development
npm install          # Install dependencies
npm run dev          # Start dev server (http://localhost:5173)
npm run build        # Build for production
npm run preview      # Preview production build

# Deployment
git push origin main           # Trigger automated deployment
firebase deploy --only hosting # Manual deployment

# Maintenance
firebase login                 # Authenticate Firebase CLI
firebase projects:list         # List Firebase projects
```

### Maintenance Schedule

**Weekly:**

- [ ] Check Firebase usage metrics
- [ ] Monitor Mapbox map loads
- [ ] Review GitHub Actions for failed deployments

**Monthly:**

- [ ] Review Wix data for accuracy
- [ ] Check for npm package updates
- [ ] Review Firebase bandwidth usage
- [ ] Check Mapbox usage against free tier

**Quarterly:**

- [ ] Audit GeoJSON for boundary accuracy
- [ ] Review and update documentation
- [ ] Security audit (update dependencies)
- [ ] Performance testing

**Annually:**

- [ ] Review hosting costs vs alternatives
- [ ] Update Node.js version if needed
- [ ] Refresh Mapbox token (for security)
- [ ] Backup all data

### Security Best Practices

- [ ] Never commit `public/config.js` to Git
- [ ] Keep GitHub Secrets secure
- [ ] Regenerate service accounts annually
- [ ] Monitor Firebase Console for unauthorized access
- [ ] Use URL restrictions on Mapbox tokens
- [ ] Keep dependencies updated (`npm audit`)

### Contact Previous Developer

If you need clarification on implementation details:

**Handover Contact:**

- Name: [Your name]
- Email: [Your email]
- Available until: [Date]

---

## Handover Completion Checklist

### Before Going Live

- [ ] GitHub repository access confirmed
- [ ] Firebase project ownership transferred
- [ ] GitHub Secrets verified
- [ ] Test automated deployment (push to main)
- [ ] Verify live site works correctly
- [ ] Review all documentation
- [ ] Set up billing alerts
- [ ] Save all login credentials securely

### Understanding Verification

- [ ] I understand how automated deployment works
- [ ] I know how to view deployment logs
- [ ] I can access Firebase Console
- [ ] I can access GitHub repository
- [ ] I know how to update GeoJSON boundaries
- [ ] I understand cost structure and limits
- [ ] I know where to find troubleshooting docs
- [ ] I have contact info for questions

### Post-Handover

- [ ] Test making a small code change and deploying
- [ ] Verify rollback process works
- [ ] Set up monitoring and alerts
- [ ] Bookmark important URLs
- [ ] Save this document for future reference

---

**Handover Date:** _________________

**Client Signature:** _________________

**Developer Signature:** _________________

---

## Appendix: Useful Code Snippets

### Testing if Map is Working

Open browser console (F12) and run:

```javascript
// Check if Mapbox loaded
console.log(typeof mapboxgl !== 'undefined' ? '✓ Mapbox loaded' : '✗ Mapbox failed');

// Check if config exists
console.log(window.config ? '✓ Config loaded' : '✗ Config missing');

// Check if neighborhoods loaded
console.log(map.getSource('neighborhoods') ? '✓ Neighborhoods loaded' : '✗ No neighborhoods');
```

### Checking Wix Connection

```javascript
// In browser console
// Should show array of items
console.log(await wixClient.items.query('HousesforSale').limit(5).find());
```

### Validating GeoJSON

```bash
# Using curl
curl -o neighborhoods.json https://your-geojson-url.com/file.json

# Validate at geojsonlint.com or use jq
cat neighborhoods.json | jq '.'
```

### Force Clear Browser Cache

```javascript
// In browser console
caches.keys().then(keys => keys.forEach(key => caches.delete(key)));
location.reload(true);
```

---

**End of Handover Document**

For questions or issues, refer to the documentation in the `docs/` folder or contact the previous developer during the transition period.
