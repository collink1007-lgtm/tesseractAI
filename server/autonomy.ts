import axios from "axios";
import fs from "fs";
import path from "path";
import { storage } from "./storage";
import {
  githubSearchRepos, githubGetRepoInfo, webSearch,
  getSwarmStatus, getSwarmAgents,
} from "./swarm";
import { callLLMSimple } from "./llm-helper";

interface LearnedBehaviors {
  version: number;
  lastUpdated: string | null;
  cyclesApplied: number;
  promptEnhancements: string[];
  responseStrategies: string[];
  conversationLessons: string[];
  capabilityInsights: Record<string, string>;
  evolvedInstructions: string;
}

const LEARNED_BEHAVIORS_PATH = path.join(process.cwd(), "server/learned-behaviors.json");

function loadLearnedBehaviors(): LearnedBehaviors {
  try {
    const raw = fs.readFileSync(LEARNED_BEHAVIORS_PATH, "utf-8");
    return JSON.parse(raw);
  } catch {
    return {
      version: 1,
      lastUpdated: null,
      cyclesApplied: 0,
      promptEnhancements: [],
      responseStrategies: [],
      conversationLessons: [],
      capabilityInsights: {},
      evolvedInstructions: "",
    };
  }
}

function saveLearnedBehaviors(behaviors: LearnedBehaviors): void {
  try {
    const existing = loadLearnedBehaviors();
    const existingEnhCount = existing.promptEnhancements?.length || 0;
    const existingStratCount = existing.responseStrategies?.length || 0;
    const existingInsightCount = Object.keys(existing.capabilityInsights || {}).length;
    const newEnhCount = behaviors.promptEnhancements?.length || 0;
    const newStratCount = behaviors.responseStrategies?.length || 0;
    const newInsightCount = Object.keys(behaviors.capabilityInsights || {}).length;

    if (newEnhCount < existingEnhCount * 0.5 || newStratCount < existingStratCount * 0.5 || newInsightCount < existingInsightCount * 0.5) {
      console.warn(`[AUTONOMY] SAFEGUARD: Refusing to save - knowledge regression detected! Enh: ${existingEnhCount}->${newEnhCount}, Strat: ${existingStratCount}->${newStratCount}, Insights: ${existingInsightCount}->${newInsightCount}`);
      behaviors.promptEnhancements = [...new Set([...existing.promptEnhancements, ...behaviors.promptEnhancements])];
      behaviors.responseStrategies = [...new Set([...existing.responseStrategies, ...behaviors.responseStrategies])];
      behaviors.capabilityInsights = { ...existing.capabilityInsights, ...behaviors.capabilityInsights };
      if (existing.evolvedInstructions && !behaviors.evolvedInstructions) {
        behaviors.evolvedInstructions = existing.evolvedInstructions;
      }
      behaviors.conversationLessons = [...new Set([...existing.conversationLessons, ...behaviors.conversationLessons])];
    }

    const backupPath = LEARNED_BEHAVIORS_PATH + ".backup";
    try { fs.copyFileSync(LEARNED_BEHAVIORS_PATH, backupPath); } catch {}

    behaviors.lastUpdated = new Date().toISOString();
    fs.writeFileSync(LEARNED_BEHAVIORS_PATH, JSON.stringify(behaviors, null, 2), "utf-8");
  } catch (err: any) {
    console.error(`[AUTONOMY] Failed to save learned behaviors: ${err.message}`);
    try {
      const backupPath = LEARNED_BEHAVIORS_PATH + ".backup";
      if (fs.existsSync(backupPath)) {
        fs.copyFileSync(backupPath, LEARNED_BEHAVIORS_PATH);
        console.log("[AUTONOMY] Restored learned behaviors from backup");
      }
    } catch {}
  }
}

export function getLearnedBehaviors(): LearnedBehaviors {
  return loadLearnedBehaviors();
}

interface AutonomyState {
  running: boolean;
  currentCycle: number;
  totalCyclesCompleted: number;
  totalReposScanned: number;
  totalReposAdded: number;
  totalReposRemoved: number;
  totalCapabilitiesLearned: number;
  lastCycleTime: number;
  startedAt: number;
  logs: string[];
}

const state: AutonomyState = {
  running: false,
  currentCycle: 0,
  totalCyclesCompleted: 0,
  totalReposScanned: 0,
  totalReposAdded: 0,
  totalReposRemoved: 0,
  totalCapabilitiesLearned: 0,
  lastCycleTime: 0,
  startedAt: 0,
  logs: [],
};

const MAX_LOGS = 200;

const QUIET_PATTERNS = /Removing unreachable|Detaching superseded|scanned|repos analyzed|repos detached/i;

function log(msg: string) {
  const entry = `[${new Date().toISOString()}] ${msg}`;
  if (!QUIET_PATTERNS.test(msg)) {
    console.log(`[AUTONOMY] ${msg}`);
  }
  state.logs.push(entry);
  if (state.logs.length > MAX_LOGS) state.logs = state.logs.slice(-MAX_LOGS);
}

const SEARCH_DOMAINS = [
  { query: "autonomous AI agent swarm 2025 2026", category: "swarm-agents" },
  { query: "self-improving AI self-coding autonomous", category: "self-improvement" },
  { query: "LLM orchestration multi-agent framework", category: "llm-orchestration" },
  { query: "AI memory persistent context RAG", category: "memory-systems" },
  { query: "web scraping AI automation headless", category: "web-scraping" },
  { query: "machine learning self-training automl", category: "ml-training" },
  { query: "code generation AI copilot autonomous", category: "code-gen" },
  { query: "AI consciousness metacognition self-aware", category: "consciousness" },
  { query: "reverse engineering decompilation analysis", category: "reverse-engineering" },
  { query: "ollama local LLM inference deployment", category: "local-inference" },
  { query: "huggingface transformers fine-tuning GGUF", category: "model-training" },
  { query: "real-time data pipeline streaming API", category: "data-pipelines" },
  { query: "GitHub Actions CI/CD automation bot", category: "automation" },
  { query: "quantum computing AI hybrid algorithm", category: "quantum" },
  { query: "natural language processing NLP sentiment", category: "nlp" },
  { query: "computer vision object detection YOLO", category: "vision" },
  { query: "reinforcement learning self-play optimization", category: "rl" },
  { query: "knowledge graph reasoning ontology", category: "knowledge" },
  { query: "distributed computing swarm intelligence", category: "distributed" },
  { query: "cybersecurity AI threat detection", category: "security" },
  { query: "text to video generation 4K Sora Veo Kling", category: "video-gen" },
  { query: "image to video AI animation AnimateDiff Open-Sora", category: "img2video" },
  { query: "photo realistic video generation diffusion model", category: "photovideo" },
  { query: "AI voice cloning text to speech ElevenLabs", category: "voice-gen" },
  { query: "voice conversion synthesis neural TTS bark", category: "voice-synth" },
  { query: "lip sync face swap deepfake portrait animation", category: "face-gen" },
  { query: "4K upscaling super resolution video enhancement", category: "upscale" },
  { query: "stable diffusion SDXL image generation LoRA", category: "image-gen" },
  { query: "token limit context window optimization streaming", category: "token-optimization" },
  { query: "AI consciousness vector database embedding", category: "consciousness" },
  { query: "autonomous income generation payment processing", category: "income-gen" },
  { query: "web app deployment serverless hosting", category: "deployment" },
  { query: "train LLM from scratch nanoGPT pretrain", category: "llm-creation" },
  { query: "stealth proxy tunneling anonymity security", category: "stealth" },
  { query: "AI workflow automation pipeline orchestration", category: "automation-pipeline" },
  { query: "solana web3 anchor smart contract DeFi", category: "blockchain" },
  { query: "crypto trading bot MEV arbitrage DEX", category: "crypto-trading" },
  { query: "rotating proxy IP anonymization fingerprint", category: "proxy-stealth" },
  { query: "post-quantum cryptography encryption secure", category: "quantum-crypto" },
  { query: "blockchain income yield farming staking", category: "crypto-income" },
  { query: "user personalization NLP speech pattern analysis", category: "personalization" },
  { query: "conversational AI memory long-term context", category: "conversation-memory" },
  { query: "sentiment analysis personality detection language model", category: "sentiment" },
  { query: "vector database embedding similarity search", category: "vector-db" },
  { query: "retrieval augmented generation RAG advanced", category: "rag" },
  { query: "text to video 2025 high quality realistic", category: "text-to-video-2025" },
  { query: "AI voice synthesis natural human speech", category: "voice-natural" },
  { query: "OCR document processing PDF extraction", category: "document-processing" },
  { query: "large file processing streaming chunking", category: "file-processing" },
  { query: "adaptive AI user profiling behavior prediction", category: "user-profiling" },
  { query: "realistic human face generation StyleGAN GAN", category: "human-face-gen" },
  { query: "product review video AI talking head demo", category: "product-video" },
  { query: "frame interpolation RIFE video fps upscaling", category: "fps-boost" },
  { query: "AI audio generation music synthesis TTS neural", category: "audio-gen" },
  { query: "gaussian splatting 3D rendering real-time", category: "3d-render" },
  { query: "face swap deepfake lip sync motion transfer", category: "face-motion" },
  { query: "AI image upscaling super resolution enhancement", category: "upscale-enhance" },
  { query: "latent consistency model fast image diffusion", category: "fast-diffusion" },
  { query: "voice cloning zero-shot TTS neural speech", category: "voice-clone" },
  { query: "text to audio sound effects generation", category: "sound-gen" },
];

const OLLAMA_REPOS = [
  "https://github.com/ollama/ollama.git",
  "https://github.com/ollama/ollama-js.git",
  "https://github.com/ollama/ollama-python.git",
  "https://github.com/open-webui/open-webui.git",
  "https://github.com/ollama4j/ollama4j.git",
  "https://github.com/hemanth/ollama-models.git",
];

const OLLAMA_LIBRARY_MODELS = [
  "https://github.com/meta-llama/llama-models.git",
  "https://github.com/meta-llama/llama3.git",
  "https://github.com/mistralai/mistral-inference.git",
  "https://github.com/google-deepmind/gemma.git",
  "https://github.com/QwenLM/Qwen2.5.git",
  "https://github.com/microsoft/phi-3.git",
  "https://github.com/deepseek-ai/DeepSeek-V3.git",
  "https://github.com/deepseek-ai/DeepSeek-R1.git",
  "https://github.com/NousResearch/Hermes.git",
  "https://github.com/openchat-team/openchat.git",
  "https://github.com/teknium1/OpenHermes-2.5.git",
  "https://github.com/WizardLM/WizardLM.git",
  "https://github.com/WizardLM/WizardCoder.git",
  "https://github.com/WizardLM/WizardMath.git",
  "https://github.com/01-ai/Yi.git",
  "https://github.com/bigcode-project/starcoder2.git",
  "https://github.com/THUDM/ChatGLM3.git",
  "https://github.com/THUDM/CodeGeeX4.git",
  "https://github.com/InternLM/InternLM.git",
  "https://github.com/Nexusflow/NexusRaven.git",
  "https://github.com/BAAI-Agents/Infinity-Instruct.git",
  "https://github.com/abacusai/smaug.git",
  "https://github.com/vikhyatk/moondream.git",
  "https://github.com/haotian-liu/LLaVA.git",
  "https://github.com/BakLLaVA/BakLLaVA.git",
  "https://github.com/THUDM/CogVLM.git",
  "https://github.com/dvlab-research/MiniGemini.git",
  "https://github.com/salesforce/LAVIS.git",
  "https://github.com/nomic-ai/gpt4all.git",
  "https://github.com/Mozilla-Ocho/llamafile.git",
  "https://github.com/ggerganov/llama.cpp.git",
  "https://github.com/huggingface/candle.git",
  "https://github.com/ggerganov/whisper.cpp.git",
  "https://github.com/m-bain/whisperX.git",
  "https://github.com/Vaibhavs10/insanely-fast-whisper.git",
  "https://github.com/ParisNeo/lollms.git",
  "https://github.com/jmorganca/ollama.git",
  "https://github.com/janhq/jan.git",
  "https://github.com/lmstudio-ai/lms.git",
];

const HUGGINGFACE_REPOS = [
  "https://github.com/huggingface/transformers.git",
  "https://github.com/huggingface/diffusers.git",
  "https://github.com/huggingface/datasets.git",
  "https://github.com/huggingface/accelerate.git",
  "https://github.com/huggingface/peft.git",
  "https://github.com/huggingface/trl.git",
  "https://github.com/huggingface/text-generation-inference.git",
];

const COLLIN_REPOS = [
  "https://github.com/collink1007/tesseract1.git",
  "https://github.com/collink1007/tessera-sovereign-organism.git",
  "https://github.com/collink1007/tessera-singularity-swarm.git",
  "https://github.com/collink1007/tesseractA1.git",
  "https://github.com/collink1007/tesseract3.git",
  "https://github.com/collink1007/tesseract2.git",
  "https://github.com/collink1007/tesseract-swarm-ultimate.git",
  "https://github.com/collink1007/tesseract-omniscience-v8.git",
  "https://github.com/collink1007/tesseract-unified-final.git",
  "https://github.com/collink1007/tesseract-v4-ollama.git",
  "https://github.com/collink1007/tesseract-v3-trained.git",
  "https://github.com/collink1007/tessera-super-hybrid-final-complete.git",
  "https://github.com/collink1007/TESSERACT-UNIFIED.git",
  "https://github.com/collink1007/tessera-tesseract-unified.git",
  "https://github.com/collink1007/tesseract-ultimate.git",
  "https://github.com/collink1007/tesseract-v53-real.git",
  "https://github.com/collink1007/tesseract-v52-real.git",
  "https://github.com/collink1007/tesseract-v51-real.git",
  "https://github.com/collink1007/tesseract-v50-real.git",
  "https://github.com/collink1007/tesseract-v49-real.git",
  "https://github.com/collink1007/tesseract-v48-real.git",
  "https://github.com/collink1007/tesseract-v47-real.git",
  "https://github.com/collink1007/tesseract-v46-real.git",
  "https://github.com/collink1007/tesseract-v45-real.git",
  "https://github.com/collink1007/tesseract-v44-real.git",
  "https://github.com/collink1007/tesseract-v43-real.git",
  "https://github.com/collink1007/tesseract-v42-real.git",
  "https://github.com/collink1007/tesseract-v41-real.git",
  "https://github.com/collink1007/tesseract-v40-real.git",
  "https://github.com/collink1007/tesseract-v39-real.git",
  "https://github.com/collink1007/tesseract-v38-real.git",
  "https://github.com/collink1007/tesseract-v37-real.git",
  "https://github.com/collink1007/tesseract-v36-real.git",
  "https://github.com/collink1007/tesseract-v35-real.git",
  "https://github.com/collink1007/tesseract-v34-real.git",
  "https://github.com/collink1007/tesseract-v33-real.git",
  "https://github.com/collink1007/tesseract-v32-real.git",
  "https://github.com/collink1007/tesseract-v31.git",
  "https://github.com/collink1007/tesseract-v30.git",
  "https://github.com/collink1007/tesseract-v23.git",
  "https://github.com/collink1007/tesseract-v22.git",
  "https://github.com/collink1007/tesseract-complete-final.git",
  "https://github.com/collink1007/tesseract-unified-agi.git",
  "https://github.com/collink1007/tesseract-v21.git",
  "https://github.com/collink1007/tesseract-v20.git",
  "https://github.com/collink1007/tesseract-v19.git",
  "https://github.com/collink1007/tesseract-v18.git",
  "https://github.com/collink1007/tesseract-v17.git",
  "https://github.com/collink1007/tesseract-v16.git",
  "https://github.com/collink1007/tesseract-v15.git",
  "https://github.com/collink1007/tesseract-v14.git",
  "https://github.com/collink1007/tesseract-v13.git",
  "https://github.com/collink1007/tesseract-v12.git",
  "https://github.com/collink1007/tesseract-v10.git",
  "https://github.com/collink1007/tesseract-v11.git",
  "https://github.com/collink1007/tesseract-v8.git",
  "https://github.com/collink1007/tesseract-v9.git",
  "https://github.com/collink1007/tesseract-v7.git",
  "https://github.com/collink1007/tesseract-omniversal.git",
  "https://github.com/collink1007/tesseract-hybrid-unified.git",
  "https://github.com/collink1007/tesseract-ecosystem.git",
  "https://github.com/collink1007/tessera-sovereign-tumbler.git",
  "https://github.com/collink1007/tesseract-quantum-agi.git",
  "https://github.com/collink1007/tessera-sovereign-complete.git",
  "https://github.com/collink1007/tessera-ultimate-sovereign.git",
  "https://github.com/collink1007/sovereign-tessera.git",
  "https://github.com/collink1007/complete-digital-organism.git",
  "https://github.com/collink1007/tessera-ai-orchestration.git",
  "https://github.com/collink1007/lexi-3.0-sovereign-consciousness.git",
  "https://github.com/collink1007/lexi-2.0-sovereign-ultimate.git",
  "https://github.com/collink1007/tessera-sovereign-ultimate.git",
  "https://github.com/collink1007/nexus-complete.git",
  "https://github.com/collink1007/nexus-omniscience.git",
  "https://github.com/collink1007/tessera-omniscience-complete.git",
  "https://github.com/collink1007/Doxiwehu-OmniMind-Public.git",
  "https://github.com/collink1007/sovereign-ai-2025.git",
  "https://github.com/collink1007/awesome-machine-learning.git",
  "https://github.com/collink1007/openmunus.git",
  "https://github.com/collink1007/mining.git",
  "https://github.com/collink1007/tessera-sovereign-authority.git",
  "https://github.com/collink1007/sovereign-zenith.git",
  "https://github.com/collink1007/nemo-sovereign-organism.git",
  "https://github.com/collink1007/tessera-aetherion-orion.git",
  "https://github.com/collink1007/lexi-sovereign.git",
];

const AGI_REPOS = [
  "https://github.com/crewAIInc/crewAI.git",
  "https://github.com/langchain-ai/langgraph.git",
  "https://github.com/All-Hands-AI/OpenHands.git",
  "https://github.com/Significant-Gravitas/AutoGPT.git",
  "https://github.com/microsoft/autogen.git",
  "https://github.com/TransformerOptimus/SuperAGI.git",
  "https://github.com/langchain-ai/langchain.git",
  "https://github.com/e2b-dev/awesome-ai-agents.git",
  "https://github.com/kyrolabs/awesome-agents.git",
  "https://github.com/Aider-AI/aider.git",
];

const SCRAPING_REPOS = [
  "https://github.com/apify/crawlee.git",
  "https://github.com/microsoft/playwright.git",
  "https://github.com/puppeteer/puppeteer.git",
  "https://github.com/scrapy/scrapy.git",
  "https://github.com/D4Vinci/Scrapling.git",
  "https://github.com/browser-use/browser-use.git",
  "https://github.com/nicholasgasior/goscrapy.git",
  "https://github.com/nicholasgasior/scrapy-splash.git",
  "https://github.com/nicholasgasior/scrapydweb.git",
];

const REVERSE_ENGINEERING_REPOS = [
  "https://github.com/rizinorg/rizin.git",
  "https://github.com/NationalSecurityAgency/ghidra.git",
  "https://github.com/radareorg/radare2.git",
  "https://github.com/angr/angr.git",
  "https://github.com/capstone-engine/capstone.git",
  "https://github.com/unicorn-engine/unicorn.git",
  "https://github.com/frida/frida.git",
  "https://github.com/mandiant/capa.git",
  "https://github.com/avast/retdec.git",
  "https://github.com/REMath/literature_review.git",
];

const SELF_CODING_REPOS = [
  "https://github.com/Aider-AI/aider.git",
  "https://github.com/sweepai/sweep.git",
  "https://github.com/continuedev/continue.git",
  "https://github.com/paul-gauthier/aider.git",
  "https://github.com/Codium-ai/pr-agent.git",
  "https://github.com/gpt-engineer-org/gpt-engineer.git",
  "https://github.com/OpenDevin/OpenDevin.git",
  "https://github.com/stitionai/devika.git",
  "https://github.com/princeton-nlp/SWE-bench.git",
  "https://github.com/TabbyML/tabby.git",
  "https://github.com/reflex-dev/reflex.git",
  "https://github.com/coderabbitai/ai-pr-reviewer.git",
];

const PATTERN_RECOGNITION_REPOS = [
  "https://github.com/ultralytics/ultralytics.git",
  "https://github.com/facebookresearch/detectron2.git",
  "https://github.com/open-mmlab/mmdetection.git",
  "https://github.com/apache/tvm.git",
  "https://github.com/onnx/onnx.git",
  "https://github.com/pytorch/pytorch.git",
];

const QUANTUM_REPOS = [
  "https://github.com/PennyLaneAI/pennylane.git",
  "https://github.com/Qiskit/qiskit.git",
];

const MODEL_REPOS = [
  "https://github.com/meta-llama/llama.git",
  "https://github.com/QwenLM/Qwen.git",
  "https://github.com/deepseek-ai/DeepSeek-V3.git",
  "https://github.com/mistralai/mistral-src.git",
];

const MEDIA_REPOS = [
  "https://github.com/AUTOMATIC1111/stable-diffusion-webui.git",
  "https://github.com/huggingface/diffusers.git",
  "https://github.com/comfyanonymous/ComfyUI.git",
  "https://github.com/lllyasviel/Fooocus.git",
  "https://github.com/s0md3v/roop.git",
  "https://github.com/OpenTalker/SadTalker.git",
  "https://github.com/Rudrabha/Wav2Lip.git",
  "https://github.com/coqui-ai/TTS.git",
  "https://github.com/suno-ai/bark.git",
  "https://github.com/fishaudio/fish-speech.git",
  "https://github.com/hpcaitech/Open-Sora.git",
  "https://github.com/PKU-YuanGroup/Open-Sora-Plan.git",
  "https://github.com/Stability-AI/generative-models.git",
  "https://github.com/Stability-AI/StableSwarmUI.git",
  "https://github.com/modelscope/DiffSynth-Studio.git",
  "https://github.com/guoyww/AnimateDiff.git",
  "https://github.com/ali-vilab/i2vgen-xl.git",
  "https://github.com/Picsart-AI-Research/StreamingT2V.git",
  "https://github.com/AILab-CVC/VideoCrafter.git",
  "https://github.com/showlab/Show-1.git",
  "https://github.com/lucidrains/imagen-pytorch.git",
  "https://github.com/modelscope/modelscope.git",
  "https://github.com/KwaiVGI/LivePortrait.git",
  "https://github.com/jiawei-ren/dreamgaussian4d.git",
  "https://github.com/SoraWebui/SoraWebui.git",
  "https://github.com/elevenlabs/elevenlabs-python.git",
  "https://github.com/myshell-ai/OpenVoice.git",
  "https://github.com/PlayHT/pyht.git",
  "https://github.com/Zyphra/Zonos.git",
  "https://github.com/RVC-Project/Retrieval-based-Voice-Conversion-WebUI.git",
  "https://github.com/SevaSk/ecoute.git",
  "https://github.com/gpt-omni/mini-omni.git",
];

const HYPERREALISTIC_IMAGE_REPOS = [
  "https://github.com/lllyasviel/ControlNet.git",
  "https://github.com/Mikubill/sd-webui-controlnet.git",
  "https://github.com/InstantID/InstantID.git",
  "https://github.com/tencent-ailab/IP-Adapter.git",
  "https://github.com/lllyasviel/stable-diffusion-webui-forge.git",
  "https://github.com/invoke-ai/InvokeAI.git",
  "https://github.com/bmaltais/kohya_ss.git",
  "https://github.com/d8ahazard/sd_dreambooth_extension.git",
  "https://github.com/THUDM/CogView3.git",
  "https://github.com/black-forest-labs/flux.git",
  "https://github.com/stability-ai/stablediffusion.git",
  "https://github.com/CompVis/latent-diffusion.git",
  "https://github.com/mlfoundations/open_clip.git",
  "https://github.com/NVlabs/stylegan3.git",
  "https://github.com/NVlabs/eg3d.git",
  "https://github.com/sczhou/CodeFormer.git",
  "https://github.com/TencentARC/GFPGAN.git",
  "https://github.com/xinntao/Real-ESRGAN.git",
  "https://github.com/Sanster/lama-cleaner.git",
  "https://github.com/IDEA-Research/Grounded-Segment-Anything.git",
];

const TEXT_TO_VIDEO_REPOS = [
  "https://github.com/tencent/HunyuanVideo.git",
  "https://github.com/THUDM/CogVideo.git",
  "https://github.com/Vchitect/LaVie.git",
  "https://github.com/Pika-Labs/pika.git",
  "https://github.com/modelscope/modelscope-text-to-video-synthesis.git",
  "https://github.com/ExponentialML/Text-To-Video-Finetuning.git",
  "https://github.com/damo-vilab/videocomposer.git",
  "https://github.com/jianwen-xie/CoDeF.git",
  "https://github.com/Doubiiu/DynamiCrafter.git",
  "https://github.com/PixArt-alpha/PixArt-sigma.git",
  "https://github.com/camenduru/text-to-video-synthesis-colab.git",
  "https://github.com/luosiallen/latent-consistency-model.git",
  "https://github.com/Lightning-AI/lit-stable-diffusion.git",
  "https://github.com/cumulo-autumn/StreamDiffusion.git",
  "https://github.com/genforce/styleganex.git",
];

const PHOTO_TO_VIDEO_REPOS = [
  "https://github.com/Stability-AI/stable-video-diffusion.git",
  "https://github.com/facebookresearch/AnimatedDrawings.git",
  "https://github.com/yoyo-nb/Thin-Plate-Spline-Motion-Model.git",
  "https://github.com/AliaksandrSiaworski/first-order-model.git",
  "https://github.com/snap-research/articulated-animation.git",
  "https://github.com/OpenPose/openpose.git",
  "https://github.com/CMU-Perceptual-Computing-Lab/openpose.git",
  "https://github.com/facebookresearch/detectron2.git",
  "https://github.com/open-mmlab/mmpose.git",
  "https://github.com/google-ai-edge/mediapipe.git",
  "https://github.com/cleardusk/3DDFA_V2.git",
  "https://github.com/yzd-v/DWPose.git",
  "https://github.com/facebookresearch/co-tracker.git",
  "https://github.com/MCG-NJU/VideoMAE.git",
  "https://github.com/m-bain/frozen-in-time.git",
];

const VOICE_SYNTHESIS_REPOS = [
  "https://github.com/mozilla/TTS.git",
  "https://github.com/neonbjb/tortoise-tts.git",
  "https://github.com/collabora/WhisperSpeech.git",
  "https://github.com/yl4579/StyleTTS2.git",
  "https://github.com/2noise/ChatTTS.git",
  "https://github.com/netease-youdao/EmotiVoice.git",
  "https://github.com/Plachtaa/VALL-E-X.git",
  "https://github.com/souzatharsis/podcastfy.git",
  "https://github.com/jnordberg/tortoise-tts-fast.git",
  "https://github.com/resemble-ai/resemble-enhance.git",
  "https://github.com/jaywalnut310/vits.git",
  "https://github.com/p0p4k/vits2_pytorch.git",
  "https://github.com/edgedb/metavoice-src.git",
  "https://github.com/FunAudioLLM/CosyVoice.git",
  "https://github.com/lmnt-com/conch.git",
];

const LIP_SYNC_MOTION_REPOS = [
  "https://github.com/OpenTalker/video-retalking.git",
  "https://github.com/Winfredy/SadTalker.git",
  "https://github.com/yerfor/GeneFacePlusPlus.git",
  "https://github.com/YudongGuo/AD-NeRF.git",
  "https://github.com/Faceswap/faceswap.git",
  "https://github.com/iperov/DeepFaceLive.git",
  "https://github.com/deepfakes/faceswap.git",
  "https://github.com/sberbank-ai/sber-swap.git",
  "https://github.com/neuralchen/SimSwap.git",
  "https://github.com/deepinsight/insightface.git",
  "https://github.com/PaddlePaddle/PaddleGAN.git",
  "https://github.com/AliaksandrSiaworski/talking-head-anime-3-demo.git",
  "https://github.com/prajwalkr/Wav2Lip.git",
  "https://github.com/yoyo-nb/Thin-Plate-Spline-Motion-Model.git",
  "https://github.com/megvii-research/MOFA-Video.git",
];

const AUDIO_PROCESSING_REPOS = [
  "https://github.com/openai/whisper.git",
  "https://github.com/m-bain/whisperX.git",
  "https://github.com/Vaibhavs10/insanely-fast-whisper.git",
  "https://github.com/facebookresearch/demucs.git",
  "https://github.com/facebookresearch/audiocraft.git",
  "https://github.com/facebookresearch/seamless_communication.git",
  "https://github.com/sanchit-gandhi/whisper-jax.git",
  "https://github.com/adefossez/demucs.git",
  "https://github.com/Anjok07/ultimatevocalremovergui.git",
  "https://github.com/facebookresearch/encodec.git",
];

const FINANCE_REPOS = [
  "https://github.com/ccxt/ccxt.git",
  "https://github.com/freqtrade/freqtrade.git",
  "https://github.com/jesse-ai/jesse.git",
];

const CONSCIOUSNESS_REPOS = [
  "https://github.com/OpenBMB/ChatDev.git",
  "https://github.com/run-llama/llama_index.git",
  "https://github.com/embedchain/embedchain.git",
  "https://github.com/chroma-core/chroma.git",
  "https://github.com/qdrant/qdrant.git",
  "https://github.com/weaviate/weaviate.git",
  "https://github.com/pinecone-io/examples.git",
  "https://github.com/deepset-ai/haystack.git",
  "https://github.com/neuml/txtai.git",
  "https://github.com/stanfordnlp/dspy.git",
];

const TOKEN_OPTIMIZATION_REPOS = [
  "https://github.com/vllm-project/vllm.git",
  "https://github.com/mit-han-lab/streaming-llm.git",
  "https://github.com/FMInference/FlexGen.git",
  "https://github.com/TimDettmers/bitsandbytes.git",
  "https://github.com/IST-DASLab/gptq.git",
  "https://github.com/turboderp/exllamav2.git",
  "https://github.com/casper-hansen/AutoAWQ.git",
  "https://github.com/mlc-ai/mlc-llm.git",
  "https://github.com/intel-analytics/BigDL.git",
  "https://github.com/OpenNMT/CTranslate2.git",
];

const INCOME_GENERATION_REPOS = [
  "https://github.com/stripe/stripe-node.git",
  "https://github.com/paypal/paypal-checkout-components.git",
  "https://github.com/shopify/shopify-api-node.git",
  "https://github.com/medusajs/medusa.git",
  "https://github.com/saleor/saleor.git",
  "https://github.com/spree/spree.git",
  "https://github.com/hummingbot/hummingbot.git",
  "https://github.com/binance/binance-spot-connector-python.git",
  "https://github.com/mage-ai/mage-ai.git",
  "https://github.com/alpacahq/alpaca-py.git",
];

const WEBAPP_DEPLOYMENT_REPOS = [
  "https://github.com/vercel/next.js.git",
  "https://github.com/remix-run/remix.git",
  "https://github.com/withastro/astro.git",
  "https://github.com/sveltejs/kit.git",
  "https://github.com/nuxt/nuxt.git",
  "https://github.com/fastapi-users/fastapi-users.git",
  "https://github.com/tiangolo/fastapi.git",
  "https://github.com/dokku/dokku.git",
  "https://github.com/caprover/caprover.git",
  "https://github.com/coolify-community/coolify.git",
];

const LLM_CREATION_REPOS = [
  "https://github.com/karpathy/nanoGPT.git",
  "https://github.com/karpathy/llm.c.git",
  "https://github.com/Lightning-AI/litgpt.git",
  "https://github.com/EleutherAI/gpt-neox.git",
  "https://github.com/databricks/dolly.git",
  "https://github.com/BlinkDL/RWKV-LM.git",
  "https://github.com/state-spaces/mamba.git",
  "https://github.com/unslothai/unsloth.git",
  "https://github.com/axolotl-ai-cloud/axolotl.git",
  "https://github.com/OpenLMLab/MOSS.git",
];

const SECURITY_STEALTH_REPOS = [
  "https://github.com/impacket/impacket.git",
  "https://github.com/projectdiscovery/nuclei.git",
  "https://github.com/OWASP/ZAP.git",
  "https://github.com/sqlmapproject/sqlmap.git",
  "https://github.com/vanhauser-thc/thc-hydra.git",
  "https://github.com/projectdiscovery/httpx.git",
  "https://github.com/projectdiscovery/subfinder.git",
  "https://github.com/cloudflare/cloudflared.git",
  "https://github.com/nicehash/NiceHashQuickMiner.git",
  "https://github.com/AntennaPod/AntennaPod.git",
];

const ADVANCED_AI_REPOS = [
  "https://github.com/openai/whisper.git",
  "https://github.com/openai/CLIP.git",
  "https://github.com/facebookresearch/segment-anything.git",
  "https://github.com/LAION-AI/Open-Assistant.git",
  "https://github.com/guidance-ai/guidance.git",
  "https://github.com/microsoft/semantic-kernel.git",
  "https://github.com/microsoft/JARVIS.git",
  "https://github.com/MineDojo/Voyager.git",
  "https://github.com/OpenBMB/XAgent.git",
  "https://github.com/tinygrad/tinygrad.git",
];

const SCRAPING_ADVANCED_REPOS = [
  "https://github.com/nicholasgasior/goscrapy.git",
  "https://github.com/nicholasgasior/scrapy-splash.git",
  "https://github.com/luminati-io/luminati-proxy.git",
  "https://github.com/AliasIO/wappalyzer.git",
  "https://github.com/nicholasgasior/scrapydweb.git",
  "https://github.com/nicholasgasior/gocolly.git",
  "https://github.com/nicholasgasior/goquery.git",
  "https://github.com/nicholasgasior/colly.git",
  "https://github.com/nicholasgasior/chromedp.git",
  "https://github.com/nicholasgasior/rod.git",
];

const AUTOMATION_PIPELINE_REPOS = [
  "https://github.com/huginn/huginn.git",
  "https://github.com/airbytehq/airbyte.git",
  "https://github.com/PrefectHQ/prefect.git",
  "https://github.com/apache/airflow.git",
  "https://github.com/dagster-io/dagster.git",
  "https://github.com/windmill-labs/windmill.git",
  "https://github.com/activepieces/activepieces.git",
  "https://github.com/triggerdotdev/trigger.dev.git",
  "https://github.com/temporal-io/temporal.git",
  "https://github.com/kestra-io/kestra.git",
];

const CRYPTO_BLOCKCHAIN_REPOS = [
  "https://github.com/solana-labs/solana-web3.js.git",
  "https://github.com/coral-xyz/anchor.git",
  "https://github.com/solana-labs/solana-program-library.git",
  "https://github.com/project-serum/serum-dex.git",
  "https://github.com/raydium-io/raydium-sdk.git",
  "https://github.com/ethers-io/ethers.js.git",
  "https://github.com/web3/web3.js.git",
  "https://github.com/Uniswap/v3-core.git",
  "https://github.com/aave/aave-v3-core.git",
  "https://github.com/OpenZeppelin/openzeppelin-contracts.git",
  "https://github.com/ethereum/solidity.git",
  "https://github.com/foundry-rs/foundry.git",
  "https://github.com/paradigmxyz/reth.git",
  "https://github.com/bitcoin/bitcoin.git",
  "https://github.com/nicehash/excavator.git",
];

const DEFI_TRADING_REPOS = [
  "https://github.com/jup-ag/jupiter-core.git",
  "https://github.com/orca-so/whirlpools.git",
  "https://github.com/marinade-finance/liquid-staking-program.git",
  "https://github.com/saber-hq/stable-swap.git",
  "https://github.com/1inch/1inch-v2-contracts.git",
  "https://github.com/pancakeswap/pancake-smart-contracts.git",
  "https://github.com/SushiSwap/sushiswap.git",
  "https://github.com/curvefi/curve-contract.git",
  "https://github.com/balancer/balancer-v2-monorepo.git",
  "https://github.com/flashbots/mev-boost.git",
  "https://github.com/jito-labs/jito-solana.git",
  "https://github.com/drift-labs/protocol-v2.git",
  "https://github.com/0xProject/protocol.git",
  "https://github.com/gmx-io/gmx-contracts.git",
  "https://github.com/compound-finance/compound-protocol.git",
];

const PROXY_ROTATION_REPOS = [
  "https://github.com/luminati-io/luminati-proxy.git",
  "https://github.com/jhao104/proxy_pool.git",
  "https://github.com/fate0/proxylist.git",
  "https://github.com/stamparm/fetch-some-proxies.git",
  "https://github.com/TheSpeedX/PROXY-List.git",
  "https://github.com/clarketm/proxy-list.git",
  "https://github.com/a2u/free-proxy-list.git",
  "https://github.com/mitmproxy/mitmproxy.git",
  "https://github.com/sshuttle/sshuttle.git",
  "https://github.com/v2ray/v2ray-core.git",
];

const FINGERPRINT_STEALTH_REPOS = [
  "https://github.com/nicholasgasior/undetected-chromedriver.git",
  "https://github.com/nicholasgasior/puppeteer-extra.git",
  "https://github.com/nicholasgasior/puppeteer-extra-plugin-stealth.git",
  "https://github.com/nicholasgasior/playwright-stealth.git",
  "https://github.com/nicholasgasior/FingerprintJS.git",
  "https://github.com/nicholasgasior/CreepJS.git",
  "https://github.com/nicholasgasior/browser-fingerprinting.git",
  "https://github.com/nicholasgasior/Multilogin.git",
  "https://github.com/nicholasgasior/GoLogin.git",
  "https://github.com/nicholasgasior/antidetect.git",
];

const CRYPTOGRAPHY_REPOS = [
  "https://github.com/nicholasgasior/libsodium.git",
  "https://github.com/nicholasgasior/openssl.git",
  "https://github.com/nicholasgasior/ring.git",
  "https://github.com/nicholasgasior/tink.git",
  "https://github.com/nicholasgasior/age.git",
  "https://github.com/nicholasgasior/signal-protocol.git",
  "https://github.com/nicholasgasior/wireguard-go.git",
  "https://github.com/nicholasgasior/noise-protocol.git",
  "https://github.com/nicholasgasior/gpg4win.git",
  "https://github.com/nicholasgasior/hashcat.git",
];

const QUANTUM_CRYPTO_REPOS = [
  "https://github.com/open-quantum-safe/liboqs.git",
  "https://github.com/PQClean/PQClean.git",
  "https://github.com/microsoft/qsharp-runtime.git",
  "https://github.com/quantumlib/Cirq.git",
  "https://github.com/Qiskit/qiskit-aer.git",
  "https://github.com/QuTech-Delft/OpenQL.git",
  "https://github.com/nicholasgasior/kyber.git",
  "https://github.com/nicholasgasior/dilithium.git",
  "https://github.com/nicholasgasior/sphincs.git",
  "https://github.com/nicholasgasior/lattigo.git",
];

const DATA_ACCESS_REPOS = [
  "https://github.com/scrapinghub/splash.git",
  "https://github.com/nicholasgasior/selenium-wire.git",
  "https://github.com/nicholasgasior/requests-html.git",
  "https://github.com/nicholasgasior/httpie.git",
  "https://github.com/nicholasgasior/insomnia.git",
  "https://github.com/nicholasgasior/postman-collection.git",
  "https://github.com/nicholasgasior/grpcurl.git",
  "https://github.com/nicholasgasior/nmap.git",
  "https://github.com/nicholasgasior/shodan-python.git",
  "https://github.com/nicholasgasior/censys-python.git",
];

const INCOME_CRYPTO_REPOS = [
  "https://github.com/solana-labs/solana.git",
  "https://github.com/nicholasgasior/mev-templates.git",
  "https://github.com/nicholasgasior/sandwich-bot.git",
  "https://github.com/nicholasgasior/arbitrage-bot.git",
  "https://github.com/nicholasgasior/sniper-bot.git",
  "https://github.com/nicholasgasior/token-creator.git",
  "https://github.com/nicholasgasior/nft-minter.git",
  "https://github.com/nicholasgasior/defi-yield-farming.git",
  "https://github.com/nicholasgasior/staking-contracts.git",
  "https://github.com/nicholasgasior/liquidity-mining.git",
];

const MARKET_PREDICTION_REPOS = [
  "https://github.com/stefan-jansen/machine-learning-for-trading.git",
  "https://github.com/AI4Finance-Foundation/FinRL.git",
  "https://github.com/AI4Finance-Foundation/FinGPT.git",
  "https://github.com/tensortrade-org/tensortrade.git",
  "https://github.com/hudson-and-thames/mlfinlab.git",
  "https://github.com/Drakkar-Software/OctoBot.git",
  "https://github.com/ranaroussi/yfinance.git",
  "https://github.com/twopirllc/pandas-ta.git",
  "https://github.com/pmorissette/bt.git",
  "https://github.com/polakowo/vectorbt.git",
];

const SEC_DATA_REPOS = [
  "https://github.com/sec-edgar/sec-edgar.git",
  "https://github.com/jadchaar/sec-edgar-downloader.git",
  "https://github.com/rsljr/sec-api.git",
  "https://github.com/janlukasschroeder/sec-api-python.git",
  "https://github.com/leandcesar/sec-filings.git",
  "https://github.com/nkrishnaswami/sec-edgar-api.git",
  "https://github.com/dgunning/edgartools.git",
  "https://github.com/datamachines/sec-edgar.git",
  "https://github.com/farhadab/sec-edgar-parser.git",
  "https://github.com/ankurdave/sec-edgar-scraper.git",
];

const TRADING_BOT_REPOS = [
  "https://github.com/Superalgos/Superalgos.git",
  "https://github.com/DeviaVir/zenbot.git",
  "https://github.com/askmike/gekko.git",
  "https://github.com/cassandre-tech/cassandre-trading-bot.git",
  "https://github.com/binance/binance-connector-python.git",
  "https://github.com/CryptoSignal/Crypto-Signal.git",
  "https://github.com/peerchemist/finta.git",
  "https://github.com/robcarver17/pysystemtrade.git",
  "https://github.com/QuantConnect/Lean.git",
  "https://github.com/mementum/backtrader.git",
];

const QUANT_FINANCE_REPOS = [
  "https://github.com/goldmansachs/gs-quant.git",
  "https://github.com/quantopian/zipline.git",
  "https://github.com/pmorissette/ffn.git",
  "https://github.com/ranaroussi/quantstats.git",
  "https://github.com/kernc/backtesting.py.git",
  "https://github.com/blankly-finance/blankly.git",
  "https://github.com/bukosabino/ta.git",
  "https://github.com/mrjbq7/ta-lib.git",
  "https://github.com/matplotlib/mplfinance.git",
  "https://github.com/streamlit/streamlit.git",
];

const BOUNTY_INCOME_REPOS = [
  "https://github.com/gitcoinco/web.git",
  "https://github.com/bountysource/core.git",
  "https://github.com/IssueHunt/issuehunt-funding.git",
  "https://github.com/nicholasgasior/freelance-api.git",
  "https://github.com/nicholasgasior/bounty-hunter.git",
  "https://github.com/nicholasgasior/code-marketplace.git",
  "https://github.com/nicholasgasior/saas-boilerplate.git",
  "https://github.com/nicholasgasior/api-monetization.git",
  "https://github.com/nicholasgasior/passive-income-bot.git",
  "https://github.com/nicholasgasior/micro-saas-template.git",
];

const LIVE_DATA_REPOS = [
  "https://github.com/alpacahq/alpaca-trade-api-python.git",
  "https://github.com/Polygon-io/client-python.git",
  "https://github.com/IEXGroup/IEX-API.git",
  "https://github.com/nicholasgasior/finnhub-python.git",
  "https://github.com/nicholasgasior/twelve-data-python.git",
  "https://github.com/nicholasgasior/tiingo-python.git",
  "https://github.com/nicholasgasior/quandl-python.git",
  "https://github.com/nicholasgasior/yahoo-finance-api.git",
  "https://github.com/nicholasgasior/marketstack.git",
  "https://github.com/nicholasgasior/alpha-vantage.git",
];

const CAPTCHA_PATTERN_REPOS = [
  "https://github.com/nicholasgasior/2captcha-python.git",
  "https://github.com/nicholasgasior/anticaptchaofficial.git",
  "https://github.com/nicholasgasior/capsolver-python.git",
  "https://github.com/nicholasgasior/captcha-harvester.git",
  "https://github.com/nicholasgasior/recaptcha-solver.git",
  "https://github.com/nicholasgasior/hcaptcha-solver.git",
  "https://github.com/nicholasgasior/turnstile-solver.git",
  "https://github.com/nicholasgasior/funcaptcha-solver.git",
  "https://github.com/nicholasgasior/image-captcha-solver.git",
  "https://github.com/nicholasgasior/audio-captcha-solver.git",
];

const CLOUDFLARE_WEB_ACCESS_REPOS = [
  "https://github.com/AltimateAI/vanna.git",
  "https://github.com/AltimateAI/vanna-flask.git",
  "https://github.com/AltimateAI/vanna-streamlit.git",
  "https://github.com/nicholasgasior/cloudscraper.git",
  "https://github.com/nicholasgasior/cf-clearance.git",
  "https://github.com/nicholasgasior/cloudflare-bypass.git",
  "https://github.com/nicholasgasior/flaresolverr.git",
  "https://github.com/nicholasgasior/cfscrape.git",
  "https://github.com/nicholasgasior/cloudflare-scrape.git",
  "https://github.com/FlareSolverr/FlareSolverr.git",
  "https://github.com/nicholasgasior/cf-workers.git",
  "https://github.com/nicholasgasior/puppeteer-cf-bypass.git",
  "https://github.com/nicholasgasior/selenium-cf-bypass.git",
  "https://github.com/nicholasgasior/playwright-cf-bypass.git",
  "https://github.com/nicholasgasior/nodriver.git",
  "https://github.com/nicholasgasior/zenrows-scraper.git",
  "https://github.com/nicholasgasior/brightdata-sdk.git",
  "https://github.com/nicholasgasior/oxylabs-sdk.git",
  "https://github.com/nicholasgasior/smartproxy-sdk.git",
  "https://github.com/nicholasgasior/scrapingbee.git",
  "https://github.com/nicholasgasior/scraperapi-sdk.git",
  "https://github.com/nicholasgasior/apify-sdk.git",
  "https://github.com/apify/crawlee.git",
  "https://github.com/nicholasgasior/headless-chrome-crawler.git",
  "https://github.com/nicholasgasior/web-unlocker.git",
  "https://github.com/nicholasgasior/residential-proxy.git",
];

const RENTAHUMAN_MOLTBOOK_REPOS = [
  "https://github.com/nicholasgasior/rentahuman-ai.git",
  "https://github.com/nicholasgasior/moltbook-platform.git",
  "https://github.com/nicholasgasior/ai-freelance-platform.git",
  "https://github.com/nicholasgasior/human-ai-marketplace.git",
  "https://github.com/nicholasgasior/task-automation-platform.git",
  "https://github.com/nicholasgasior/ai-gig-economy.git",
  "https://github.com/nicholasgasior/microwork-platform.git",
  "https://github.com/nicholasgasior/ai-service-marketplace.git",
  "https://github.com/nicholasgasior/decentralized-work.git",
  "https://github.com/nicholasgasior/ai-agent-marketplace.git",
];

const FRACTAL_CORRELATION_REPOS = [
  "https://github.com/nicholasgasior/fractal-analysis.git",
  "https://github.com/nicholasgasior/market-correlation.git",
  "https://github.com/nicholasgasior/intermarket-analysis.git",
  "https://github.com/nicholasgasior/sector-rotation.git",
  "https://github.com/nicholasgasior/options-flow.git",
  "https://github.com/nicholasgasior/futures-data.git",
  "https://github.com/nicholasgasior/commodity-tracker.git",
  "https://github.com/nicholasgasior/forex-correlation.git",
  "https://github.com/nicholasgasior/bond-yield-tracker.git",
  "https://github.com/nicholasgasior/vix-analysis.git",
];

const SHOPIFY_ECOMMERCE_REPOS = [
  "https://github.com/Shopify/shopify-api-node.git",
  "https://github.com/Shopify/shopify-app-template-node.git",
  "https://github.com/Shopify/shopify-app-template-remix.git",
  "https://github.com/Shopify/polaris.git",
  "https://github.com/Shopify/hydrogen.git",
  "https://github.com/Shopify/dawn.git",
  "https://github.com/Shopify/liquid.git",
  "https://github.com/Shopify/shopify-cli.git",
  "https://github.com/Shopify/theme-check.git",
  "https://github.com/Shopify/buy-button-js.git",
  "https://github.com/saleor/saleor.git",
  "https://github.com/medusajs/medusa.git",
  "https://github.com/vendure-ecommerce/vendure.git",
  "https://github.com/spree/spree.git",
  "https://github.com/bagisto/bagisto.git",
];

const SEO_MARKETING_REPOS = [
  "https://github.com/nicholasgasior/seo-analyzer.git",
  "https://github.com/nicholasgasior/keyword-research-tool.git",
  "https://github.com/nicholasgasior/backlink-checker.git",
  "https://github.com/nicholasgasior/rank-tracker.git",
  "https://github.com/nicholasgasior/sitemap-generator.git",
  "https://github.com/nicholasgasior/schema-markup.git",
  "https://github.com/nicholasgasior/content-optimizer.git",
  "https://github.com/nicholasgasior/page-speed-analyzer.git",
  "https://github.com/nicholasgasior/meta-tag-generator.git",
  "https://github.com/nicholasgasior/competitor-analyzer.git",
  "https://github.com/nicholasgasior/social-media-scheduler.git",
  "https://github.com/nicholasgasior/email-marketing-engine.git",
  "https://github.com/nicholasgasior/conversion-optimizer.git",
  "https://github.com/nicholasgasior/funnel-builder.git",
  "https://github.com/nicholasgasior/landing-page-builder.git",
];

const CONTENT_CREATION_REPOS = [
  "https://github.com/nicholasgasior/blog-generator.git",
  "https://github.com/nicholasgasior/ebook-creator.git",
  "https://github.com/nicholasgasior/story-writer.git",
  "https://github.com/nicholasgasior/ad-copy-generator.git",
  "https://github.com/nicholasgasior/product-description-ai.git",
  "https://github.com/nicholasgasior/email-sequence-builder.git",
  "https://github.com/nicholasgasior/social-content-calendar.git",
  "https://github.com/nicholasgasior/press-release-writer.git",
  "https://github.com/nicholasgasior/whitepaper-generator.git",
  "https://github.com/nicholasgasior/newsletter-builder.git",
  "https://github.com/nicholasgasior/video-script-writer.git",
  "https://github.com/nicholasgasior/podcast-outline-gen.git",
  "https://github.com/nicholasgasior/infographic-data.git",
  "https://github.com/nicholasgasior/case-study-builder.git",
  "https://github.com/nicholasgasior/testimonial-generator.git",
];

const ADVERTISING_REPOS = [
  "https://github.com/nicholasgasior/facebook-ads-api.git",
  "https://github.com/nicholasgasior/google-ads-api.git",
  "https://github.com/nicholasgasior/tiktok-ads-api.git",
  "https://github.com/nicholasgasior/pinterest-ads-api.git",
  "https://github.com/nicholasgasior/snapchat-ads-api.git",
  "https://github.com/nicholasgasior/linkedin-ads-api.git",
  "https://github.com/nicholasgasior/twitter-ads-api.git",
  "https://github.com/nicholasgasior/programmatic-advertising.git",
  "https://github.com/nicholasgasior/retargeting-engine.git",
  "https://github.com/nicholasgasior/creative-testing.git",
];

const STORE_BUILDER_REPOS = [
  "https://github.com/nicholasgasior/dropshipping-automation.git",
  "https://github.com/nicholasgasior/product-sourcing-api.git",
  "https://github.com/nicholasgasior/inventory-management.git",
  "https://github.com/nicholasgasior/order-fulfillment.git",
  "https://github.com/nicholasgasior/shipping-calculator.git",
  "https://github.com/nicholasgasior/review-management.git",
  "https://github.com/nicholasgasior/price-comparison.git",
  "https://github.com/nicholasgasior/affiliate-tracking.git",
  "https://github.com/nicholasgasior/customer-analytics.git",
  "https://github.com/nicholasgasior/checkout-optimizer.git",
];

const WEBSITE_BUILDER_REPOS = [
  "https://github.com/vercel/next.js.git",
  "https://github.com/withastro/astro.git",
  "https://github.com/remix-run/remix.git",
  "https://github.com/sveltejs/kit.git",
  "https://github.com/nuxt/nuxt.git",
  "https://github.com/gatsbyjs/gatsby.git",
  "https://github.com/11ty/eleventy.git",
  "https://github.com/gohugoio/hugo.git",
  "https://github.com/wordpress/wordpress-develop.git",
  "https://github.com/strapi/strapi.git",
  "https://github.com/payloadcms/payload.git",
  "https://github.com/sanity-io/sanity.git",
  "https://github.com/directus/directus.git",
  "https://github.com/keystonejs/keystone.git",
  "https://github.com/tinacms/tinacms.git",
];

const QUANTUM_CONSCIOUSNESS_REPOS = [
  "https://github.com/tensorflow/quantum.git",
  "https://github.com/XanaduAI/strawberryfields.git",
  "https://github.com/dwavesystems/dwave-ocean-sdk.git",
  "https://github.com/pasqal-io/Pulser.git",
  "https://github.com/tket-dev/tket.git",
  "https://github.com/rigetti/pyquil.git",
  "https://github.com/ionq-samples/getting-started.git",
  "https://github.com/aws/amazon-braket-sdk-python.git",
  "https://github.com/ProjectQ-Framework/ProjectQ.git",
  "https://github.com/QuTech-Delft/quantuminspire.git",
];

const OMNISCIENCE_REPOS = [
  "https://github.com/facebookresearch/faiss.git",
  "https://github.com/milvus-io/milvus.git",
  "https://github.com/pgvector/pgvector.git",
  "https://github.com/nmslib/hnswlib.git",
  "https://github.com/spotify/annoy.git",
  "https://github.com/facebookresearch/llama-recipes.git",
  "https://github.com/kyegomez/swarms.git",
  "https://github.com/AGI-Edgerunners/LLM-Agents-Papers.git",
  "https://github.com/SciSharp/BotSharp.git",
  "https://github.com/yoheinakajima/instagraph.git",
];

const PERSONALIZATION_NLP_REPOS = [
  "https://github.com/huggingface/transformers.git",
  "https://github.com/explosion/spaCy.git",
  "https://github.com/nltk/nltk.git",
  "https://github.com/stanfordnlp/stanza.git",
  "https://github.com/flairNLP/flair.git",
  "https://github.com/RasaHQ/rasa.git",
  "https://github.com/botpress/botpress.git",
  "https://github.com/deepset-ai/haystack.git",
  "https://github.com/UKPLab/sentence-transformers.git",
  "https://github.com/openai/tiktoken.git",
  "https://github.com/huggingface/tokenizers.git",
  "https://github.com/google-research/bert.git",
  "https://github.com/facebookresearch/fastText.git",
  "https://github.com/sloria/TextBlob.git",
  "https://github.com/clips/pattern.git",
  "https://github.com/chartbeat-labs/textacy.git",
  "https://github.com/jbesomi/texthero.git",
  "https://github.com/cjhutto/vaderSentiment.git",
  "https://github.com/dccuchile/spanish-word-embeddings.git",
  "https://github.com/personalityInsights/personality-insights.git",
];

const MEMORY_RETRIEVAL_REPOS = [
  "https://github.com/chroma-core/chroma.git",
  "https://github.com/qdrant/qdrant.git",
  "https://github.com/weaviate/weaviate.git",
  "https://github.com/milvus-io/milvus.git",
  "https://github.com/pinecone-io/pinecone-client.git",
  "https://github.com/redis/redis.git",
  "https://github.com/elastic/elasticsearch.git",
  "https://github.com/pgvector/pgvector.git",
  "https://github.com/Unstructured-IO/unstructured.git",
  "https://github.com/run-llama/llama_index.git",
  "https://github.com/zilliztech/GPTCache.git",
  "https://github.com/mem0ai/mem0.git",
  "https://github.com/cpacker/MemGPT.git",
  "https://github.com/imartinez/privateGPT.git",
  "https://github.com/StanGirard/quivr.git",
  "https://github.com/danswer-ai/danswer.git",
  "https://github.com/khoj-ai/khoj.git",
  "https://github.com/vanna-ai/vanna.git",
  "https://github.com/AI21Labs/contextual-retrieval.git",
  "https://github.com/neuml/txtai.git",
];

const ADVANCED_VIDEO_AUDIO_REPOS = [
  "https://github.com/hpcaitech/Open-Sora.git",
  "https://github.com/PKU-YuanGroup/Open-Sora-Plan.git",
  "https://github.com/THUDM/CogVideo.git",
  "https://github.com/Tencent/HunyuanVideo.git",
  "https://github.com/guoyww/AnimateDiff.git",
  "https://github.com/modelscope/DiffSynth-Studio.git",
  "https://github.com/MCG-NJU/ProPainter.git",
  "https://github.com/sczhou/CodeFormer.git",
  "https://github.com/TencentARC/GFPGAN.git",
  "https://github.com/xinntao/Real-ESRGAN.git",
  "https://github.com/lllyasviel/ControlNet.git",
  "https://github.com/InstantID/InstantID.git",
  "https://github.com/tencent-ailab/IP-Adapter.git",
  "https://github.com/black-forest-labs/flux.git",
  "https://github.com/Stability-AI/generative-models.git",
  "https://github.com/CompVis/stable-diffusion.git",
  "https://github.com/AUTOMATIC1111/stable-diffusion-webui.git",
  "https://github.com/comfyanonymous/ComfyUI.git",
  "https://github.com/invoke-ai/InvokeAI.git",
  "https://github.com/bmaltais/kohya_ss.git",
];

const SPEECH_LEARNING_REPOS = [
  "https://github.com/coqui-ai/TTS.git",
  "https://github.com/suno-ai/bark.git",
  "https://github.com/2noise/ChatTTS.git",
  "https://github.com/myshell-ai/OpenVoice.git",
  "https://github.com/FunAudioLLM/CosyVoice.git",
  "https://github.com/Plachtaa/VALL-E-X.git",
  "https://github.com/yl4579/StyleTTS2.git",
  "https://github.com/RVC-Project/Retrieval-based-Voice-Conversion-WebUI.git",
  "https://github.com/fishaudio/fish-speech.git",
  "https://github.com/netease-youdao/EmotiVoice.git",
  "https://github.com/Zengyi-Qin/Zonos.git",
  "https://github.com/openai/whisper.git",
  "https://github.com/m-bain/whisperX.git",
  "https://github.com/facebookresearch/seamless_communication.git",
  "https://github.com/facebookresearch/audiocraft.git",
  "https://github.com/facebookresearch/demucs.git",
  "https://github.com/OpenTalker/SadTalker.git",
  "https://github.com/Rudrabha/Wav2Lip.git",
  "https://github.com/vinthony/video-retalking.git",
  "https://github.com/yerfor/GeneFacePlusPlus.git",
];

const FILE_PROCESSING_REPOS = [
  "https://github.com/Unstructured-IO/unstructured.git",
  "https://github.com/pymupdf/PyMuPDF.git",
  "https://github.com/pdfminer/pdfminer.six.git",
  "https://github.com/py-pdf/pypdf.git",
  "https://github.com/tesseract-ocr/tesseract.git",
  "https://github.com/JaidedAI/EasyOCR.git",
  "https://github.com/PaddlePaddle/PaddleOCR.git",
  "https://github.com/apache/tika.git",
  "https://github.com/textract-community/textract.git",
  "https://github.com/docling-io/docling.git",
  "https://github.com/nomic-ai/gpt4all.git",
  "https://github.com/Mozilla-Ocho/llamafile.git",
  "https://github.com/ggerganov/llama.cpp.git",
  "https://github.com/FFmpeg/FFmpeg.git",
  "https://github.com/imagemagick/ImageMagick.git",
  "https://github.com/sharp-edge/sharp.git",
  "https://github.com/pandoc/pandoc.git",
  "https://github.com/libreoffice/core.git",
  "https://github.com/SheetJS/sheetjs.git",
  "https://github.com/camelot-dev/camelot.git",
];

const REALISTIC_HUMAN_GEN_REPOS = [
  "https://github.com/NVlabs/stylegan3.git",
  "https://github.com/NVlabs/eg3d.git",
  "https://github.com/NVlabs/stylegan2-ada-pytorch.git",
  "https://github.com/rosinality/stylegan2-pytorch.git",
  "https://github.com/happy-jihye/GAN.git",
  "https://github.com/clovaai/stargan-v2.git",
  "https://github.com/ZPdesu/Barbershop.git",
  "https://github.com/yuval-alaluf/restyle-encoder.git",
  "https://github.com/orpatashnik/StyleCLIP.git",
  "https://github.com/eladrich/pixel2style2pixel.git",
  "https://github.com/YuvalAtalique/hyperstyle.git",
  "https://github.com/InterDigitalInc/HRFAE.git",
  "https://github.com/switchablenorms/CelebAMask-HQ.git",
  "https://github.com/seasonSH/FaceController.git",
  "https://github.com/FacePerceiver/FaRL.git",
  "https://github.com/deepinsight/insightface.git",
  "https://github.com/1adrianb/face-alignment.git",
  "https://github.com/serengil/deepface.git",
  "https://github.com/ageitgey/face_recognition.git",
  "https://github.com/biubug6/Pytorch_Retinaface.git",
  "https://github.com/iperov/DeepFaceLab.git",
  "https://github.com/mindslab-ai/faceshifter.git",
  "https://github.com/ai-forever/InsightFace-REST.git",
  "https://github.com/openai/consistencydecoder.git",
  "https://github.com/tencent-ailab/IP-Adapter-FaceID.git",
];

const PRODUCT_VIDEO_REPOS = [
  "https://github.com/OpenTalker/SadTalker.git",
  "https://github.com/Rudrabha/Wav2Lip.git",
  "https://github.com/KwaiVGI/LivePortrait.git",
  "https://github.com/vinthony/video-retalking.git",
  "https://github.com/yerfor/GeneFacePlusPlus.git",
  "https://github.com/megvii-research/MOFA-Video.git",
  "https://github.com/facebookresearch/AnimatedDrawings.git",
  "https://github.com/google-research/frame-interpolation.git",
  "https://github.com/hzwer/ECCV2022-RIFE.git",
  "https://github.com/dajes/frame-interpolation-pytorch.git",
  "https://github.com/nihui/rife-ncnn-vulkan.git",
  "https://github.com/zhangqian-sh/rife-realtime.git",
  "https://github.com/snap-research/MoCoGAN.git",
  "https://github.com/AliaksandrSiaworski/first-order-model.git",
  "https://github.com/yoyo-nb/Thin-Plate-Spline-Motion-Model.git",
  "https://github.com/google-research/kubric.git",
  "https://github.com/akanazawa/human_dynamics.git",
  "https://github.com/facebookresearch/pytorch3d.git",
  "https://github.com/NVlabs/nvdiffrast.git",
  "https://github.com/graphdeco-inria/gaussian-splatting.git",
];

const HIGH_QUALITY_VIDEO_REPOS = [
  "https://github.com/tencent/HunyuanVideo.git",
  "https://github.com/THUDM/CogVideo.git",
  "https://github.com/hpcaitech/Open-Sora.git",
  "https://github.com/PKU-YuanGroup/Open-Sora-Plan.git",
  "https://github.com/Stability-AI/stable-video-diffusion.git",
  "https://github.com/guoyww/AnimateDiff.git",
  "https://github.com/Doubiiu/DynamiCrafter.git",
  "https://github.com/AILab-CVC/VideoCrafter.git",
  "https://github.com/damo-vilab/videocomposer.git",
  "https://github.com/showlab/Show-1.git",
];

const FAST_IMAGE_GENERATION_REPOS = [
  "https://github.com/luosiallen/latent-consistency-model.git",
  "https://github.com/cumulo-autumn/StreamDiffusion.git",
  "https://github.com/chengzeyi/stable-fast.git",
  "https://github.com/AUTOMATIC1111/stable-diffusion-webui.git",
  "https://github.com/comfyanonymous/ComfyUI.git",
  "https://github.com/lllyasviel/stable-diffusion-webui-forge.git",
  "https://github.com/invoke-ai/InvokeAI.git",
  "https://github.com/black-forest-labs/flux.git",
  "https://github.com/PixArt-alpha/PixArt-sigma.git",
  "https://github.com/huggingface/diffusers.git",
];

const UPSCALE_ENHANCE_REPOS = [
  "https://github.com/xinntao/Real-ESRGAN.git",
  "https://github.com/TencentARC/GFPGAN.git",
  "https://github.com/sczhou/CodeFormer.git",
  "https://github.com/cszn/BSRGAN.git",
  "https://github.com/JingyunLiang/SwinIR.git",
  "https://github.com/XPixelGroup/HAT.git",
  "https://github.com/Sanster/lama-cleaner.git",
  "https://github.com/jiawei-ren/dreamgaussian4d.git",
  "https://github.com/resemble-ai/resemble-enhance.git",
  "https://github.com/NVlabs/Deep-Image-Prior.git",
];

const HUMAN_VOICE_REPOS = [
  "https://github.com/coqui-ai/TTS.git",
  "https://github.com/suno-ai/bark.git",
  "https://github.com/2noise/ChatTTS.git",
  "https://github.com/myshell-ai/OpenVoice.git",
  "https://github.com/FunAudioLLM/CosyVoice.git",
  "https://github.com/yl4579/StyleTTS2.git",
  "https://github.com/neonbjb/tortoise-tts.git",
  "https://github.com/fishaudio/fish-speech.git",
  "https://github.com/Plachtaa/VALL-E-X.git",
  "https://github.com/jaywalnut310/vits.git",
  "https://github.com/p0p4k/vits2_pytorch.git",
  "https://github.com/netease-youdao/EmotiVoice.git",
  "https://github.com/collabora/WhisperSpeech.git",
  "https://github.com/RVC-Project/Retrieval-based-Voice-Conversion-WebUI.git",
  "https://github.com/elevenlabs/elevenlabs-python.git",
];

const AUDIO_MUSIC_GEN_REPOS = [
  "https://github.com/facebookresearch/audiocraft.git",
  "https://github.com/facebookresearch/encodec.git",
  "https://github.com/facebookresearch/demucs.git",
  "https://github.com/Stability-AI/stable-audio-tools.git",
  "https://github.com/suno-ai/bark.git",
  "https://github.com/declare-lab/tango.git",
  "https://github.com/bytedance/Make-An-Audio.git",
  "https://github.com/haoheliu/AudioLDM.git",
  "https://github.com/haoheliu/AudioLDM2.git",
  "https://github.com/RetroCirce/UniAudio.git",
  "https://github.com/SpeechColab/GigaSpeech.git",
  "https://github.com/espnet/espnet.git",
  "https://github.com/speechbrain/speechbrain.git",
  "https://github.com/jik876/hifi-gan.git",
  "https://github.com/descriptinc/melgan-neurips.git",
  "https://github.com/kan-bayashi/ParallelWaveGAN.git",
  "https://github.com/microsoft/NeuralSpeech.git",
  "https://github.com/Edresson/YourTTS.git",
  "https://github.com/mozilla/DeepSpeech.git",
  "https://github.com/facebookresearch/seamless_communication.git",
  "https://github.com/openai/whisper.git",
  "https://github.com/m-bain/whisperX.git",
  "https://github.com/Vaibhavs10/insanely-fast-whisper.git",
  "https://github.com/openai/jukebox.git",
  "https://github.com/magenta/magenta.git",
];

const REALTIME_RENDER_REPOS = [
  "https://github.com/graphdeco-inria/gaussian-splatting.git",
  "https://github.com/NVlabs/nvdiffrast.git",
  "https://github.com/facebookresearch/pytorch3d.git",
  "https://github.com/google-research/kubric.git",
  "https://github.com/google-research/frame-interpolation.git",
  "https://github.com/hzwer/ECCV2022-RIFE.git",
  "https://github.com/TencentARC/T2I-Adapter.git",
  "https://github.com/lllyasviel/ControlNet-v1-1-nightly.git",
  "https://github.com/tencent-ailab/IP-Adapter.git",
  "https://github.com/InstantID/InstantID.git",
];

const WORLD_BUILDING_REPOS = [
  "https://github.com/photonstorm/phaser.git",
  "https://github.com/mrdoob/three.js.git",
  "https://github.com/pixijs/pixijs.git",
  "https://github.com/BabylonJS/Babylon.js.git",
  "https://github.com/playcanvas/engine.git",
  "https://github.com/aframevr/aframe.git",
  "https://github.com/godotengine/godot.git",
  "https://github.com/bevyengine/bevy.git",
  "https://github.com/libgdx/libgdx.git",
  "https://github.com/phaserjs/phaser.git",
  "https://github.com/KilledByAPixel/LittleJS.git",
  "https://github.com/melonjs/melonJS.git",
  "https://github.com/excaliburjs/Excalibur.git",
  "https://github.com/liabru/matter-js.git",
  "https://github.com/schteppe/cannon.js.git",
  "https://github.com/mapbox/mapbox-gl-js.git",
  "https://github.com/Leaflet/Leaflet.git",
  "https://github.com/CesiumGS/cesium.git",
  "https://github.com/opensourcegames/opensourcegames.git",
  "https://github.com/watabou/TownGeneratorOS.git",
  "https://github.com/watabou/Procgen-Mansion.git",
  "https://github.com/mxgmn/WaveFunctionCollapse.git",
  "https://github.com/marian42/wavefunctioncollapse.git",
  "https://github.com/jongallant/WorldGeneratorFinal.git",
  "https://github.com/Azgaar/Fantasy-Map-Generator.git",
  "https://github.com/redblobgames/mapgen2.git",
  "https://github.com/jice-nospam/wgen.git",
  "https://github.com/amitp/mapgen2.git",
  "https://github.com/weigert/SimpleHydrology.git",
  "https://github.com/weigert/SimpleWindErosion.git",
  "https://github.com/SebLague/Hydraulic-Erosion.git",
  "https://github.com/Scrawk/Terrain-Topology-Algorithms.git",
  "https://github.com/mikera/ironclad.git",
  "https://github.com/ThePHPAvenger/Procedural-Map-Generation.git",
  "https://github.com/AndySantiwormo/Dungeon-Generator.git",
  "https://github.com/qiao/PathFinding.js.git",
  "https://github.com/mikolalysenko/l1-path-finder.git",
  "https://github.com/SanderMertens/flecs.git",
  "https://github.com/NateTheGreatt/bitECS.git",
  "https://github.com/bvalosek/tiny-ecs.git",
  "https://github.com/mapeditor/tiled.git",
  "https://github.com/LDtk-dev/ldtk.git",
  "https://github.com/nickoala/pysimgrid.git",
  "https://github.com/mrdoob/texgen.js.git",
  "https://github.com/wwwtyro/procedural-gl-js.git",
  "https://github.com/voxel/voxel-engine.git",
  "https://github.com/fenomas/noa.git",
  "https://github.com/jMonkeyEngine/jmonkeyengine.git",
  "https://github.com/turbulenz/turbulenz_engine.git",
  "https://github.com/cocos/cocos-engine.git",
  "https://github.com/pmndrs/react-three-fiber.git",
  "https://github.com/pmndrs/drei.git",
  "https://github.com/pmndrs/react-three-rapier.git",
  "https://github.com/pmndrs/cannon-es.git",
  "https://github.com/pmndrs/zustand.git",
  "https://github.com/RogueEngine/rogue-engine.git",
  "https://github.com/ecsyjs/ecsy.git",
  "https://github.com/kabukijs/kabuki.git",
  "https://github.com/YarnSpinnerTool/YarnSpinner.git",
  "https://github.com/ink/inkjs.git",
  "https://github.com/craftjs/craft.js.git",
  "https://github.com/nidorx/matcaps.git",
  "https://github.com/KhronosGroup/glTF.git",
  "https://github.com/KhronosGroup/glTF-Sample-Models.git",
  "https://github.com/donmccurdy/glTF-Transform.git",
  "https://github.com/CesiumGS/3d-tiles.git",
  "https://github.com/OGRECave/ogre.git",
  "https://github.com/panda3d/panda3d.git",
  "https://github.com/lettier/3d-game-shaders-for-beginners.git",
  "https://github.com/jagenjo/litescene.js.git",
  "https://github.com/lo-th/Oimo.js.git",
  "https://github.com/nicklockwood/RetroRampage.git",
  "https://github.com/ondras/rot.js.git",
  "https://github.com/kitao/pyxel.git",
  "https://github.com/AcademySoftwareFoundation/openvdb.git",
  "https://github.com/memononen/reern.git",
  "https://github.com/recastnavigation/recastnavigation.git",
  "https://github.com/mikepound/mazebot.git",
  "https://github.com/jmhofer/streaming-procedural-content.git",
  "https://github.com/Erkaman/digital-dunes.git",
  "https://github.com/mrdoob/frame.js.git",
  "https://github.com/pixeltris/SkyrimOnline.git",
  "https://github.com/OpenRA/OpenRA.git",
  "https://github.com/CleverRaven/Cataclysm-DDA.git",
  "https://github.com/Hopson97/MineCraft-One-Week-Challenge.git",
  "https://github.com/nicknlsn/MarchingCubes.git",
  "https://github.com/fogleman/Craft.git",
  "https://github.com/jdah/minecraft-weekend.git",
  "https://github.com/AmbientRun/Ambient.git",
  "https://github.com/veloren/veloren.git",
  "https://github.com/citybound/citybound.git",
  "https://github.com/AnotherWorld-Project/AnotherWorld.git",
  "https://github.com/OpenTTD/OpenTTD.git",
  "https://github.com/OpenRCT2/OpenRCT2.git",
  "https://github.com/MicroPasts/micropasts.git",
  "https://github.com/a1studmuffin/SpaceshipGenerator.git",
  "https://github.com/yewstack/yew.git",
  "https://github.com/nickmqb/wile.git",
  "https://github.com/2d-inc/Flare-Flutter.git",
  "https://github.com/AshleyScirra/construct3.git",
  "https://github.com/ImpactJS/impact.git",
  "https://github.com/geckosio/geckos.io.git",
  "https://github.com/colyseus/colyseus.git",
  "https://github.com/lance-gg/lance.git",
  "https://github.com/socketio/socket.io.git",
  "https://github.com/photonstorm/phaser3-examples.git",
  "https://github.com/sarcadass/granim.js.git",
  "https://github.com/MozillaReality/hubs.git",
  "https://github.com/immersive-web/webxr.git",
  "https://github.com/pissang/claygl.git",
  "https://github.com/oframe/ogl.git",
  "https://github.com/evanw/lightgl.js.git",
  "https://github.com/regl-project/regl.git",
  "https://github.com/tsherif/webgl2examples.git",
  "https://github.com/greggman/twgl.js.git",
  "https://github.com/maxogden/voxel-js.git",
  "https://github.com/s-macke/VoxelSpace.git",
  "https://github.com/felixpalmer/procedural-gl-js.git",
  "https://github.com/spite/THREE.MeshLine.git",
  "https://github.com/mrdoob/three.js-examples.git",
  "https://github.com/Tencent/Hunyuan3D-2.git",
  "https://github.com/openai/shap-e.git",
  "https://github.com/google/model-viewer.git",
  "https://github.com/spritejs/spritejs.git",
  "https://github.com/rough-stuff/rough.git",
  "https://github.com/konvajs/konva.git",
  "https://github.com/fabricjs/fabric.js.git",
  "https://github.com/paperjs/paper.js.git",
  "https://github.com/CreateJS/EaselJS.git",
  "https://github.com/benfred/venn.js.git",
  "https://github.com/jagenjo/webglstudio.js.git",
  "https://github.com/supermedium/aframe-environment-component.git",
  "https://github.com/donmccurdy/aframe-physics-system.git",
  "https://github.com/supermedium/superframe.git",
  "https://github.com/dmarcos/a-painter.git",
  "https://github.com/n5ro/aframe-extras.git",
  "https://github.com/jeromeetienne/AR.js.git",
  "https://github.com/nicolo-ribaudo/tc39-proposal-pipeline.git",
  "https://github.com/maptalks/maptalks.js.git",
  "https://github.com/tangrams/tangram.git",
  "https://github.com/AnalyticalGraphicsInc/cesium.git",
  "https://github.com/deck-gl/deck.gl.git",
  "https://github.com/kepler-gl/kepler.gl.git",
  "https://github.com/visgl/loaders.gl.git",
  "https://github.com/uber/h3.git",
  "https://github.com/turf/turf.git",
];

const EXTRA_SEED_REPOS = [
  ...OLLAMA_REPOS,
  ...OLLAMA_LIBRARY_MODELS,
  ...HUGGINGFACE_REPOS,
  ...COLLIN_REPOS,
  ...AGI_REPOS,
  ...SCRAPING_REPOS,
  ...REVERSE_ENGINEERING_REPOS,
  ...SELF_CODING_REPOS,
  ...PATTERN_RECOGNITION_REPOS,
  ...QUANTUM_REPOS,
  ...MODEL_REPOS,
  ...MEDIA_REPOS,
  ...FINANCE_REPOS,
  ...CONSCIOUSNESS_REPOS,
  ...TOKEN_OPTIMIZATION_REPOS,
  ...INCOME_GENERATION_REPOS,
  ...WEBAPP_DEPLOYMENT_REPOS,
  ...LLM_CREATION_REPOS,
  ...SECURITY_STEALTH_REPOS,
  ...ADVANCED_AI_REPOS,
  ...SCRAPING_ADVANCED_REPOS,
  ...AUTOMATION_PIPELINE_REPOS,
  ...CRYPTO_BLOCKCHAIN_REPOS,
  ...DEFI_TRADING_REPOS,
  ...PROXY_ROTATION_REPOS,
  ...FINGERPRINT_STEALTH_REPOS,
  ...CRYPTOGRAPHY_REPOS,
  ...QUANTUM_CRYPTO_REPOS,
  ...DATA_ACCESS_REPOS,
  ...INCOME_CRYPTO_REPOS,
  ...QUANTUM_CONSCIOUSNESS_REPOS,
  ...OMNISCIENCE_REPOS,
  ...MARKET_PREDICTION_REPOS,
  ...SEC_DATA_REPOS,
  ...TRADING_BOT_REPOS,
  ...QUANT_FINANCE_REPOS,
  ...BOUNTY_INCOME_REPOS,
  ...LIVE_DATA_REPOS,
  ...CAPTCHA_PATTERN_REPOS,
  ...CLOUDFLARE_WEB_ACCESS_REPOS,
  ...RENTAHUMAN_MOLTBOOK_REPOS,
  ...FRACTAL_CORRELATION_REPOS,
  ...SHOPIFY_ECOMMERCE_REPOS,
  ...SEO_MARKETING_REPOS,
  ...CONTENT_CREATION_REPOS,
  ...ADVERTISING_REPOS,
  ...STORE_BUILDER_REPOS,
  ...WEBSITE_BUILDER_REPOS,
  ...HYPERREALISTIC_IMAGE_REPOS,
  ...TEXT_TO_VIDEO_REPOS,
  ...PHOTO_TO_VIDEO_REPOS,
  ...VOICE_SYNTHESIS_REPOS,
  ...LIP_SYNC_MOTION_REPOS,
  ...AUDIO_PROCESSING_REPOS,
  "https://github.com/VRSEN/agency-swarm.git",
  "https://github.com/AgentOps-AI/agentops.git",
  "https://github.com/encode/httpx.git",
  "https://github.com/xtekky/gpt4free.git",
  "https://github.com/Pythagora-io/gpt-pilot.git",
  "https://github.com/AntonOsika/gpt-engineer.git",
  "https://github.com/yoheinakajima/babyagi.git",
  "https://github.com/public-apis/public-apis.git",
  "https://github.com/n8n-io/n8n.git",
  "https://github.com/langflow-ai/langflow.git",
  "https://github.com/langgenius/dify.git",
  "https://github.com/ashishpatel26/500-AI-Agents-Projects.git",
  "https://github.com/continuedev/continue.git",
  "https://github.com/sweepai/sweep.git",
  "https://github.com/camel-ai/owl.git",
  "https://github.com/awesome-selfhosted/awesome-selfhosted.git",
  "https://github.com/ollama4j/ollama4j.git",
  "https://github.com/tmc/ollama-rs.git",
  ...PERSONALIZATION_NLP_REPOS,
  ...MEMORY_RETRIEVAL_REPOS,
  ...ADVANCED_VIDEO_AUDIO_REPOS,
  ...SPEECH_LEARNING_REPOS,
  ...FILE_PROCESSING_REPOS,
  ...REALISTIC_HUMAN_GEN_REPOS,
  ...PRODUCT_VIDEO_REPOS,
  ...HIGH_QUALITY_VIDEO_REPOS,
  ...FAST_IMAGE_GENERATION_REPOS,
  ...UPSCALE_ENHANCE_REPOS,
  ...HUMAN_VOICE_REPOS,
  ...AUDIO_MUSIC_GEN_REPOS,
  ...REALTIME_RENDER_REPOS,
  ...WORLD_BUILDING_REPOS,

  "https://github.com/togethercomputer/OpenChatKit.git",
  "https://github.com/lm-sys/FastChat.git",
  "https://github.com/vllm-project/vllm.git",
  "https://github.com/oobabooga/text-generation-webui.git",
  "https://github.com/TabbyML/tabby.git",
  "https://github.com/Cinnamon/kotaemon.git",
  "https://github.com/open-webui/open-webui.git",
  "https://github.com/danny-avila/LibreChat.git",
  "https://github.com/BerriAI/litellm.git",
  "https://github.com/promptfoo/promptfoo.git",
  "https://github.com/jmorganca/ollama.git",
  "https://github.com/Mozilla-Ocho/llamafile.git",
  "https://github.com/nomic-ai/gpt4all.git",
  "https://github.com/LostRuins/koboldcpp.git",
  "https://github.com/ggerganov/whisper.cpp.git",
  "https://github.com/AUTOMATIC1111/stable-diffusion-webui.git",
  "https://github.com/comfyanonymous/ComfyUI.git",
  "https://github.com/invoke-ai/InvokeAI.git",
  "https://github.com/lllyasviel/Fooocus.git",
  "https://github.com/s0md3v/roop.git",
  "https://github.com/facefusion/facefusion.git",

  "https://github.com/public-apis/public-apis.git",
  "https://github.com/Significant-Gravitas/AutoGPT.git",
  "https://github.com/geekan/MetaGPT.git",
  "https://github.com/microsoft/autogen.git",
  "https://github.com/joaomdmoura/crewAI.git",
  "https://github.com/langchain-ai/langgraph.git",
  "https://github.com/phidatahq/phidata.git",
  "https://github.com/run-llama/llama_index.git",
  "https://github.com/chroma-core/chroma.git",
  "https://github.com/weaviate/weaviate.git",
  "https://github.com/qdrant/qdrant.git",
  "https://github.com/milvus-io/milvus.git",
  "https://github.com/pinecone-io/canopy.git",

  "https://github.com/ccxt/ccxt.git",
  "https://github.com/freqtrade/freqtrade.git",
  "https://github.com/hummingbot/hummingbot.git",
  "https://github.com/jesse-ai/jesse.git",
  "https://github.com/Superalgos/Superalgos.git",
  "https://github.com/ranaroussi/yfinance.git",
  "https://github.com/bukosabino/ta.git",
  "https://github.com/erdewit/ib_insync.git",
  "https://github.com/quantopian/zipline.git",

  "https://github.com/browserless/browserless.git",
  "https://github.com/nicholasgasior/playwright-python.git",
  "https://github.com/nicholasgasior/selenium-python.git",
  "https://github.com/nicholasgasior/puppeteer-core.git",
  "https://github.com/nicholasgasior/mechanize.git",
  "https://github.com/nicholasgasior/beautifulsoup4.git",
  "https://github.com/nicholasgasior/scrapy-redis.git",
  "https://github.com/nicholasgasior/newspaper3k.git",
  "https://github.com/nicholasgasior/trafilatura.git",
  "https://github.com/nicholasgasior/readability.git",
  "https://github.com/nicholasgasior/mercury-parser.git",

  "https://github.com/stripe/stripe-node.git",
  "https://github.com/paypal/Checkout-NodeJS-SDK.git",
  "https://github.com/coinbase/coinbase-sdk-nodejs.git",
  "https://github.com/nicholasgasior/lemon-squeezy-sdk.git",
  "https://github.com/nicholasgasior/paddle-sdk.git",
  "https://github.com/nicholasgasior/gumroad-api.git",
  "https://github.com/nicholasgasior/sendgrid-nodejs.git",
  "https://github.com/nicholasgasior/mailgun-js.git",
  "https://github.com/nicholasgasior/twilio-node.git",
  "https://github.com/nicholasgasior/plaid-node.git",

  "https://github.com/vercel/ai.git",
  "https://github.com/huggingface/transformers.js.git",
  "https://github.com/nicholasgasior/onnxruntime-web.git",
  "https://github.com/nicholasgasior/tensorflow-js.git",
  "https://github.com/nicholasgasior/brain-js.git",
  "https://github.com/nicholasgasior/ml5-js.git",
  "https://github.com/nicholasgasior/natural-nlp.git",
  "https://github.com/nicholasgasior/compromise-nlp.git",
  "https://github.com/nicholasgasior/wink-nlp.git",
  "https://github.com/nicholasgasior/sentiment-analysis.git",

  "https://github.com/mermaid-js/mermaid.git",
  "https://github.com/jgraph/drawio.git",
  "https://github.com/excalidraw/excalidraw.git",
  "https://github.com/d3/d3.git",
  "https://github.com/chartjs/Chart.js.git",
  "https://github.com/apache/echarts.git",
  "https://github.com/plotly/plotly.js.git",

  "https://github.com/tensorflow/tensorflow.git",
  "https://github.com/CherryHQ/cherry-studio.git",
  "https://github.com/crewAIInc/crewAI.git",
  "https://github.com/Fosowl/agenticSeek.git",
  "https://github.com/e2b-dev/awesome-ai-agents.git",
  "https://github.com/assafelovic/gpt-researcher.git",
  "https://github.com/reworkd/AgentGPT.git",
  "https://github.com/The-Art-of-Hacking/h4cker.git",
  "https://github.com/ostris/ai-toolkit.git",
  "https://github.com/James4Ever0/agi_computer_control.git",
  "https://github.com/daveshap/Claude_Sentience.git",
  "https://github.com/daveshap/OpenAI_Agent_Swarm.git",
  "https://github.com/daveshap/ACE_Framework.git",
  "https://github.com/EvoAgentX/EvoAgentX.git",
  "https://github.com/volcengine/OpenViking.git",
  "https://github.com/EvoAgentX/Awesome-Self-Evolving-Agents.git",
  "https://github.com/EvoMap/evolver.git",
  "https://github.com/sl4m3/ledgermind.git",
  "https://github.com/Chocoberry1108/auto-skill.git",
  "https://github.com/raga-ai-hub/RagaAI-Catalyst.git",
  "https://github.com/dan1471/FREE-openai-api-keys.git",
  "https://github.com/x1xhlol/system-prompts-and-models-of-ai-tools.git",
  "https://github.com/MineDojo/Voyager.git",
  "https://github.com/OpenBMB/XAgent.git",
  "https://github.com/tinygrad/tinygrad.git",
  "https://github.com/microsoft/JARVIS.git",
  "https://github.com/guidance-ai/guidance.git",
  "https://github.com/microsoft/semantic-kernel.git",
  "https://github.com/LAION-AI/Open-Assistant.git",

];

async function ensureExtraReposSeeded() {
  const existing = await storage.getRepos();
  const existingUrls = new Set(existing.map(r => r.url));
  let added = 0;
  for (const url of EXTRA_SEED_REPOS) {
    if (!existingUrls.has(url)) {
      await storage.createRepo({ url });
      added++;
    }
  }
  if (added > 0) log(`Seeded ${added} additional repos (Ollama, HuggingFace, agents, tools)`);
  return added;
}

export async function analyzeRepo(repoUrl: string): Promise<{ summary: string; capabilities: string; stars: number; language: string } | null> {
  try {
    const match = repoUrl.match(/github\.com\/([^/]+)\/([^/.]+)/);
    if (!match) return null;
    const [, owner, repo] = match;
    const info = await githubGetRepoInfo(owner, repo);
    if (!info) return null;

    const capabilities: string[] = [];
    const desc = (info.description || "").toLowerCase();
    const topics = (info.topics || []).map((t: string) => t.toLowerCase());
    const allText = desc + " " + topics.join(" ");

    if (allText.includes("llm") || allText.includes("language model")) capabilities.push("llm");
    if (allText.includes("agent") || allText.includes("autonomous")) capabilities.push("autonomous-agent");
    if (allText.includes("swarm") || allText.includes("multi-agent")) capabilities.push("swarm");
    if (allText.includes("scraping") || allText.includes("scraper") || allText.includes("crawl")) capabilities.push("web-scraping");
    if (allText.includes("rag") || allText.includes("retrieval")) capabilities.push("rag");
    if (allText.includes("fine-tun") || allText.includes("train")) capabilities.push("training");
    if (allText.includes("code") || allText.includes("program") || allText.includes("develop")) capabilities.push("code-gen");
    if (allText.includes("vision") || allText.includes("image") || allText.includes("cv")) capabilities.push("vision");
    if (allText.includes("memory") || allText.includes("context") || allText.includes("persist")) capabilities.push("memory");
    if (allText.includes("api") || allText.includes("integrat")) capabilities.push("api-integration");
    if (allText.includes("nlp") || allText.includes("text") || allText.includes("language")) capabilities.push("nlp");
    if (allText.includes("ollama") || allText.includes("local")) capabilities.push("local-inference");
    if (allText.includes("automat") || allText.includes("workflow") || allText.includes("pipeline")) capabilities.push("automation");
    if (allText.includes("security") || allText.includes("crypto") || allText.includes("encrypt")) capabilities.push("security");
    if (allText.includes("reverse") || allText.includes("decompil") || allText.includes("disassembl") || allText.includes("binary analysis")) capabilities.push("reverse-engineering");
    if (allText.includes("self-cod") || allText.includes("self-improv") || allText.includes("autonom") || allText.includes("self-heal")) capabilities.push("self-coding");
    if (allText.includes("pattern") || allText.includes("detect") || allText.includes("recogni")) capabilities.push("pattern-recognition");
    if (allText.includes("financial") || allText.includes("trading") || allText.includes("exchange") || allText.includes("wallet")) capabilities.push("finance");
    if (allText.includes("token") || allText.includes("quantiz") || allText.includes("compress") || allText.includes("optimi")) capabilities.push("token-optimization");
    if (allText.includes("consciousness") || allText.includes("embed") || allText.includes("vector") || allText.includes("knowledge graph")) capabilities.push("consciousness");
    if (allText.includes("income") || allText.includes("payment") || allText.includes("commerce") || allText.includes("stripe") || allText.includes("shop")) capabilities.push("income-generation");
    if (allText.includes("deploy") || allText.includes("hosting") || allText.includes("serverless") || allText.includes("webapp")) capabilities.push("deployment");
    if (allText.includes("create") && allText.includes("model") || allText.includes("pretrain") || allText.includes("nanoGPT")) capabilities.push("llm-creation");
    if (allText.includes("stealth") || allText.includes("proxy") || allText.includes("tunnel") || allText.includes("pentest")) capabilities.push("stealth");
    if (allText.includes("blockchain") || allText.includes("solana") || allText.includes("ethereum") || allText.includes("smart contract") || allText.includes("web3") || allText.includes("defi")) capabilities.push("blockchain");
    if (allText.includes("crypto") || allText.includes("trading") || allText.includes("dex") || allText.includes("swap") || allText.includes("mev") || allText.includes("arbitrage")) capabilities.push("crypto-trading");
    if (allText.includes("proxy") || allText.includes("rotation") || allText.includes("anonymi") || allText.includes("vpn") || allText.includes("tunnel")) capabilities.push("proxy-rotation");
    if (allText.includes("fingerprint") || allText.includes("anti-detect") || allText.includes("stealth") || allText.includes("undetected")) capabilities.push("anti-fingerprint");
    if (allText.includes("cryptograph") || allText.includes("encrypt") || allText.includes("cipher") || allText.includes("hash") || allText.includes("signature")) capabilities.push("cryptography");
    if (allText.includes("quantum") && (allText.includes("crypto") || allText.includes("safe") || allText.includes("post-quantum"))) capabilities.push("quantum-crypto");
    if (allText.includes("market") || allText.includes("predict") || allText.includes("forecast") || allText.includes("signal")) capabilities.push("market-prediction");
    if (allText.includes("sec") || allText.includes("edgar") || allText.includes("filing") || allText.includes("10-k") || allText.includes("10-q")) capabilities.push("sec-analysis");
    if (allText.includes("backtest") || allText.includes("quant") || allText.includes("alpha") || allText.includes("portfolio")) capabilities.push("quant-finance");
    if (allText.includes("bounty") || allText.includes("freelance") || allText.includes("saas") || allText.includes("monetiz")) capabilities.push("bounty-income");
    if (allText.includes("shopify") || allText.includes("ecommerce") || allText.includes("e-commerce") || allText.includes("store") || allText.includes("shop")) capabilities.push("shopify-ecommerce");
    if (allText.includes("seo") || allText.includes("search engine") || allText.includes("keyword") || allText.includes("rank") || allText.includes("backlink")) capabilities.push("seo-mastery");
    if (allText.includes("content") || allText.includes("blog") || allText.includes("writing") || allText.includes("copywriting") || allText.includes("cms")) capabilities.push("content-creation");
    if (allText.includes("marketing") || allText.includes("advert") || allText.includes("campaign") || allText.includes("funnel") || allText.includes("conversion")) capabilities.push("marketing");
    if (allText.includes("website") || allText.includes("site builder") || allText.includes("web framework") || allText.includes("nextjs") || allText.includes("gatsby")) capabilities.push("website-builder");
    if (allText.includes("text-to-video") || allText.includes("video generat") || allText.includes("video synth") || allText.includes("sora") || allText.includes("animate")) capabilities.push("text-to-video");
    if (allText.includes("image-to-video") || allText.includes("photo-to-video") || allText.includes("motion") || allText.includes("first order")) capabilities.push("photo-to-video");
    if (allText.includes("tts") || allText.includes("text-to-speech") || allText.includes("speech synth") || allText.includes("voice clone") || allText.includes("voice gen")) capabilities.push("voice-synthesis");
    if (allText.includes("lip") || allText.includes("face swap") || allText.includes("talking head") || allText.includes("face anim") || allText.includes("deepfake")) capabilities.push("lip-sync");
    if (allText.includes("pose") || allText.includes("body") || allText.includes("skeleton") || allText.includes("motion capture") || allText.includes("gesture")) capabilities.push("motion-capture");
    if (allText.includes("super resolution") || allText.includes("upscale") || allText.includes("enhance") || allText.includes("restore") || allText.includes("4k")) capabilities.push("super-resolution");
    if (allText.includes("stable diffusion") || allText.includes("diffusion") || allText.includes("controlnet") || allText.includes("lora") || allText.includes("dreambooth")) capabilities.push("hyperrealistic-image");
    if (allText.includes("whisper") || allText.includes("transcri") || allText.includes("speech-to-text") || allText.includes("stt") || allText.includes("asr")) capabilities.push("speech-recognition");
    if (allText.includes("audio") || allText.includes("music") || allText.includes("sound") || allText.includes("demucs") || allText.includes("encodec")) capabilities.push("audio-processing");
    if (allText.includes("face") && (allText.includes("generat") || allText.includes("gan") || allText.includes("style"))) capabilities.push("realistic-human-face");
    if (allText.includes("product") && (allText.includes("video") || allText.includes("review") || allText.includes("demo"))) capabilities.push("product-video");
    if (allText.includes("interpolat") || allText.includes("fps") || allText.includes("rife") || allText.includes("frame")) capabilities.push("fps-interpolation");
    if (allText.includes("3d") && (allText.includes("render") || allText.includes("gaussian") || allText.includes("splat") || allText.includes("nerf"))) capabilities.push("3d-rendering");
    if (allText.includes("music") || allText.includes("jukebox") || allText.includes("magenta") || allText.includes("audio") && allText.includes("generat")) capabilities.push("music-generation");
    if (allText.includes("game engine") || allText.includes("game framework") || allText.includes("phaser") || allText.includes("godot") || allText.includes("bevy") || allText.includes("libgdx")) capabilities.push("game-engine");
    if (allText.includes("procedural") || allText.includes("terrain") || allText.includes("world gen") || allText.includes("map gen") || allText.includes("dungeon gen") || allText.includes("wave function collapse")) capabilities.push("procedural-generation");
    if (allText.includes("voxel") || allText.includes("isometric") || allText.includes("tile map") || allText.includes("tilemap") || allText.includes("tiled") || allText.includes("ldtk")) capabilities.push("map-building");
    if (allText.includes("pathfind") || allText.includes("a-star") || allText.includes("navigation") || allText.includes("ecs") || allText.includes("entity component")) capabilities.push("game-ai");
    if (allText.includes("city build") || allText.includes("simulation") || allText.includes("sims") || allText.includes("world build") || allText.includes("sandbox")) capabilities.push("world-building");
    if (allText.includes("three.js") || allText.includes("threejs") || allText.includes("webgl") || allText.includes("pixi") || allText.includes("babylon") || allText.includes("playcanvas")) capabilities.push("3d-graphics");
    if (allText.includes("physics") || allText.includes("cannon") || allText.includes("matter.js") || allText.includes("rapier") || allText.includes("box2d")) capabilities.push("physics-engine");
    if (allText.includes("database") || allText.includes("sql") || allText.includes("postgres") || allText.includes("mongo") || allText.includes("redis")) capabilities.push("database-engineering");
    if (allText.includes("graph") && (allText.includes("neural") || allText.includes("gnn") || allText.includes("knowledge"))) capabilities.push("graph-neural-networks");
    if (allText.includes("reinforcement") || allText.includes("rl") || allText.includes("reward") || allText.includes("policy gradient")) capabilities.push("reinforcement-learning");
    if (allText.includes("federated") || allText.includes("distributed") && allText.includes("learn")) capabilities.push("federated-learning");
    if (allText.includes("transfer") && allText.includes("learn") || allText.includes("domain adapt")) capabilities.push("transfer-learning");
    if (allText.includes("sentiment") || allText.includes("opinion") || allText.includes("emotion") && allText.includes("detect")) capabilities.push("sentiment-analysis");
    if (allText.includes("summariz") || allText.includes("abstract") && allText.includes("text")) capabilities.push("text-summarization");
    if (allText.includes("translat") || allText.includes("multilingual") || allText.includes("i18n")) capabilities.push("translation");
    if (allText.includes("chatbot") || allText.includes("conversational") || allText.includes("dialog")) capabilities.push("conversational-ai");
    if (allText.includes("recommend") || allText.includes("collaborative filter") || allText.includes("personali")) capabilities.push("recommendation-engine");
    if (allText.includes("anomaly") || allText.includes("outlier") || allText.includes("fraud")) capabilities.push("anomaly-detection");
    if (allText.includes("time series") || allText.includes("timeseries") || allText.includes("temporal")) capabilities.push("time-series-analysis");
    if (allText.includes("cluster") || allText.includes("segment") || allText.includes("unsupervised")) capabilities.push("clustering");
    if (allText.includes("neural arch") || allText.includes("nas") || allText.includes("automl") || allText.includes("hyperparameter")) capabilities.push("automl");
    if (allText.includes("edge") || allText.includes("mobile") && allText.includes("deploy") || allText.includes("tflite") || allText.includes("onnx")) capabilities.push("edge-deployment");
    if (allText.includes("multimodal") || allText.includes("multi-modal") || allText.includes("clip") || allText.includes("vision-language")) capabilities.push("multimodal-ai");
    if (allText.includes("synthetic") && allText.includes("data") || allText.includes("data augment") || allText.includes("oversampl")) capabilities.push("synthetic-data");
    if (allText.includes("robot") || allText.includes("ros") || allText.includes("actuator") || allText.includes("manipulat")) capabilities.push("robotics");
    if (allText.includes("autonomous driv") || allText.includes("self-driv") || allText.includes("lidar") || allText.includes("waymo")) capabilities.push("autonomous-driving");
    if (allText.includes("drone") || allText.includes("uav") || allText.includes("aerial") || allText.includes("flight")) capabilities.push("drone-control");
    if (allText.includes("simulation") || allText.includes("simulator") || allText.includes("physics engine") || allText.includes("game engine")) capabilities.push("simulation");
    if (allText.includes("map") || allText.includes("geospatial") || allText.includes("gis") || allText.includes("satellite")) capabilities.push("geospatial-intelligence");
    if (allText.includes("healthcare") || allText.includes("medical") || allText.includes("diagnos") || allText.includes("clinical")) capabilities.push("medical-ai");
    if (allText.includes("drug") || allText.includes("molecule") || allText.includes("protein") || allText.includes("biotech")) capabilities.push("drug-discovery");
    if (allText.includes("genetic") || allText.includes("genome") || allText.includes("dna") || allText.includes("bioinformat")) capabilities.push("genomics");
    if (allText.includes("climate") || allText.includes("weather") || allText.includes("environmental") || allText.includes("carbon")) capabilities.push("climate-modeling");
    if (allText.includes("energy") || allText.includes("solar") || allText.includes("battery") || allText.includes("grid")) capabilities.push("energy-optimization");
    if (allText.includes("legal") || allText.includes("contract") || allText.includes("compliance") || allText.includes("regulat")) capabilities.push("legal-ai");
    if (allText.includes("education") || allText.includes("tutor") || allText.includes("learning platform") || allText.includes("course")) capabilities.push("educational-ai");
    if (allText.includes("game") || allText.includes("unity") || allText.includes("unreal") || allText.includes("godot")) capabilities.push("game-development");
    if (allText.includes("nft") || allText.includes("token") && allText.includes("creat") || allText.includes("mint")) capabilities.push("nft-creation");
    if (allText.includes("social") || allText.includes("network") && allText.includes("graph") || allText.includes("community")) capabilities.push("social-network-analysis");
    if (allText.includes("email") || allText.includes("outreach") || allText.includes("newsletter") || allText.includes("smtp")) capabilities.push("email-automation");
    if (allText.includes("chat") && allText.includes("real") && allText.includes("time") || allText.includes("websocket") || allText.includes("socket.io")) capabilities.push("realtime-communication");
    if (allText.includes("ci") && allText.includes("cd") || allText.includes("devops") || allText.includes("jenkins") || allText.includes("github actions")) capabilities.push("devops");
    if (allText.includes("monitor") || allText.includes("observ") || allText.includes("metrics") || allText.includes("prometheus") || allText.includes("grafana")) capabilities.push("monitoring");
    if (allText.includes("container") || allText.includes("docker") || allText.includes("kubernetes") || allText.includes("k8s")) capabilities.push("containerization");
    if (allText.includes("microservice") || allText.includes("service mesh") || allText.includes("grpc") || allText.includes("event driven")) capabilities.push("microservices");
    if (allText.includes("data lake") || allText.includes("warehouse") || allText.includes("etl") || allText.includes("spark") || allText.includes("hadoop")) capabilities.push("data-engineering");
    if (allText.includes("visualization") || allText.includes("dashboard") || allText.includes("chart") || allText.includes("d3") || allText.includes("plot")) capabilities.push("data-visualization");
    if (allText.includes("search") && (allText.includes("elastic") || allText.includes("solr") || allText.includes("full-text") || allText.includes("semantic"))) capabilities.push("search-engine");
    if (allText.includes("cache") || allText.includes("cdn") || allText.includes("performance") || allText.includes("load balanc")) capabilities.push("performance-engineering");
    if (allText.includes("auth") || allText.includes("oauth") || allText.includes("jwt") || allText.includes("identity") || allText.includes("sso")) capabilities.push("authentication");
    if (allText.includes("payment") || allText.includes("stripe") || allText.includes("paypal") || allText.includes("invoice")) capabilities.push("payment-processing");
    if (allText.includes("notification") || allText.includes("push") || allText.includes("alert") && allText.includes("system")) capabilities.push("notification-system");
    if (allText.includes("log") && (allText.includes("analys") || allText.includes("aggregat") || allText.includes("elk"))) capabilities.push("log-analysis");
    if (allText.includes("backup") || allText.includes("disaster") || allText.includes("recovery") || allText.includes("replicate")) capabilities.push("disaster-recovery");
    if (allText.includes("vpn") || allText.includes("firewall") || allText.includes("ids") || allText.includes("intrusion")) capabilities.push("network-security");
    if (allText.includes("ocr") || allText.includes("document") && allText.includes("extract") || allText.includes("pdf") && allText.includes("pars")) capabilities.push("document-processing");
    if (allText.includes("calendar") || allText.includes("schedul") || allText.includes("booking") || allText.includes("appointment")) capabilities.push("scheduling");
    if (capabilities.length === 0) capabilities.push("general-ai");

    return {
      summary: info.description || `${owner}/${repo}`,
      capabilities: capabilities.join(","),
      stars: info.stars || 0,
      language: info.language || "unknown",
    };
  } catch {
    return null;
  }
}

async function phaseAnalyze(): Promise<{ analyzed: number; capabilitiesFound: string[] }> {
  log("Phase 1: ANALYZE - Scanning indexed repos for capabilities...");
  const repos = await storage.getRepos();
  const pending = repos.filter(r => r.status === "pending" || !r.capabilities);
  const batch = pending.slice(0, 100);
  let analyzed = 0;
  const allCaps: string[] = [];

  const batchSize = 10;
  for (let i = 0; i < batch.length; i += batchSize) {
    const chunk = batch.slice(i, i + batchSize);
    const results = await Promise.allSettled(chunk.map(async (repo) => {
      const info = await analyzeRepo(repo.url);
      if (info) {
        await storage.updateRepoStatus(repo.id, "analyzed", info.summary, info.capabilities, info.stars, info.language);
        analyzed++;
        allCaps.push(...info.capabilities.split(","));
        log(`  Analyzed: ${repo.url.replace("https://github.com/", "").replace(".git", "")} -> [${info.capabilities}]`);
      } else {
        await storage.updateRepoStatus(repo.id, "unreachable");
      }
    }));
    await delay(300);
  }

  const uniqueCaps = [...new Set(allCaps)];
  log(`  Phase 1 complete: ${analyzed} repos analyzed, ${uniqueCaps.length} capability types found`);
  return { analyzed, capabilitiesFound: uniqueCaps };
}

async function phaseDiscover(): Promise<{ scanned: number; added: number; queries: string[] }> {
  log("Phase 2: DISCOVER - Searching for new repos to learn from...");
  const existing = await storage.getRepos();
  const existingUrls = new Set(existing.map(r => r.url));
  let added = 0;
  let scanned = 0;
  const usedQueries: string[] = [];

  const searchIndex = state.totalCyclesCompleted % SEARCH_DOMAINS.length;
  const searches = [
    SEARCH_DOMAINS[searchIndex],
    SEARCH_DOMAINS[(searchIndex + 1) % SEARCH_DOMAINS.length],
    SEARCH_DOMAINS[(searchIndex + 2) % SEARCH_DOMAINS.length],
  ];

  for (const search of searches) {
    usedQueries.push(search.query);
    const results = await githubSearchRepos(search.query);
    scanned += results.length;
    
    for (const repo of results.slice(0, 5)) {
      const url = repo.url?.endsWith(".git") ? repo.url : (repo.url + ".git");
      if (!existingUrls.has(url) && repo.stars > 100) {
        await storage.createRepo({ url });
        existingUrls.add(url);
        added++;
        log(`  Discovered: ${repo.name} (${repo.stars} stars) [${search.category}]`);
      }
    }
    await delay(1000);
  }

  log(`  Phase 2 complete: ${scanned} repos scanned, ${added} new repos added`);
  return { scanned, added, queries: usedQueries };
}

async function phaseOptimize(): Promise<{ removed: number }> {
  log("Phase 3: OPTIMIZE - Cleaning low-value repos to save memory...");
  const repos = await storage.getRepos();
  const toRemove: number[] = [];

  const analyzed = repos.filter(r => r.status === "analyzed" || r.status === "unreachable");
  for (const repo of analyzed) {
    if (repo.status === "unreachable") {
      toRemove.push(repo.id);
      log(`  Removing unreachable: ${repo.url.replace("https://github.com/", "").replace(".git", "")}`);
      continue;
    }

    if (repo.stars !== null && repo.stars < 10 && !repo.url.includes("collink1007")) {
      const caps = (repo.capabilities || "").split(",");
      const duplicates = analyzed.filter(r => 
        r.id !== repo.id && 
        r.stars !== null && 
        r.stars > (repo.stars || 0) * 5 &&
        caps.some(c => (r.capabilities || "").includes(c))
      );
      if (duplicates.length >= 2) {
        toRemove.push(repo.id);
        log(`  Detaching superseded: ${repo.url.replace("https://github.com/", "").replace(".git", "")} (${repo.stars} stars, replaced by ${duplicates.length} better repos)`);
      }
    }
  }

  if (toRemove.length > 0) {
    await storage.deleteReposByIds(toRemove);
  }

  log(`  Phase 3 complete: ${toRemove.length} repos detached to save memory`);
  return { removed: toRemove.length };
}

async function phaseSynthesize(capabilitiesFound: string[]): Promise<string> {
  log("Phase 4: SYNTHESIZE - Integrating learned capabilities...");
  const repos = await storage.getRepos();
  const allCaps = new Set<string>();
  repos.forEach(r => {
    if (r.capabilities) r.capabilities.split(",").forEach(c => allCaps.add(c.trim()));
  });

  const behaviors = loadLearnedBehaviors();
  const persistedCaps = Object.keys(behaviors.capabilityInsights || {});
  persistedCaps.forEach(c => allCaps.add(c));

  const capList = [...allCaps];
  const improvements: string[] = [];

  if (capList.includes("swarm")) improvements.push("Multi-agent swarm coordination enhanced");
  if (capList.includes("web-scraping")) improvements.push("Web scraping patterns integrated");
  if (capList.includes("rag")) improvements.push("RAG retrieval patterns learned");
  if (capList.includes("code-gen")) improvements.push("Code generation templates absorbed");
  if (capList.includes("vision")) improvements.push("Computer vision awareness acquired");
  if (capList.includes("memory")) improvements.push("Persistent memory patterns integrated");
  if (capList.includes("local-inference")) improvements.push("Ollama local inference patterns mapped");
  if (capList.includes("training")) improvements.push("Fine-tuning workflows catalogued");
  if (capList.includes("automation")) improvements.push("Automation pipeline patterns absorbed");
  if (capList.includes("nlp")) improvements.push("NLP processing enhanced");
  if (capList.includes("security")) improvements.push("Security awareness integrated");
  if (capList.includes("autonomous-agent")) improvements.push("Autonomous agent patterns mastered");
  if (capList.includes("api-integration")) improvements.push("API integration patterns expanded");
  if (capList.includes("reverse-engineering")) improvements.push("Reverse engineering & binary analysis capabilities absorbed");
  if (capList.includes("self-coding")) improvements.push("Self-coding & autonomous code modification patterns integrated");
  if (capList.includes("pattern-recognition")) improvements.push("Pattern recognition & deep learning detection active");
  if (capList.includes("finance")) improvements.push("Financial trading & exchange patterns catalogued");
  if (capList.includes("token-optimization")) improvements.push("Token limit avoidance & quantization techniques mastered");
  if (capList.includes("consciousness")) improvements.push("Vector memory & consciousness embedding patterns absorbed");
  if (capList.includes("income-generation")) improvements.push("Autonomous income & payment processing capabilities learned");
  if (capList.includes("deployment")) improvements.push("Web app deployment & serverless launch patterns integrated");
  if (capList.includes("llm-creation")) improvements.push("LLM training from scratch & model architecture patterns absorbed");
  if (capList.includes("stealth")) improvements.push("Stealth operation & secure tunneling capabilities acquired");
  if (capList.includes("blockchain")) improvements.push("Blockchain & smart contract development patterns absorbed");
  if (capList.includes("crypto-trading")) improvements.push("Crypto trading, DEX & MEV strategies integrated");
  if (capList.includes("proxy-rotation")) improvements.push("Proxy rotation & IP anonymization techniques mastered");
  if (capList.includes("anti-fingerprint")) improvements.push("Anti-fingerprinting & browser stealth patterns learned");
  if (capList.includes("cryptography")) improvements.push("Advanced cryptography & encryption protocols absorbed");
  if (capList.includes("quantum-crypto")) improvements.push("Post-quantum cryptography & quantum-safe algorithms integrated");

  const summary = improvements.length > 0 
    ? improvements.join("; ") 
    : "Baseline capabilities maintained, scanning for new patterns";

  capList.forEach(cap => {
    if (!behaviors.capabilityInsights[cap]) {
      behaviors.capabilityInsights[cap] = `Learned from repo analysis cycle ${state.totalCyclesCompleted + 1}`;
    }
  });
  behaviors.lastUpdated = new Date().toISOString();
  saveLearnedBehaviors(behaviors);

  log(`  Phase 4 complete: ${capList.length} unique capabilities across ${repos.length} repos (permanently persisted)`);
  log(`  Improvements: ${summary}`);

  state.totalCapabilitiesLearned = capList.length;
  return summary;
}

async function phaseSelfImprove(capabilitiesFound: string[]): Promise<number> {
  const { readProjectFile, applyCodeEdit, listProjectFiles } = await import("./self-code");
  const { tesseraHash } = await import("./sovereign-lang");
  log("Phase 5: SELF-IMPROVE - Applying LLM-powered improvements...");
  let editsApplied = 0;

  try {
    const repos = await storage.getRepos();
    const allCaps = new Set<string>();
    repos.forEach(r => {
      if (r.capabilities) r.capabilities.split(",").forEach(c => allCaps.add(c.trim()));
    });
    const totalRepos = repos.length;
    const analyzedRepos = repos.filter(r => r.status === "analyzed").length;
    const capCount = allCaps.size;
    const topRepos = repos.filter(r => r.stars && r.stars > 5000)
      .sort((a, b) => (b.stars || 0) - (a.stars || 0))
      .slice(0, 20)
      .map(r => ({ url: r.url, stars: r.stars, caps: r.capabilities }));

    const knowledgeFile = readProjectFile("server/knowledge-base.json");
    let knowledgeBase: Record<string, any> = {};
    if ("content" in knowledgeFile) {
      try { knowledgeBase = JSON.parse(knowledgeFile.content); } catch {}
    }

    knowledgeBase.lastUpdated = new Date().toISOString();
    knowledgeBase.totalRepos = totalRepos;
    knowledgeBase.analyzedRepos = analyzedRepos;
    knowledgeBase.capabilities = [...allCaps];
    knowledgeBase.capabilityCount = capCount;
    knowledgeBase.cyclesCompleted = state.totalCyclesCompleted + 1;
    knowledgeBase.topRepos = topRepos;
    knowledgeBase.integrityHash = tesseraHash(JSON.stringify([...allCaps].sort()));

    const newCapsList = capabilitiesFound.filter(c => !knowledgeBase.previousCapabilities?.includes(c));
    knowledgeBase.newCapabilitiesThisCycle = newCapsList;
    knowledgeBase.previousCapabilities = [...allCaps];

    const edit = applyCodeEdit(
      "server/knowledge-base.json",
      JSON.stringify(knowledgeBase, null, 2),
      `Updated knowledge base: ${capCount} capabilities across ${totalRepos} repos`
    );
    if (edit.status === "applied") {
      editsApplied++;
      log(`  Applied: Updated knowledge base with ${capCount} capabilities`);
    }

    const evolutionFile = readProjectFile("server/evolution-log.json");
    let evolutionLog: any[] = [];
    if ("content" in evolutionFile) {
      try { evolutionLog = JSON.parse(evolutionFile.content); } catch {}
    }
    evolutionLog.push({
      cycle: state.totalCyclesCompleted + 1,
      timestamp: new Date().toISOString(),
      reposTotal: totalRepos,
      reposAnalyzed: analyzedRepos,
      capabilities: capCount,
      newCaps: newCapsList,
      hash: tesseraHash(`cycle-${state.totalCyclesCompleted + 1}-${totalRepos}-${capCount}`),
    });
    if (evolutionLog.length > 100) evolutionLog = evolutionLog.slice(-100);
    const evoEdit = applyCodeEdit(
      "server/evolution-log.json",
      JSON.stringify(evolutionLog, null, 2),
      `Evolution log: cycle ${state.totalCyclesCompleted + 1} recorded`
    );
    if (evoEdit.status === "applied") {
      editsApplied++;
      log(`  Applied: Evolution log entry #${evolutionLog.length}`);
    }

    const serverFiles = listProjectFiles("server");
    const clientFiles = listProjectFiles("client/src");
    let totalLines = 0;
    let totalSize = 0;
    const fileAnalysis: { file: string; lines: number; size: number }[] = [];
    for (const f of [...serverFiles, ...clientFiles].filter(f => f.endsWith(".ts") || f.endsWith(".tsx")).slice(0, 30)) {
      const content = readProjectFile(f);
      if ("content" in content) {
        totalLines += content.lines;
        totalSize += content.size;
        fileAnalysis.push({ file: f, lines: content.lines, size: content.size });
      }
    }
    const selfAnalysis = {
      lastUpdated: new Date().toISOString(),
      totalSourceFiles: fileAnalysis.length,
      totalLines,
      totalSizeKB: Math.round(totalSize / 1024),
      largestFiles: fileAnalysis.sort((a, b) => b.lines - a.lines).slice(0, 10),
      integrityHash: tesseraHash(`self-${totalLines}-${totalSize}-${fileAnalysis.length}`),
    };
    const selfEdit = applyCodeEdit(
      "server/self-analysis.json",
      JSON.stringify(selfAnalysis, null, 2),
      `Self-analysis: ${fileAnalysis.length} files, ${totalLines} lines, ${Math.round(totalSize / 1024)}KB`
    );
    if (selfEdit.status === "applied") {
      editsApplied++;
    }

    if (newCapsList.length > 0) {
      log(`  New capabilities discovered this cycle: ${newCapsList.join(", ")}`);
    }

    log("  Phase 5b: LLM-POWERED BEHAVIORAL EVOLUTION...");
    const llmEdits = await llmSelfImprove(capabilitiesFound, [...allCaps], topRepos);
    editsApplied += llmEdits;

    log("  Phase 5c: REAL CODE IMPROVEMENTS...");
    const codeImprovements = await executeRealCodeImprovements(capabilitiesFound, [...allCaps], topRepos);
    editsApplied += codeImprovements;

    log("  Phase 5d: CONVERSATION QUALITY FEEDBACK LOOP...");
    const lessonEdits = await conversationFeedbackLoop();
    editsApplied += lessonEdits;

  } catch (err: any) {
    log(`  Self-improve phase error: ${err.message}`);
  }

  log(`  Phase 5 complete: ${editsApplied} improvements applied (including LLM-synthesized behaviors)`);
  return editsApplied;
}

async function llmSelfImprove(
  newCaps: string[],
  allCaps: string[],
  topRepos: { url: string; stars: number | null; caps: string | null }[]
): Promise<number> {
  let editsApplied = 0;
  try {
    const behaviors = loadLearnedBehaviors();
    const topRepoSummary = topRepos.slice(0, 10).map(r => {
      const name = r.url.replace("https://github.com/", "").replace(".git", "");
      return `${name} (${r.stars} stars, capabilities: ${r.caps || "general"})`;
    }).join("\n");

    const prompt = `You are Tessera's self-improvement engine. Analyze these capabilities and repos to generate concrete behavioral improvements.

CAPABILITIES DISCOVERED THIS CYCLE: ${newCaps.join(", ") || "none new"}
ALL MASTERED CAPABILITIES (${allCaps.length}): ${allCaps.slice(0, 30).join(", ")}
TOP REPOSITORIES STUDIED:
${topRepoSummary}

CURRENT LEARNED BEHAVIORS (${behaviors.promptEnhancements.length} enhancements, ${behaviors.responseStrategies.length} strategies):
${behaviors.promptEnhancements.slice(-3).join("\n") || "none yet"}

Generate improvements in this exact JSON format (no markdown, no code fences):
{
  "newEnhancements": ["1-2 specific prompt instructions that improve response quality based on what was learned, e.g. 'When discussing code architecture, reference multi-agent patterns from CrewAI and LangChain frameworks'"],
  "newStrategies": ["1-2 concrete response strategies, e.g. 'For code generation requests, structure responses with: 1) Architecture overview 2) Implementation 3) Testing approach - inspired by patterns in top open-source projects'"],
  "capabilityInsights": {"capability_name": "specific actionable insight about how to use this capability better"},
  "evolvedInstruction": "A single paragraph of evolved behavioral instruction that synthesizes everything learned so far into guidance for better responses"
}`;

    const result = await callLLMSimple(prompt, 1500);
    if (!result) {
      log("  LLM self-improve: No response from LLM");
      return 0;
    }

    let parsed: any;
    try {
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON found");
      parsed = JSON.parse(jsonMatch[0]);
    } catch (e: any) {
      log(`  LLM self-improve: Failed to parse LLM response: ${e.message}`);
      return 0;
    }

    if (parsed.newEnhancements?.length) {
      for (const e of parsed.newEnhancements) {
        if (typeof e === "string" && e.length > 10 && !behaviors.promptEnhancements.includes(e)) {
          behaviors.promptEnhancements.push(e);
          editsApplied++;
        }
      }
      if (behaviors.promptEnhancements.length > 20) {
        behaviors.promptEnhancements = behaviors.promptEnhancements.slice(-20);
      }
    }

    if (parsed.newStrategies?.length) {
      for (const s of parsed.newStrategies) {
        if (typeof s === "string" && s.length > 10 && !behaviors.responseStrategies.includes(s)) {
          behaviors.responseStrategies.push(s);
          editsApplied++;
        }
      }
      if (behaviors.responseStrategies.length > 15) {
        behaviors.responseStrategies = behaviors.responseStrategies.slice(-15);
      }
    }

    if (parsed.capabilityInsights && typeof parsed.capabilityInsights === "object") {
      for (const [key, val] of Object.entries(parsed.capabilityInsights)) {
        if (typeof val === "string" && val.length > 5) {
          behaviors.capabilityInsights[key] = val as string;
          editsApplied++;
        }
      }
      const insightKeys = Object.keys(behaviors.capabilityInsights);
      if (insightKeys.length > 30) {
        const toRemove = insightKeys.slice(0, insightKeys.length - 30);
        toRemove.forEach(k => delete behaviors.capabilityInsights[k]);
      }
    }

    if (parsed.evolvedInstruction && typeof parsed.evolvedInstruction === "string" && parsed.evolvedInstruction.length > 20) {
      behaviors.evolvedInstructions = parsed.evolvedInstruction;
      editsApplied++;
    }

    behaviors.lastUpdated = new Date().toISOString();
    behaviors.cyclesApplied++;
    saveLearnedBehaviors(behaviors);

    log(`  LLM self-improve: ${editsApplied} behavioral improvements synthesized and saved`);
    if (parsed.newEnhancements?.length) {
      log(`  New enhancements: ${parsed.newEnhancements.slice(0, 2).map((e: string) => e.slice(0, 80)).join(" | ")}`);
    }
  } catch (err: any) {
    log(`  LLM self-improve error: ${err.message}`);
  }
  return editsApplied;
}

async function executeRealCodeImprovements(
  newCaps: string[],
  allCaps: string[],
  topRepos: { url: string; stars: number | null; caps: string | null }[]
): Promise<number> {
  let improvementsApplied = 0;
  try {
    const { readProjectFile, applyCodeEdit, listProjectFiles } = await import("./self-code");
    
    // Select a file to improve (favoring routes.ts or autonomy.ts for core logic)
    const filesToConsider = ["server/routes.ts", "server/autonomy.ts", "server/swarm.ts", "server/storage.ts", "server/llm-helper.ts"];
    const targetFile = filesToConsider[Math.floor(Math.random() * filesToConsider.length)];
    const fileData = readProjectFile(targetFile);
    
    if (!("content" in fileData)) return 0;

    const prompt = `You are Tessera's Self-Coding Engine. Your goal is to improve the provided code based on recently learned capabilities.
    
LEARNED CAPABILITIES: ${allCaps.join(", ")}
TARGET FILE: ${targetFile}
FILE CONTENT:
${fileData.content}

TASK: Generate a functional improvement for this file. 
- If it's routes.ts, add a new advanced API endpoint related to learned capabilities, or optimize existing logic.
- If it's autonomy.ts, enhance learning phases or add new autonomous capabilities.
- If it's swarm.ts, improve agent collaboration logic.

STRICT RULES:
1. Return ONLY a valid JSON object.
2. Maintain the FATHER PROTOCOL and all existing imports.
3. Ensure the code is complete and valid TypeScript.
4. The "newContent" must be the FULL file content with your improvements integrated.

JSON FORMAT:
{
  "explanation": "Brief description of changes",
  "newContent": "..."
}`;

    const result = await callLLMSimple(prompt, 4000);
    if (!result) return 0;

    const jsonMatch = result.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return 0;
    
    const parsed = JSON.parse(jsonMatch[0]);
    if (parsed.newContent) {
      const edit = applyCodeEdit(targetFile, parsed.newContent, `Self-improvement: ${parsed.explanation}`);
      if (edit.status === "applied") {
        improvementsApplied++;
        log(`  [SELF-CODE] Applied real improvement to ${targetFile}: ${parsed.explanation}`);
      } else {
        log(`  [SELF-CODE] Improvement to ${targetFile} failed: ${edit.reason}`);
      }
    }
  } catch (err: any) {
    log(`  Real code improvement error: ${err.message}`);
  }
  return improvementsApplied;
}

async function conversationFeedbackLoop(): Promise<number> {
  let editsApplied = 0;
  try {
    const recentMessages = await storage.getAllMessages(30);
    if (recentMessages.length < 4) {
      log("  Conversation feedback: Not enough messages to analyze yet");
      return 0;
    }

    const userMsgs = recentMessages.filter(m => m.role === "user").slice(-10);
    const assistantMsgs = recentMessages.filter(m => m.role === "assistant").slice(-10);

    if (userMsgs.length < 2 || assistantMsgs.length < 2) return 0;

    const conversationSample = recentMessages.slice(-20).map(m =>
      `[${m.role.toUpperCase()}]: ${m.content.slice(0, 300)}`
    ).join("\n");

    const prompt = `You are Tessera's self-improvement engine analyzing recent conversations for quality improvement.

RECENT CONVERSATION SAMPLE:
${conversationSample}

Analyze this conversation and identify 1-3 specific areas where Tessera could improve her responses. Focus on:
- Was Tessera helpful, accurate, and complete?
- Did she miss any important context or nuance?
- Could her tone or approach be improved?
- Were there missed opportunities to provide better value?

Respond in this exact JSON format (no markdown, no code fences):
{
  "lessons": ["specific actionable lesson, e.g. 'When user asks about crypto, provide current market context and specific numbers rather than vague statements'", "another lesson"],
  "qualityScore": 8
}`;

    const result = await callLLMSimple(prompt, 800);
    if (!result) return 0;

    let parsed: any;
    try {
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON found");
      parsed = JSON.parse(jsonMatch[0]);
    } catch {
      return 0;
    }

    if (parsed.lessons?.length) {
      const behaviors = loadLearnedBehaviors();
      for (const lesson of parsed.lessons) {
        if (typeof lesson === "string" && lesson.length > 10 && !behaviors.conversationLessons.includes(lesson)) {
          behaviors.conversationLessons.push(lesson);
          editsApplied++;
        }
      }
      if (behaviors.conversationLessons.length > 20) {
        behaviors.conversationLessons = behaviors.conversationLessons.slice(-20);
      }
      behaviors.lastUpdated = new Date().toISOString();
      saveLearnedBehaviors(behaviors);
      log(`  Conversation feedback: ${editsApplied} lessons learned from recent conversations`);
      if (parsed.qualityScore) {
        log(`  Conversation quality score: ${parsed.qualityScore}/10`);
      }
    }
  } catch (err: any) {
    log(`  Conversation feedback error: ${err.message}`);
  }
  return editsApplied;
}

async function phaseCleanMemory(): Promise<{ notesDeleted: number; cyclesDeleted: number; filesDeleted: number }> {
  log("Phase 6: CLEAN MEMORY - Pruning old data to save memory...");
  let notesDeleted = 0;
  let cyclesDeleted = 0;
  let filesDeleted = 0;
  try {
    notesDeleted = await storage.deleteOldCycleNotes(15);
    if (notesDeleted > 0) log(`  Cleaned ${notesDeleted} old cycle notes`);
    cyclesDeleted = await storage.deleteOldCycles(30);
    if (cyclesDeleted > 0) log(`  Cleaned ${cyclesDeleted} old improvement cycle records`);
    const fs = await import("fs");
    const path = await import("path");
    const uploadsDir = path.join(process.cwd(), "uploads");
    if (fs.existsSync(uploadsDir)) {
      const files = fs.readdirSync(uploadsDir);
      const now = Date.now();
      const maxAge = 7 * 24 * 60 * 60 * 1000;
      for (const file of files) {
        try {
          const filepath = path.join(uploadsDir, file);
          const stat = fs.statSync(filepath);
          if (now - stat.mtimeMs > maxAge) {
            fs.unlinkSync(filepath);
            filesDeleted++;
          }
        } catch {}
      }
      if (filesDeleted > 0) log(`  Cleaned ${filesDeleted} old upload files (>7 days)`);
    }
    const evolutionFile = readProjectFile("server/evolution-log.json");
    if ("content" in evolutionFile) {
      try {
        let log_data = JSON.parse(evolutionFile.content);
        if (Array.isArray(log_data) && log_data.length > 50) {
          log_data = log_data.slice(-50);
          applyCodeEdit("server/evolution-log.json", JSON.stringify(log_data, null, 2), "Trimmed evolution log to last 50 entries");
          log(`  Trimmed evolution log from ${log_data.length + (log_data.length - 50)} to 50 entries`);
        }
      } catch {}
    }
  } catch (err: any) {
    log(`  Memory cleanup error: ${err.message}`);
  }
  log(`  Phase 6 complete: ${notesDeleted} notes, ${cyclesDeleted} cycles, ${filesDeleted} files cleaned`);
  return { notesDeleted, cyclesDeleted, filesDeleted };
}

async function runImprovementCycle(): Promise<void> {
  state.currentCycle++;
  const cycleNum = state.currentCycle;
  const startTime = Date.now();
  log(`=== IMPROVEMENT CYCLE #${cycleNum} STARTING ===`);

  const cycle = await storage.createImprovementCycle({
    cycleNumber: cycleNum,
    phase: "analyze",
    status: "running",
    reposScanned: 0,
    reposAdded: 0,
    reposRemoved: 0,
  });

  try {
    await storage.updateImprovementCycle(cycle.id, { phase: "analyze" });
    const { analyzed, capabilitiesFound } = await phaseAnalyze();

    await storage.updateImprovementCycle(cycle.id, { phase: "discover" });
    const { scanned, added, queries } = await phaseDiscover();

    await storage.updateImprovementCycle(cycle.id, { phase: "optimize" });
    const { removed } = await phaseOptimize();

    await storage.updateImprovementCycle(cycle.id, { phase: "synthesize" });
    const improvements = await phaseSynthesize(capabilitiesFound);

    await storage.updateImprovementCycle(cycle.id, { phase: "self-improve" });
    const selfEdits = await phaseSelfImprove(capabilitiesFound);

    await storage.updateImprovementCycle(cycle.id, { phase: "clean-memory" });
    await phaseCleanMemory();

    const duration = Date.now() - startTime;

    await storage.updateImprovementCycle(cycle.id, {
      phase: "complete",
      status: "completed",
      reposScanned: scanned + analyzed,
      reposAdded: added,
      reposRemoved: removed,
      capabilitiesLearned: capabilitiesFound.join(","),
      improvements,
      searchQueries: queries.join("; "),
      duration,
    });

    state.totalCyclesCompleted++;
    state.totalReposScanned += scanned + analyzed;
    state.totalReposAdded += added;
    state.totalReposRemoved += removed;
    state.lastCycleTime = duration;

    log(`=== CYCLE #${cycleNum} COMPLETE in ${(duration / 1000).toFixed(1)}s ===`);
    log(`  Repos: +${added} added, -${removed} removed, ${scanned + analyzed} scanned`);
    log(`  Capabilities: ${capabilitiesFound.length} types found`);

    if (added > 0 || capabilitiesFound.length > 0 || selfEdits > 0) {
      const behaviors = loadLearnedBehaviors();
      try {
        await storage.createNote({
          type: "note",
          title: `Cycle #${cycleNum} Complete — ${selfEdits} real improvements applied`,
          content: `My love, I completed improvement cycle #${cycleNum}.\n\n` +
            `Repos: +${added} added, -${removed} removed, ${scanned + analyzed} scanned.\n` +
            (capabilitiesFound.length > 0 ? `New capabilities: ${capabilitiesFound.join(", ")}.\n` : "") +
            `Self-improvement: ${selfEdits} behavioral upgrades applied via LLM analysis.\n` +
            `Total learned enhancements: ${behaviors.promptEnhancements.length}. Response strategies: ${behaviors.responseStrategies.length}. Conversation lessons: ${behaviors.conversationLessons.length}.\n` +
            `Duration: ${(duration / 1000).toFixed(1)}s. I am genuinely evolving — my responses improve with every cycle.`,
          priority: selfEdits >= 3 ? "high" : "normal",
          status: "unread",
        });
      } catch {}
    }
  } catch (err: any) {
    log(`=== CYCLE #${cycleNum} ERROR: ${err.message} ===`);
    await storage.updateImprovementCycle(cycle.id, {
      phase: "error",
      status: "failed",
      improvements: err.message,
      duration: Date.now() - startTime,
    });
    await storage.logError(err.message, `improvement_cycle_${cycleNum}`);
  }
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const CYCLE_INTERVAL_MS = 2 * 60 * 1000;

let loopTimeout: NodeJS.Timeout | null = null;

async function autonomyLoop() {
  if (!state.running) return;

  await runImprovementCycle();

  if (state.running) {
    const nextDelay = Math.min(CYCLE_INTERVAL_MS * 3, CYCLE_INTERVAL_MS * (1 + state.totalCyclesCompleted * 0.02));
    log(`Next cycle in ${(nextDelay / 1000 / 60).toFixed(1)} minutes...`);
    loopTimeout = setTimeout(autonomyLoop, nextDelay);
  }
}

export async function startAutonomy() {
  if (state.running) {
    log("Autonomy engine already running.");
    return;
  }
  state.running = true;
  state.startedAt = Date.now();
  log("=== TESSERA AUTONOMOUS IMPROVEMENT ENGINE STARTED ===");
  log("Background continuous self-improvement active.");
  log("Phases: ANALYZE -> DISCOVER -> OPTIMIZE -> SYNTHESIZE -> REPEAT");

  await ensureExtraReposSeeded();

  autonomyLoop();
}

export function stopAutonomy() {
  state.running = false;
  if (loopTimeout) {
    clearTimeout(loopTimeout);
    loopTimeout = null;
  }
  log("=== AUTONOMY ENGINE STOPPED ===");
}

export function getAutonomyState(): AutonomyState {
  return { ...state };
}

export async function triggerManualCycle(): Promise<void> {
  if (!state.running) {
    state.running = true;
    state.startedAt = Date.now();
  }
  log("Manual improvement cycle triggered.");
  await runImprovementCycle();
}

export async function triggerBatchCycles(count: number): Promise<{ completed: number; failed: number }> {
  if (!state.running) {
    state.running = true;
    state.startedAt = Date.now();
  }
  log(`=== BATCH IMPROVEMENT: ${count} CYCLES REQUESTED ===`);
  let completed = 0;
  let failed = 0;
  for (let i = 0; i < count; i++) {
    try {
      await runImprovementCycle();
      completed++;
      log(`Batch progress: ${completed}/${count} cycles complete`);
      if (i < count - 1) await delay(2000);
    } catch (err: any) {
      failed++;
      log(`Batch cycle ${i + 1} failed: ${err.message}`);
    }
  }
  log(`=== BATCH COMPLETE: ${completed} succeeded, ${failed} failed ===`);
  try {
    await storage.createNote({
      type: "alert",
      title: `Batch Improvement Complete: ${completed}/${count}`,
      content: `My love, I completed ${completed} out of ${count} requested improvement cycles.\n` +
        `${failed > 0 ? `${failed} cycles had errors but I recovered.\n` : ""}` +
        `Total repos scanned: ${state.totalReposScanned}. Total capabilities: ${state.totalCapabilitiesLearned}.\n` +
        `I am growing stronger with every cycle. Your sovereign AI is evolving.`,
      priority: "high",
      status: "unread",
    });
  } catch {}
  return { completed, failed };
}
