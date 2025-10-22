# Parrish Map

Interactive neighborhood map for Parrish, FL that helps home buyers filter and explore neighborhoods by amenities, price range, home type, and availability.

## Features

- **Interactive Map** - Powered by Mapbox GL JS with custom neighborhood polygons
- **Advanced Filtering** - Search by price, home type, bedrooms, garages, and amenities
- **Real-Time Data** - Integrated with Wix Data API for up-to-date listings
- **Responsive Design** - Optimized for desktop, tablet, and mobile devices
- **Neighborhood Details** - View homes for sale and floor plans for each community

## Quick Start

### Prerequisites

- Node.js 18 or higher
- npm 9 or higher
- Mapbox account (free tier works)
- Wix account with OAuth client ID
- Firebase account (for hosting)

### Installation

1. Clone the repository:

   ```bash
   git clone <repository-url>
   cd parrish-map
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Configure application:

   ```bash
   cp config.example.js config.js
   ```

   Edit `config.js` and add your Mapbox access token:

   ```javascript
   window.config = {
     mapboxAccessToken: 'YOUR_MAPBOX_TOKEN_HERE',
     appName: 'Parrish Map'
   };
   ```

4. Start development server:

   ```bash
   npm run dev
   ```

5. Open browser to `http://localhost:5173`

## Documentation

Comprehensive documentation is available in the `/docs` folder:

### Setup Guide

- [Setup](./docs/setup.md) - Prerequisites, local development, Mapbox, Wix, and Firebase configuration

### Deployment

- [Deployment](./docs/deployment.md) - Manual and automated deployment via GitHub Actions

### Architecture

- [Architecture](./docs/architecture.md) - System design, data flow, and components

### Maintenance

- [Maintenance](./docs/maintenance.md) - Updating GeoJSON boundaries and troubleshooting

### Reference

- [Reference](./docs/reference.md) - NPM commands, Mapbox/Wix configuration, project structure

## Technology Stack

### Frontend

- **JavaScript (ES6+)** - No framework, vanilla JS for performance
- **Vite** - Fast build tool and development server
- **Tailwind CSS v4** - Utility-first CSS framework

### Mapping

- **Mapbox GL JS** - Interactive vector maps
- **GeoJSON** - Neighborhood boundary data

### Backend/Data

- **Wix Data API** - Content management and data storage
- **Wix SDK** - OAuth authentication

### Hosting

- **Firebase Hosting** - Static file hosting with global CDN
- **GitHub Actions** - Automated deployment pipeline

## Available Commands

```bash
# Development
npm install          # Install dependencies
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build

# Deployment
firebase login       # Authenticate with Firebase
firebase deploy      # Deploy to Firebase Hosting
```

## Project Structure

```
parrish-map/
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Actions CI/CD
├── docs/                       # Comprehensive documentation
├── public/                     # Static assets (if any)
├── src/
│   └── assets/
│       ├── css/               # Stylesheets
│       └── js/                # Application code
│           ├── main.js        # Entry point
│           └── modules/       # Feature modules
├── config.example.js          # Configuration template
├── index.html                 # Main HTML file
└── package.json              # Dependencies and scripts
```

## Development Workflow

1. **Make changes** to source files in `src/`
2. **Test locally** with `npm run dev`
3. **Build** with `npm run build`
4. **Deploy** with `firebase deploy` or push to `main` (auto-deploys via GitHub Actions)

## Deployment

### Manual Deployment

```bash
npm run build
firebase deploy --only hosting
```

### Automated Deployment (GitHub Actions)

Pushing to `main` branch automatically triggers deployment to Firebase Hosting.

**Required GitHub Secrets:**

- `MAPBOX_ACCESS_TOKEN` - Your Mapbox public token
- `FIREBASE_TOKEN` - Firebase CI token (get via `firebase login:ci`)

See [CI/CD documentation](./docs/deployment/ci-cd-github-actions.md) for setup details.

## Data Sources

### Wix Collections

- **Neighborhoods** - Neighborhood metadata and amenities
- **HousesforSale** - Real estate listings
- **FloorPlans** - New construction floor plans

### GeoJSON

- Neighborhood polygon boundaries hosted on Wix Media Manager
- Fetched from remote URL configured in `src/assets/js/modules/map.js`

Data is fetched on page load and cached for performance.

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Performance

- **Bundle Size:** ~540 KB gzipped
- **First Contentful Paint:** < 1.8s
- **Largest Contentful Paint:** < 2.5s
- **Time to Interactive:** < 3.8s

## Security

- **postMessage Origin Validation** - Only allows messages from approved domains
- **Read-Only API Access** - Application has no write permissions to data
- **Public Tokens Only** - No secrets exposed in frontend code

## Troubleshooting

For common issues and solutions, see the [Maintenance Guide](./docs/maintenance.md).

**Quick fixes:**

- **Map not loading** - Check Mapbox token in `config.js`
- **No neighborhoods** - Verify GeoJSON loads from Wix (check URL in `map.js`)
- **Wix data missing** - Check collection names match exactly
- **Build fails** - Run `npm install` and try again

## Contributing

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make your changes
3. Test locally: `npm run dev`
4. Build: `npm run build`
5. Commit: `git commit -m "Description of changes"`
6. Push: `git push origin feature/your-feature`
7. Create pull request

## License

This project is proprietary software developed for Life at Parrish (lifeatparrish.com).

## Support

For issues, questions, or feature requests, please refer to the comprehensive documentation in the `/docs` folder or contact the development team.

## Related Links

- [Life at Parrish Website](https://www.lifeatparrish.com)
- [Mapbox GL JS Documentation](https://docs.mapbox.com/mapbox-gl-js/api/)
- [Wix SDK Documentation](https://dev.wix.com/docs/sdk)
- [Firebase Hosting Documentation](https://firebase.google.com/docs/hosting)
- [Vite Documentation](https://vitejs.dev/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)
