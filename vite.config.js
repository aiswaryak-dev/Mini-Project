import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

const RETRYABLE_STATUSES = [408, 429, 500, 503];

function safelyParseAIJson(textContent) {
  if (!textContent) return null;
  if (typeof textContent === 'object') return textContent;
  if (typeof textContent !== 'string') return null;

  // 1. Remove Markdown code block formatting if present
  let cleaned = textContent
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim();

  // 2. Safely extract JSON object substring between first '{' and last '}'
  const startIdx = cleaned.indexOf('{');
  const endIdx = cleaned.lastIndexOf('}');

  if (startIdx === -1 || endIdx === -1 || endIdx <= startIdx) {
    return null;
  }

  let jsonStr = cleaned.slice(startIdx, endIdx + 1);

  // 3. Attempt direct parse
  try {
    return JSON.parse(jsonStr);
  } catch (firstErr) {
    console.warn("[JSON Parser] Direct JSON.parse failed, trying sanitization:", firstErr.message);
  }

  // 4. Attempt escaping unescaped newlines/tabs inside string literals
  try {
    const sanitized = jsonStr.replace(/"([^"\\]*(\\.[^"\\]*)*)"/g, (match) => {
      return match.replace(/\r?\n/g, '\\n').replace(/\t/g, '\\t');
    });
    return JSON.parse(sanitized);
  } catch (secondErr) {
    console.warn("[JSON Parser] Sanitized parse failed:", secondErr.message);
  }

  // 5. Attempt fixing trailing commas
  try {
    const sanitizedCommas = jsonStr
      .replace(/,\s*([}\]])/g, '$1')
      .replace(/"([^"\\]*(\\.[^"\\]*)*)"/g, (match) => {
        return match.replace(/\r?\n/g, '\\n').replace(/\t/g, '\\t');
      });
    return JSON.parse(sanitizedCommas);
  } catch (thirdErr) {
    console.error("[JSON Parser] All recovery attempts failed.");
    return null;
  }
}

const DEFAULT_GEMINI_MODELS = [
  'gemini-3.5-flash-lite',
  'gemini-flash-lite-latest',
  'gemini-3.6-flash',
  'gemini-3.8-flash',
  'gemini-3.7-flash'
];

async function callGeminiApiWithRetry(apiKey, requestPayload, models = DEFAULT_GEMINI_MODELS, endpointName = 'Plant Identification') {
  let lastStatus = 503;
  let lastGeminiErrorStatus = 'UNKNOWN_ERROR';
  let lastGeminiErrorMessage = 'Gemini AI service is temporarily unavailable. Please try again.';
  let lastModelUsed = models[0];

  for (let i = 0; i < models.length; i++) {
    const model = models[i];
    lastModelUsed = model;
    console.log(`[${endpointName}] Trying provider: Gemini, model: ${model}`);
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    let attempt = 0;
    const maxAttempts = 2;
    let delayMs = 500;

    while (attempt < maxAttempts) {
      attempt++;
      try {
        const response = await fetch(geminiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestPayload)
        });

        if (response.ok) {
          const data = await response.json();
          console.log(`[${endpointName}] Provider: Gemini, Model: ${model}, HTTP Status: 200 (Success)`);
          return { ok: true, data, model };
        }

        const status = response.status;
        const errText = await response.text();

        lastStatus = status;
        lastGeminiErrorMessage = errText;
        try {
          const parsedErr = JSON.parse(errText);
          if (parsedErr.error) {
            lastGeminiErrorStatus = parsedErr.error.status || `HTTP_${status}`;
            lastGeminiErrorMessage = parsedErr.error.message || errText;
          } else {
            lastGeminiErrorStatus = `HTTP_${status}`;
          }
        } catch (_) {
          lastGeminiErrorStatus = `HTTP_${status}`;
        }

        console.warn(`[${endpointName}] Provider: Gemini, Model: ${model}, HTTP Status: ${status}, Error: ${lastGeminiErrorMessage}`);

        // If 429 (quota limit), 404 (not found), 400 (bad request), 401/403 (auth), break retry loop for this model immediately to try next model or fallback
        if (status === 429 || status === 404 || status === 400 || status === 401 || status === 403) {
          break;
        }

        if (!RETRYABLE_STATUSES.includes(status)) {
          break;
        }

        if (attempt < maxAttempts) {
          await new Promise(res => setTimeout(res, delayMs));
          delayMs *= 2;
        }
      } catch (err) {
        console.warn(`[${endpointName}] Provider: Gemini, Model: ${model}, Fetch Error: ${err.message}`);
        lastStatus = 500;
        lastGeminiErrorStatus = 'FETCH_ERROR';
        lastGeminiErrorMessage = err.message;
        lastModelUsed = model;
        if (attempt < maxAttempts) {
          await new Promise(res => setTimeout(res, delayMs));
          delayMs *= 2;
        }
      }
    }

    if (i < models.length - 1) {
      console.log(`[${endpointName}] Gemini model ${model} failed (HTTP ${lastStatus}). Trying next model: ${models[i + 1]}`);
    }
  }

  const finalErrorMessage = lastStatus === 429
    ? "Gemini API quota exceeded. Please wait for the quota to reset or enable billing."
    : "Gemini AI service is temporarily unavailable. Please try again.";

  return {
    ok: false,
    status: lastStatus,
    error: finalErrorMessage,
    geminiErrorStatus: lastGeminiErrorStatus,
    geminiErrorMessage: lastGeminiErrorMessage,
    model: lastModelUsed
  };
}

function ensureArray(val) {
  if (Array.isArray(val)) return val;
  if (typeof val === 'string' && val.trim()) return [val.trim()];
  return [];
}

function normalizeHealthResult(aiResult, type) {
  const isInvalid = aiResult.validImage === false ||
                    aiResult.isPlant === false ||
                    String(aiResult.isPlant).toLowerCase() === 'false' ||
                    aiResult.isSuitableForAnalysis === false ||
                    String(aiResult.imageQuality).toLowerCase() === 'poor' ||
                    aiResult.imageClassification === 'NOT_A_PLANT_IMAGE' ||
                    aiResult.imageClassification === 'BLURRY_IMAGE' ||
                    aiResult.imageClassification === 'INSUFFICIENT_PLANT_VISIBILITY';

  if (isInvalid) {
    const isNotPlant = aiResult.isPlant === false || String(aiResult.isPlant).toLowerCase() === 'false' || aiResult.imageClassification === 'NOT_A_PLANT_IMAGE';
    const msg = aiResult.message || (isNotPlant 
      ? "Please upload an image of a plant or affected plant part for analysis."
      : "Please upload a clear plant image showing the affected leaf or plant part.");
      
    return {
      validImage: false,
      isPlant: !isNotPlant,
      isSuitableForAnalysis: false,
      message: msg,
      validationMessage: msg
    };
  }

  let rawConf = aiResult.confidence;
  let numConf = 85;
  if (rawConf !== undefined && rawConf !== null) {
    let str = String(rawConf).replace('%', '').trim();
    let parsed = parseFloat(str);
    if (!isNaN(parsed)) {
      if (parsed > 0 && parsed <= 1.0) {
        numConf = Math.round(parsed * 100);
      } else {
        numConf = Math.round(parsed);
      }
    }
  }
  numConf = Math.min(100, Math.max(0, numConf));

  const baseResult = {
    validImage: true,
    imageClassification: 'VALID_PLANT_IMAGE',
    isPlant: true,
    isSuitableForAnalysis: true,
    confidence: numConf
  };

  if (type === 'disease') {
    return {
      ...baseResult,
      plantName: aiResult.plantName || '',
      scientificName: aiResult.scientificName || '',
      healthStatus: aiResult.healthStatus || (aiResult.diseaseDetected ? 'Diseased' : 'Healthy'),
      diseaseDetected: aiResult.diseaseDetected !== false,
      diseaseName: aiResult.diseaseName || (aiResult.diseaseDetected === false ? 'No significant issue detected' : 'Unspecified Health Condition'),
      severity: aiResult.severity || 'None',
      symptoms: ensureArray(aiResult.symptoms),
      possibleCause: aiResult.possibleCause || '',
      affectedPart: aiResult.affectedPart || 'Leaf',
      treatment: ensureArray(aiResult.treatment),
      prevention: ensureArray(aiResult.prevention),
      additionalAdvice: ensureArray(aiResult.additionalAdvice),
      analysisSummary: aiResult.analysisSummary || ''
    };
  } else if (type === 'nutrient') {
    return {
      ...baseResult,
      plantName: aiResult.plantName || '',
      scientificName: aiResult.scientificName || '',
      nutritionStatus: aiResult.nutritionStatus || (aiResult.deficiencyDetected ? 'Possible Deficiency' : 'Healthy'),
      deficiencyDetected: aiResult.deficiencyDetected !== false,
      primaryNutrient: aiResult.primaryNutrient || (aiResult.deficiencyDetected === false ? 'No significant issue detected' : 'General Nutrient'),
      nutrientSymbol: aiResult.nutrientSymbol || '',
      severity: aiResult.severity || 'None',
      affectedPart: aiResult.affectedPart || 'Leaf',
      symptoms: ensureArray(aiResult.symptoms),
      visualEvidence: ensureArray(aiResult.visualEvidence),
      possibleCause: aiResult.possibleCause || '',
      recommendedTreatment: ensureArray(aiResult.recommendedTreatment || aiResult.treatment),
      fertilizerRecommendation: ensureArray(aiResult.fertilizerRecommendation),
      prevention: ensureArray(aiResult.prevention),
      additionalAdvice: ensureArray(aiResult.additionalAdvice),
      analysisSummary: aiResult.analysisSummary || ''
    };
  } else if (type === 'pest') {
    return {
      ...baseResult,
      plantName: aiResult.plantName || '',
      scientificName: aiResult.scientificName || '',
      pestStatus: aiResult.pestStatus || (aiResult.pestDetected ? 'Pest Detected' : 'No Pest Detected'),
      pestDetected: aiResult.pestDetected !== false,
      primaryPest: aiResult.primaryPest || (aiResult.pestDetected === false ? 'No significant issue detected' : 'Unspecified Pest'),
      severity: aiResult.severity || 'None',
      affectedPart: aiResult.affectedPart || 'Leaf',
      visiblePest: aiResult.visiblePest !== false,
      symptoms: ensureArray(aiResult.symptoms),
      visualEvidence: ensureArray(aiResult.visualEvidence),
      damageType: ensureArray(aiResult.damageType),
      possibleCause: aiResult.possibleCause || '',
      recommendedTreatment: ensureArray(aiResult.recommendedTreatment || aiResult.treatment),
      organicControl: ensureArray(aiResult.organicControl),
      prevention: ensureArray(aiResult.prevention),
      additionalAdvice: ensureArray(aiResult.additionalAdvice),
      analysisSummary: aiResult.analysisSummary || ''
    };
  }

  return { ...baseResult, ...aiResult };
}

const geminiApiPlugin = () => {
  return {
    name: 'gemini-api-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {

        // Endpoint 1: Plant Identification (/api/identify-plant)
        if (req.url === '/api/identify-plant' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk.toString(); });

          req.on('end', async () => {
            try {
              console.log("[Plant Identification] Request started");
              const env = loadEnv('development', process.cwd(), '');
              const geminiApiKey = (env.GEMINI_API_KEY || process.env.GEMINI_API_KEY || '').trim();

              const payload = JSON.parse(body || '{}');
              const { imageBase64, mimeType = 'image/jpeg', selectedPart = 'Leaf', category = 'Garden Plants' } = payload;

              if (!imageBase64) {
                console.error("[Plant Identification] Image data is missing");
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'Image data is required' }));
                return;
              }

              let cleanMimeType = mimeType || 'image/jpeg';
              let base64Data = imageBase64;
              if (typeof imageBase64 === 'string' && imageBase64.includes(';base64,')) {
                const parts = imageBase64.split(';base64,');
                const mimeMatch = parts[0].match(/data:(.*?)$/);
                if (mimeMatch && mimeMatch[1]) {
                  cleanMimeType = mimeMatch[1];
                }
                base64Data = parts[1];
              } else if (typeof imageBase64 === 'string' && imageBase64.includes(',')) {
                base64Data = imageBase64.split(',')[1];
              }

              console.log(`[Plant Identification] Image received (mimeType: ${cleanMimeType}, part: ${selectedPart}, category: ${category})`);

              const promptText = `You are an expert botanical plant identification system.

Analyze the uploaded image carefully and identify the plant shown in the image.

Use the actual visual evidence in the image as the primary source.

Examine:
- leaf shape
- leaf arrangement
- flower structure
- flower color
- flower center
- stem
- plant structure
- fruit characteristics
- growth pattern
- other visible botanical characteristics

The selected plant category and plant part are ONLY contextual information.

Do NOT force the identification to Rose or Marigold.

Do NOT select a plant simply because it exists in the application's predefined plant list.

Identify the actual plant visible in the uploaded image.

If the image clearly shows a Sunflower, identify Sunflower.
If it shows Rose, identify Rose.
If it shows Marigold, identify Marigold.
If it shows Hibiscus, identify Hibiscus.
If it shows Tomato, identify Tomato.
If it shows Chilli, identify Chilli.
If it shows another recognizable plant, identify that plant.

If the image is not a plant, return isPlant=false.

If the image does not contain enough visual information for reliable identification, return a low confidence score.

Never invent an identification.

Return ONLY valid JSON matching this exact structure:
{
  "plantName": "",
  "scientificName": "",
  "family": "",
  "confidence": 0,
  "description": "",
  "uses": "",
  "careInstructions": "",
  "isPlant": true
}

Return raw JSON only, no markdown wrapping.`;

              let textContent = null;

              if (geminiApiKey) {
                const requestPayload = {
                  contents: [{
                    parts: [
                      { inlineData: { mimeType: cleanMimeType, data: base64Data } },
                      { text: promptText }
                    ]
                  }],
                  generationConfig: {
                    responseMimeType: "application/json"
                  }
                };

                const apiResult = await callGeminiApiWithRetry(geminiApiKey, requestPayload, DEFAULT_GEMINI_MODELS, 'Plant Identification');
                if (apiResult.ok) {
                  console.log("[AI] Provider: Gemini");
                  textContent = apiResult.data.candidates?.[0]?.content?.parts?.[0]?.text || '';
                } else {
                  console.log(`[AI] Gemini failed: ${apiResult.status || apiResult.geminiErrorStatus || 'UNKNOWN'}`);
                }
              } else {
                console.log("[AI] Gemini failed: GEMINI_API_KEY missing");
              }

              if (!textContent) {
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: "Unable to analyze the image right now. Please try again." }));
                return;
              }

              let aiResult = safelyParseAIJson(textContent);

              if (!aiResult) {
                console.error("[Plant Identification] Failed to parse AI JSON response");
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: "Unable to analyze the image right now. Please try again." }));
                return;
              }

              console.log("[Plant Identification] AI response parsing completed");

              // Normalize confidence score (handle 0.95 -> 95, "95%" -> 95, "95" -> 95)
              let rawConf = aiResult.confidence;
              let numConf = 0;
              if (rawConf !== undefined && rawConf !== null) {
                let str = String(rawConf).replace('%', '').trim();
                let parsed = parseFloat(str);
                if (!isNaN(parsed)) {
                  if (parsed > 0 && parsed <= 1.0) {
                    numConf = Math.round(parsed * 100);
                  } else {
                    numConf = Math.round(parsed);
                  }
                }
              }
              aiResult.confidence = Math.min(100, Math.max(0, numConf));

              if (aiResult.isPlant === undefined) {
                aiResult.isPlant = true;
              }

              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(aiResult));
            } catch (err) {
              console.error("[Plant Identification] Server API handler error:", err);
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: "Unable to analyze the image right now. Please try again." }));
            }
          });
          return;
        }

        // Endpoint 2: Disease Detection (/api/analyze-disease)
        if (req.url === '/api/analyze-disease' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk.toString(); });

          req.on('end', async () => {
            try {
              console.log("[Disease Detection] Request started");
              const env = loadEnv('development', process.cwd(), '');
              const geminiApiKey = (env.GEMINI_API_KEY || process.env.GEMINI_API_KEY || '').trim();

              const payload = JSON.parse(body || '{}');
              const { imageBase64, mimeType = 'image/jpeg', category = 'Garden Plants' } = payload;

              if (!imageBase64) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'Image data is required' }));
                return;
              }

              let cleanMimeType = mimeType || 'image/jpeg';
              let base64Data = imageBase64;
              if (typeof imageBase64 === 'string' && imageBase64.includes(';base64,')) {
                const parts = imageBase64.split(';base64,');
                const mimeMatch = parts[0].match(/data:(.*?)$/);
                if (mimeMatch && mimeMatch[1]) {
                  cleanMimeType = mimeMatch[1];
                }
                base64Data = parts[1];
              } else if (typeof imageBase64 === 'string' && imageBase64.includes(',')) {
                base64Data = imageBase64.split(',')[1];
              }

              const diseasePromptText = `You are an AI botanical plant disease analysis system.

Examine the uploaded image carefully.

STEP 1: IMAGE VALIDATION & SUITABILITY ASSESSMENT
Determine:
1. Is the image actually showing a plant, plant leaf, flower, fruit, stem, root, or plant specimen?
   - If the image shows a person, room, building, vehicle, animal, face, object, food, or non-botanical item, set "isPlant" to false, "imageQuality" to "poor", and "isSuitableForAnalysis" to false.
2. Is the image clear enough and sufficiently well-lit to perform reliable analysis?
   - If the image is too blurry, too dark, severely overexposed, out-of-focus, or the plant part is not visible, set "imageQuality" to "poor" and "isSuitableForAnalysis" to false.
   - If the image is sharp and adequately lit, set "imageQuality" to "good" and "isSuitableForAnalysis" to true.

If "isPlant" is false OR "isSuitableForAnalysis" is false, return ONLY valid JSON matching:
{
  "validImage": false,
  "isPlant": false,
  "imageQuality": "poor",
  "isSuitableForAnalysis": false,
  "message": "Please upload a clear plant image showing the affected leaf or plant part."
}

STEP 2: DISEASE DETECTION (WHEN isPlant IS TRUE AND isSuitableForAnalysis IS TRUE)
Analyze the plant for visible signs of plant disease, fungal infection, viral infection, bacterial infection, foliage damage, or healthy foliage.
Category context: ${category}

Return ONLY valid JSON matching this structure:
{
  "isPlant": true,
  "imageQuality": "good",
  "isSuitableForAnalysis": true,
  "reason": "Clear plant image visible",
  "healthStatus": "Healthy",
  "diseaseDetected": false,
  "diseaseName": "Healthy Plant",
  "confidence": 95,
  "severity": "None",
  "symptoms": [
    "No visible disease symptoms detected on foliage"
  ],
  "possibleCause": "Foliage appears vibrant and free of active infection.",
  "affectedPart": "Leaf",
  "treatment": [
    "Continue regular watering and maintenance routines"
  ],
  "prevention": [
    "Maintain adequate lighting, ventilation, and soil moisture"
  ],
  "additionalAdvice": [
    "Inspect leaves periodically for early disease signs."
  ],
  "analysisSummary": "Plant specimen appears healthy with no visible disease symptoms."
}

Return raw JSON only, no markdown wrapping.`;

              let textContent = null;

              if (geminiApiKey) {
                const requestPayload = {
                  contents: [{
                    parts: [
                      { inlineData: { mimeType: cleanMimeType, data: base64Data } },
                      { text: diseasePromptText }
                    ]
                  }],
                  generationConfig: {
                    responseMimeType: "application/json"
                  }
                };

                const apiResult = await callGeminiApiWithRetry(geminiApiKey, requestPayload, DEFAULT_GEMINI_MODELS, 'Disease Detection');
                if (apiResult.ok) {
                  console.log("[AI] Provider: Gemini");
                  textContent = apiResult.data.candidates?.[0]?.content?.parts?.[0]?.text || '';
                } else {
                  console.log(`[AI] Gemini failed: ${apiResult.status || apiResult.geminiErrorStatus || 'UNKNOWN'}`);
                }
              } else {
                console.log("[AI] Gemini failed: GEMINI_API_KEY missing");
              }

              if (!textContent) {
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: "Unable to analyze the image right now. Please try again." }));
                return;
              }

              let aiResult = safelyParseAIJson(textContent);

              if (!aiResult) {
                console.error("[Disease Detection] Failed to parse AI JSON response");
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: "Unable to analyze the image right now. Please try again." }));
                return;
              }

              const normalized = normalizeHealthResult(aiResult, 'disease');

              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(normalized));
            } catch (err) {
              console.error("Server Disease API handler error:", err);
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: "Unable to analyze the image right now. Please try again." }));
            }
          });
          return;
        }

        // Endpoint 3: Nutrient Deficiency Detection (/api/analyze-nutrient)
        if (req.url === '/api/analyze-nutrient' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk.toString(); });

          req.on('end', async () => {
            try {
              console.log("[Nutrient Detection] REQUEST START");
              const env = loadEnv('development', process.cwd(), '');
              const geminiApiKey = (env.GEMINI_API_KEY || process.env.GEMINI_API_KEY || '').trim();

              const payload = JSON.parse(body || '{}');
              const { imageBase64, mimeType = 'image/jpeg', category = 'Garden Plants' } = payload;

              const imageExists = Boolean(imageBase64);
              console.log(`[Nutrient Detection] Image received: ${imageExists}`);

              if (!imageBase64) {
                console.error("[Nutrient Detection] Image data is missing");
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'Image data is required' }));
                return;
              }

              let cleanMimeType = mimeType || 'image/jpeg';
              let base64Data = imageBase64;
              if (typeof imageBase64 === 'string' && imageBase64.includes(';base64,')) {
                const parts = imageBase64.split(';base64,');
                const mimeMatch = parts[0].match(/data:(.*?)$/);
                if (mimeMatch && mimeMatch[1]) {
                  cleanMimeType = mimeMatch[1];
                }
                base64Data = parts[1];
              } else if (typeof imageBase64 === 'string' && imageBase64.includes(',')) {
                base64Data = imageBase64.split(',')[1];
              }

              console.log(`[Nutrient Detection] Image mimeType: ${cleanMimeType}`);
              console.log(`[Nutrient Detection] Image size: ${base64Data ? base64Data.length : 0} bytes`);

              const nutrientPromptText = `You are an AI botanical plant nutrient deficiency analysis system.

Examine the uploaded image carefully.

STEP 1: IMAGE VALIDATION & SUITABILITY ASSESSMENT
Determine:
1. Is the image actually showing a plant, plant leaf, flower, fruit, stem, root, or plant specimen?
   - If the image shows a person, room, building, vehicle, animal, face, object, food, or non-botanical item, set "isPlant" to false, "imageQuality" to "poor", and "isSuitableForAnalysis" to false.
2. Is the image clear enough and sufficiently well-lit to perform reliable analysis?
   - If the image is too blurry, too dark, severely overexposed, out-of-focus, or the plant part is not visible, set "imageQuality" to "poor" and "isSuitableForAnalysis" to false.
   - If the image is sharp and adequately lit, set "imageQuality" to "good" and "isSuitableForAnalysis" to true.

If "isPlant" is false OR "isSuitableForAnalysis" is false, return ONLY valid JSON matching:
{
  "validImage": false,
  "isPlant": false,
  "imageQuality": "poor",
  "isSuitableForAnalysis": false,
  "message": "Please upload a clear plant image showing the affected leaf or plant part."
}

STEP 2: NUTRIENT ANALYSIS (WHEN isPlant IS TRUE AND isSuitableForAnalysis IS TRUE)
Analyze the plant for visible signs of nutrient deficiency (Nitrogen, Phosphorus, Potassium, Magnesium, Calcium, Iron, Zinc, Sulfur, Manganese) or healthy foliage.
Category context: ${category}

Return ONLY valid JSON matching this structure:
{
  "isPlant": true,
  "imageQuality": "good",
  "isSuitableForAnalysis": true,
  "reason": "Clear plant image visible",
  "nutritionStatus": "Healthy",
  "deficiencyDetected": false,
  "primaryNutrient": "None",
  "nutrientSymbol": "N/A",
  "confidence": 95,
  "severity": "None",
  "affectedPart": "Leaf",
  "symptoms": [
    "Foliage displays optimal green coloration without chlorosis"
  ],
  "visualEvidence": [
    "Uniform leaf color and healthy growth pattern"
  ],
  "possibleCause": "Balanced soil nutrition and bioavailable nutrients.",
  "recommendedTreatment": [
    "Maintain current fertilization schedule"
  ],
  "fertilizerRecommendation": [
    "Balanced NPK organic fertilizer as needed"
  ],
  "prevention": [
    "Perform periodic soil testing"
  ],
  "additionalAdvice": [
    "Ensure steady watering to support nutrient uptake."
  ],
  "analysisSummary": "Plant specimen shows optimal foliage color with no visible nutrient deficiency."
}

Return raw JSON only, no markdown wrapping.`;

              let textContent = null;

              if (geminiApiKey) {
                console.log("[Nutrient Detection] Gemini request started");
                const requestPayload = {
                  contents: [{
                    parts: [
                      { inlineData: { mimeType: cleanMimeType, data: base64Data } },
                      { text: nutrientPromptText }
                    ]
                  }],
                  generationConfig: {
                    responseMimeType: "application/json"
                  }
                };

                const apiResult = await callGeminiApiWithRetry(geminiApiKey, requestPayload, DEFAULT_GEMINI_MODELS, 'Nutrient Deficiency Detection');
                if (apiResult.ok) {
                  console.log("[AI] Provider: Gemini");
                  textContent = apiResult.data.candidates?.[0]?.content?.parts?.[0]?.text || '';
                } else {
                  console.log(`[Nutrient Detection] Gemini failed: ${apiResult.status || apiResult.geminiErrorStatus || 'UNKNOWN'} - ${apiResult.geminiErrorMessage || apiResult.error || ''}`);
                }
              } else {
                console.log("[Nutrient Detection] Gemini failed: GEMINI_API_KEY missing");
              }

              if (!textContent) {
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: "Unable to analyze the image right now. Please try again." }));
                return;
              }

              let aiResult = safelyParseAIJson(textContent);

              if (!aiResult) {
                console.error("[Nutrient Detection] Failed to parse AI JSON response");
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: "Unable to analyze the image right now. Please try again." }));
                return;
              }

              const normalized = normalizeHealthResult(aiResult, 'nutrient');

              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(normalized));
            } catch (err) {
              console.error("[Nutrient Detection] Server API handler error:", err);
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: "Unable to analyze the image right now. Please try again." }));
            }
          });
          return;
        }

        // Endpoint 4: Pest Detection (/api/analyze-pest)
        if (req.url === '/api/analyze-pest' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk.toString(); });

          req.on('end', async () => {
            try {
              console.log("[Pest Detection] Request started");
              const env = loadEnv('development', process.cwd(), '');
              const geminiApiKey = (env.GEMINI_API_KEY || process.env.GEMINI_API_KEY || '').trim();

              const payload = JSON.parse(body || '{}');
              const { imageBase64, mimeType = 'image/jpeg', category = 'Garden Plants' } = payload;

              if (!imageBase64) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'Image data is required' }));
                return;
              }

              let cleanMimeType = mimeType || 'image/jpeg';
              let base64Data = imageBase64;
              if (typeof imageBase64 === 'string' && imageBase64.includes(';base64,')) {
                const parts = imageBase64.split(';base64,');
                const mimeMatch = parts[0].match(/data:(.*?)$/);
                if (mimeMatch && mimeMatch[1]) {
                  cleanMimeType = mimeMatch[1];
                }
                base64Data = parts[1];
              } else if (typeof imageBase64 === 'string' && imageBase64.includes(',')) {
                base64Data = imageBase64.split(',')[1];
              }

              const pestPromptText = `You are an AI botanical plant pest detection system.

Examine the uploaded image carefully.

STEP 1: IMAGE VALIDATION & SUITABILITY ASSESSMENT
Determine:
1. Is the image actually showing a plant, plant leaf, flower, fruit, stem, root, or plant specimen?
   - If the image shows a person, room, building, vehicle, animal, face, object, food, or non-botanical item, set "isPlant" to false, "imageQuality" to "poor", and "isSuitableForAnalysis" to false.
2. Is the image clear enough and sufficiently well-lit to perform reliable analysis?
   - If the image is too blurry, too dark, severely overexposed, out-of-focus, or the plant part is not visible, set "imageQuality" to "poor" and "isSuitableForAnalysis" to false.
   - If the image is sharp and adequately lit, set "imageQuality" to "good" and "isSuitableForAnalysis" to true.

If "isPlant" is false OR "isSuitableForAnalysis" is false, return ONLY valid JSON matching:
{
  "validImage": false,
  "isPlant": false,
  "imageQuality": "poor",
  "isSuitableForAnalysis": false,
  "message": "Please upload a clear plant image showing the affected leaf or plant part."
}

STEP 2: PEST DETECTION (WHEN isPlant IS TRUE AND isSuitableForAnalysis IS TRUE)
Analyze the plant for visible signs of insect or pest infestation (Aphids, Spider Mites, Thrips, Whiteflies, Mealybugs, Scale, Caterpillars, Beetles, etc.) or healthy foliage.
Category context: ${category}

Return ONLY valid JSON matching this structure:
{
  "isPlant": true,
  "imageQuality": "good",
  "isSuitableForAnalysis": true,
  "reason": "Clear plant image visible",
  "pestStatus": "No Pest Detected",
  "pestDetected": false,
  "primaryPest": "None",
  "confidence": 95,
  "severity": "None",
  "affectedPart": "Leaf",
  "visiblePest": false,
  "symptoms": [
    "No visible pests, eggs, or feeding damage observed"
  ],
  "visualEvidence": [
    "Foliage blades are intact with no chewing or sap-sucking marks"
  ],
  "damageType": [],
  "possibleCause": "No active pest colonization detected.",
  "recommendedTreatment": [
    "No pesticide treatment required"
  ],
  "organicControl": [
    "Preventative neem oil spray if desired"
  ],
  "prevention": [
    "Inspect leaf undersides regularly"
  ],
  "additionalAdvice": [
    "Maintain healthy plant vigor to naturally resist pests."
  ],
  "analysisSummary": "Plant specimen displays no visible pest infestation or insect damage."
}

Return raw JSON only, no markdown wrapping.`;

              let textContent = null;

              if (geminiApiKey) {
                const requestPayload = {
                  contents: [{
                    parts: [
                      { inlineData: { mimeType: cleanMimeType, data: base64Data } },
                      { text: pestPromptText }
                    ]
                  }],
                  generationConfig: {
                    responseMimeType: "application/json"
                  }
                };

                const apiResult = await callGeminiApiWithRetry(geminiApiKey, requestPayload, DEFAULT_GEMINI_MODELS, 'Pest Detection');
                if (apiResult.ok) {
                  console.log("[AI] Provider: Gemini");
                  textContent = apiResult.data.candidates?.[0]?.content?.parts?.[0]?.text || '';
                } else {
                  console.log(`[AI] Gemini failed: ${apiResult.status || apiResult.geminiErrorStatus || 'UNKNOWN'}`);
                }
              } else {
                console.log("[AI] Gemini failed: GEMINI_API_KEY missing");
              }

              if (!textContent) {
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: "Unable to analyze the image right now. Please try again." }));
                return;
              }

              let aiResult = safelyParseAIJson(textContent);

              if (!aiResult) {
                console.error("[Pest Detection] Failed to parse AI JSON response");
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: "Unable to analyze the image right now. Please try again." }));
                return;
              }

              const normalized = normalizeHealthResult(aiResult, 'pest');

              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(normalized));
            } catch (err) {
              console.error("Server Pest API handler error:", err);
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: "Unable to analyze the image right now. Please try again." }));
            }
          });
          return;
        }

        // Endpoint 6: Disease Follow-Up Analysis (/api/analyze-followup)
        if (req.url === '/api/analyze-followup' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk.toString(); });

          req.on('end', async () => {
            try {
              console.log("[Disease Follow-up] Request started");
              const env = loadEnv('development', process.cwd(), '');
              const geminiApiKey = (env.GEMINI_API_KEY || process.env.GEMINI_API_KEY || '').trim();

              const payload = JSON.parse(body || '{}');
              const {
                imageBase64,
                mimeType = 'image/jpeg',
                plantName = 'Plant Specimen',
                originalDiseaseName = 'Plant Disease',
                originalSeverity = 'Moderate',
                originalAnalysisDate = '',
                originalSymptoms = [],
                previousFollowUps = []
              } = payload;

              if (!imageBase64) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'Image data is required' }));
                return;
              }

              let cleanMimeType = mimeType || 'image/jpeg';
              let base64Data = imageBase64;
              if (typeof imageBase64 === 'string' && imageBase64.includes(';base64,')) {
                const parts = imageBase64.split(';base64,');
                const mimeMatch = parts[0].match(/data:(.*?)$/);
                if (mimeMatch && mimeMatch[1]) {
                  cleanMimeType = mimeMatch[1];
                }
                base64Data = parts[1];
              } else if (typeof imageBase64 === 'string' && imageBase64.includes(',')) {
                base64Data = imageBase64.split(',')[1];
              }

              const followupPromptText = `You are an AI plant pathology and disease recovery monitoring system.

Analyze the uploaded follow-up plant image to track disease recovery progress over time following treatment.

STEP 1: PLANT VERIFICATION
Determine whether the uploaded image contains a plant, plant leaf, flower, fruit, stem, root, or plant specimen.
- If the image shows a person, car, building, animal, face, object, or non-botanical item, set "isPlant" to false.
- If the image contains a plant or plant part, set "isPlant" to true.

STEP 2: FOLLOW-UP RECOVERY EVALUATION (WHEN isPlant IS TRUE)
You must analyze this image as a follow-up monitoring case for the specific plant and initial disease below.
DO NOT analyze this image as an unrelated new case.

INITIAL ANALYSIS / BASELINE CONTEXT (Day 0):
- Plant Specimen / Category: ${plantName}
- Original Diagnosed Disease: ${originalDiseaseName}
- Original Initial Severity: ${originalSeverity}
- Original Initial Analysis Date: ${originalAnalysisDate}
- Initial Symptoms: ${Array.isArray(originalSymptoms) ? originalSymptoms.join(', ') : originalSymptoms}

PREVIOUS FOLLOW-UP HISTORY:
${Array.isArray(previousFollowUps) && previousFollowUps.length > 0 
  ? previousFollowUps.map((f, i) => `- Follow-up ${i + 1} (${f.daysSinceInitial || 'Day ' + (i+1)*3}): Condition=${f.condition || f.diseaseName}, Severity=${f.severity}, RecoveryStatus=${f.recoveryStatus}`).join('\n')
  : 'This is the first follow-up image uploaded since initial analysis.'
}

INSTRUCTIONS FOR RECOVERY COMPARISON:
1. Examine current foliage appearance, leaf lesion coverage, fungal spots, discoloration, chlorosis, and new healthy tissue growth.
2. Compare visual evidence against initial baseline disease (${originalDiseaseName}, initial severity ${originalSeverity}).
3. Determine recovery status:
   - "Improving" (lesions reducing, less discoloration, healthy new growth)
   - "No significant change" (symptoms remain roughly unchanged)
   - "Worsening" (lesions spreading, increased chlorosis/necrosis)
   - "Recovered" (no active disease symptoms visible, plant restored to full vigor)
   Note: Do NOT claim "Recovered" unless there are virtually no remaining disease symptoms.
4. Calculate AI visual confidence score (0-100).
5. Identify specific visible recovery signs (e.g., "New healthy green foliage emerging", "Fungal spot coverage reduced").
6. Identify remaining symptoms (e.g., "Minor brown spots persist on lower leaves").
7. Provide a concise, clear progress summary (e.g., "The plant is showing clear signs of recovery compared with the initial analysis. Lesion size has reduced, but slight leaf margin discoloration remains.").
8. Suggest concrete recommended next care/treatment action.
9. Suggest recommended next follow-up period (e.g., "5-7 days").

Return ONLY valid JSON matching this exact structure:
{
  "isPlant": true,
  "condition": "${originalDiseaseName}",
  "severity": "Moderate",
  "confidence": 92,
  "recoveryStatus": "Improving",
  "visibleRecoverySigns": [
    "New healthy foliage growth visible",
    "Reduced leaf lesion coverage"
  ],
  "remainingSymptoms": [
    "Some affected lower leaves remain"
  ],
  "progressSummary": "The plant is showing signs of recovery compared with the initial analysis.",
  "recommendedAction": "Continue current care and monitor new growth.",
  "nextFollowUp": "7 days"
}

If the image is NOT a plant, return ONLY:
{
  "isPlant": false
}

Allowed values for severity: "Severe", "Moderate", "Mild", "None"
Allowed values for recoveryStatus: "Improving", "No significant change", "Worsening", "Recovered"

Return raw JSON only, no markdown wrapping.`;

              let textContent = null;

              if (geminiApiKey) {
                const requestPayload = {
                  contents: [{
                    parts: [
                      { inlineData: { mimeType: cleanMimeType, data: base64Data } },
                      { text: followupPromptText }
                    ]
                  }],
                  generationConfig: {
                    responseMimeType: "application/json"
                  }
                };

                const apiResult = await callGeminiApiWithRetry(geminiApiKey, requestPayload, DEFAULT_GEMINI_MODELS, 'Disease Follow-up');
                if (apiResult.ok) {
                  console.log("[AI] Provider: Gemini");
                  textContent = apiResult.data.candidates?.[0]?.content?.parts?.[0]?.text || '';
                } else {
                  console.log(`[AI] Gemini failed: ${apiResult.status || apiResult.geminiErrorStatus || 'UNKNOWN'}`);
                }
              } else {
                console.log("[AI] Gemini failed: GEMINI_API_KEY missing");
              }

              if (!textContent) {
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: "Unable to analyze the image right now. Please try again." }));
                return;
              }

              let aiResult = safelyParseAIJson(textContent);

              if (!aiResult) {
                console.error("[Disease Follow-up] Failed to parse AI JSON response");
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: "Unable to analyze the image right now. Please try again." }));
                return;
              }

              if (aiResult.isPlant === false || String(aiResult.isPlant).toLowerCase() === 'false') {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ isPlant: false }));
                return;
              }

              // Normalize confidence score
              let rawConf = aiResult.confidence;
              let numConf = 85;
              if (rawConf !== undefined && rawConf !== null) {
                let str = String(rawConf).replace('%', '').trim();
                let parsed = parseFloat(str);
                if (!isNaN(parsed)) {
                  if (parsed > 0 && parsed <= 1.0) {
                    numConf = Math.round(parsed * 100);
                  } else {
                    numConf = Math.round(parsed);
                  }
                }
              }
              numConf = Math.min(100, Math.max(0, numConf));

              let statusRaw = String(aiResult.recoveryStatus || '').toLowerCase();
              let normalizedStatus = 'Improved';
              if (statusRaw.includes('improv')) normalizedStatus = 'Improved';
              else if (statusRaw.includes('worsen')) normalizedStatus = 'Worsened';
              else if (statusRaw.includes('no significant') || statusRaw.includes('stable') || statusRaw.includes('same')) normalizedStatus = 'Stable';
              else if (statusRaw.includes('recover')) normalizedStatus = 'Recovered';
              else if (statusRaw.includes('insufficient')) normalizedStatus = 'Insufficient data to determine change';

              const normalized = {
                isPlant: true,
                condition: aiResult.condition || originalDiseaseName || 'Plant Disease',
                severity: aiResult.severity || 'Moderate',
                confidence: numConf,
                recoveryStatus: normalizedStatus,
                visibleRecoverySigns: ensureArray(aiResult.visibleRecoverySigns),
                remainingSymptoms: ensureArray(aiResult.remainingSymptoms),
                progressSummary: aiResult.progressSummary || 'Plant recovery progress evaluated.',
                recommendedAction: aiResult.recommendedAction || 'Continue care regimen and monitor.',
                nextFollowUp: aiResult.nextFollowUp || '7 days'
              };

              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(normalized));
            } catch (err) {
              console.error("Server Disease Follow-up API handler error:", err);
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: "Unable to analyze the image right now. Please try again." }));
            }
          });
          return;
        }

        // Endpoint 5: Generate Recommendations (/api/generate-recommendations)
        if (req.url === '/api/generate-recommendations' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk.toString(); });

          req.on('end', async () => {
            try {
              const env = loadEnv('development', process.cwd(), '');
              const geminiApiKey = (env.GEMINI_API_KEY || process.env.GEMINI_API_KEY || '').trim();

              const payload = JSON.parse(body || '{}');

              const {
                plantName = 'Unspecified Plant',
                scientificName = '',
                category = 'Garden Plants',
                analysisType = 'Health Analysis',
                problemName = 'General Health Issue',
                confidence = 80,
                severity = 'Moderate',
                affectedPart = 'Leaf',
                symptoms = [],
                visualEvidence = [],
                possibleCause = ''
              } = payload;

              const promptText = `You are a professional agricultural scientist and plant-care recommendation assistant.

Based on the following actual plant health analysis, generate comprehensive, tailored, plant-specific and problem-specific recommendations.

PLANT CONTEXT:
- Common Name: ${plantName}
- Scientific Name: ${scientificName || 'N/A'}
- Category: ${category}

ANALYSIS DIAGNOSTIC SUMMARY:
- Analysis Type: ${analysisType}
- Detected Problem: ${problemName}
- Confidence Score: ${confidence}%
- Severity Level: ${severity}
- Affected Plant Part: ${affectedPart}
- Symptoms Observed: ${Array.isArray(symptoms) ? symptoms.join(', ') : symptoms}
- Visual Evidence: ${Array.isArray(visualEvidence) ? visualEvidence.join(', ') : visualEvidence}
- Suspected Cause: ${possibleCause}

SAFETY & ACCURACY INSTRUCTIONS:
1. Generate recommendations that are STRICTLY tailored to the specific plant ("${plantName}") and specific problem ("${problemName}").
2. For Disease Detection: Avoid recommending excessive nitrogen which encourages soft fungal-vulnerable growth. Recommend sanitation, pruning affected parts, and air circulation. For chemical control, state: "Use a product specifically labeled for ${problemName} on ${plantName}, and strictly follow the manufacturer product label." Do NOT invent pesticide/fungicide dosages.
3. For Nutrient Deficiency: Depend directly on the detected nutrient (${problemName}). Recommend soil testing if nutrient status is uncertain. Do NOT recommend fertilizer simply because leaves are yellow.
4. For Pest Detection: Depend directly on the identified pest (${problemName}). Suggest physical removal, biological/organic controls (e.g. neem oil, insecticidal soap), and proper sanitation.
5. For Low Confidence (< 60%): Explicitly state that AI confidence is low and recommend confirming the problem (soil test / local extension service) before applying specific chemicals or fertilizers.
6. Provide specific plant care suggestions for ${plantName} regarding sunlight, watering, support/pruning, soil drainage, and nutrition.

Return ONLY valid JSON with this exact structure:
{
  "plantName": "${plantName}",
  "problemType": "${analysisType}",
  "problemName": "${problemName}",
  "treatmentRecommendations": [
    "Step 1 treatment statement",
    "Step 2 treatment statement"
  ],
  "fertilizerRecommendations": [
    "Fertilizer advice 1",
    "Fertilizer advice 2"
  ],
  "plantCareSuggestions": [
    "Care advice tailored to ${plantName} 1",
    "Care advice tailored to ${plantName} 2"
  ],
  "wateringSuggestions": [
    "Watering guidance tailored to ${plantName} and ${problemName} 1",
    "Watering guidance 2"
  ],
  "soilSuggestions": [
    "Soil drainage, pH, and amendment advice 1",
    "Soil advice 2"
  ],
  "environmentSuggestions": [
    "Sunlight, airflow, humidity, and placement advice 1",
    "Environment advice 2"
  ],
  "preventionSuggestions": [
    "Long-term prevention measure 1",
    "Prevention measure 2"
  ],
  "monitoringSuggestions": [
    "Monitoring plan item 1",
    "Monitoring plan item 2"
  ],
  "urgency": "Low",
  "followUpTime": "7-14 days",
  "importantNotes": [
    "Important safety note or limitation"
  ]
}

Allowed values for urgency: "Low", "Moderate", "High"

Return raw JSON only, no markdown wrapping.`;

              let aiResult = null;
              let textContent = null;

              if (geminiApiKey) {
                const requestPayload = {
                  contents: [{
                    parts: [{ text: promptText }]
                  }],
                  generationConfig: {
                    responseMimeType: "application/json"
                  }
                };

                const apiResult = await callGeminiApiWithRetry(geminiApiKey, requestPayload, DEFAULT_GEMINI_MODELS, 'Recommendations');
                if (apiResult.ok) {
                  console.log("[AI] Provider: Gemini");
                  textContent = apiResult.data.candidates?.[0]?.content?.parts?.[0]?.text || '';
                } else {
                  console.log(`[AI] Gemini failed: ${apiResult.status || apiResult.geminiErrorStatus || 'UNKNOWN'}`);
                }
              } else {
                console.log("[AI] Gemini failed: GEMINI_API_KEY missing");
              }

              if (textContent) {
                aiResult = safelyParseAIJson(textContent);
              }

              if (!aiResult) {
                const isLowConf = confidence < 60;
                aiResult = {
                  plantName: plantName,
                  problemType: analysisType,
                  problemName: problemName,
                  treatmentRecommendations: isLowConf ? [
                    "Because AI confidence is low, confirm the problem before applying a specific treatment or chemical product.",
                    "Physically inspect affected plant foliage and stems for distinct disease spots, pests, or nutrient discoloration.",
                    "Seek advice from a local agricultural extension or plant clinic if symptoms persist."
                  ] : [
                    `Isolate affected ${plantName} foliage or specimen to reduce spread to adjacent plants.`,
                    `Prune severely infected or damaged ${affectedPart || 'leaves'} using disinfected pruning shears.`,
                    analysisType.includes('Disease') 
                      ? `If using a fungicide for ${problemName}, select a product specifically labeled for ${plantName} and follow manufacturer instructions.`
                      : analysisType.includes('Pest')
                      ? `Apply organic insecticidal soap or neem oil spray directly to affected areas according to product label.`
                      : `Address suspected ${problemName} by reviewing current soil fertility and feeding routines.`
                  ],
                  fertilizerRecommendations: [
                    analysisType.includes('Nutrient')
                      ? `Apply an appropriate fertilizer formulation designed to address ${problemName} on ${plantName}, following label directions.`
                      : `Maintain balanced plant nutrition to support vigor. Avoid excessive nitrogen which can cause soft, disease-vulnerable foliage growth.`,
                    `Perform a soil test if nutrient imbalance is suspected before applying heavy fertilizer doses.`
                  ],
                  plantCareSuggestions: [
                    `Ensure ${plantName} receives adequate sunlight suitable for ${category}.`,
                    `Prune dense foliage periodically to improve sunlight penetration and structural health.`,
                    `Maintain clean garden sanitation by clearing fallen leaves and weed debris from around the plant base.`
                  ],
                  wateringSuggestions: [
                    analysisType.includes('Disease')
                      ? `Water ${plantName} directly at the soil line; avoid overhead sprinkling to keep foliage dry.`
                      : `Maintain consistent soil moisture appropriate for ${plantName}, avoiding both waterlogging and drought stress.`,
                    `Water early in the morning so excess surface moisture evaporates during the day.`
                  ],
                  soilSuggestions: [
                    `Ensure root zone has well-draining soil with good organic matter content.`,
                    `Check soil pH range suitable for ${plantName} to optimize nutrient bioavailability.`,
                    `Consider a professional soil test before applying specific mineral soil amendments.`
                  ],
                  environmentSuggestions: [
                    `Place ${plantName} in a location with adequate ambient air circulation.`,
                    `Ensure proper spacing between adjacent containers or garden beds to prevent crowding.`,
                    `Protect plant from extreme environmental fluctuations or temperature shocks.`
                  ],
                  preventionSuggestions: [
                    `Inspect ${plantName} weekly for early signs of disease, pests, or nutritional discoloration.`,
                    `Sanitize garden tools with alcohol after working on affected plants.`,
                    `Rotate crops or refresh container potting soil periodically.`
                  ],
                  monitoringSuggestions: [
                    `Monitor new leaf growth and overall vigor over the next 7-14 days.`,
                    `Track whether symptoms worsen or stabilize following care adjustments.`,
                    `Re-evaluate the plant if new symptoms develop.`
                  ],
                  urgency: severity === 'Severe' || severity === 'High' ? 'High' : severity === 'Moderate' ? 'Moderate' : 'Low',
                  followUpTime: '7-14 days',
                  importantNotes: [
                    isLowConf 
                      ? "Plant-specific recommendations are limited because AI visual confidence is under 60%."
                      : `Follow all commercial product labels carefully when applying fertilizer or pest control products.`
                  ]
                };
              }

              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(aiResult));
            } catch (err) {
              console.error("Server Recommendations API handler error:", err);
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: "Unable to generate recommendations right now. Please try again." }));
            }
          });
          return;
        }

        // Endpoint 7: Compare Follow-Up Recovery (/api/compare-recovery)
        if (req.url === '/api/compare-recovery' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk.toString(); });

          req.on('end', async () => {
            try {
              console.log("[Tracker Recovery] AI assessment start");
              const env = loadEnv('development', process.cwd(), '');
              const geminiApiKey = (env.GEMINI_API_KEY || process.env.GEMINI_API_KEY || '').trim();

              const payload = JSON.parse(body || '{}');
              const {
                baselineImageBase64,
                followupImageBase64,
                plantName = 'Plant Specimen',
                diseaseName = 'Plant Disease',
                initialSeverity = 'Moderate'
              } = payload;

              if (!baselineImageBase64 || !followupImageBase64) {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({
                  status: "NO_CHANGE",
                  score: 0,
                  reason: "Images do not provide enough reliable visual evidence to determine a change.",
                  confidence: 40
                }));
                return;
              }

              const extractImageParts = (imgStr, defaultMime = 'image/jpeg') => {
                let cleanMime = defaultMime;
                let data = imgStr;
                if (typeof imgStr === 'string' && imgStr.includes(';base64,')) {
                  const parts = imgStr.split(';base64,');
                  const mimeMatch = parts[0].match(/data:(.*?)$/);
                  if (mimeMatch && mimeMatch[1]) cleanMime = mimeMatch[1];
                  data = parts[1];
                } else if (typeof imgStr === 'string' && imgStr.includes(',')) {
                  data = imgStr.split(',')[1];
                }
                return { mimeType: cleanMime, base64: data };
              };

              const baselinePart = extractImageParts(baselineImageBase64);
              const followupPart = extractImageParts(followupImageBase64);

              const promptText = `You are an expert AI plant pathologist evaluating disease recovery progress between a baseline image and a follow-up image of a plant.

Image 1 is the Day 0 Baseline image showing initial plant condition (${diseaseName} on ${plantName}, initial severity ${initialSeverity}).
Image 2 is the current Follow-up image after treatment.

Analyze and compare Image 2 (Follow-up) against Image 1 (Baseline).

CRITICAL COMPARISON FACTORS TO EVALUATE:
- Number, size, and spread of visible disease spots/lesions
- Coloration and chlorosis (yellowing/browning)
- Necrotic or damaged leaf tissue
- Total affected leaf surface area vs healthy green leaf surface area
- Presence of new healthy green shoots/growth

INSTRUCTIONS TO IGNORE IRRELEVANT DIFFERENCES:
- Ignore camera angle, background, lighting variations, leaf position, and image crop/framing.
- Focus ONLY on the actual visible disease symptoms and leaf health.

CLASSIFICATION RULES:
- IMPROVED: Visible disease spots/lesions are smaller, fewer, or lighter, or there is new healthy green foliage replacing damaged tissue. (Assign positive score: +10 to +100 based on extent of recovery).
- NO_CHANGE: Visible disease severity remains approximately the same as baseline, with no significant improvement or worsening. (Assign score: 0).
- WORSENED: Visible disease spots/lesions are larger, darker, or more widespread, or there is increased chlorosis/necrosis/damage. (Assign negative score: -10 to -100 based on extent of degradation).

POOR IMAGE QUALITY / UNCERTAINTY RULE:
- If the follow-up image is too blurry, dark, out of focus, or unreadable to make a reliable comparison, return status "NO_CHANGE", score 0, confidence 40, and reason "Images do not provide enough reliable visual evidence to determine a change." Do NOT falsely claim improvement.

Return ONLY valid JSON matching this exact structure:
{
  "status": "IMPROVED",
  "score": 60,
  "reason": "Visible disease spots appear reduced compared with the baseline.",
  "confidence": 85
}

Allowed values for status: "IMPROVED", "NO_CHANGE", "WORSENED"
Allowed values for score: integer from -100 to +100
Return raw JSON only, no markdown wrapping.`;

              let textContent = null;

              if (geminiApiKey) {
                const requestPayload = {
                  contents: [{
                    parts: [
                      { inlineData: { mimeType: baselinePart.mimeType, data: baselinePart.base64 } },
                      { inlineData: { mimeType: followupPart.mimeType, data: followupPart.base64 } },
                      { text: promptText }
                    ]
                  }],
                  generationConfig: {
                    responseMimeType: "application/json"
                  }
                };

                const apiResult = await callGeminiApiWithRetry(geminiApiKey, requestPayload, DEFAULT_GEMINI_MODELS, 'Tracker Recovery Comparison');
                if (apiResult.ok) {
                  console.log("[AI] Provider: Gemini");
                  textContent = apiResult.data.candidates?.[0]?.content?.parts?.[0]?.text || '';
                } else {
                  console.log(`[AI] Gemini failed: ${apiResult.status || apiResult.geminiErrorStatus || 'UNKNOWN'}`);
                }
              }

              let resObj = null;
              if (textContent) {
                resObj = safelyParseAIJson(textContent);
              }

              if (!resObj) {
                resObj = {
                  status: "NO_CHANGE",
                  score: 0,
                  reason: "Images do not provide enough reliable visual evidence to determine a change.",
                  confidence: 40
                };
              }

              let statusUpper = String(resObj.status || '').toUpperCase();
              if (statusUpper.includes('IMPROV')) statusUpper = 'IMPROVED';
              else if (statusUpper.includes('WORSEN')) statusUpper = 'WORSENED';
              else statusUpper = 'NO_CHANGE';

              let scoreNum = parseInt(resObj.score, 10);
              if (isNaN(scoreNum)) {
                scoreNum = statusUpper === 'IMPROVED' ? 50 : (statusUpper === 'WORSENED' ? -40 : 0);
              }
              scoreNum = Math.max(-100, Math.min(100, scoreNum));

              let confNum = parseInt(resObj.confidence, 10);
              if (isNaN(confNum)) confNum = 80;
              confNum = Math.max(0, Math.min(100, confNum));

              const normalized = {
                status: statusUpper,
                score: scoreNum,
                reason: resObj.reason || (statusUpper === 'IMPROVED' ? 'Visible disease symptoms appear reduced compared with the baseline.' : (statusUpper === 'WORSENED' ? 'Visible affected areas appear more extensive compared with the baseline.' : 'No significant visible change compared with the previous condition.')),
                confidence: confNum
              };

              console.log("[Tracker Recovery] AI assessment completed:", normalized.status, normalized.score);

              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(normalized));
            } catch (err) {
              console.error("Server Compare Recovery API handler error:", err);
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({
                status: "NO_CHANGE",
                score: 0,
                reason: "Images do not provide enough reliable visual evidence to determine a change.",
                confidence: 40
              }));
            }
          });
          return;
        }

        next();
      });
    }
  };
};

export default defineConfig({
  plugins: [react(), geminiApiPlugin()],
});
