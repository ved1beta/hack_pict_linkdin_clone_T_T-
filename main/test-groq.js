/**
 * Quick test to verify Groq API key works
 * Groq: Free, unlimited, blazingly fast
 */

const Groq = require("groq-sdk");

async function testGroq() {
  console.log("🧪 Testing Groq API (FREE & UNLIMITED)...\n");

  // User needs to provide their own key
  const apiKey = process.env.NEXT_PUBLIC_GROQ_API_KEY;

  if (!apiKey || apiKey === "your_groq_api_key_here") {
    console.log("❌ API key not found!\n");
    console.log("📝 Setup instructions:");
    console.log("1. Go to: https://console.groq.com/keys");
    console.log("2. Create a FREE API key");
    console.log("3. Add to .env: NEXT_PUBLIC_GROQ_API_KEY=your_key");
    console.log("4. Restart: npm run dev\n");
    return;
  }

  try {
    const groq = new Groq({ apiKey });

    console.log("✅ Connected to Groq API");
    console.log("📝 Testing Llama 3.3 70B model...\n");

    const message = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: "Say hello and confirm you are working. Keep it to 2 words.",
        },
      ],
      model: "llama-3.3-70b-versatile",
    });

    const response = message.choices[0]?.message?.content;
    console.log("✅ Groq Response:", response);
    console.log("\n🎉 SUCCESS! Your Groq API is working!\n");
    console.log("Next steps:");
    console.log("1. Restart dev server: npm run dev");
    console.log("2. Go to http://localhost:3007");
    console.log("3. Click 'Analyze My Resume' or 'Analyze My Git'");
    console.log("4. Watch Groq analyze everything instantly! ⚡\n");
    console.log(
      "📊 You have unlimited free requests - no quota limits! 🚀\n"
    );
  } catch (error) {
    console.error("❌ Error:", error.message);
    console.log("\nTroubleshooting:");
    console.log(
      "- Check API key at: https://console.groq.com/keys (make sure it's active)"
    );
    console.log("- Copy the full key (including gsk_ prefix)");
    console.log("- Add to .env: NEXT_PUBLIC_GROQ_API_KEY=gsk_...");
    console.log("- Restart dev server");
  }
}

testGroq();
