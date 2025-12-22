import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BOOK_CATEGORIES = [
  "School",
  "College / University", 
  "Entrance / Competitive",
  "Fiction",
  "Non-Fiction",
  "Other"
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { title, imageBase64 } = await req.json();
    
    if (!title && !imageBase64) {
      return new Response(
        JSON.stringify({ error: "Title or image is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY not configured");
      return new Response(
        JSON.stringify({ category: "Other", confidence: "low" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build message content
    const content: any[] = [
      {
        type: "text",
        text: `Analyze this book and categorize it into exactly ONE of these categories:
${BOOK_CATEGORIES.map((c, i) => `${i + 1}. ${c}`).join("\n")}

Book Title: "${title || 'Unknown'}"

Rules:
- School: K-12 textbooks, NCERT, CBSE, ICSE, state board books
- College / University: Engineering, medical, law, MBA, degree textbooks
- Entrance / Competitive: JEE, NEET, UPSC, GATE, CAT, banking, SSC prep books
- Fiction: Novels, stories, literature, poetry
- Non-Fiction: Self-help, biography, history, science (non-academic)
- Other: Anything that doesn't fit above

Respond with ONLY a JSON object in this exact format:
{"category": "Category Name", "sub_category": "Optional sub-category", "confidence": "high|medium|low"}`
      }
    ];

    // Add image if provided
    if (imageBase64) {
      content.push({
        type: "image_url",
        image_url: {
          url: imageBase64.startsWith("data:") ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`
        }
      });
    }

    console.log("Calling Lovable AI for book categorization...");
    
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "user",
            content: content
          }
        ],
        max_tokens: 200,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later.", category: "Other", confidence: "low" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted.", category: "Other", confidence: "low" }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ category: "Other", confidence: "low" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content || "";
    
    console.log("AI Response:", aiResponse);

    // Parse JSON from response
    let result = { category: "Other", sub_category: "", confidence: "low" };
    
    try {
      // Extract JSON from response (handle markdown code blocks)
      const jsonMatch = aiResponse.match(/\{[^}]+\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        
        // Validate category is in our list
        if (BOOK_CATEGORIES.includes(parsed.category)) {
          result.category = parsed.category;
          result.sub_category = parsed.sub_category || "";
          result.confidence = parsed.confidence || "medium";
        }
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
    }

    console.log("Categorization result:", result);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in categorize-book:", error);
    return new Response(
      JSON.stringify({ category: "Other", confidence: "low", error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
