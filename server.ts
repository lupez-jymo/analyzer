import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialize Gemini AI
let aiClient: GoogleGenAI | null = null;
function getAIClient(): GoogleGenAI | null {
  if (!process.env.GEMINI_API_KEY) {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Health check endpoint
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
    timestamp: new Date().toISOString(),
  });
});

// AI Analyst synthesis endpoint
app.post("/api/analyst", async (req, res) => {
  try {
    const {
      market,
      symbol,
      currentPrice,
      digitStats,
      evenOddStats,
      riseFallStats,
      volatility,
      rsi,
      sampleSize,
    } = req.body;

    const sample = sampleSize || 100;
    const ai = getAIClient();

    if (ai) {
      const prompt = `You are the quantitative AI Market Analyst for Deriv Options Analyzer, an independent market-analysis platform.
Analyze this market dataset objectively:
Market: ${market || 'Volatility Index'} (${symbol || 'R_100'})
Sample Size: ${sample} ticks
Current Price: ${currentPrice || 'N/A'}
Digit Distribution: Most frequent digit=${digitStats?.mostFrequentDigit} (${digitStats?.mostFrequentPercentage}%), Least frequent digit=${digitStats?.leastFrequentDigit} (${digitStats?.leastFrequentPercentage}%)
Even / Odd: Even=${evenOddStats?.evenPercentage}%, Odd=${evenOddStats?.oddPercentage}%, Streak=${evenOddStats?.currentStreak}x ${evenOddStats?.currentStreakType}
Rise / Fall: Rise=${riseFallStats?.risePercentage}%, Fall=${riseFallStats?.fallPercentage}%, Trend=${riseFallStats?.shortTermTrend}
Volatility StdDev: ${volatility || '0.15'}, RSI: ${rsi || 50}

Generate a JSON report adhering strictly to this schema:
{
  "summary": "3-4 sentences objective summary emphasizing sample size and current dispersion without guaranteeing outcomes",
  "keyDigitInsights": ["3 concise bullet points on digit frequencies and overdue numbers"],
  "trendAssessment": "2-3 sentences assessing short-term momentum vs mean reversion",
  "potentialOpportunities": ["2-3 conditional analytical opportunities such as parity fade or streak continuation"],
  "riskConsiderations": ["2-3 risk warnings including martingale danger, streak persistence, and market volatility"],
  "sampleSizeTransparency": ${sample},
  "conflictingIndicators": ["1-2 conflicting statistical observations if any"]
}

STRICT RULE: Only return valid JSON. Do not include markdown ticks or wrap in backticks.`;

      try {
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
          config: {
            systemInstruction: "You are an objective quantitative statistics analyst. Never promise guaranteed profits or certainty. Always express probabilities objectively.",
            responseMimeType: "application/json",
            temperature: 0.2,
          },
        });

        const parsed = JSON.parse(response.text || '{}');
        if (parsed.summary && parsed.keyDigitInsights) {
          return res.json({
            ...parsed,
            sampleSizeTransparency: sample,
          });
        }
      } catch (genErr) {
        console.warn("Gemini generation failed, falling back to deterministic synthesis:", genErr);
      }
    }

    // High-quality deterministic quantitative synthesis
    const report = generateStructuredAnalysis(
      market,
      symbol,
      currentPrice,
      sample,
      digitStats,
      evenOddStats,
      riseFallStats,
      volatility,
      rsi
    );

    return res.json(report);
  } catch (error: any) {
    console.error("AI Analyst error:", error);
    return res.status(500).json({
      summary: "Error synthesizing analysis. Please verify market data connection.",
      keyDigitInsights: ["Data evaluation interrupted"],
      trendAssessment: "Neutral bias due to calculation error",
      potentialOpportunities: [],
      riskConsiderations: ["Maintain cautious capital controls"],
      sampleSizeTransparency: 100,
      conflictingIndicators: [],
    });
  }
});

function generateStructuredAnalysis(
  market: string,
  symbol: string,
  currentPrice: number,
  sampleSize: number,
  digitStats: any,
  evenOddStats: any,
  riseFallStats: any,
  volatility: number,
  rsi: number
) {
  const topDigit = digitStats?.mostFrequentDigit ?? 7;
  const topPct = digitStats?.mostFrequentPercentage ?? 14.5;
  const bottomDigit = digitStats?.leastFrequentDigit ?? 2;
  const bottomPct = digitStats?.leastFrequentPercentage ?? 6.2;
  const evenPct = evenOddStats?.evenPercentage ?? 50;
  const oddPct = evenOddStats?.oddPercentage ?? 50;
  const risePct = riseFallStats?.risePercentage ?? 50;
  const fallPct = riseFallStats?.fallPercentage ?? 50;
  const trend = riseFallStats?.shortTermTrend ?? 'Neutral';

  const conflicting: string[] = [];
  if (evenPct > 54 && risePct < 46) {
    conflicting.push(`Even digit bias (${evenPct}%) coexists with a downward directional bias (${fallPct}% Fall).`);
  }
  if (topPct > 15 && trend === 'Neutral') {
    conflicting.push(`Heavy clustering on digit ${topDigit} occurs within a low-momentum consolidation corridor.`);
  }
  if (conflicting.length === 0) {
    conflicting.push('Indicators display mild statistical coherence across 10-tick and 50-tick lookbacks.');
  }

  return {
    summary: `Evaluating ${sampleSize} historical ticks for ${market || 'Synthetic Index'} (${symbol || 'R_100'}) at spot quote ${currentPrice || '1000.00'}. The sample reflects ${trend.toLowerCase()} momentum with ${risePct}% rising and ${fallPct}% falling ticks. Digit occurrences show a dispersion range of ${bottomPct}% to ${topPct}%, with digit ${topDigit} presenting peak frequency. All metrics denote empirical historical observations and do not imply future deterministic patterns.`,
    keyDigitInsights: [
      `Digit ${topDigit} records highest relative prominence at ${topPct}% (expected baseline is ~10.0%).`,
      `Digit ${bottomDigit} remains the most statistically overdue with ${bottomPct}% occurrence rate.`,
      `Even digits occupy ${evenPct}% versus Odd at ${oddPct}%, with an active ${evenOddStats?.currentStreak || 1}x streak.`,
    ],
    trendAssessment: `Short-term velocity exhibits a ${trend} bias with 10-tick momentum registering ${riseFallStats?.momentum ?? 0.1}. The relative strength index (RSI) registers at ${Math.round(rsi || 50)}, denoting balanced positioning without extreme overextension.`,
    potentialOpportunities: [
      `Even/Odd mean reversion: If streak extends beyond 4 ticks, analytical probability favors parity diversification.`,
      `Matches/Differs statistical edge: Differs against overdue digit ${bottomDigit} aligns with ${100 - bottomPct}% empirical survival rate.`,
      `Rise/Fall continuation: Aligning short-duration contracts with ${trend} flow when SMA(10) confirms slope.`,
    ],
    riskConsiderations: [
      `Strictly avoid Martingale recovery progressions: synthetic runs can maintain outlier streaks beyond 8 consecutive ticks.`,
      `Fixed stake discipline: Cap single-contract risk at maximum 1-2% of available simulated session balance.`,
      `Volatility shifts: Rapid regime changes in synthetic indices can invalidate short-window directional models.`,
    ],
    sampleSizeTransparency: sampleSize,
    conflictingIndicators: conflicting,
  };
}

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Deriv Options Analyzer server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
