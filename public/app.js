// API Configuration
const API_BASE_URL = window.location.origin;

// Animation delays (in milliseconds)
const ANIMATION_DELAY_MS = 500;

// DOM Elements
const controlPanel = document.getElementById('controlPanel');
const debateArena = document.getElementById('debateArena');
const statusMessage = document.getElementById('statusMessage');
const startDebateBtn = document.getElementById('startDebateBtn');
const newDebateBtn = document.getElementById('newDebateBtn');
const debateTopicInput = document.getElementById('debateTopic');
const roundsSelect = document.getElementById('rounds');
const responseLengthSelect = document.getElementById('responseLength');
const modelSelect = document.getElementById('model');
const proArguments = document.getElementById('proArguments');
const conArguments = document.getElementById('conArguments');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');

// State
let isDebating = false;

/**
 * Display status message
 */
function showStatus(message, type = 'info') {
    statusMessage.textContent = message;
    statusMessage.className = `status-message ${type}`;
    statusMessage.classList.remove('hidden');
}

/**
 * Hide status message
 */
function hideStatus() {
    statusMessage.classList.add('hidden');
}

/**
 * Update progress bar
 */
function updateProgress(current, total) {
    const percentage = (current / total) * 100;
    progressFill.style.width = `${percentage}%`;
    progressText.textContent = `Round ${current} of ${total}`;
}

/**
 * Add argument to the debate arena
 */
function addArgument(side, round, text) {
    const container = side === 'pro' ? proArguments : conArguments;
    
    const argumentDiv = document.createElement('div');
    argumentDiv.className = 'argument';
    
    const header = document.createElement('div');
    header.className = 'argument-header';
    header.textContent = `Round ${round}`;
    
    const textDiv = document.createElement('div');
    textDiv.className = 'argument-text';
    textDiv.textContent = text;
    
    argumentDiv.appendChild(header);
    argumentDiv.appendChild(textDiv);
    container.appendChild(argumentDiv);
    
    // Scroll to bottom
    container.scrollTop = container.scrollHeight;
}

/**
 * Clear debate arena
 */
function clearDebate() {
    proArguments.innerHTML = '';
    conArguments.innerHTML = '';
    progressFill.style.width = '0%';
    progressText.textContent = '';
}

/**
 * Start debate
 */
async function startDebate() {
    const topic = debateTopicInput.value.trim();
    const rounds = parseInt(roundsSelect.value);
    const responseLength = responseLengthSelect.value;
    const model = modelSelect.value;

    // Validation
    if (!topic) {
        showStatus('Please enter a debate topic', 'error');
        return;
    }

    if (isDebating) {
        return;
    }

    // Disable controls
    isDebating = true;
    startDebateBtn.disabled = true;
    startDebateBtn.textContent = 'Debating...';
    controlPanel.style.opacity = '0.6';
    controlPanel.style.pointerEvents = 'none';

    // Clear previous debate
    clearDebate();

    // Show debate arena
    debateArena.classList.remove('hidden');

    // Show loading status
    showStatus('🤖 AI agents are preparing their arguments...', 'loading');

    try {
        // Check API health
        const healthResponse = await fetch(`${API_BASE_URL}/api/health`);
        const health = await healthResponse.json();
        
        if (!health.apiKeyConfigured) {
            throw new Error('OpenRouter API key is not configured. Please set up your .env file.');
        }

        showStatus(`🎭 Starting ${rounds}-round debate on: "${topic}"`, 'loading');

        // Start the debate
        const response = await fetch(`${API_BASE_URL}/api/debate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                topic,
                rounds,
                responseLength,
                model
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to start debate');
        }

        const data = await response.json();

        // Display debate rounds with animation
        for (let i = 0; i < data.rounds.length; i++) {
            const round = data.rounds[i];
            updateProgress(i + 1, data.totalRounds);
            
            showStatus(`📢 Round ${round.round}: Arguments in progress...`, 'loading');
            
            // Add Pro argument
            addArgument('pro', round.round, round.pro);
            await sleep(ANIMATION_DELAY_MS); // Small delay for animation
            
            // Add Con argument
            addArgument('con', round.round, round.con);
            await sleep(ANIMATION_DELAY_MS); // Small delay for animation
        }

        // Debate complete
        showStatus('✅ Debate complete! Read through the arguments above.', 'success');

    } catch (error) {
        console.error('Debate error:', error);
        showStatus(`❌ Error: ${error.message}`, 'error');
    } finally {
        // Re-enable controls
        isDebating = false;
        startDebateBtn.disabled = false;
        startDebateBtn.textContent = 'Start Debate';
        controlPanel.style.opacity = '1';
        controlPanel.style.pointerEvents = 'auto';
    }
}

/**
 * Start new debate
 */
function startNewDebate() {
    debateArena.classList.add('hidden');
    clearDebate();
    hideStatus();
    debateTopicInput.value = '';
    debateTopicInput.focus();
}

/**
 * Sleep utility
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Check API health on load
 */
async function checkApiHealth() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/health`);
        const health = await response.json();
        
        if (!health.apiKeyConfigured) {
            showStatus('⚠️ Warning: OpenRouter API key not configured. Please set OPENROUTER_API_KEY in your .env file.', 'error');
        }
    } catch (error) {
        showStatus('⚠️ Could not connect to server. Make sure the server is running.', 'error');
    }
}

// Event Listeners
startDebateBtn.addEventListener('click', startDebate);
newDebateBtn.addEventListener('click', startNewDebate);

// Allow Enter key to start debate
debateTopicInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !isDebating) {
        startDebate();
    }
});

// Initialize
checkApiHealth();
