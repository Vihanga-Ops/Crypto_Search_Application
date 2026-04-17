// ==================== STATE ====================
let currentChart = null;
let allCoins = [];
let topCoins = [];
let favorites = JSON.parse(localStorage.getItem('cv_favs') || '[]');
let currentCoinId = null;
let prevView = 'home';

// ==================== API ====================
const API = 'https://api.coingecko.com/api/v3';

async function fetchJSON(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

function fmt(n, digits = 2) {
  if (n === null || n === undefined) return '—';
  if (Math.abs(n) >= 1e12) return '$' + (n / 1e12).toFixed(2) + 'T';
  if (Math.abs(n) >= 1e9) return '$' + (n / 1e9).toFixed(2) + 'B';
  if (Math.abs(n) >= 1e6) return '$' + (n / 1e6).toFixed(2) + 'M';
  if (Math.abs(n) >= 1) return '$' + n.toFixed(digits).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return '$' + n.toFixed(6);
}

function fmtSimple(n) {
  if (!n) return '—';
  if (n >= 1e12) return (n / 1e12).toFixed(2) + 'T';
  if (n >= 1e9) return (n / 1e9).toFixed(2) + 'B';
  if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M';
  return n.toLocaleString();
}

// ==================== VIEWS ====================
function showView(name) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById('view-' + name).classList.add('active');
  ['Home', 'Search', 'Favs'].forEach(n => {
    const btn = document.getElementById('nav' + n);
    if (btn) btn.classList.remove('active');
  });
  const navMap = { home: 'navHome', search: 'navSearch', favorites: 'navFavs', detail: 'navSearch' };
  const nb = document.getElementById(navMap[name]);
  if (nb) nb.classList.add('active');
  if (name === 'favorites') loadFavorites();
  window.scrollTo(0, 0);
}

function goBack() {
  showView(prevView || 'home');
}

// ==================== HOME ====================
async function initHome() {
  loadGlobalStats();
  loadTopCoins();
  loadNews();
}

async function loadGlobalStats() {
  try {
    const d = await fetchJSON(`${API}/global`);
    const gd = d.data;
    document.getElementById('globalMcap').textContent = '$' + fmtSimple(gd.total_market_cap.usd);
    document.getElementById('globalVol').textContent = '$' + fmtSimple(gd.total_volume.usd);
    document.getElementById('btcDom').textContent = gd.market_cap_percentage.btc.toFixed(1) + '%';
  } catch (e) {
    console.warn('Global stats error', e);
  }
}

async function loadTopCoins() {
  try {
    const coins = await fetchJSON(
      `${API}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=true`
    );
    topCoins = coins;
    allCoins = coins;
    renderTicker(coins);
    renderCoinsGrid(coins.slice(0, 12));
    updateFloatCards(coins);
  } catch (e) {
    document.getElementById('coinsGrid').innerHTML =
      '<div class="empty"><span class="emoji">⚠️</span>Failed to load coin data. Try again shortly.</div>';
    console.warn('Top coins error', e);
  }
}

function renderTicker(coins) {
  const track = document.getElementById('tickerTrack');
  const items = [...coins, ...coins].map(c => {
    const up = c.price_change_percentage_24h >= 0;
    return `<div class="ticker-item" onclick="openCoin('${c.id}')">
      <img class="ticker-img" src="${c.image}" onerror="this.style.display='none'">
      <div class="ticker-info">
        <div class="ticker-sym">${c.symbol}</div>
        <div class="ticker-price">${fmt(c.current_price)}</div>
      </div>
      <span class="ticker-badge ${up ? 'up' : 'down'}">${up ? '+' : ''}${c.price_change_percentage_24h?.toFixed(2)}%</span>
    </div>`;
  }).join('');
  track.innerHTML = items;
}

function renderCoinsGrid(coins) {
  const grid = document.getElementById('coinsGrid');
  grid.innerHTML = coins.map(c => {
    const up = c.price_change_percentage_24h >= 0;
    return `<div class="coin-card" onclick="openCoin('${c.id}')">
      <div class="cc-top">
        <img class="cc-img" src="${c.image}" onerror="this.style.display='none'">
        <div>
          <div class="cc-name">${c.name}</div>
          <div class="cc-sym">${c.symbol}</div>
        </div>
        <div class="cc-rank">#${c.market_cap_rank}</div>
      </div>
      <div class="cc-price">${fmt(c.current_price)}</div>
      <div class="cc-change ${up ? 'up' : 'down'}">${up ? '▲' : '▼'} ${Math.abs(c.price_change_percentage_24h || 0).toFixed(2)}% (24h)</div>
      <div class="cc-mcap">MCap: ${fmt(c.market_cap)}</div>
    </div>`;
  }).join('');
}

function updateFloatCards(coins) {
  const btc = coins.find(c => c.id === 'bitcoin');
  const eth = coins.find(c => c.id === 'ethereum');
  const usdt = coins.find(c => c.id === 'tether');

  if (btc) {
    document.getElementById('fc-btc-price').textContent = fmt(btc.current_price);
    const up = btc.price_change_percentage_24h >= 0;
    const el = document.getElementById('fc-btc-change');
    el.textContent = (up ? '+' : '') + btc.price_change_percentage_24h?.toFixed(2) + '%';
    el.className = 'fc-change ' + (up ? 'up' : 'down');
    drawSparkline('sparkBTC', btc.sparkline_in_7d?.price, up ? '#20bf6b' : '#fc5c65');
  }
  if (eth) {
    document.getElementById('fc-eth-price').textContent = fmt(eth.current_price);
    const up = eth.price_change_percentage_24h >= 0;
    const el = document.getElementById('fc-eth-change');
    el.textContent = (up ? '+' : '') + eth.price_change_percentage_24h?.toFixed(2) + '%';
    el.className = 'fc-change ' + (up ? 'up' : 'down');
    drawSparkline('sparkETH', eth.sparkline_in_7d?.price, up ? '#20bf6b' : '#fc5c65');
  }
  if (usdt) {
    document.getElementById('fc-usdt-price').textContent = fmt(usdt.current_price);
    drawSparkline('sparkUSDT', usdt.sparkline_in_7d?.price, '#26a17b');
  }
}

function drawSparkline(canvasId, prices, color) {
  if (!prices || !prices.length) return;
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  canvas.width = 160; canvas.height = 40;
  const pts = prices.filter((_, i) => i % 4 === 0);
  const min = Math.min(...pts), max = Math.max(...pts);
  const w = canvas.width, h = canvas.height;
  ctx.clearRect(0, 0, w, h);
  ctx.beginPath();
  pts.forEach((p, i) => {
    const x = (i / (pts.length - 1)) * w;
    const y = h - ((p - min) / (max - min + 0.0001)) * h;
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

// ==================== NEWS ====================
async function loadNews() {
  const newsItems = [
    { source: 'CoinDesk', title: 'Bitcoin Surges Past Key Resistance Level', desc: 'BTC bulls push the leading cryptocurrency through a critical technical barrier, signaling potential upside.' },
    { source: 'Decrypt', title: 'Ethereum Layer 2 Volume Hits Record High', desc: 'Optimism and Arbitrum combine for over $1B in daily transaction volume as DeFi activity picks up.' },
    { source: 'The Block', title: 'Fed Rate Decision Could Impact Crypto Markets', desc: 'Analysts watch the FOMC meeting closely as macro factors continue to influence digital asset prices.' },
    { source: 'CryptoSlate', title: 'DeFi TVL Rebounds After Market Correction', desc: 'Total value locked in decentralized protocols climbs back above $80 billion amid renewed investor confidence.' },
    { source: 'BeInCrypto', title: 'Solana NFT Sales Spike 40% This Week', desc: 'The Solana ecosystem sees renewed interest as major collections see heightened trading activity.' },
    { source: 'Blockworks', title: 'Institutional Crypto Adoption Accelerates in Q2', desc: 'Survey data shows more hedge funds and asset managers allocating to digital assets than ever before.' },
  ];
  const grid = document.getElementById('newsGrid');
  grid.innerHTML = newsItems.map(n => `
    <div class="news-card">
      <div class="news-source">${n.source}</div>
      <div class="news-title">${n.title}</div>
      <div class="news-desc">${n.desc}</div>
    </div>`).join('');
}

// ==================== SEARCH ====================
function heroSearch() {
  const q = document.getElementById('heroSearchInput').value.trim();
  if (!q) return;
  document.getElementById('searchInput').value = q;
  prevView = 'home';
  showView('search');
  searchCoins();
}

async function searchCoins() {
  const q = document.getElementById('searchInput').value.trim();
  if (!q) return;
  const res = document.getElementById('searchResults');
  res.innerHTML = '<div class="loading"><div class="spin"></div> Searching...</div>';

  try {
    const data = await fetchJSON(`${API}/search?query=${encodeURIComponent(q)}`);
    const ids = data.coins.slice(0, 10).map(c => c.id).join(',');
    if (!ids) {
      res.innerHTML = `<div class="empty"><span class="emoji">🤷</span>No results found for "${q}"</div>`;
      return;
    }

    const markets = await fetchJSON(
      `${API}/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc&per_page=10&page=1&sparkline=false`
    );
    const coinMap = {};
    markets.forEach(c => (coinMap[c.id] = c));

    res.innerHTML = data.coins.slice(0, 10).map(coin => {
      const m = coinMap[coin.id];
      if (!m) return '';
      const up = (m.price_change_percentage_24h || 0) >= 0;
      return `<div class="result-item" onclick="openCoin('${m.id}')">
        <img class="ri-img" src="${m.image}" onerror="this.style.display='none'">
        <div class="ri-info">
          <div class="ri-name">${m.name}</div>
          <div class="ri-sym">${m.symbol} · #${m.market_cap_rank || '?'}</div>
        </div>
        <span class="ri-price">${fmt(m.current_price)}</span>
        <span class="ri-change ${up ? 'up' : 'down'}">${up ? '+' : ''}${(m.price_change_percentage_24h || 0).toFixed(2)}%</span>
        <button class="more-btn" onclick="event.stopPropagation();openCoin('${m.id}')">More Info →</button>
      </div>`;
    }).join('');
  } catch (e) {
    res.innerHTML = '<div class="empty"><span class="emoji">⚠️</span>Search failed. Please try again.</div>';
    console.warn(e);
  }
}

// ==================== DETAIL ====================
async function openCoin(id) {
  prevView = document.querySelector('.view.active')?.id?.replace('view-', '') || 'home';
  showView('detail');
  currentCoinId = id;
  renderDetail(id, 30);
}

async function renderDetail(id, days) {
  const content = document.getElementById('detailContent');
  content.innerHTML = '<div class="loading"><div class="spin"></div> Loading coin data...</div>';

  try {
    const [coin, chart] = await Promise.all([
      fetchJSON(`${API}/coins/${id}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false`),
      fetchJSON(`${API}/coins/${id}/market_chart?vs_currency=usd&days=${days}`)
    ]);

    const md = coin.market_data;
    const up = (md.price_change_percentage_24h || 0) >= 0;
    const isFav = favorites.includes(id);

    const currencies = [
      { code: 'usd', flag: '🇺🇸', symbol: '$' },
      { code: 'eur', flag: '🇪🇺', symbol: '€' },
      { code: 'gbp', flag: '🇬🇧', symbol: '£' },
      { code: 'jpy', flag: '🇯🇵', symbol: '¥' },
      { code: 'inr', flag: '🇮🇳', symbol: '₹' },
      { code: 'btc', flag: '₿', symbol: '₿' },
      { code: 'eth', flag: 'Ξ', symbol: 'Ξ' },
      { code: 'aud', flag: '🇦🇺', symbol: 'A$' },
    ];

    const priceCards = currencies.map(c => {
      const val = md.current_price[c.code];
      if (!val) return '';
      const formatted = ['btc', 'eth'].includes(c.code)
        ? val.toFixed(8)
        : val.toLocaleString(undefined, { maximumFractionDigits: 2 });
      return `<div class="price-card">
        <div class="pc-flag">${c.flag}</div>
        <div class="pc-currency">${c.code.toUpperCase()}</div>
        <div class="pc-val">${c.symbol}${formatted}</div>
      </div>`;
    }).join('');

    const desc = coin.description?.en
      ? coin.description.en.replace(/<[^>]*>/g, '').substring(0, 600) + '...'
      : 'No description available.';

    content.innerHTML = `
      <div class="detail-header">
        <img class="dh-img" src="${coin.image?.large}" onerror="this.style.display='none'">
        <div class="dh-info">
          <div class="dh-name">${coin.name}</div>
          <div class="dh-sym">${coin.symbol?.toUpperCase()} · Rank #${md.market_cap_rank || '?'}</div>
        </div>
        <div class="dh-right">
          <div class="dh-price">${fmt(md.current_price.usd)}</div>
          <div class="dh-change ${up ? 'up' : 'down'}">${up ? '▲' : '▼'} ${Math.abs(md.price_change_percentage_24h || 0).toFixed(2)}% (24h)</div>
          <button class="fav-btn ${isFav ? 'active' : ''}" onclick="toggleFav('${id}')" id="favBtn">
            ${isFav ? '★ Saved' : '☆ Save'}
          </button>
        </div>
      </div>

      <div style="max-width:1200px;margin:0 auto;padding:0 2rem;">
        <div class="section-label" style="margin-bottom:1rem">Price in Multiple Currencies</div>
      </div>
      <div class="price-grid">${priceCards}</div>

      <div class="chart-section">
        <div class="section-label" style="margin-bottom:1rem">Price History</div>
        <div class="chart-controls">
          <button class="period-btn" onclick="changeChart('${id}',1,this)">1D</button>
          <button class="period-btn" onclick="changeChart('${id}',7,this)">1W</button>
          <button class="period-btn active" onclick="changeChart('${id}',30,this)">1M</button>
          <button class="period-btn" onclick="changeChart('${id}',90,this)">3M</button>
          <button class="period-btn" onclick="changeChart('${id}',365,this)">1Y</button>
          <button class="period-btn" onclick="changeChart('${id}','max',this)">All</button>
        </div>
        <div class="chart-container">
          <canvas id="mainChart"></canvas>
        </div>
      </div>

      <div class="converter-section">
        <div class="section-label" style="margin-bottom:1rem">Crypto Converter</div>
        <div class="converter-box">
          <h3>Convert ${coin.symbol?.toUpperCase()} to USD</h3>
          <div class="converter-row">
            <input class="conv-input" type="number" id="convInput" value="1" oninput="updateConv(${md.current_price.usd})">
            <span class="conv-label">${coin.symbol?.toUpperCase()}</span>
            <span class="conv-equals">=</span>
            <span class="conv-result" id="convResult">${fmt(md.current_price.usd)}</span>
            <span class="conv-label">USD</span>
          </div>
        </div>
      </div>

      <div class="stats-grid">
        <div class="stat-card"><div class="sc-label">Market Cap</div><div class="sc-val">${fmt(md.market_cap.usd)}</div></div>
        <div class="stat-card"><div class="sc-label">24h Volume</div><div class="sc-val">${fmt(md.total_volume.usd)}</div></div>
        <div class="stat-card"><div class="sc-label">24h High</div><div class="sc-val">${fmt(md.high_24h.usd)}</div></div>
        <div class="stat-card"><div class="sc-label">24h Low</div><div class="sc-val">${fmt(md.low_24h.usd)}</div></div>
        <div class="stat-card"><div class="sc-label">ATH</div><div class="sc-val">${fmt(md.ath.usd)}</div></div>
        <div class="stat-card"><div class="sc-label">ATL</div><div class="sc-val">${fmt(md.atl.usd)}</div></div>
        <div class="stat-card"><div class="sc-label">Circulating Supply</div><div class="sc-val">${fmtSimple(md.circulating_supply)} ${coin.symbol?.toUpperCase()}</div></div>
        <div class="stat-card"><div class="sc-label">Max Supply</div><div class="sc-val">${md.max_supply ? fmtSimple(md.max_supply) + ' ' + coin.symbol?.toUpperCase() : '∞ Unlimited'}</div></div>
      </div>

      <div class="desc-section">
        <div class="desc-box">
          <h3>About ${coin.name}</h3>
          ${desc}
        </div>
      </div>
    `;

    drawChart(chart.prices, days);
  } catch (e) {
    content.innerHTML = '<div class="empty"><span class="emoji">⚠️</span>Failed to load coin data.</div>';
    console.warn(e);
  }
}

function drawChart(prices, days) {
  if (currentChart) { currentChart.destroy(); currentChart = null; }
  const ctx = document.getElementById('mainChart');
  if (!ctx) return;

  let pts = prices;
  if (pts.length > 200) {
    const step = Math.ceil(pts.length / 200);
    pts = pts.filter((_, i) => i % step === 0);
  }

  const labels = pts.map(p => {
    const d = new Date(p[0]);
    if (days <= 1) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (days <= 30) return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    return d.toLocaleDateString([], { month: 'short', year: '2-digit' });
  });
  const vals = pts.map(p => p[1]);
  const up = vals[vals.length - 1] >= vals[0];
  const color = up ? '#20bf6b' : '#fc5c65';

  currentChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        data: vals,
        borderColor: color,
        borderWidth: 2,
        fill: true,
        backgroundColor: (context) => {
          const gradient = context.chart.ctx.createLinearGradient(0, 0, 0, 300);
          gradient.addColorStop(0, color + '33');
          gradient.addColorStop(1, color + '00');
          return gradient;
        },
        pointRadius: 0,
        tension: 0.3,
      }]
    },
    options: {
      responsive: true,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#12121a',
          borderColor: '#252538',
          borderWidth: 1,
          titleColor: '#6b6b8a',
          bodyColor: '#e8e8f0',
          callbacks: { label: ctx => ' $' + ctx.raw.toLocaleString(undefined, { maximumFractionDigits: 4 }) }
        }
      },
      scales: {
        x: { grid: { color: '#252538' }, ticks: { color: '#6b6b8a', maxTicksLimit: 8 } },
        y: { grid: { color: '#252538' }, ticks: { color: '#6b6b8a', callback: v => '$' + fmtSimple(v) } }
      }
    }
  });
}

async function changeChart(id, days, btn) {
  document.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  try {
    const data = await fetchJSON(`${API}/coins/${id}/market_chart?vs_currency=usd&days=${days}`);
    drawChart(data.prices, days);
  } catch (e) { console.warn(e); }
}

function updateConv(priceUsd) {
  const amt = parseFloat(document.getElementById('convInput').value) || 0;
  document.getElementById('convResult').textContent = fmt(amt * priceUsd);
}

// ==================== FAVORITES ====================
function toggleFav(id) {
  if (favorites.includes(id)) {
    favorites = favorites.filter(f => f !== id);
    showToast('Removed from saved coins');
  } else {
    favorites.push(id);
    showToast('Added to saved coins ⭐');
  }
  localStorage.setItem('cv_favs', JSON.stringify(favorites));
  const btn = document.getElementById('favBtn');
  if (btn) {
    btn.className = 'fav-btn ' + (favorites.includes(id) ? 'active' : '');
    btn.textContent = favorites.includes(id) ? '★ Saved' : '☆ Save';
  }
}

async function loadFavorites() {
  const grid = document.getElementById('favsGrid');
  if (!favorites.length) {
    grid.innerHTML = '<div class="empty"><span class="emoji">⭐</span>No saved coins yet!</div>';
    return;
  }
  grid.innerHTML = '<div class="loading"><div class="spin"></div> Loading saved coins...</div>';
  try {
    const ids = favorites.join(',');
    const coins = await fetchJSON(
      `${API}/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc&per_page=50&page=1&sparkline=false`
    );
    grid.innerHTML = coins.map(c => {
      const up = c.price_change_percentage_24h >= 0;
      return `<div class="coin-card" onclick="openCoin('${c.id}')">
        <div class="cc-top">
          <img class="cc-img" src="${c.image}" onerror="this.style.display='none'">
          <div>
            <div class="cc-name">${c.name}</div>
            <div class="cc-sym">${c.symbol}</div>
          </div>
          <div class="cc-rank">#${c.market_cap_rank}</div>
        </div>
        <div class="cc-price">${fmt(c.current_price)}</div>
        <div class="cc-change ${up ? 'up' : 'down'}">${up ? '▲' : '▼'} ${Math.abs(c.price_change_percentage_24h || 0).toFixed(2)}% (24h)</div>
      </div>`;
    }).join('');
  } catch (e) {
    grid.innerHTML = '<div class="empty"><span class="emoji">⚠️</span>Failed to load favorites.</div>';
  }
}

// ==================== THEME ====================
function toggleTheme() {
  document.body.classList.toggle('light');
  if (currentChart) {
    const isDark = !document.body.classList.contains('light');
    currentChart.options.scales.x.grid.color = isDark ? '#252538' : '#e2e1d8';
    currentChart.options.scales.y.grid.color = isDark ? '#252538' : '#e2e1d8';
    currentChart.update();
  }
}

// ==================== TOAST ====================
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2000);
}

// ==================== INIT ====================
initHome();