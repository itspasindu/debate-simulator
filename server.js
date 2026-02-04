const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// OpenRouter API configuration
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const FETCH_TIMEOUT_MS = 60000; // 60 seconds timeout
const MAX_RETRIES = 3; // Maximum number of retry attempts
const INITIAL_RETRY_DELAY_MS = 1000; // Initial delay before first retry

// Simple rate limiting for debate endpoint
const debateRateLimiter = new Map();
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const MAX_DEBATES_PER_WINDOW = 5;

// Available free models on OpenRouter
const FREE_MODELS = {
  llama: 'meta-llama/llama-3-8b-instruct:free',
  gemma: 'google/gemma-7b-it:free',
  mistral: 'mistralai/mistral-7b-instruct:free'
};

// AI Agent personalities
const AGENT_PERSONALITIES = {
  pro: {
    name: 'Pro Agent',
    role: 'advocate',
    style: 'You are a skilled debater arguing in FAVOR of the topic. Be persuasive, use logical arguments, provide examples, and maintain a professional but passionate tone. Always support the affirmative position.'
  },
  con: {
    name: 'Con Agent',
    role: 'opponent',
    style: 'You are a skilled debater arguing AGAINST the topic. Be critical, challenge assumptions, present counterarguments, and maintain a professional but firm tone. Always support the negative position.'
  }
};

// Response length configurations
const RESPONSE_LENGTHS = {
  short: { tokens: 150, description: '1-2 paragraphs' },
  medium: { tokens: 300, description: '3-4 paragraphs' },
  long: { tokens: 500, description: '5-6 paragraphs' }
};

/**
 * Helper function to add timeout to fetch requests
 */
async function fetchWithTimeout(url, options, timeout = FETCH_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

/**
 * Helper function to delay execution
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Call OpenRouter API to get AI response with retry logic
 */
async function callOpenRouter(prompt, personality, length, model = 'llama', retryCount = 0) {
  const modelId = FREE_MODELS[model] || FREE_MODELS.llama;
  const maxTokens = RESPONSE_LENGTHS[length]?.tokens || 300;

  try {
    const response = await fetchWithTimeout(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://github.com/itspasindu/debate-simulator',
        'X-Title': 'AI Debate Simulator'
      },
      body: JSON.stringify({
        model: modelId,
        messages: [
          {
            role: 'system',
            content: personality.style
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: maxTokens,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`OpenRouter API error: ${response.status} - ${errorData}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error(`Error calling OpenRouter (attempt ${retryCount + 1}/${MAX_RETRIES + 1}):`, error.message);
    
    // Check if we should retry
    const isNetworkError = error.name === 'AbortError' || 
                          error.name === 'TypeError' || 
                          error.code === 'UND_ERR_CONNECT_TIMEOUT' ||
                          error.code === 'ECONNREFUSED' ||
                          error.code === 'ETIMEDOUT';
    
    if (isNetworkError && retryCount < MAX_RETRIES) {
      // Calculate exponential backoff delay
      const delayMs = INITIAL_RETRY_DELAY_MS * Math.pow(2, retryCount);
      console.log(`Retrying in ${delayMs}ms...`);
      await delay(delayMs);
      return callOpenRouter(prompt, personality, length, model, retryCount + 1);
    }
    
    throw error;
  }
}

/**
 * API Endpoints
 */

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok',
    apiKeyConfigured: !!OPENROUTER_API_KEY,
    availableModels: Object.keys(FREE_MODELS)
  });
});

// Get available models and configurations
app.get('/api/config', (req, res) => {
  res.json({
    models: FREE_MODELS,
    responseLengths: RESPONSE_LENGTHS,
    agents: {
      pro: { name: AGENT_PERSONALITIES.pro.name },
      con: { name: AGENT_PERSONALITIES.con.name }
    }
  });
});

// Start a debate
app.post('/api/debate', async (req, res) => {
  try {
    // Simple rate limiting by IP
    const clientIp = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    
    // Clean up old entries
    for (const [ip, data] of debateRateLimiter.entries()) {
      if (now - data.timestamp > RATE_LIMIT_WINDOW_MS) {
        debateRateLimiter.delete(ip);
      }
    }
    
    // Check rate limit
    const clientData = debateRateLimiter.get(clientIp) || { count: 0, timestamp: now };
    if (clientData.count >= MAX_DEBATES_PER_WINDOW && now - clientData.timestamp < RATE_LIMIT_WINDOW_MS) {
      return res.status(429).json({ 
        error: 'Too many requests. Please wait a minute before starting another debate.' 
      });
    }
    
    // Update rate limit counter
    if (now - clientData.timestamp > RATE_LIMIT_WINDOW_MS) {
      clientData.count = 1;
      clientData.timestamp = now;
    } else {
      clientData.count += 1;
    }
    debateRateLimiter.set(clientIp, clientData);

    const { topic, rounds, responseLength, model } = req.body;

    // Validation
    if (!topic || !topic.trim()) {
      return res.status(400).json({ error: 'Topic is required' });
    }

    if (!rounds || rounds < 1 || rounds > 10) {
      return res.status(400).json({ error: 'Rounds must be between 1 and 10' });
    }

    if (!responseLength || !RESPONSE_LENGTHS[responseLength]) {
      return res.status(400).json({ error: 'Invalid response length' });
    }

    if (!OPENROUTER_API_KEY) {
      return res.status(500).json({ 
        error: 'OpenRouter API key not configured. Please set OPENROUTER_API_KEY in .env file.' 
      });
    }

    const debateRounds = [];
    let context = `Debate Topic: ${topic}\n\n`;

    // Generate debate rounds
    for (let i = 1; i <= rounds; i++) {
      console.log(`Generating round ${i}...`);

      // Pro argument
      const proPrompt = `${context}Round ${i}: Present your argument in favor of: "${topic}"`;
      const proResponse = await callOpenRouter(
        proPrompt,
        AGENT_PERSONALITIES.pro,
        responseLength,
        model
      );

      // Con argument
      const conPrompt = `${context}Round ${i}: The Pro side just argued:\n"${proResponse}"\n\nNow present your counter-argument against: "${topic}"`;
      const conResponse = await callOpenRouter(
        conPrompt,
        AGENT_PERSONALITIES.con,
        responseLength,
        model
      );

      debateRounds.push({
        round: i,
        pro: proResponse,
        con: conResponse
      });

      // Update context for next round
      context += `Round ${i}:\nPro: ${proResponse}\nCon: ${conResponse}\n\n`;
    }

    res.json({
      topic,
      rounds: debateRounds,
      totalRounds: rounds,
      responseLength,
      model
    });

  } catch (error) {
    console.error('Debate error:', error);
    res.status(500).json({ 
      error: 'Failed to generate debate',
      details: error.message 
    });
  }
});

// Serve the frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`🎭 Debate Simulator Server running on http://localhost:${PORT}`);
  console.log(`API Key configured: ${!!OPENROUTER_API_KEY}`);
  if (!OPENROUTER_API_KEY) {
    console.log('⚠️  Warning: OPENROUTER_API_KEY not set. Please create a .env file with your API key.');
  }
});
