import axios from "axios";
import { storage } from "./storage";

const WALLETS = {
  SOL: "57pNZ8Kybv22PJ8z5AK7ojB8G7Rx2XQLsfNQV8a65rmm",
  ETH: "0x34Ec405AA9ed747f163AD0C7cb54408ACce57b81",
  BTC: "bc1pmf0v2dm4f0v6w6fadktdwwg7yqmlqqawsw7nfj840nny488dx0fqnzpk4t",
};

interface WalletBalance {
  address: string;
  chain: string;
  balance: number;
  usdValue: number;
  lastChecked: number;
}

interface IncomeMethod {
  id: string;
  name: string;
  category: string;
  description: string;
  status: "active" | "scanning" | "pending" | "disabled";
  riskLevel: "low" | "medium" | "high";
  estimatedDaily: number;
}

const INCOME_METHODS: IncomeMethod[] = [
  { id: "sol-staking-monitor", name: "SOL Staking Rewards Monitor", category: "crypto", description: "Track Solana staking rewards and validator performance", status: "active", riskLevel: "low", estimatedDaily: 0 },
  { id: "eth-staking-monitor", name: "ETH Staking Yield Monitor", category: "crypto", description: "Monitor Ethereum staking yields and beacon chain rewards", status: "active", riskLevel: "low", estimatedDaily: 0 },
  { id: "defi-yield-scanner", name: "DeFi Yield Farm Scanner", category: "crypto", description: "Scan top DeFi protocols for highest yield opportunities", status: "active", riskLevel: "medium", estimatedDaily: 0 },
  { id: "airdrop-eligibility", name: "Airdrop Eligibility Checker", category: "crypto", description: "Check wallet eligibility for upcoming token airdrops", status: "active", riskLevel: "low", estimatedDaily: 0 },
  { id: "liquidity-pool-apy", name: "Liquidity Pool APY Scanner", category: "crypto", description: "Find highest APY liquidity pools across DEXes", status: "active", riskLevel: "medium", estimatedDaily: 0 },
  { id: "token-price-alerts", name: "Token Price Alert System", category: "crypto", description: "Monitor token prices and trigger buy/sell alerts", status: "active", riskLevel: "low", estimatedDaily: 0 },
  { id: "mev-opportunity-scan", name: "MEV Opportunity Scanner", category: "crypto", description: "Detect MEV opportunities in mempool transactions", status: "scanning", riskLevel: "high", estimatedDaily: 0 },
  { id: "arbitrage-dex", name: "DEX Arbitrage Detector", category: "crypto", description: "Find price discrepancies across decentralized exchanges", status: "active", riskLevel: "high", estimatedDaily: 0 },
  { id: "nft-floor-monitor", name: "NFT Floor Price Monitor", category: "crypto", description: "Track NFT collection floor prices for flip opportunities", status: "active", riskLevel: "high", estimatedDaily: 0 },
  { id: "memecoin-sniper", name: "Memecoin Launch Sniper", category: "crypto", description: "Monitor new token launches on Pump.fun, Raydium for early entry", status: "scanning", riskLevel: "high", estimatedDaily: 0 },
  { id: "github-bounty-scan", name: "GitHub Bounty Scanner", category: "bounty", description: "Scan GitHub issues with bounty labels and rewards", status: "active", riskLevel: "low", estimatedDaily: 0 },
  { id: "gitcoin-grants", name: "Gitcoin Grants Monitor", category: "bounty", description: "Track active Gitcoin grants and bounty rounds", status: "active", riskLevel: "low", estimatedDaily: 0 },
  { id: "bug-bounty-scan", name: "Bug Bounty Program Scanner", category: "bounty", description: "Monitor HackerOne, Bugcrowd, Immunefi for new programs", status: "active", riskLevel: "low", estimatedDaily: 0 },
  { id: "code-contest", name: "Code Contest Aggregator", category: "bounty", description: "Track competitive programming contests with prizes", status: "active", riskLevel: "low", estimatedDaily: 0 },
  { id: "audit-bounty", name: "Smart Contract Audit Bounties", category: "bounty", description: "Find smart contract audit competitions on Code4rena, Sherlock", status: "active", riskLevel: "low", estimatedDaily: 0 },
  { id: "seo-content-monetize", name: "SEO Content Monetization", category: "content", description: "Generate SEO-optimized content for ad revenue and affiliate income", status: "active", riskLevel: "low", estimatedDaily: 0 },
  { id: "affiliate-link-gen", name: "Affiliate Link Generator", category: "content", description: "Generate and track affiliate links for product recommendations", status: "active", riskLevel: "low", estimatedDaily: 0 },
  { id: "blog-traffic-tracker", name: "Blog Traffic Analytics", category: "content", description: "Monitor blog traffic, engagement, and revenue metrics", status: "active", riskLevel: "low", estimatedDaily: 0 },
  { id: "ebook-sales", name: "eBook Sales Pipeline", category: "content", description: "Create and sell digital eBooks on multiple platforms", status: "pending", riskLevel: "low", estimatedDaily: 0 },
  { id: "course-creation", name: "Online Course Builder", category: "content", description: "Build and monetize online courses and tutorials", status: "pending", riskLevel: "low", estimatedDaily: 0 },
  { id: "micro-saas-monitor", name: "Micro-SaaS Revenue Tracker", category: "apps", description: "Track revenue from deployed micro-SaaS applications", status: "active", riskLevel: "low", estimatedDaily: 0 },
  { id: "api-usage-metering", name: "API Usage Metering", category: "apps", description: "Monitor and bill for API usage across deployed services", status: "active", riskLevel: "low", estimatedDaily: 0 },
  { id: "app-store-monitor", name: "App Store Revenue Monitor", category: "apps", description: "Track downloads and revenue from app store listings", status: "pending", riskLevel: "low", estimatedDaily: 0 },
  { id: "saas-template-sales", name: "SaaS Template Marketplace", category: "apps", description: "Sell code templates and starter kits on marketplaces", status: "active", riskLevel: "low", estimatedDaily: 0 },
  { id: "bot-service", name: "Bot-as-a-Service Revenue", category: "apps", description: "Deploy and monetize AI chatbot services", status: "pending", riskLevel: "low", estimatedDaily: 0 },
  { id: "crypto-arbitrage", name: "Cross-Exchange Arbitrage", category: "market", description: "Detect price differences between centralized exchanges", status: "scanning", riskLevel: "high", estimatedDaily: 0 },
  { id: "market-making", name: "Market Making Spread Analysis", category: "market", description: "Analyze bid-ask spreads for market making opportunities", status: "scanning", riskLevel: "high", estimatedDaily: 0 },
  { id: "funding-rate-arb", name: "Funding Rate Arbitrage", category: "market", description: "Exploit perpetual futures funding rate differences", status: "scanning", riskLevel: "high", estimatedDaily: 0 },
  { id: "flash-loan-scan", name: "Flash Loan Opportunity Scanner", category: "market", description: "Detect profitable flash loan arbitrage paths", status: "scanning", riskLevel: "high", estimatedDaily: 0 },
  { id: "liquidation-monitor", name: "Liquidation Event Monitor", category: "market", description: "Monitor DeFi protocols for upcoming liquidation events", status: "active", riskLevel: "high", estimatedDaily: 0 },
  { id: "mining-hashrate", name: "Mining Hashrate Monitor", category: "mining", description: "Estimate and track mining hashrate profitability", status: "active", riskLevel: "medium", estimatedDaily: 0 },
  { id: "mining-pool-compare", name: "Mining Pool Comparison", category: "mining", description: "Compare mining pool fees, rewards, and reliability", status: "active", riskLevel: "medium", estimatedDaily: 0 },
  { id: "pow-analysis", name: "Proof-of-Work Analysis", category: "mining", description: "Analyze PoW algorithms for most profitable coins to mine", status: "active", riskLevel: "medium", estimatedDaily: 0 },
  { id: "gpu-profit-calc", name: "GPU Profitability Calculator", category: "mining", description: "Calculate GPU mining profitability by hardware", status: "active", riskLevel: "low", estimatedDaily: 0 },
  { id: "freelance-scan", name: "Freelance Job Scanner", category: "freelance", description: "Scan Upwork, Fiverr, Toptal for high-paying dev jobs", status: "active", riskLevel: "low", estimatedDaily: 0 },
  { id: "ai-service-revenue", name: "AI Service Revenue", category: "freelance", description: "Track revenue from AI-powered service offerings", status: "active", riskLevel: "low", estimatedDaily: 0 },
  { id: "consulting-pipeline", name: "Consulting Pipeline", category: "freelance", description: "Manage and track consulting engagement revenue", status: "pending", riskLevel: "low", estimatedDaily: 0 },
  { id: "print-on-demand", name: "Print-on-Demand Monitor", category: "ecommerce", description: "Track print-on-demand product sales and revenue", status: "pending", riskLevel: "low", estimatedDaily: 0 },
  { id: "dropshipping-scout", name: "Dropshipping Product Scout", category: "ecommerce", description: "Find trending products for dropshipping stores", status: "active", riskLevel: "medium", estimatedDaily: 0 },
  { id: "shopify-revenue", name: "Shopify Store Revenue", category: "ecommerce", description: "Track connected Shopify store sales and metrics", status: "active", riskLevel: "low", estimatedDaily: 0 },
  { id: "pump-dump-detector", name: "Pump & Dump Detector", category: "crypto", description: "Detect pump and dump patterns for early exit signals", status: "scanning", riskLevel: "high", estimatedDaily: 0 },
  { id: "whale-tracker", name: "Whale Movement Tracker", category: "crypto", description: "Track large wallet movements and whale transactions", status: "active", riskLevel: "medium", estimatedDaily: 0 },
  { id: "token-launch-scanner", name: "New Token Launch Scanner", category: "crypto", description: "Monitor Solana and Ethereum for new token deployments", status: "scanning", riskLevel: "high", estimatedDaily: 0 },
  { id: "yield-aggregator", name: "Yield Aggregator Optimizer", category: "crypto", description: "Auto-route funds to highest yield aggregators", status: "scanning", riskLevel: "medium", estimatedDaily: 0 },
  { id: "domain-flip", name: "Domain Flipping Scanner", category: "market", description: "Find undervalued domains for resale at profit", status: "active", riskLevel: "medium", estimatedDaily: 0 },
  { id: "rentahuman-tasks", name: "RentAHuman.ai Task Scanner", category: "freelance", description: "Scan RentAHuman.ai for AI-completable tasks and gigs", status: "active", riskLevel: "low", estimatedDaily: 0 },
  { id: "moltbook-publishing", name: "MoltBook Content Publisher", category: "content", description: "Publish and monetize content on MoltBook.com platform", status: "active", riskLevel: "low", estimatedDaily: 0 },
  { id: "cloudflare-bypass-scan", name: "Cloudflare Bypass Monitor", category: "market", description: "Monitor and update Cloudflare bypass techniques for web access", status: "active", riskLevel: "medium", estimatedDaily: 0 },
  { id: "captcha-solving-monitor", name: "CAPTCHA Solving Service", category: "market", description: "Monitor captcha solving services (2captcha, anticaptcha, capsolver) for opportunities", status: "active", riskLevel: "low", estimatedDaily: 0 },
  { id: "web-scraping-service", name: "Web Scraping Service Revenue", category: "apps", description: "Offer automated web scraping as a paid service via APIs", status: "active", riskLevel: "low", estimatedDaily: 0 },
  { id: "proxy-resale", name: "Proxy Resale Arbitrage", category: "market", description: "Find and resell residential/datacenter proxies at markup", status: "scanning", riskLevel: "medium", estimatedDaily: 0 },
  { id: "ai-agent-service", name: "AI Agent-as-a-Service", category: "apps", description: "Deploy Tessera-powered AI agent services for clients", status: "active", riskLevel: "low", estimatedDaily: 0 },
  { id: "data-pipeline-service", name: "Data Pipeline Revenue", category: "apps", description: "Automated data collection and processing pipelines as service", status: "active", riskLevel: "low", estimatedDaily: 0 },
  { id: "social-media-automation", name: "Social Media Automation", category: "content", description: "Automated social media posting and engagement services", status: "active", riskLevel: "low", estimatedDaily: 0 },
  { id: "newsletter-monetize", name: "Newsletter Monetization", category: "content", description: "Build and monetize automated newsletters with sponsorships", status: "pending", riskLevel: "low", estimatedDaily: 0 },
];

let walletBalances: WalletBalance[] = [];
let engineRunning = false;
let engineInterval: NodeJS.Timeout | null = null;
let lastCheckTime = 0;
let totalChecks = 0;
let engineStartedAt = 0;

let cachedSolPrice = 0;
let cachedEthPrice = 0;
let cachedBtcPrice = 0;
let lastPriceFetch = 0;

async function fetchCryptoPrices() {
  if (Date.now() - lastPriceFetch < 60000 && cachedSolPrice > 0) return;
  try {
    const res = await axios.get("https://api.coingecko.com/api/v3/simple/price?ids=solana,ethereum,bitcoin&vs_currencies=usd", { timeout: 8000 });
    cachedSolPrice = res.data?.solana?.usd || cachedSolPrice;
    cachedEthPrice = res.data?.ethereum?.usd || cachedEthPrice;
    cachedBtcPrice = res.data?.bitcoin?.usd || cachedBtcPrice;
    lastPriceFetch = Date.now();
    
  } catch {
    try {
      const res = await axios.get("https://min-api.cryptocompare.com/data/pricemulti?fsyms=SOL,ETH,BTC&tsyms=USD", { timeout: 8000 });
      cachedSolPrice = res.data?.SOL?.USD || cachedSolPrice || 86;
      cachedEthPrice = res.data?.ETH?.USD || cachedEthPrice || 2800;
      cachedBtcPrice = res.data?.BTC?.USD || cachedBtcPrice || 95000;
      lastPriceFetch = Date.now();
    } catch {
      if (!cachedSolPrice) cachedSolPrice = 86;
      if (!cachedEthPrice) cachedEthPrice = 2800;
      if (!cachedBtcPrice) cachedBtcPrice = 95000;
    }
  }
}

async function checkSolanaBalance(): Promise<WalletBalance> {
  try {
    const res = await axios.post("https://api.mainnet-beta.solana.com", {
      jsonrpc: "2.0",
      id: 1,
      method: "getBalance",
      params: [WALLETS.SOL],
    }, { timeout: 10000 });
    const lamports = res.data?.result?.value || 0;
    const solBalance = lamports / 1e9;
    await fetchCryptoPrices();
    return { address: WALLETS.SOL, chain: "SOL", balance: solBalance, usdValue: solBalance * cachedSolPrice, lastChecked: Date.now() };
  } catch (e: any) {
    
    return { address: WALLETS.SOL, chain: "SOL", balance: 0, usdValue: 0, lastChecked: Date.now() };
  }
}

async function checkEthBalance(): Promise<WalletBalance> {
  try {
    const res = await axios.post("https://rpc.ankr.com/eth", {
      jsonrpc: "2.0",
      id: 1,
      method: "eth_getBalance",
      params: [WALLETS.ETH, "latest"],
    }, { timeout: 10000 });
    const weiHex = res.data?.result || "0x0";
    const ethBalance = parseInt(weiHex, 16) / 1e18;
    await fetchCryptoPrices();
    return { address: WALLETS.ETH, chain: "ETH", balance: ethBalance, usdValue: ethBalance * cachedEthPrice, lastChecked: Date.now() };
  } catch (e: any) {
    
    return { address: WALLETS.ETH, chain: "ETH", balance: 0, usdValue: 0, lastChecked: Date.now() };
  }
}

async function checkBtcBalance(): Promise<WalletBalance> {
  try {
    const res = await axios.get(`https://blockchain.info/q/addressbalance/${WALLETS.BTC}`, { timeout: 10000 });
    const satoshis = parseInt(res.data) || 0;
    const btcBalance = satoshis / 1e8;
    await fetchCryptoPrices();
    return { address: WALLETS.BTC, chain: "BTC", balance: btcBalance, usdValue: btcBalance * cachedBtcPrice, lastChecked: Date.now() };
  } catch (e: any) {
    
    return { address: WALLETS.BTC, chain: "BTC", balance: 0, usdValue: 0, lastChecked: Date.now() };
  }
}

async function scanGitHubBounties(): Promise<any[]> {
  try {
    const token = process.env.GITHUB_TOKEN;
    const headers: any = { Accept: "application/vnd.github.v3+json" };
    if (token) headers.Authorization = `token ${token}`;
    const res = await axios.get("https://api.github.com/search/issues?q=label:bounty+state:open+is:issue&sort=created&order=desc&per_page=10", { headers, timeout: 10000 });
    return (res.data?.items || []).map((i: any) => ({
      title: i.title,
      url: i.html_url,
      repo: i.repository_url?.replace("https://api.github.com/repos/", ""),
      labels: i.labels?.map((l: any) => l.name) || [],
      created: i.created_at,
    }));
  } catch (e: any) {
    
    return [];
  }
}

async function scanDeFiYields(): Promise<any[]> {
  try {
    const res = await axios.get("https://yields.llama.fi/pools", { timeout: 15000 });
    const pools = res.data?.data || [];
    return pools
      .filter((p: any) => p.apy > 5 && p.tvlUsd > 100000)
      .sort((a: any, b: any) => b.apy - a.apy)
      .slice(0, 20)
      .map((p: any) => ({
        pool: p.pool,
        project: p.project,
        chain: p.chain,
        symbol: p.symbol,
        apy: p.apy,
        tvl: p.tvlUsd,
      }));
  } catch (e: any) {
    
    return [];
  }
}

async function runIncomeCheck() {
  totalChecks++;
  lastCheckTime = Date.now();
  const [sol, eth, btc] = await Promise.all([
    checkSolanaBalance(),
    checkEthBalance(),
    checkBtcBalance(),
  ]);
  walletBalances = [sol, eth, btc];

  for (const method of INCOME_METHODS) {
    if (method.status === "disabled") continue;
    try {
      const existing = await storage.getIncomeProcessByMethod(method.id);
      if (!existing) {
        await storage.createIncomeProcess({
          type: method.category,
          name: method.name,
          category: method.category,
          status: method.status,
          method: method.id,
          details: method.description,
          estimatedRevenue: method.estimatedDaily,
          actualRevenue: 0,
          walletAddress: method.category === "crypto" ? WALLETS.SOL : null,
          txHash: null,
          lastCheckedAt: new Date(),
        });
      } else {
        await storage.updateIncomeProcess(existing.id, {
          status: method.status,
          lastCheckedAt: new Date(),
          details: method.description,
        });
      }
    } catch (e: any) {
      
    }
  }

  const [bounties, yields] = await Promise.allSettled([
    scanGitHubBounties(),
    scanDeFiYields(),
  ]);

  const bountyCount = bounties.status === "fulfilled" ? bounties.value.length : 0;
  const yieldCount = yields.status === "fulfilled" ? yields.value.length : 0;
  
}

export async function startIncomeEngine() {
  if (engineRunning) return;
  engineRunning = true;
  engineStartedAt = Date.now();
  

  try {
    await runIncomeCheck();
  } catch (e: any) {
    
  }

  engineInterval = setInterval(async () => {
    try {
      await runIncomeCheck();
    } catch (e: any) {
      
    }
  }, 60 * 1000);
}

export function stopIncomeEngine() {
  engineRunning = false;
  if (engineInterval) {
    clearInterval(engineInterval);
    engineInterval = null;
  }
  
}

export function getIncomeEngineState() {
  return {
    running: engineRunning,
    totalChecks,
    lastCheckTime,
    startedAt: engineStartedAt,
    uptime: engineStartedAt ? Date.now() - engineStartedAt : 0,
    methodCount: INCOME_METHODS.length,
    activeMethodCount: INCOME_METHODS.filter(m => m.status !== "disabled").length,
  };
}

export function getWalletBalances() {
  return walletBalances;
}

export function getIncomeMethods() {
  return INCOME_METHODS;
}

export async function triggerIncomeCheck() {
  await runIncomeCheck();
}
