# 💰 CryptoView

> A real-time cryptocurrency tracking web application — search any coin, explore live charts, and monitor the market at a glance.

---

## 📸 Overview

CryptoView is a fully client-side, single-file web app that lets users track live cryptocurrency prices, search across thousands of coins, and analyze price history through interactive charts. It uses the free [CoinGecko API](https://www.coingecko.com/en/api) — no backend or API key required.

---

## ✨ Features

### 🏠 Home / Index Page
- **Hero section** with live global market stats (Total Market Cap, 24h Volume, BTC Dominance)
- **Animated floating cards** for Bitcoin, Ethereum, and Tether with real-time prices and 7-day sparklines
- **Live scrolling ticker** showing top 50 coins with 24h price change badges — hover to pause
- **Top 12 coins grid** — each card is clickable and shows price, 24h change, and market cap
- **Crypto news feed** with latest market headlines
- **Inline hero search** — type a coin name and hit Enter to jump to search results

### 🔍 Search Page
- Search any cryptocurrency by name or symbol
- Results show coin icon, name, symbol, market cap rank, current price, and 24h change
- Each result has a **"More Info →"** button to open the detail page

### 📊 Detail / More Info Page
- **Current price in 8 currencies:** USD, EUR, GBP, JPY, INR, BTC, ETH, AUD
- **Interactive price history chart** powered by Chart.js with gradient fill and tooltip on hover
- **Time period selector:** 1D · 1W · 1M · 3M · 1Y · All
- **Market stats panel:** Market Cap, 24h Volume, 24h High/Low, ATH, ATL, Circulating Supply, Max Supply
- **Built-in crypto converter** — enter an amount in the coin's units to see the USD equivalent
- **Coin description** sourced directly from CoinGecko
- **Save / Favorites button** to bookmark the coin for quick access

### ⭐ Saved Coins Page
- View all bookmarked cryptocurrencies in one place
- Favorites persist across sessions using `localStorage`

### 🎨 UI & Extras
- **Dark / Light theme toggle** — dark cyberpunk default with a clean light mode
- **Responsive layout** — works on desktop and mobile
- Gold accent color scheme with a CSS grid background for visual depth
- `Space Mono` + `Syne` font pairing for a distinctive, technical aesthetic
- Toast notifications for user actions (save / unsave)

---

## 🗂️ Project Structure

```
cryptoview.html       ← Entire application (HTML + CSS + JS, single file)
README.md             ← This file
```

This is intentionally a **zero-dependency, single-file** application. No build tools, no npm, no frameworks. Just open the HTML file in a browser.

---

## 🚀 Getting Started

### Option 1 — Open directly
Double-click `cryptoview.html` in your file manager. It opens in your browser and works immediately.

### Option 2 — Serve locally (recommended to avoid CORS on some browsers)
```bash
# Python 3
python -m http.server 8080

# Then visit:
http://localhost:8080/cryptoview.html
```

### Option 3 — Deploy to GitHub Pages / Netlify / Vercel
Drop the single HTML file into any static hosting service. No configuration needed.

---

## 🔌 API Reference

All data is fetched from the **CoinGecko Public API v3** (free tier, no key required):

| Endpoint | Used For |
|---|---|
| `/global` | Market cap, volume, BTC dominance |
| `/coins/markets` | Top coins grid, ticker, search results |
| `/search?query=` | Coin search by name / symbol |
| `/coins/{id}` | Full coin detail, description, multi-currency prices |
| `/coins/{id}/market_chart` | Historical price data for charts |

> **Note:** The free CoinGecko API has rate limits (~10–30 calls/min). If you see loading errors, wait a moment and retry. For production use, consider the [CoinGecko Pro API](https://www.coingecko.com/en/api/pricing).

---

## 📐 Tech Stack

| Technology | Role |
|---|---|
| HTML5 / CSS3 | Structure and styling |
| Vanilla JavaScript (ES2020) | All app logic, routing, API calls |
| [Chart.js 4.4](https://www.chartjs.org/) | Interactive price history charts |
| [Google Fonts](https://fonts.google.com/) | Syne (display) + Space Mono (body) |
| CoinGecko API | Live cryptocurrency data |
| `localStorage` | Persisting saved/favorite coins |

No build step. No frameworks. No API key.

---

## 🖼️ Pages & Navigation

```
CryptoView
│
├── Home          → Hero + Ticker + Top Coins Grid + News Feed
├── Search        → Search bar + Results list with More Info buttons
├── Detail        → Prices in 8 currencies + Chart + Stats + Converter
└── Saved ⭐      → All bookmarked coins
```

Navigation is handled client-side — the app switches between views without any page reload.

---

## 🧩 Rubric Coverage

| Criteria | Implementation |
|---|---|
| UI Design | Consistent dark/light theme, Syne + Space Mono fonts, gold accent palette, animated cards, CSS grid background |
| Index Page | Search button, live scrolling ticker, clickable top coin cards, real-time global stats |
| Search Functionality | Search by name/symbol, results list, "More Info →" per result |
| More Info Page | 8-currency price panel, interactive Chart.js chart, full market stats, converter |
| Creativity | Interactive charts with period selector, real-time ticker animation, sparklines, favorites/saved system, news feed, crypto converter, dark/light themes |

---

## 🔧 Customization

**Change default currency:** Search for `vs_currency=usd` in the JS and replace `usd` with any [supported currency code](https://api.coingecko.com/api/v3/simple/supported_vs_currencies).

**Adjust number of top coins shown:** Find `per_page=50` in the API calls and change the number (max 250 on free tier).

**Add more currencies to the detail page:** Extend the `currencies` array in the `renderDetail()` function with any currency code supported by CoinGecko.

---

## 📄 License

This project was built for academic/educational purposes as part of a web development assignment.

---

## 👨‍💻 Authors

Developed by **Vihanga Pathirana** — CryptoView © 2024