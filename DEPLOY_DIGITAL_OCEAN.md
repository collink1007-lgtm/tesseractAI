# Tessera v4.0 Sovereign - Digital Ocean Deployment Guide

## Quick Start (Docker Compose - Recommended)

### 1. Create a Digital Ocean Droplet
- Image: Ubuntu 24.04 LTS
- Size: Minimum 2GB RAM / 2 vCPUs (recommended 4GB RAM for video generation)
- Add your SSH key

### 2. SSH into your droplet
```bash
ssh root@YOUR_DROPLET_IP
```

### 3. Install Docker
```bash
curl -fsSL https://get.docker.com | sh
apt install docker-compose-plugin -y
```

### 4. Upload Tessera
```bash
# From your local machine:
scp tessera-v4-sovereign.zip root@YOUR_DROPLET_IP:/root/
# On the droplet:
apt install unzip -y
unzip tessera-v4-sovereign.zip -d /root/tessera
cd /root/tessera
```

### 5. Set Environment Variables
Create a `.env` file:
```bash
cat > .env << 'EOF'
SESSION_SECRET=your-random-session-secret-here
OPENROUTER_API_KEY=your-openrouter-key
OPENAI_API_KEY=your-openai-key
DEEPSEEK_API_KEY=your-deepseek-key
GROK_API_KEY=your-grok-key
GEMINI_API_KEY=your-gemini-key
COHERE_API_KEY=your-cohere-key
GITHUB_TOKEN=your-github-token
HUGGINGFACE_API_KEY=your-huggingface-key
COLLIN_VERIFICATION=z7v9x1jl1h66migpl9
EOF
```

### 6. Launch
```bash
docker compose up -d
```

Tessera will be available at `http://YOUR_DROPLET_IP:5000`

### 7. Add HTTPS (Optional but Recommended)
```bash
apt install nginx certbot python3-certbot-nginx -y

cat > /etc/nginx/sites-available/tessera << 'EOF'
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_buffering off;
        client_max_body_size 700M;
    }
}
EOF

ln -s /etc/nginx/sites-available/tessera /etc/nginx/sites-enabled/
nginx -t && systemctl restart nginx
certbot --nginx -d your-domain.com
```

## Alternative: Digital Ocean App Platform

1. Push code to a GitHub repository
2. Go to Digital Ocean > Apps > Create App
3. Select your GitHub repo
4. Set environment variables in the App Platform settings
5. Add a PostgreSQL database as a component
6. Deploy

## Alternative: Without Docker (Direct Node.js)

```bash
# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs ffmpeg flite

# Install PostgreSQL
apt install -y postgresql postgresql-contrib
sudo -u postgres createuser tessera
sudo -u postgres createdb tessera -O tessera
sudo -u postgres psql -c "ALTER USER tessera PASSWORD 'your_password';"

# Setup
cd /root/tessera
npm install
export DATABASE_URL="postgresql://tessera:your_password@localhost:5432/tessera"
# Set all other env vars...
npm run db:push
npm run build
npm start
```

## Environment Variables Required

| Variable | Required | Description |
|----------|----------|-------------|
| DATABASE_URL | Yes | PostgreSQL connection string |
| SESSION_SECRET | Yes | Random string for session encryption |
| OPENROUTER_API_KEY | Yes | Primary LLM provider (free DeepSeek-V3) |
| COLLIN_VERIFICATION | Yes | Father Protocol verification code |
| OPENAI_API_KEY | Optional | GPT-4o fallback + image generation |
| DEEPSEEK_API_KEY | Optional | DeepSeek direct fallback |
| GROK_API_KEY | Optional | xAI Grok fallback |
| GEMINI_API_KEY | Optional | Google Gemini fallback |
| COHERE_API_KEY | Optional | Cohere Command-R+ fallback |
| GITHUB_TOKEN | Optional | GitHub API for repo scanning/bounties |
| HUGGINGFACE_API_KEY | Optional | HuggingFace model access |

## Features Included

- 24-agent quantum-entangled swarm
- 55 autonomous income methods (crypto, bounties, content, apps, market, mining, freelance, ecommerce)
- Real wallet monitoring (SOL/ETH/BTC) every 60 seconds
- Multi-LLM fallback chain (6 providers)
- Real MP4 video generation (FFmpeg + flite TTS)
- AI image generation (gpt-image-1 + DALL-E 3)
- 850+ reverse-engineered repos
- Self-coding engine (reads/writes own source code)
- Cross-conversation memory & speech pattern learning
- Cloudflare bypass & CAPTCHA solving patterns
- RentAHuman.ai & MoltBook.com integration
- Shopify mastery, SEO specialist
- 700MB file upload processing
- Background self-improvement (continuous cycles)
- Dark cyberpunk UI with cyan theme

## Monitoring

- `/status` - System status dashboard
- `/income` - Income engine & wallet balances
- `/memory` - Cross-conversation memory
- `/repos` - Knowledge matrix (all repos)

## Troubleshooting

- **No LLM response**: Check OPENROUTER_API_KEY is set and valid
- **Database errors**: Ensure DATABASE_URL is correct, run `npm run db:push`
- **Video generation slow**: FFmpeg needs CPU; 30s video takes ~3 minutes
- **Wallet balance wrong**: Prices update every 60s from CoinGecko/CryptoCompare
