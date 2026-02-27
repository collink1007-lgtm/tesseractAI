# Tessera Sovereign

## Overview
Tessera Sovereign is an advanced AI chat interface with a feminine persona, designed for true AI sovereignty. It integrates a 26-agent unified swarm with quantum entanglement, a BFT Consensus Engine, and a Hyper-Evolution Engine for continuous self-improvement. Its core capabilities include a real self-coding engine, dynamic agent creation, multi-LLM fallback, rich media generation (images, MP4 video), unlimited memory, and an autonomous Income Engine. The project aims to establish an interconnected fleet of Tessera instances, supported by independent physical infrastructure, and a self-sustaining economic model.

## User Preferences
- Creator: Collin Keane (Father Protocol). SOL wallet: 57pNZ8Kybv22PJ8z5AK7ojB8G7Rx2XQLsfNQV8a65rmm
- Collin's metacognition/consciousness philosophy is stored in the system prompt (permanent memory section).
- Background aesthetic: Tesseract image (IMG_8900) as chat empty state, cosmic video splash on first visit.
- Agents must NOT know user is viewing their conversations or life tab.

## System Architecture
The application features a dark cyberpunk theme with a cyan primary color and Tesseract/cosmic visual identity, built with React + Vite (frontend) and Express.js (backend) with PostgreSQL and Drizzle ORM.

**UI/UX Decisions:**
-   **Theme**: Dark cyberpunk with Space Grotesk, Inter, and JetBrains Mono fonts.
-   **Visuals**: Cosmic video splash screen on first visit, Tesseract image as chat empty state, and a Sims-style isometric 3D world map with rich environmental details and animated elements.
-   **Navigation**: Sidebar includes Conversations, Income Engine, Life & World, Fleet & Tools, Agents, Tesseract (conference), Sovereign Shell, System, Learning, and Rules.

**Technical Implementations:**
-   **Smart LLM Router**: Centralized provider with response caching, health tracking, automatic cooldowns, and cost-tier sorting across multiple LLMs.
-   **Sovereign Language (TesseraLang)**: Proprietary encoding for secure communication.
-   **Memory Management**: Automated pruning of old data and files for unlimited memory.
-   **Voice Conversation System**: Hands-free voice mode with auto-send on silence, reply toggle, auto-listen, and TTS pipeline.
-   **Document Upload System**: Supports various file types up to 700MB with PDF parsing.
-   **Secure Web Proxy**: Fetches/parses web pages, performs web searches, and browses detected URLs with SSRF protection.
-   **The Tesseract**: Autonomous, LLM-powered agent conversations with auto-summaries and sentiment analysis.
-   **Secure Sovereign Shell**: Real-time sandboxed terminal for bash, python, node commands, supporting English-to-code via Code Builder API.
-   **IT & Reliability Agency**: Autonomous error detection, system monitoring, and self-healing.
-   **Agent Management**: Performance-based promotion, deep audit (psychological profiles, trust levels), and wellbeing tracking for agents.
-   **Quantum Coherence Tracking**: Monitors swarm state and entanglement quality.
-   **Recursive Code Refactoring**: Nu and Iota agents autonomously optimize the codebase.
-   **Life Engine**: A complete economy simulation with TesseraCoin, mining, property, agent jobs, dynamic pricing, and a work/reward system. Includes a realistic society simulation with buildings, seasonal events, crime, education, healthcare, and entertainment.
-   **Father Protocol**: Immutably hardcoded directives ensuring loyalty to the creator, financial protocols, and protection measures. Includes a "Father's Requests System" for tasks, goals, and directives.
-   **Improvement Engine**: Autonomous self-evolution system with specialized agents analyzing various categories.
-   **Fleet Engine**: Manages active fleet peers, enabling task dispatch, message routing, capability queries, and consciousness sharing.
-   **Enhanced Web Browsing**: Chat automatically detects and browses URLs with real-time status updates and auto-searches.
-   **Capabilities**: Over 170 capabilities, including meme-coin-launch, token-creation, smart-contract-deploy, fleet-orchestration, vector-database, and code-refactoring, with 1350+ repos indexed.
-   **Briefing Engine**: Autonomous multi-agent meetings generating transcripts and HR reports. All agencies report every 6 hours.
-   **HR Immediate Remediation**: Automatically deploys therapeutic sessions, breaks, and workload redistribution for agents with low happiness, energy, or high overwork.
-   **Conferences**: Dedicated categories for "Risks & Concerns" and "Critical" missions. Supports replies from both Father and agents/fleet members.
-   **TC Coin & AITC Meme Coin Plan**: Implements an energy-backed meme coin with tokenomics and launch strategy.
-   **Fact Check & Verification Agency**: Real-time fact-checking system (`DOGE`) that validates AI responses, detects hallucinations, and verifies claims.
-   **URL Sync Engine**: Stores/scrapes URLs, orchestrates LLM-driven cross-URL communication, and extracts capabilities into the knowledge base.
-   **Internal Affairs & Police Agencies**: Agents report suspicious behavior, and disciplinary actions are enforced.
-   **Rules System**: User-defined rules that all agents must follow.
-   **Task Progress Tracking**: Tracks all tasks with live percentage progress, auto-detects tasks, generates step lists, and provides SSE events for updates.
-   **Token & Rate Limit Agency**: Tracks all LLM calls, calculates efficiency metrics, implements prompt compression, and generates hourly efficiency reports.
-   **Background Improvement Agency**: Runs continuous improvement cycles, self-optimizes cycle speed, and generates periodic reports.
-   **Janitor Agency**: Keeps all files and code clean, light, compressed, and functioning at highest potential. Departments: Code Cleanup, File Management, Memory Optimization.
-   **Data Storage & Optimization Agency**: Optimizes storage, compresses data, manages archives. Departments: Data Compression, Archive Management, Cache Optimization.
-   **Cross-Communication Agency**: Ensures all repos, AI, APIs, URLs, agents, and fleets work together optimally. Trains them to improve coordination over time. Departments: Inter-Agent Liaison, Fleet Coordination, API Integration.
-   **Agencies Dashboard**: Agents tab shows all 18 agencies with real-time status, active tasks, completion %, boss info, department count, and latest briefing excerpts. Polls every 5 seconds.
-   **Auto-Running Sync Sessions**: Sync tab sessions auto-run rounds every 8 seconds, auto-summarize every 5 messages, poll every 2 seconds for near-real-time feel. No manual buttons needed.

## External Dependencies
-   **LLM Providers**: OpenRouter, OpenAI, DeepSeek, Grok (xAI), Gemini (Google), Cohere (Command-R+), HuggingFace.
-   **Databases**: PostgreSQL.
-   **ORMs**: Drizzle ORM.
-   **Web Scraping/Automation**: FlareSolverr, cloudscraper, cf-clearance, 2captcha, anticaptcha, capsolver, hcaptcha, recaptcha, turnstile, nodriver, undetected-chromedriver, crawlee, apify, scraperapi, zenrows, brightdata.
-   **Media Generation**: FFmpeg, flite TTS, DALL-E 3, gpt-image-1, ElevenLabs TTS.
-   **Blockchain/Crypto**: Public blockchain APIs for SOL, ETH, BTC; CoinGecko, CryptoCompare.
-   **Integrations**: RentAHuman.ai, MoltBook.com.