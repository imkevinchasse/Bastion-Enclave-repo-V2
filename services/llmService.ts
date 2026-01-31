
import { AuditResult, SecurityLevel, PhishingResult } from "../types";

// Note: We use specific CDN URLs with @vite-ignore to prevent the bundler from 
// failing on Node.js dependencies (buffer, long) found in the local node_modules.

// --- CONFIGURATION ---

// Layer 2 Model: MiniLM-L12 (Higher precision embeddings than L6)
const EMBEDDING_MODEL = "Xenova/all-MiniLM-L12-v2";

// Layer 3 Model: TinyLlama (Generative Reasoner)
const LLM_MODEL_ID = "TinyLlama-1.1B-Chat-v1.0-q4f32_1-MLC";

// --- STATE MANAGEMENT ---

interface ServiceState {
    llm: any | null; 
    embedder: any | null; 
    status: 'idle' | 'loading' | 'ready' | 'error';
    progress: string;
    anchors?: {
        threat: number[][];
        safe: number[][];
    }
}

let state: ServiceState = {
    llm: null,
    embedder: null,
    status: 'idle',
    progress: ''
};

// --- LAYER 1: DETERMINISTIC SIGNAL VECTOR ---

const PATTERNS = {
    urgency: /\b(immediately|urgent|act now|suspended|24 hours|expired|unauthorized|breach|lock|verify|deleted|terminate|deadline)\b/i,
    authority: /\b(admin|support|security team|ceo|hr department|irs|police|legal|compliance|executive)\b/i,
    credential: /\b(password|login|verify account|click here|secure link|update details|billing|invoice|sign in|validation)\b/i,
    financial: /\b(payment|invoice|overdue|refund|gift card|bitcoin|btc|transfer|wire|bank|deposit)\b/i,
    pressure: /\b(ignore this|don't tell|secret|confidential|risk|lawsuit|warrant)\b/i
};

interface SignalVector {
    urgency: boolean;
    authority: boolean;
    credential: boolean;
    financial: boolean;
    pressure: boolean;
    linkCount: number;
    capsRatio: number;
    score: number; // 0-100
}

const normalizeText = (text: string) => text.toLowerCase().replace(/\s+/g, ' ').trim();

const extractSignalVector = (text: string): SignalVector => {
    const norm = normalizeText(text);
    
    const signals = {
        urgency: PATTERNS.urgency.test(norm),
        authority: PATTERNS.authority.test(norm),
        credential: PATTERNS.credential.test(norm),
        financial: PATTERNS.financial.test(norm),
        pressure: PATTERNS.pressure.test(norm),
        linkCount: (text.match(/http[s]?:\/\//g) || []).length,
        capsRatio: (text.replace(/[^A-Z]/g, "").length) / (text.length || 1),
        score: 0
    };

    // Deterministic Scoring Rule
    let rawScore = 0;
    if (signals.urgency) rawScore += 25;
    if (signals.authority) rawScore += 15;
    if (signals.credential) rawScore += 30;
    if (signals.financial) rawScore += 15;
    if (signals.pressure) rawScore += 15;
    if (signals.linkCount > 0) rawScore += 10;
    if (signals.capsRatio > 0.3) rawScore += 10;

    signals.score = Math.min(100, rawScore);
    return signals;
};

// --- LAYER 2: SEMANTIC ANCHORS ---

const ANCHOR_TEXTS = {
    THREAT: [
        "urgent action required account suspended immediately",
        "verify your password and identity to prevent lockout",
        "unauthorized login attempt detected click to secure",
        "payment failed update billing information now",
        "transfer funds to this bitcoin wallet address",
        "executive request do this silently and quickly"
    ],
    SAFE: [
        "meeting agenda for next week team sync",
        "hey can we grab lunch tomorrow",
        "project status update report attached",
        "shipping confirmation for your amazon order",
        "happy birthday have a great day",
        "recipe for chocolate chip cookies"
    ]
};

// Math Utils
const dotProduct = (a: number[], b: number[]) => a.reduce((sum, v, i) => sum + v * b[i], 0);
const magnitude = (v: number[]) => Math.sqrt(v.reduce((sum, x) => sum + x * x, 0));
const cosineSimilarity = (a: number[], b: number[]) => dotProduct(a, b) / (magnitude(a) * magnitude(b));

// --- INITIALIZATION ---

export const isModelReady = (): boolean => state.status === 'ready';

export const isLlmAvailable = (): boolean => state.status === 'ready' && state.llm !== null;

export const isEmbedderAvailable = (): boolean => state.status === 'ready' && state.embedder !== null;

export const checkWebGPUSupport = (): boolean => {
    return !!(navigator as any).gpu;
};

export const initLLM = async (onProgress: (text: string) => void): Promise<void> => {
    if (state.status === 'ready') return;

    // STRICT WEBGPU CHECK
    if (!checkWebGPUSupport()) {
        const error = "WebGPU Required: This AI model requires hardware acceleration not available in your current environment.";
        state.status = 'error';
        throw new Error(error);
    }

    try {
        state.status = 'loading';
        onProgress("Initializing Core engines...");

        // 1. Attempt to load Layer 2 (Embeddings)
        try {
            // @ts-ignore
            const transformersMod = await import(/* @vite-ignore */ "https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2");
            const { pipeline, env } = transformersMod;
            
            // Configuration
            env.allowLocalModels = false;
            env.useBrowserCache = true;
            // Even if WebGPU is present, we often use WASM for the embedder to save GPU VRAM for the LLM
            env.backends.onnx.wasm.numThreads = 1; 
            env.backends.onnx.wasm.simd = true;

            onProgress("Loading Semantic Encoder...");
            state.embedder = await pipeline('feature-extraction', EMBEDDING_MODEL, {
                quantized: true,
            });

            // Pre-compute Anchors
            const threatEmbeds: number[][] = [];
            const safeEmbeds: number[][] = [];

            for (const text of ANCHOR_TEXTS.THREAT) {
                const out = await state.embedder(text, { pooling: 'mean', normalize: true });
                threatEmbeds.push(Array.from(out.data));
            }
            for (const text of ANCHOR_TEXTS.SAFE) {
                const out = await state.embedder(text, { pooling: 'mean', normalize: true });
                safeEmbeds.push(Array.from(out.data));
            }
            state.anchors = { threat: threatEmbeds, safe: safeEmbeds };

        } catch (e) {
            console.warn("Layer 2 (Embeddings) Init Failed.", e);
            throw new Error("Failed to load Semantic Encoder.");
        }

        // 2. Attempt to load Layer 3 (LLM)
        try {
            onProgress("Initializing Neural Reasoner (GPU)...");
            // @ts-ignore
            const webLlmMod = await import(/* @vite-ignore */ "https://esm.sh/@mlc-ai/web-llm@0.2.72");
            const { CreateMLCEngine } = webLlmMod;
            
            state.llm = await CreateMLCEngine(LLM_MODEL_ID, {
                initProgressCallback: (report: any) => onProgress(report.text)
            });
            onProgress("Hybrid Intelligence Active");
        } catch (e) {
            console.error("WebGPU Init Failed:", e);
            throw new Error("Failed to initialize GPU Neural Engine. Check VRAM availability.");
        }

        state.status = 'ready';

    } catch (e: any) {
        console.error("Critical AI Init Failed:", e);
        state.status = 'error';
        state.llm = null;
        state.embedder = null;
        throw e; // Propagate error to UI
    }
};

// --- PUBLIC API ---

export const runPhishingAnalysis = async (text: string): Promise<PhishingResult> => {
    if (state.status !== 'ready') throw new Error("AI Engine not ready");

    // --- STEP 1: Signal Extraction (Heuristic - Layer 1) ---
    const signals = extractSignalVector(text);
    const activeSignals = Object.entries(signals)
        .filter(([k, v]) => v === true && k !== 'score')
        .map(([k]) => k.toUpperCase());

    // --- STEP 2: Semantic Classification (Embedding - Layer 2) ---
    let semanticRisk = 0;
    let threatSim = 0; 
    let safeSim = 0;

    if (state.embedder && state.anchors) {
        const output = await state.embedder(text, { pooling: 'mean', normalize: true });
        const inputVec = Array.from(output.data) as number[];

        threatSim = Math.max(...state.anchors.threat.map(anchor => cosineSimilarity(inputVec, anchor)));
        safeSim = Math.max(...state.anchors.safe.map(anchor => cosineSimilarity(inputVec, anchor)));
        
        if (threatSim > safeSim) {
            semanticRisk = (threatSim - safeSim) * 100 * 2;
        }
        semanticRisk = Math.min(100, Math.max(0, semanticRisk));
    }

    // --- HYBRID SCORING ---
    const hybridScore = (signals.score * 0.5) + (semanticRisk * 0.5);
    
    let riskLevel: 'SAFE' | 'SUSPICIOUS' | 'DANGEROUS' = 'SAFE';
    if (hybridScore > 65) riskLevel = 'DANGEROUS';
    else if (hybridScore > 35) riskLevel = 'SUSPICIOUS';

    // --- STEP 3: Neural Explanation (Generative) ---
    let analysis = "";
    
    if (state.llm) {
        const systemPrompt = `You are a security analyst.
Input: "${text.substring(0, 150)}..."
Signals: ${activeSignals.join(", ") || "None"}.
Risk: ${riskLevel}.
Task: Explain why this is ${riskLevel} in one sentence.`;

        try {
            const response = await state.llm.chat.completions.create({
                messages: [{ role: "user", content: systemPrompt }],
                max_tokens: 60,
                temperature: 0.1,
            });
            analysis = response.choices[0].message.content || "Analysis failed.";
        } catch (e) {
            analysis = `Automated Analysis: Detected ${activeSignals.length} risk signals.`;
        }
    } else {
        analysis = "Neural Engine unavailable. Heuristic Analysis only.";
    }

    return {
        riskLevel,
        confidence: Math.round(hybridScore),
        indicators: activeSignals.length > 0 ? activeSignals : ["NO_OBVIOUS_TRIGGERS"],
        analysis: analysis.replace(/"/g, '').trim()
    };
};

export const runCredentialAudit = async (password: string, service?: string, username?: string): Promise<AuditResult> => {
    if (state.status !== 'ready') throw new Error("AI Engine not ready");

    // Heuristics for Password (Layer 1)
    const hasContext = service && password.toLowerCase().includes(service.toLowerCase());
    const lenScore = Math.min(100, password.length * 4);
    const diversityScore = (/[A-Z]/.test(password) ? 20 : 0) + 
                           (/[0-9]/.test(password) ? 20 : 0) + 
                           (/[^A-Za-z0-9]/.test(password) ? 30 : 0);
    
    let totalScore = Math.min(100, lenScore + diversityScore);
    if (hasContext) totalScore = Math.max(0, totalScore - 50); 

    let level: SecurityLevel = SecurityLevel.LOW;
    if (totalScore > 80) level = SecurityLevel.HIGH;
    else if (totalScore > 50) level = SecurityLevel.MEDIUM;
    else if (totalScore <= 20) level = SecurityLevel.CRITICAL;

    const suggestions = hasContext ? ["Remove service name from password"] : ["Increase length", "Use symbols"];

    // Reasoner
    let analysis = "";
    if (state.llm) {
        const prompt = `Password Score: ${totalScore}/100.
Context Leak: ${hasContext ? "YES" : "NO"}.
Task: Give 1 specific advice to improve this password. Be brief.`;

        try {
            const response = await state.llm.chat.completions.create({
                messages: [{ role: "user", content: prompt }],
                max_tokens: 60,
                temperature: 0.2,
            });
            analysis = response.choices[0].message.content;
        } catch (e) {
            analysis = "Use a longer, random password generated by the Bastion Chaos Engine.";
        }
    }

    return {
        score: totalScore,
        level,
        analysis: analysis || "Use a longer, random password.",
        suggestions
    };
};

export const expandSearchQuery = async (query: string): Promise<string[]> => {
    if (!state.llm) return []; 
    try {
        const response = await state.llm.chat.completions.create({
            messages: [{ role: "user", content: `List 3 synonyms for "${query}" as comma-separated words:` }],
            max_tokens: 50,
        });
        return (response.choices[0].message.content || "").split(',').map((s: string) => s.trim()).slice(0, 5);
    } catch { return []; }
};

export const runTextTransformation = async (text: string, mode: 'summarize' | 'grammar' | 'todo'): Promise<string> => {
    if (!state.llm) throw new Error("Neural Engine (LLM) is required for text transformation. Your device may not support WebGPU.");
    const prompts = {
        summarize: "Summarize this:",
        grammar: "Fix grammar:",
        todo: "Extract tasks:"
    };
    const response = await state.llm.chat.completions.create({
        messages: [{ role: "user", content: `${prompts[mode]}\n${text.substring(0, 1000)}` }],
        max_tokens: 300,
    });
    return response.choices[0].message.content || "";
};
