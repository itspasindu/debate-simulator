# 🎭 AI Debate Simulator

A full-stack web application that simulates debates between two AI agents with distinct personalities. Watch Pro and Con agents argue on any topic using free AI models from OpenRouter.

![Debate Simulator](https://img.shields.io/badge/AI-Debate%20Simulator-purple?style=for-the-badge)
![Node.js](https://img.shields.io/badge/Node.js-Express-green?style=flat-square)
![OpenRouter](https://img.shields.io/badge/OpenRouter-Free%20Models-blue?style=flat-square)

## ✨ Features

- **🤖 Dual AI Agents**: Pro and Con agents with distinct personalities and debate styles
- **🎨 Modern Split-Screen Interface**: Clean, responsive design with real-time debate visualization
- **⚙️ Customizable Options**:
  - Choose number of rounds (1-10)
  - Select response length (short/medium/long)
  - Pick from multiple free AI models (Llama, Gemma, Mistral)
- **🆓 Free AI Models**: Powered by OpenRouter's free model tier
- **📱 Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **⚡ Real-time Updates**: Live progress tracking and animated argument display

## 🏗️ Architecture

### Frontend
- **HTML5/CSS3**: Modern, semantic markup with gradient designs
- **Vanilla JavaScript**: No framework dependencies, pure ES6+
- **Responsive Layout**: Mobile-first design with CSS Grid

### Backend
- **Node.js + Express**: Lightweight REST API server
- **OpenRouter Integration**: Free AI model access (Llama 3, Gemma 7B, Mistral 7B)
- **Environment-based Config**: Secure API key management

## 🚀 Quick Start

### Prerequisites

- Node.js (v14 or higher)
- npm (comes with Node.js)
- OpenRouter API key (free from [OpenRouter](https://openrouter.ai/keys))

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/itspasindu/debate-simulator.git
   cd debate-simulator
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your OpenRouter API key:
   ```env
   OPENROUTER_API_KEY=your_actual_api_key_here
   PORT=3000
   ```

4. **Start the server**
   ```bash
   npm start
   ```

5. **Open your browser**
   Navigate to: `http://localhost:3000`

## 🎮 Usage

1. **Enter a debate topic**: Type any topic you want the AI agents to debate (e.g., "Artificial intelligence will benefit humanity")

2. **Configure settings**:
   - **Rounds**: Choose how many back-and-forth exchanges (1-10)
   - **Response Length**: Select argument length (short/medium/long)
   - **AI Model**: Pick your preferred free model (Llama, Gemma, or Mistral)

3. **Start the debate**: Click "Start Debate" and watch the AI agents argue their positions

4. **Review arguments**: Read through the split-screen display showing Pro (in favor) and Con (against) arguments

5. **Start a new debate**: Click "Start New Debate" to try a different topic

## 🔧 API Endpoints

### Health Check
```http
GET /api/health
```
Returns server status and API key configuration.

### Get Configuration
```http
GET /api/config
```
Returns available models, response lengths, and agent information.

### Start Debate
```http
POST /api/debate
Content-Type: application/json

{
  "topic": "Artificial intelligence will benefit humanity",
  "rounds": 3,
  "responseLength": "medium",
  "model": "llama"
}
```
Starts a debate and returns all rounds.

## 🤖 Available AI Models

All models are free to use via OpenRouter:

- **Llama 3.1 8B Instruct**: Meta's powerful open-source model
- **Gemma 2 9B IT**: Google's instruction-tuned model  
- **Mistral 7B Instruct**: High-quality French AI model
- **Qwen 2 7B Instruct**: Alibaba's efficient instruction model

## 🎨 UI Components

- **Control Panel**: Topic input and configuration options
- **Progress Bar**: Visual indicator of debate progress
- **Split-Screen Arena**: Side-by-side argument display
- **Agent Headers**: Visual identification of Pro vs Con agents
- **Status Messages**: Real-time feedback and error handling

## 📁 Project Structure

```
debate-simulator/
├── server.js           # Express server and API endpoints
├── package.json        # Node.js dependencies and scripts
├── .env.example        # Environment variable template
├── .gitignore         # Git ignore rules
├── README.md          # Documentation (this file)
└── public/            # Frontend files
    ├── index.html     # Main HTML page
    ├── styles.css     # CSS styling
    └── app.js         # Frontend JavaScript
```

## 🛠️ Development

### Running in Development Mode
```bash
npm run dev
```

### Environment Variables
- `OPENROUTER_API_KEY`: Your OpenRouter API key (required)
- `PORT`: Server port (default: 3000)

## 🔒 Security

- API keys are stored in `.env` file (not committed to git)
- CORS enabled for local development
- Input validation on all API endpoints
- No sensitive data logged or exposed

## 🐛 Troubleshooting

### "OpenRouter API key not configured" error
- Make sure you created a `.env` file from `.env.example`
- Add your actual API key from [OpenRouter](https://openrouter.ai/keys)
- Restart the server after adding the key

### Server won't start
- Check if port 3000 is already in use
- Try a different port: `PORT=3001 npm start`
- Ensure Node.js v14+ is installed: `node --version`

### Debates are slow
- This is normal - AI models take time to generate responses
- Try using "short" response length for faster results
- Each round requires 2 API calls (Pro and Con)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## 📄 License

ISC License

## 🙏 Acknowledgments

- **OpenRouter**: For providing free AI model access
- **Meta, Google, Mistral AI**: For their open-source AI models
- **Express.js**: For the excellent web framework

## 🔗 Links

- [OpenRouter Documentation](https://openrouter.ai/docs)
- [Get OpenRouter API Key](https://openrouter.ai/keys)
- [Express.js Documentation](https://expressjs.com/)

---

Built with ❤️ for the AI community