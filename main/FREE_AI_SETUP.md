# FREE AI Setup - Google Gemini API

Your app now uses **Google Gemini AI** (completely free) for all analysis. No credit card needed!

## ✨ Why Gemini?

- ✅ **100% FREE** - Generous free tier
- ✅ **No credit card** - Just sign up
- ✅ **Fast** - Gemini 2.0 Flash is quick
- ✅ **Runs locally** - All analysis in browser
- ✅ **Unlimited** - No strict rate limits on free tier
- ✅ **No backend needed** - Direct API calls

## 🚀 Setup (2 Minutes)

### Step 1: Get Free API Key
1. Go to: https://ai.google.dev
2. Click "Get API Key"
3. Select your Google account (create one if needed - totally free)
4. Click "Create API Key"
5. Copy the API key

### Step 2: Add to .env
Open `.env` and update:

```env
NEXT_PUBLIC_GEMINI_API_KEY=your_key_here
```

Replace `your_key_here` with your actual key from Step 1.

### Step 3: Restart Dev Server
```bash
npm run dev
```

Done! ✅

## 🎯 What Works

### Resume Analysis
- Click **"Analyze My Resume"** → Gemini analyzes your profile instantly
- Click **"Analyze"** on any job → Compares resume vs job posting
- Results saved to browser localStorage

### Git Portfolio Analysis
- Click **"Analyze My Git"** → Gemini evaluates your repos
- Tech stack, project quality, improvement suggestions
- Results saved locally

### Chat & Career Advice
- Chatbot runs on Gemini
- Get real-time career guidance
- Completely free!

## 📊 Free Tier Limits

- **Requests**: 60 per minute (more than enough for testing)
- **Cost**: FREE
- **No credit card**: Seriously
- **Usage**: Unlimited for personal/educational use

Official limits: https://ai.google.dev/gemini-api/docs/usage-limits

## 🏗️ How It Works

```
You (Browser)
   ↓
Gemini API (Google's servers)
   ↓
Your resume/portfolio analysis
   ↓
Results saved to localStorage
```

**Data flow**:
1. Your resume text → sent to Gemini
2. Gemini analyzes → returns JSON results
3. Results stored in browser LocalStorage
4. No backend server needed

## 📝 Available Functions

All in `lib/localClaude.ts`:

```typescript
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

## 🔒 Privacy Note

Your **Gemini API key is visible in browser** (it's NEXT_PUBLIC_). This is fine because:
- ✅ Personal project
- ✅ Development/testing
- ✅ No real user data

For production with real users, use a backend proxy (see below).

## 🚀 Production Setup (Optional)

To protect your API key in production:

1. Move key to server `.env` (not NEXT_PUBLIC_)
2. Create Next.js API route `/api/analyze`:
   ```typescript
   // pages/api/analyze.ts
   import { analyzeResumeGeneral } from "@/lib/localClaude";

   export default async function handler(req, res) {
     const result = await analyzeResumeGeneral(req.body.resumeText);
     res.json(result);
   }
   ```
3. Call from frontend: `fetch('/api/analyze', ...)`

## ❓ Troubleshooting

### "API key not found"
- Add `NEXT_PUBLIC_GEMINI_API_KEY` to `.env`
- Restart dev server
- Don't forget the `NEXT_PUBLIC_` prefix!

### "Rate limit exceeded"
- Wait 1 minute
- You're hitting 60 requests/minute - try again

### "Invalid API key"
- Go to https://ai.google.dev
- Check if key is active
- Generate a new key if needed

### Results not showing?
- Check browser LocalStorage: DevTools → Application → LocalStorage
- Check browser console for errors: DevTools → Console
- Make sure API key is correct in `.env`

## 💰 Cost Breakdown

- **Your cost**: $0 (FREE)
- **Gemini 2.0 Flash**: ~$0.075 per 1M input tokens
- **Free tier**: ~60 requests/minute = essentially unlimited for testing
- **When to upgrade**: Only if you hit millions of tokens (unlikely for a personal app)

## 🎓 Learning Resources

- Gemini API docs: https://ai.google.dev/gemini-api/docs
- Example notebook: https://ai.google.dev/tutorials
- GitHub: https://github.com/google/generative-ai-js

## 🔄 What's Different from Claude?

| Feature | Gemini | Claude |
|---------|--------|--------|
| Cost | FREE | Need API key ($) |
| Setup | 2 min | 2 min + credits |
| Speed | ⚡ Very fast | ⚡⚡ Very fast |
| Quality | Excellent | Excellent |
| Free tier | Yes | No |

## Next Steps

1. ✅ Go to https://ai.google.dev
2. ✅ Get your FREE API key
3. ✅ Add to `.env`: `NEXT_PUBLIC_GEMINI_API_KEY=your_key`
4. ✅ Restart: `npm run dev`
5. ✅ Click "Analyze My Resume" or "Analyze My Git"
6. ✅ Watch Gemini analyze everything! 🚀

---

**You're all set!** Your app is now powered by **FREE Google Gemini AI** 🎉
