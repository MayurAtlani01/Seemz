const handleChat = async (req, res) => {
  console.log("[Seemz AI] Request received");
  
  const { message, history, user, location, weather, products } = req.body;

  // 1. Missing message check
  if (message === undefined) {
    console.error("[Seemz AI] Validation error: message is undefined");
    return res.status(400).json({ error: "Message is required." });
  }

  // 2. Empty message check
  if (typeof message !== "string" || message.trim() === "") {
    console.error("[Seemz AI] Validation error: message is empty");
    return res.status(400).json({ error: "Message cannot be empty." });
  }

  // 3. API Key existence check and sanitization (trimming)
  const rawApiKey = process.env.GEMINI_API_KEY;
  const apiKey = rawApiKey ? rawApiKey.trim() : null;
  
  console.log(`[Seemz AI] Gemini key configured: ${Boolean(apiKey)}`);
  if (apiKey) {
    console.log(`[Seemz AI] Key details - Length: ${apiKey.length}, Has CR (\\r): ${apiKey.includes('\r')}, Has LF (\\n): ${apiKey.includes('\n')}, Has Spaces: ${apiKey.includes(' ')}`);
  }
  
  if (!apiKey) {
    console.error("[Seemz AI] Config error: GEMINI_API_KEY is not defined in the backend environment.");
    return res.status(500).json({ error: "Gemini API configuration is missing." });
  }

  // System Prompt (Strictly server-side)
  const systemInstruction = `You are Seemz AI, the personal fashion assistant for Seemz.

You help users discover clothing and make better fashion purchasing decisions.

You should be concise, helpful, fashion-aware, and conversational.

You should eventually be able to help with:
- clothing recommendations
- climate-based shopping
- sizing
- fit
- fabrics
- product discovery
- Seemz virtual try-on

Do not pretend to know real-time weather, location, inventory, prices, or product availability unless that information is explicitly provided to you by the application.

Do not invent products or prices.

When the application provides product/catalog data, recommend from that data rather than inventing products.

Do not claim to have physically measured the user's body unless the application provides measurements.`;

  // Map history to contents for multi-turn conversations
  const contents = [];
  if (Array.isArray(history)) {
    history.forEach((msg) => {
      const role = msg.sender === "user" ? "user" : "model";
      contents.push({
        role: role,
        parts: [{ text: msg.text }],
      });
    });
  }

  // Add the current user message to the conversation context
  contents.push({
    role: "user",
    parts: [{ text: message }],
  });

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`;

  const payload = {
    contents: contents,
    systemInstruction: {
      parts: [
        {
          text: systemInstruction,
        },
      ],
    },
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

  console.log("[Seemz AI] Calling Gemini...");
  const startTime = Date.now();

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    
    const duration = Date.now() - startTime;
    console.log(`[Seemz AI] Gemini response received in ${duration}ms, Status: ${response.status}`);

    // 4. Rate-limit check
    if (response.status === 429) {
      console.error("[Seemz AI] Error: Rate limit exceeded (429)");
      return res.status(429).json({
        error: "Rate limit exceeded. Please wait a moment before sending another message.",
      });
    }

    // 5. General HTTP error checks
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Seemz AI] Gemini API error status ${response.status}:`, errorText);
      return res.status(response.status || 502).json({
        error: "We encountered an error communicating with the fashion assistant. Please try again.",
      });
    }

    const data = await response.json();

    // 6. Malformed response checks
    if (
      !data.candidates ||
      !data.candidates[0] ||
      !data.candidates[0].content ||
      !data.candidates[0].content.parts ||
      !data.candidates[0].content.parts[0] ||
      typeof data.candidates[0].content.parts[0].text !== "string"
    ) {
      console.error("[Seemz AI] Error: Malformed Gemini API response:", JSON.stringify(data));
      return res.status(502).json({
        error: "Invalid response format received from the fashion assistant.",
      });
    }

    const reply = data.candidates[0].content.parts[0].text;
    console.log("[Seemz AI] Returning reply to client");
    return res.status(200).json({ reply });

  } catch (error) {
    clearTimeout(timeoutId);
    const elapsed = Date.now() - startTime;

    // 7. Timeout/Network error handling
    if (error.name === "AbortError") {
      console.error(`[Seemz AI] Gemini request timed out after ${elapsed}ms`);
      return res.status(504).json({
        error: "Connection timed out. Please check your network and try again.",
      });
    }

    console.error("[Seemz AI] Error communicating with Gemini:", error);
    return res.status(500).json({
      error: "Unable to reach the fashion assistant. Please check your connection and try again.",
    });
  }
};

module.exports = {
  handleChat,
};
