# Local Claude Setup Guide

Your app now uses **Claude locally** in the browser for all AI analysis. No backend API calls needed!

## Setup Steps

### 1. Get Your Claude API Key
- Go to https://console.anthropic.com/
- Create an API key (get $5 free credits)
- Copy your API key

### 2. Add to .env
Edit `.env` and replace the placeholder:

```
NEXT_PUBLIC_ANTHROPIC_API_KEY=sk-ant-v1-your_actual_key_here
```

⚠️ **IMPORTANT**: This is `NEXT_PUBLIC_` so it will be visible to clients. For production, use a backend proxy.

### 3. Restart Dev Server
```bash
npm run dev
```

## What Works Locally Now

### Resume Analysis
- **General Analysis**: Click "Analyze My Resume" → Claude analyzes your profile locally
- **Job Match**: Click "Analyze" on any job → Claude compares resume vs job posting
- All results saved to browser localStorage

### Git Portfolio Analysis
- Click "Analyze My Git" → Claude analyzes your repos locally
- Evaluates tech stack, project complexity, documentation
- Results saved to localStorage

### Chat & Advice
- Career advice chatbot runs locally with Claude
- Streaming responses for real-time feedback
- No server needed

## How It Works

1. **Data stays in browser**: Resume/profile data never sent to your server
2. **Direct Claude API**: Uses `@anthropic-ai/sdk` to call Claude directly
3. **Persistent storage**: Results saved to browser localStorage
4. **Streaming support**: Real-time chat responses with `chatWithClaudeStream()`

## Files Modified

- `lib/localClaude.ts` - Core Claude integration functions
- `app/analytics/AnalyticsClient.tsx` - Updated to use local Claude
- `.env` - Added NEXT_PUBLIC_ANTHROPIC_API_KEY

## Available Functions

```typescript
import {
  analyzeResumeGeneral,
  analyzeResumeForJob,
  analyzeGitPortfolio,
  chatWithClaude,
  chatWithClaudeStream,
} from "@/lib/localClaude";

// Resume analysis
const result = await analyzeResumeGeneral(resumeText);

// Job matching
const jobMatch = await analyzeResumeForJob(resumeText, jobDetails);

// Git portfolio
const gitAnalysis = await analyzeGitPortfolio(repos);

// Chat
const response = await chatWithClaude(messages, systemPrompt);

// Streaming chat
for await (const chunk of chatWithClaudeStream(messages, systemPrompt)) {
  console.log(chunk);
}
```

## API Keys Exposed?

Your Claude API key is visible in the browser (it's NEXT_PUBLIC_). This is fine for:
- ✅ Personal projects
- ✅ Development
- ✅ Demo/testing

For production with real users:
- ❌ Move key to backend
- ❌ Use Next.js API routes as proxy
- ❌ Or use Anthropic Messages API via backend

## Troubleshooting

### "Analysis failed - check your Claude API key"
- Make sure `NEXT_PUBLIC_ANTHROPIC_API_KEY` is set in `.env`
- Restart dev server after changing .env
- Check key is valid at console.anthropic.com

### "Module not found: @anthropic-ai/sdk"
```bash
npm install @anthropic-ai/sdk
```

### Results not saving?
- Check browser's Application → LocalStorage
- Look for keys: `resumeAnalyses`, `gitAnalyses`
- Clear cache if stale data showing

## Cost & Limits

- Claude 3.5 Sonnet: $3 per 1M input tokens, $15 per 1M output tokens
- Free trial: $5 credits (often enough for testing)
- Rate limits: Check console.anthropic.com for your account

## Next Steps

1. Add your Claude API key to `.env`
2. Restart dev server
3. Click "Analyze My Resume" or "Analyze My Git"
4. Watch Claude analyze everything locally! 🚀
