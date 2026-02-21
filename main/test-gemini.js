/**
 * Quick test to verify Gemini API key works
 */

const { GoogleGenerativeAI } = require("@google/generative-ai");

async function testGemini() {
  console.log("🧪 Testing Google Gemini API...\n");

  try {
    const apiKey = "AIzaSyAB53byT6ZQz5wKlFCzBeNXe8VDhaWBVf8";
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    console.log("✅ Connected to Gemini API");
    console.log("📝 Testing simple prompt...\n");

    const result = await model.generateContent(
      "Say hello and confirm you are working in 2 words max"
    );

    const response = result.response.text();
    console.log("✅ Gemini Response:", response);
    console.log("\n🎉 SUCCESS! Your Gemini API is working!\n");
    console.log("Next steps:");
    console.log("1. Restart dev server: npm run dev");
    console.log("2. Go to http://localhost:3007");
    console.log("3. Click 'Analyze My Resume' or 'Analyze My Git'");
    console.log("4. Watch Gemini analyze everything for FREE! 🚀\n");
  } catch (error) {
    console.error("❌ Error:", error.message);
    console.log("\nTroubleshooting:");
    console.log("- Check API key is correct");
    console.log("- Make sure API is enabled at https://ai.google.dev");
    console.log("- Try generating a new API key");
  }
}

testGemini();
