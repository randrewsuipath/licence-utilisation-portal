# Licence Utilisation Portal

A professional operational dashboard for monitoring Power BI licence utilisation, import quality, and account-level consumption analysis using UiPath Data Fabric entities with configurable metric mappings and comprehensive audit trails.

[cloudflarebutton]

## Overview

The Licence Utilisation Portal provides real-time visibility into licence consumption, account-level utilisation analysis, import auditing, and metric mapping administration. Built exclusively with UiPath Data Fabric entities (LicenseAccount, LicenseSnapshotRun, LicenseMetricMap, AccountLicenseConsumptionSnapshot), the application calculates utilisation percentages using configurable metric mappings, tracks licence expiry, identifies under-utilised and over-utilised accounts, and provides comprehensive import quality monitoring.

## Key Features

- **Real-time Dashboard**: KPI cards showing total accounts, active accounts, licensed quantities, consumption metrics, and utilisation percentages
- **Trend Analysis**: Visualise utilisation trends by snapshot month and product with interactive charts
- **Account Management**: Comprehensive account list with search, filtering, and detailed drill-down views
- **Licence Expiry Tracking**: Monitor licences expiring within 30, 60, and 90 days with automated warnings
- **Import Monitoring**: Track import runs with quality indicators, error summaries, and audit trails
- **Metric Mapping Administration**: Configure product display names, usage metrics, and utilisation formulas
- **Utilisation Risk Bands**: Automatic categorisation (No licence, No usage, Low, Moderate, Healthy, Over-utilised, Not mapped)
- **Global Filters**: Apply filters across Dashboard and Accounts views for snapshot month, product, account director, TAM, CSM, subsidiary, region, and utilisation risk
- **Audit Traceability**: Full audit trails via snapshotRunKey and subsidiaryId for compliance

## Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and optimised builds
- **Tailwind CSS v4** for styling
- **shadcn/ui** component library
- **Recharts** for data visualisation
- **date-fns** for date manipulation
- **Zustand** for state management
- **React Router** for navigation

### Backend & Deployment
- **Cloudflare Pages** for hosting
- **UiPath Data Fabric** for data storage and retrieval
- **UiPath TypeScript SDK** for API integration

### Development Tools
- **TypeScript 5.8**
- **ESLint** for code quality
- **Bun** for package management

## Prerequisites

- [Bun](https://bun.sh/) v1.0 or higher
- UiPath Cloud account with Data Fabric access
- OAuth client credentials with required scopes:
  - `DataFabric.Schema.Read`
  - `DataFabric.Data.Read`
  - `DataFabric.Data.Write`

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd licence-utilisation-portal
```

2. Install dependencies:
```bash
bun install
```

3. Configure environment variables:

Create a `.env` file in the root directory (or update the existing one):

```env
VITE_UIPATH_BASE_URL=https://api.uipath.com
VITE_UIPATH_ORG_NAME=your-org-name
VITE_UIPATH_TENANT_NAME=your-tenant-name
VITE_UIPATH_CLIENT_ID=your-client-id
VITE_UIPATH_REDIRECT_URI=http://localhost:3000
VITE_UIPATH_SCOPE=DataFabric.Data.Read DataFabric.Data.Write DataFabric.Schema.Read
```

Replace the placeholder values with your UiPath Cloud credentials.

## Development

Start the development server:

```bash
bun run dev
```

The application will be available at `http://localhost:3000`.

### Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # shadcn/ui components
│   └── layout/         # Layout components
├── hooks/              # Custom React hooks
├── pages/              # Page components
├── lib/                # Utility functions
└── main.tsx           # Application entry point
```

## Usage

### Dashboard View

The main dashboard displays:
- KPI cards with key metrics (total accounts, licensed quantities, utilisation percentages)
- Trend charts showing utilisation over time
- Top under-utilised and over-utilised accounts
- Licence expiry warnings
- Products missing metric mappings

Apply global filters to refine data across all views.

### Accounts View

Browse all accounts with:
- Search by subsidiary name or ID
- Filter by account director, TAM, CSM, region, active status, and utilisation risk
- Click any account to view detailed information

### Account Detail View

Detailed account-level information including:
- Account KPI summary
- Product-level utilisation table with metric mappings
- Monthly trend charts by product
- Licence expiry list
- Raw snapshot audit data

### Imports View

Monitor import runs with:
- Status badges (Started, Completed, Failed, DuplicateSkipped)
- Import quality indicators (row counts, errors)
- Detailed error summaries
- Drill-down to snapshot records by run

### Metric Mapping Admin

Configure metric mappings for products:
- Set display names and sort order
- Define primary usage metrics and licensed quantity metrics
- Configure display units and graph types
- Manage active/inactive mappings
- View warnings for unmapped products

## Building for Production

Build the application:

```bash
bun run build
```

The optimised production build will be created in the `dist/` directory.

Preview the production build locally:

```bash
bun run preview
```

## Deployment

### Cloudflare Pages

This application is designed to be deployed on Cloudflare Pages.

[cloudflarebutton]

#### Manual Deployment

1. Build the application:
```bash
bun run build
```

2. Deploy to Cloudflare Pages:
```bash
npx wrangler pages deploy dist
```

3. Configure environment variables in the Cloudflare Pages dashboard:
   - `VITE_UIPATH_BASE_URL`
   - `VITE_UIPATH_ORG_NAME`
   - `VITE_UIPATH_TENANT_NAME`
   - `VITE_UIPATH_CLIENT_ID`
   - `VITE_UIPATH_REDIRECT_URI` (set to your production URL)
   - `VITE_UIPATH_SCOPE`

4. Update the OAuth redirect URI in your UiPath Cloud OAuth client settings to match your production URL.

#### Automatic Deployment

Connect your repository to Cloudflare Pages for automatic deployments on every push:

1. Go to the Cloudflare Pages dashboard
2. Create a new project and connect your Git repository
3. Configure build settings:
   - Build command: `bun run build`
   - Build output directory: `dist`
4. Add environment variables as listed above
5. Deploy

## Data Model

The application uses the following UiPath Data Fabric entities:

- **LicenseAccount**: Account information (subsidiaryId, subsidiaryName, region, account director, TAM, CSM)
- **LicenseSnapshotRun**: Import run metadata (snapshotMonth, status, row counts, errors)
- **LicenseMetricMap**: Product metric mappings (display names, usage metrics, units)
- **AccountLicenseConsumptionSnapshot**: Consumption data (licensed quantities, usage values, dates)

### Utilisation Calculation

For each product:
1. Join to LicenseMetricMap using licensedProduct
2. Extract primaryUsageMetric field name (e.g., monthlyExecutedHours)
3. Read usage value from that field
4. Extract licensedQuantityMetric field name (e.g., licensedProductQty)
5. Calculate: `utilisation % = (usage / licensed quantity) × 100`
6. Assign risk band based on percentage

## Configuration

### Metric Mappings

Metric mappings control how products are displayed and calculated. Each mapping includes:

- **licensedProduct**: Product identifier (must match AccountLicenseConsumptionSnapshot)
- **displayName**: Human-readable product name
- **primaryUsageMetric**: Field name for usage value (monthlyExecutedHours, robotUnitsConsumed, etc.)
- **licensedQuantityMetric**: Field name for licensed quantity (usually licensedProductQty)
- **displayUnit**: Unit label (hours, units, etc.)
- **sortOrder**: Display order in lists
- **isActive**: Whether to use this mapping

### Utilisation Risk Bands

- **No licence quantity**: Licensed quantity is blank, zero, or missing
- **No usage**: Licensed quantity > 0 and usage is zero or blank
- **Low utilisation**: 0% < utilisation < 25%
- **Moderate utilisation**: 25% ≤ utilisation < 75%
- **Healthy utilisation**: 75% ≤ utilisation ≤ 100%
- **Over-utilised**: utilisation > 100%
- **Not mapped**: No active LicenseMetricMap record exists

## Troubleshooting

### Authentication Issues

If you encounter authentication errors:
1. Verify your OAuth client credentials in `.env`
2. Ensure the redirect URI matches your application URL
3. Check that required scopes are granted in UiPath Cloud
4. Clear browser storage and retry authentication

### Data Not Loading

If data fails to load:
1. Verify Data Fabric entities exist in your tenant
2. Check that LicenseSnapshotRun has at least one completed run
3. Ensure LicenseMetricMap has active mappings for your products
4. Review browser console for API errors

### Build Errors

If the build fails:
1. Clear the build cache: `rm -rf dist node_modules/.vite`
2. Reinstall dependencies: `bun install`
3. Retry the build: `bun run build`

## Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'Add your feature'`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a pull request

## License

This project is licensed under the MIT License.

## Support

For issues and questions:
- Open an issue in the repository
- Contact your UiPath account team
- Refer to the [UiPath Documentation](https://docs.uipath.com/)

## Acknowledgments

Built with the [UiPath TypeScript SDK](https://www.npmjs.com/package/@uipath/uipath-typescript) and deployed on [Cloudflare Pages](https://pages.cloudflare.com/).