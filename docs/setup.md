# Setup

Complete setup guide from installation to first run.

## Prerequisites

**Required Software:**

- **Node.js 18+** - Check: `node --version` - Install: [nodejs.org](https://nodejs.org/)
- **npm 9+** - Comes with Node.js - Check: `npm --version`
- **Git** - Check: `git --version` - Install: [git-scm.com](https://git-scm.com/)

**Required Accounts:**

- **Mapbox** - [mapbox.com/signup](https://www.mapbox.com/signup/) - Free tier: 50,000 map views/month
- **Wix** - Admin access to Life at Parrish site - Paid plan required for Data API
- **Firebase** - [firebase.google.com](https://firebase.google.com/) - Free Spark plan sufficient
- **Google Account** - For Firebase

## Local Development Setup

**1. Clone repository:**

```bash
git clone <repository-url>
cd parrish-map
```

**2. Install dependencies:**

```bash
npm install
```

Wait 1-3 minutes for packages to download.

**3. Configure application:**

```bash
cp config.example.js config.js
```

Edit `config.js` and add your tokens:

```javascript
window.config = {
  mapboxAccessToken: 'pk.your-mapbox-token-here',
  wixClientId: '7cbe278c-f794-4ac6-8261-404022bb5625',
  appName: 'Parrish Map'
};
```

**4. Start development server:**

```bash
npm run dev
```

**5. Open browser:**

```
http://localhost:5173
```

You should see the map with neighborhood polygons.

### Available Commands

```bash
npm run dev      # Start dev server (http://localhost:5173)
npm run build    # Build for production (outputs to /dist)
npm run preview  # Preview production build (http://localhost:4173)
```

### Testing on Mobile

```bash
npm run dev -- --host
```

Find your local IP:

- Windows: `ipconfig`
- Mac/Linux: `ifconfig`

Access from phone: `http://YOUR-IP:5173`

## Mapbox Configuration

### Get Access Token

**1. Create account:**

- Go to [mapbox.com/signup](https://www.mapbox.com/signup/)
- Verify email
- Add payment method (free tier won't charge)

**2. Get token:**

- Login to [account.mapbox.com](https://account.mapbox.com/)
- Navigate to **Access Tokens**
- Copy the **Default public token** (starts with `pk.`)

**3. Add to config.js:**

```javascript
window.config = {
  mapboxAccessToken: 'pk.eyJ1Ijoiam9obmRvZSIsImEiOiJjbGV4YW1wbGUifQ.example',
};
```

**4. Test:**

```bash
npm run dev
```

Map should load with streets/terrain.

### URL Restrictions (Production)

Protect your token from abuse:

1. Go to [account.mapbox.com/access-tokens](https://account.mapbox.com/access-tokens/)
2. Click your token
3. Scroll to **Token restrictions** → **URL restrictions**
4. Add allowed URLs:

**Development:**

```
http://localhost:*
```

**Production:**

```
https://www.lifeatparrish.com/*
https://lifeatparrish.com/*
https://your-firebase-project.web.app/*
```

5. Click **Update token**

### Monitor Usage

Check usage at [account.mapbox.com](https://account.mapbox.com/):

- Map loads: 50,000/month free
- Each page view = 1 load
- Zoom/pan = no additional load
- Overage: $5 per 1,000 additional loads

## Wix Configuration

### Collections

The app fetches data from three Wix collections:

**1. Neighborhoods** - Community info

- `title` - Neighborhood name (must match GeoJSON)
- `amenitiesTags` - Array of amenities

**2. HousesforSale** - Listings

- `village` - Neighborhood name
- `listingPrice` / `listingPricePure` - Price
- `bedrooms`, `bathrooms`, `homeType`, `garages`

**3. FloorPlans** - New construction

- `villages` - Neighborhood name

### OAuth Client ID

Configured in `config.js`:

```javascript
window.config = {
  wixClientId: '7cbe278c-f794-4ac6-8261-404022bb5625'
};
```

**To use different Wix site:**

1. Go to [dev.wix.com](https://dev.wix.com/)
2. Create new app
3. Configure OAuth with "Read Data" permissions
4. Copy Client ID
5. Update in `config.js`

### Data Linking

GeoJSON polygons link to Wix data by neighborhood name:

**GeoJSON:**

```json
{
  "properties": {
    "neighborhood": "Silverleaf"
  }
}
```

**Wix:**

- `Neighborhoods.title` = "Silverleaf"
- `HousesforSale.village` = "Silverleaf"
- `FloorPlans.villages` = "Silverleaf"

Names must match exactly (case-insensitive).

### Name Mapping

For inconsistent naming, update mapping in `src/assets/js/modules/map.js`:

```javascript
const NEIGHBORHOOD_NAME_MAPPING = {
  'Oakfield': 'Oakfield Lakes',
  'Del Webb BayView': 'Del Webb at Bayview',
};
```

### Verify Wix Connection

Check browser console after `npm run dev`:

```
Loaded X neighborhoods from Wix
Loaded Y houses for sale
Loaded Z neighborhoods with new construction
```

## Firebase Configuration

### Create Project

**1. Create Firebase project:**

- Go to [console.firebase.google.com](https://console.firebase.google.com/)
- Click **Add project**
- Enter name: "Parrish Map"
- Disable Google Analytics (optional)
- Click **Create project**

**2. Install Firebase CLI:**

```bash
npm install -g firebase-tools
```

Verify: `firebase --version` (should be 13.0.0+)

**3. Login:**

```bash
firebase login
```

Browser opens for authentication.

### Initialize Hosting

**1. Navigate to project:**

```bash
cd parrish-map
```

**2. Initialize:**

```bash
firebase init hosting
```

**3. Answer prompts:**

- Features: **Hosting**
- Project: **Use existing project** → Select your project
- Public directory: **dist** (important!)
- Single-page app: **No**
- GitHub deploys: **No** (we'll use GitHub Actions)
- Overwrite files: **No**

**4. Verify `firebase.json` created:**

```json
{
  "hosting": {
    "public": "dist",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"]
  }
}
```

### Test Deployment

**1. Build project:**

```bash
npm run build
```

**2. Deploy:**

```bash
firebase deploy --only hosting
```

**3. Visit your site:**

Copy the Hosting URL from terminal output:

```
Hosting URL: https://your-project-id.web.app
```

### Custom Domain (Optional)

**1. Add domain:**

- Firebase Console → Hosting → **Add custom domain**
- Enter: `map.lifeatparrish.com`

**2. Verify ownership:**

- Add TXT record to DNS
- Wait for verification (up to 24 hours)

**3. Configure DNS:**

Add A records:

```
@    A    151.101.1.195
@    A    151.101.65.195
```

Or CNAME:

```
map    CNAME    your-project-id.web.app
```

**4. SSL certificate:**

Firebase provisions automatically (up to 24 hours).

## Configuration Files

### config.js

**Location:** `/config.js` (root directory)

**Purpose:** Application configuration

**Important:** NOT committed to Git (in `.gitignore`)

**Structure:**

```javascript
window.config = {
  mapboxAccessToken: 'pk.your-token-here',
  appName: 'Parrish Map',
  appVersion: '1.0.0'
};
```

### firebase.json

**Location:** `/firebase.json` (root directory)

**Purpose:** Firebase hosting configuration

**Example:**

```json
{
  "hosting": {
    "public": "dist",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"]
  }
}
```

### .firebaserc

**Location:** `/.firebaserc` (root directory)

**Purpose:** Links local project to Firebase project

**Auto-created by** `firebase init`

## Troubleshooting

### Port 5173 already in use

```bash
npm run dev -- --port 3000
```

### Map not showing

**Check:**

1. Mapbox token in `config.js` is correct
2. Browser console for errors
3. Token is active in Mapbox dashboard

**Debug:**

```javascript
// In browser console
console.log(window.config.mapboxAccessToken)
```

### Changes not reflecting

1. Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
2. Clear cache: DevTools → Right-click refresh → "Empty Cache and Hard Reload"
3. Restart dev server: Ctrl+C then `npm run dev`

### Module not found errors

```bash
rm -rf node_modules package-lock.json
npm install
```

### No Wix data loading

**Check:**

1. Collections exist in Wix Content Manager: Neighborhoods, HousesforSale, FloorPlans
2. OAuth client ID in `api.js` is correct
3. Browser console for errors
4. Network tab for failed requests to `*.wix.com`

### Firebase deployment fails (403)

```bash
firebase logout
firebase login
firebase deploy
```

### Deployed site shows blank page

**Check:**

1. `firebase.json` has `"public": "dist"`
2. Ran `npm run build` before deploying
3. `config.js` exists before building
4. Browser console for errors

### Node.js version too old

If `node --version` shows < 18:

1. Uninstall current Node.js
2. Download LTS from [nodejs.org](https://nodejs.org/)
3. Reinstall

## Security Checklist

Before going to production:

- [ ] `config.js` not committed to Git
- [ ] Production Mapbox token has URL restrictions
- [ ] postMessage origins restricted (in `main.js`)
- [ ] No `console.log()` with sensitive data
- [ ] No hardcoded passwords or secrets
- [ ] Firebase enforces HTTPS (automatic)

## Quick Reference

### First-Time Setup

```bash
# 1. Clone and install
git clone <repository-url>
cd parrish-map
npm install

# 2. Configure
cp config.example.js config.js
# Edit config.js with your Mapbox token

# 3. Run
npm run dev
# Open http://localhost:5173
```

### Daily Development

```bash
# Start dev server
npm run dev

# Make changes in /src
# Browser auto-refreshes

# Test production build
npm run build
npm run preview
```

### Deployment

```bash
# Build and deploy
npm run build
firebase deploy --only hosting

# Or use GitHub Actions (push to main)
git add .
git commit -m "Update features"
git push origin main
```

## Next Steps

- **Ready to deploy?** See [Deployment](./deployment.md)
- **Understand the code?** See [Architecture](./architecture.md)
- **Common issues?** See [Maintenance](./maintenance.md)
