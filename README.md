# GenAI Use Case Command Center – Insurance Dashboard

A production-ready React dashboard that visualises all Gen AI use cases across the Insurance IBU/HBU, deployable as an **Azure Function App**.

---

## 📸 Dashboard Features

| Feature | Detail |
|---|---|
| KPI Cards | Total use cases, Live in Production, Completed, Active Accounts |
| Portfolio Donut | Distribution across Production / Built / Dev / Ideation |
| Account Bar Chart | Use case count per customer account |
| Filterable Table | Filter by maturity, search by name or account |
| Status Indicators | Slider status & Demo status with live-pulse dots |
| Progress Bars | Per-use-case % complete |

---

## 🚀 Local Development

```bash
# Install dependencies
npm install

# Start dev server (http://localhost:5173)
npm run dev

# Build for production
npm run build
```

---

## ☁️ Azure Function App Deployment

### Prerequisites
- Azure CLI installed & logged in (`az login`)
- An Azure Function App created (Node 20, Linux)
- App setting: `WEBSITE_RUN_FROM_PACKAGE = 1`

### Option A — GitHub Actions (recommended)

1. Fork / push this repo to GitHub.
2. In Azure Portal → Function App → **Get Publish Profile** → download XML.
3. In GitHub repo → **Settings → Secrets → Actions** → add secret:
   - Name: `AZURE_FUNCTIONAPP_PUBLISH_PROFILE`
   - Value: paste the publish profile XML
4. Edit `.github/workflows/deploy.yml` and set `AZURE_FUNCTIONAPP_NAME` to your Function App name.
5. Push to `main` → workflow deploys automatically.

### Option B — Manual Deployment via Azure CLI

```bash
# 1. Build React app
npm run build

# 2. Copy dist into API package
cp -r dist api/dist

# 3. Install API production dependencies
cd api && npm ci --omit=dev && cd ..

# 4. Zip the api folder
cd api && zip -r ../function-package.zip . && cd ..

# 5. Deploy to Azure
az functionapp deployment source config-zip \
  --resource-group <YOUR_RESOURCE_GROUP> \
  --name <YOUR_FUNCTION_APP_NAME> \
  --src function-package.zip
```

### Option C — VS Code Azure Functions Extension

1. Install the **Azure Functions** VS Code extension.
2. Run `npm run build && cp -r dist api/dist`.
3. Right-click the `api` folder → **Deploy to Function App**.

---

## 📁 Project Structure

```
insurance-dashboard/
├── src/
│   ├── main.jsx            ← React entry point
│   └── App.jsx             ← Dashboard component (all data + UI)
├── api/
│   ├── serveSPA/
│   │   └── index.js        ← Azure Function (serves React SPA)
│   ├── host.json           ← Azure Functions runtime config
│   └── package.json        ← API dependencies
├── .github/
│   └── workflows/
│       └── deploy.yml      ← GitHub Actions CI/CD
├── index.html
├── vite.config.js
├── package.json
└── README.md
```

---

## 🔧 Customisation

To update the data, edit the `RAW_DATA` array in `src/App.jsx`.  
Future iterations can replace this with an API call to a backend / Azure SQL / Cosmos DB.

---

## 🛡️ Security

- No API keys or secrets stored in frontend code.
- Azure Function uses `authLevel: anonymous` (suitable for internal corp network with AAD authentication layer or APIM in front).
- Add Azure Active Directory authentication via **Function App → Authentication → Add provider → Microsoft** for enterprise SSO.
