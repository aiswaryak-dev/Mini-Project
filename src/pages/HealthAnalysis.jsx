import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Shield, FlaskConical, Bug, Upload, ArrowRight, Sun, Target, Eye, AlertCircle, Info, Sparkles, CheckCircle2, Sprout, Loader2, AlertTriangle, Activity, Stethoscope, Zap, Droplets, Mountain, ShieldCheck, Clock, Camera, TrendingUp } from 'lucide-react';
import { usePlants } from '../context/PlantContext';
import { useAuth } from '../context/AuthContext';
import { auth } from '../firebase/config';

export const HealthAnalysis = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { selectedCategory, saveDiseaseAnalysis, saveNutrientAnalysis, savePestAnalysis } = usePlants();
  const { currentUser } = useAuth();
  const [selectedFeature, setSelectedFeature] = useState('disease'); // 'disease' | 'nutrient' | 'pest'
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGeneratingRecs, setIsGeneratingRecs] = useState(false);
  const [report, setReport] = useState(null);
  const [recommendations, setRecommendations] = useState(null);
  const [savedAnalysisId, setSavedAnalysisId] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [lowConfidenceNotice, setLowConfidenceNotice] = useState(null);
  const [invalidPlantNotice, setInvalidPlantNotice] = useState(null);
  const [unclearImageNotice, setUnclearImageNotice] = useState(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);

  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // Clear transient UI state when returning from Disease Progress Tracker or navigating
  useEffect(() => {
    const isFromTracker = location.state?.fromTracker || sessionStorage.getItem('reset_health_analysis_on_next_visit') === 'true';

    sessionStorage.removeItem('reset_health_analysis_on_next_visit');

    if (isFromTracker) {
      console.log("[Health Analysis] Returning from Tracker - resetting transient UI state for fresh analysis");
      setFile(null);
      setPreview(null);
      setReport(null);
      setRecommendations(null);
      setSavedAnalysisId(null);
      setErrorMessage(null);
      setLowConfidenceNotice(null);
      setInvalidPlantNotice(null);
      setUnclearImageNotice(null);
      setIsAnalyzing(false);
      setIsGeneratingRecs(false);

      if (location.state?.fromTracker) {
        navigate(location.pathname, { replace: true, state: {} });
      }
    }
  }, [location, navigate]);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleStartCamera = async () => {
    setErrorMessage(null);
    setLowConfidenceNotice(null);
    setInvalidPlantNotice(null);
    setUnclearImageNotice(null);
    setCameraError(null);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError("Camera access is not supported by your browser.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      streamRef.current = stream;
      setIsCameraActive(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 100);
    } catch (err) {
      console.warn("Camera access denied or unavailable:", err);
      setCameraError("Unable to access device camera. Please check camera permissions.");
    }
  };

  const handleStopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
    setCameraError(null);
  };

  const handleCapturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      if (!blob) {
        setCameraError("Failed to capture image from camera.");
        return;
      }
      const capturedFile = new File([blob], `plant_health_photo_${Date.now()}.jpg`, { type: 'image/jpeg' });
      
      if (capturedFile.size > 5 * 1024 * 1024) {
        setErrorMessage("Captured image exceeds 5MB limit. Please try again.");
        handleStopCamera();
        return;
      }

      setFile(capturedFile);
      setPreview(URL.createObjectURL(capturedFile));
      setReport(null);
      setRecommendations(null);
      setErrorMessage(null);
      setLowConfidenceNotice(null);
      setInvalidPlantNotice(null);
      setUnclearImageNotice(null);
      setIsAnalyzing(false);
      setIsGeneratingRecs(false);
      handleStopCamera();
    }, 'image/jpeg', 0.9);
  };

  const features = [
    {
      id: 'disease',
      badge: 'FUNGAL & VIRAL',
      title: 'Disease Detection',
      icon: Shield,
      desc: 'Analyze your plant image to identify possible diseases, causes, symptoms, and treatment protocols.'
    },
    {
      id: 'nutrient',
      badge: 'SOIL & MINERALS',
      title: 'Nutrient Deficiency Detection',
      icon: FlaskConical,
      desc: 'Analyze your plant image to identify possible nutrient deficiencies (N, P, K, Mg, Ca, Fe, Zn, S, Mn).'
    },
    {
      id: 'pest',
      badge: 'INSECT ATTACK',
      title: 'Pest Detection',
      icon: Bug,
      desc: 'Analyze your plant image to identify possible pests affecting your plant.'
    }
  ];

  const handleFileChange = (e) => {
    setErrorMessage(null);
    setLowConfidenceNotice(null);
    setInvalidPlantNotice(null);
    setUnclearImageNotice(null);

    const uploaded = e.target.files[0];
    if (uploaded) {
      // Validate file size (max 5 MB)
      if (uploaded.size > 5 * 1024 * 1024) {
        setErrorMessage("Image file size exceeds 5MB limit. Please upload a smaller image.");
        return;
      }

      // Validate file format (JPG, JPEG, PNG, WEBP)
      const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
      if (!validTypes.includes(uploaded.type.toLowerCase())) {
        setErrorMessage("Unsupported file format. Please upload a JPG, JPEG, PNG, or WEBP image.");
        return;
      }

      setFile(uploaded);
      setPreview(URL.createObjectURL(uploaded));
      setReport(null);
      setRecommendations(null);
      setIsAnalyzing(false);
      setIsGeneratingRecs(false);
    }
  };

  const readFileAsDataURL = (fileObj) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = (err) => reject(err || new Error("Unable to read the image file. Please try again."));
      reader.readAsDataURL(fileObj);
    });
  };

  const handleRunAnalysis = async () => {
    if (!file || isAnalyzing) return;

    console.log("[Disease Detection] Button clicked");

    const activeUid = auth?.currentUser?.uid || (currentUser && !currentUser.isDemo ? currentUser.uid : null);
    const isDemoUser = !activeUid || currentUser?.isDemo || activeUid === 'demo-gardener-123' || activeUid === 'guest' || !String(activeUid).trim();

    if (selectedFeature === 'disease' && isDemoUser) {
      console.log("[Disease Detection] Authenticated UID: null");
      setErrorMessage("Please sign in before saving the disease analysis.");
      return;
    }

    if (selectedFeature === 'disease') {
      console.log(`[Disease Detection] Authenticated UID: ${activeUid}`);
    }

    setIsAnalyzing(true);
    setIsGeneratingRecs(false);
    setReport(null);
    setRecommendations(null);
    setErrorMessage(null);
    setLowConfidenceNotice(null);
    setInvalidPlantNotice(null);
    setUnclearImageNotice(null);

    try {
      console.log("[Disease Detection] Starting AI request");

      let base64Data;
      try {
        base64Data = await readFileAsDataURL(file);
      } catch (readErr) {
        throw new Error("Unable to read the image file. Please try again.");
      }

      const endpoint = selectedFeature === 'disease' 
        ? '/api/analyze-disease' 
        : selectedFeature === 'nutrient' 
        ? '/api/analyze-nutrient' 
        : '/api/analyze-pest';

      let response;
      try {
        response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: base64Data,
            mimeType: file.type || 'image/jpeg',
            category: selectedCategory || 'Garden Plants'
          })
        });
      } catch (networkErr) {
        console.error("[Disease Detection] SAVE ERROR:", {
          code: 'network-error',
          message: networkErr?.message,
          error: networkErr
        });
        const connErr = new Error("The disease was detected, but the result could not be saved. Please check your connection and try again.");
        connErr.code = "unavailable";
        throw connErr;
      }

      if (!response.ok) {
        let errData = {};
        try {
          errData = await response.json();
        } catch (_) {}

        const status = response.status;
        console.error(`[Disease Detection] ERROR: HTTP ${status}`, errData);

        if (status === 429) {
          const quotaErr = new Error("The AI service quota has been exceeded. Please try again after the quota resets.");
          quotaErr.code = "resource-exhausted";
          throw quotaErr;
        } else if (status === 400) {
          throw new Error("The image or request could not be processed. Please try another image.");
        } else if (status === 401 || status === 403) {
          throw new Error("Gemini API authentication or permission error. Please check the API configuration.");
        } else if (status === 500 || status === 503) {
          throw new Error("The AI service is temporarily unavailable. Please try again shortly.");
        } else {
          throw new Error(errData.error || errData.message || `AI service returned error (HTTP ${status}). Please try again.`);
        }
      }

      const data = await response.json();
      console.log("[Disease Detection] AI response received");

      // Case 1: Invalid Image (validImage === false, not a plant, blurry, dark, unclear, etc.)
      if (data.validImage === false || data.isPlant === false || data.isSuitableForAnalysis === false || data.imageClassification === 'NOT_A_PLANT_IMAGE' || data.imageClassification === 'BLURRY_IMAGE' || data.imageClassification === 'INSUFFICIENT_PLANT_VISIBILITY' || (data.confidence !== undefined && data.confidence < 60)) {
        const isNotPlant = data.isPlant === false || data.imageClassification === 'NOT_A_PLANT_IMAGE';
        const msg = data.message || data.validationMessage || (isNotPlant 
          ? "Please upload an image of a plant or affected plant part for analysis."
          : "Please upload a clear plant image showing the affected leaf or plant part.");

        if (isNotPlant) {
          setInvalidPlantNotice(msg);
          setUnclearImageNotice(null);
        } else {
          setUnclearImageNotice(msg);
          setInvalidPlantNotice(null);
        }
        setReport(null);
        setRecommendations(null);
        return;
      }

      console.log("[Disease Detection] Parsed disease result");

      // Case 3: Valid Image -> Prepare notices
      setInvalidPlantNotice(null);
      setUnclearImageNotice(null);

      const realPlantName = (data.plantName || '').trim();
      const realScientificName = (data.scientificName || '').trim();

      // Derive care recommendations directly from diagnostic result
      const hasIssue = (
        (selectedFeature === 'disease' && data.diseaseDetected !== false && data.diseaseName !== 'Healthy Plant' && data.diseaseName !== 'No significant issue detected') ||
        (selectedFeature === 'nutrient' && data.deficiencyDetected !== false && data.primaryNutrient !== 'None' && data.primaryNutrient !== 'No significant issue detected') ||
        (selectedFeature === 'pest' && data.pestDetected !== false && data.primaryPest !== 'None' && data.primaryPest !== 'No significant issue detected')
      );

      let recData = null;
      if (hasIssue) {
        const problemName = selectedFeature === 'disease'
          ? (data.diseaseName || 'Plant Disease')
          : selectedFeature === 'nutrient'
          ? (data.primaryNutrient ? `${data.primaryNutrient} (${data.nutrientSymbol || ''}) Deficiency` : 'Nutrient Deficiency')
          : (data.primaryPest || 'Pest Infestation');

        const recPlantName = realPlantName || 'Plant Specimen';

        recData = {
          plantName: recPlantName,
          problemType: selectedFeature === 'disease' ? 'Disease Detection' : selectedFeature === 'nutrient' ? 'Nutrient Deficiency Detection' : 'Pest Detection',
          problemName,
          urgency: (data.severity === 'Severe' || data.severity === 'High') ? 'High' : (data.severity === 'Moderate' ? 'Moderate' : 'Low'),
          treatmentRecommendations: (data.treatment && data.treatment.length > 0) ? data.treatment : (data.recommendedTreatment || []),
          fertilizerRecommendations: data.fertilizerRecommendation || [],
          plantCareSuggestions: data.additionalAdvice || [],
          wateringSuggestions: [
            `Maintain consistent, appropriate soil moisture for ${recPlantName}. Avoid overhead watering to keep foliage dry.`,
            `Water early in the morning so excess moisture evaporates during the day.`
          ],
          soilSuggestions: [
            `Ensure well-draining soil with good organic matter content.`,
            `Check soil pH range suitable for ${recPlantName}.`
          ],
          environmentSuggestions: [
            `Place ${recPlantName} in a location with adequate ambient air circulation and suitable lighting.`
          ],
          preventionSuggestions: data.prevention || [],
          monitoringSuggestions: [
            `Monitor new foliage growth and overall vigor over the next 7-14 days.`
          ],
          followUpTime: '7-14 days',
          importantNotes: [
            `Follow all commercial product instructions carefully when applying fertilizers or pest control.`
          ]
        };
      }

      // Save analysis to Firebase Storage and Firestore
      if (selectedFeature === 'disease') {
        let savedRecord;
        try {
          savedRecord = await saveDiseaseAnalysis({
            file,
            imageUrl: preview,
            plantName: realPlantName || undefined,
            scientificName: realScientificName || undefined,
            healthStatus: data.healthStatus,
            diseaseDetected: data.diseaseDetected,
            diseaseName: data.diseaseName,
            confidence: data.confidence,
            severity: data.severity,
            symptoms: data.symptoms,
            possibleCause: data.possibleCause,
            affectedPart: data.affectedPart,
            treatment: data.treatment,
            prevention: data.prevention,
            additionalAdvice: data.additionalAdvice,
            analysisSummary: data.analysisSummary,
            recommendations: recData
          });
        } catch (saveError) {
          console.error("[Disease Detection] SAVE ERROR:", {
            code: saveError?.code,
            message: saveError?.message,
            error: saveError
          });

          const code = saveError?.code || '';
          const msg = saveError?.message || '';

          let errorMsg = "The disease was detected, but the result could not be saved.";

          if (code === 'unauthenticated' || code === 'storage/unauthenticated' || msg.includes('Please sign in')) {
            errorMsg = "Please sign in before saving the disease analysis.";
          } else if (code === 'image/oversized' || msg.includes('too large')) {
            errorMsg = "The image is too large to save. Please choose a smaller image.";
          } else if (code === 'permission-denied' || msg.includes('permission-denied') || msg.includes('permissions are blocking')) {
            errorMsg = "Unable to save the analysis. Firebase permissions are blocking the save.";
          } else if (code === 'unavailable' || code === 'network-request-failed' || msg.includes('connection')) {
            errorMsg = "The disease was detected, but the result could not be saved. Please check your connection and try again.";
          }

          setErrorMessage(errorMsg);
          setReport(data);
          setRecommendations(recData);
          setSavedAnalysisId(null);
          return;
        }

        const returnedAnalysisId = savedRecord?.analysisId || savedRecord?.id;
        if (returnedAnalysisId) {
          setSavedAnalysisId(returnedAnalysisId);
          setReport({ ...data, ...savedRecord, id: returnedAnalysisId });
          setRecommendations(recData);
          console.log("[Disease Detection] Detection completed");
        } else {
          console.error("[Disease Detection] SAVE ERROR: Missing returned analysisId", savedRecord);
          setErrorMessage("The disease was detected, but the result could not be saved.");
          setReport(null);
          setRecommendations(null);
          return;
        }
      } else if (selectedFeature === 'nutrient') {
        let savedRecord;
        try {
          savedRecord = await saveNutrientAnalysis({
            file,
            imageUrl: preview,
            plantName: realPlantName || undefined,
            scientificName: realScientificName || undefined,
            nutritionStatus: data.nutritionStatus,
            deficiencyDetected: data.deficiencyDetected,
            primaryNutrient: data.primaryNutrient,
            nutrientSymbol: data.nutrientSymbol,
            confidence: data.confidence,
            severity: data.severity,
            affectedPart: data.affectedPart,
            symptoms: data.symptoms,
            visualEvidence: data.visualEvidence,
            possibleCause: data.possibleCause,
            recommendedTreatment: data.recommendedTreatment,
            fertilizerRecommendation: data.fertilizerRecommendation,
            prevention: data.prevention,
            additionalAdvice: data.additionalAdvice,
            analysisSummary: data.analysisSummary,
            recommendations: recData
          });
        } catch (saveError) {
          console.error("[Nutrient Detection] SAVE ERROR:", saveError);
          setErrorMessage(saveError?.message || "The nutrient deficiency was detected, but the result could not be saved.");
          setReport(data);
          setRecommendations(recData);
          setSavedAnalysisId(null);
          return;
        }

        const returnedAnalysisId = savedRecord?.analysisId || savedRecord?.id;
        if (returnedAnalysisId) {
          setSavedAnalysisId(returnedAnalysisId);
          setReport({ ...data, ...savedRecord, id: returnedAnalysisId });
          setRecommendations(recData);
          console.log("[Nutrient Detection] Detection completed");
        } else {
          setErrorMessage("The nutrient deficiency was detected, but the result could not be saved.");
          setReport(null);
          setRecommendations(null);
          return;
        }
      } else if (selectedFeature === 'pest') {
        let savedRecord;
        try {
          savedRecord = await savePestAnalysis({
            file,
            imageUrl: preview,
            plantName: realPlantName || undefined,
            scientificName: realScientificName || undefined,
            pestStatus: data.pestStatus,
            healthStatus: data.pestStatus,
            pestDetected: data.pestDetected,
            primaryPest: data.primaryPest,
            pestName: data.primaryPest,
            confidence: data.confidence,
            severity: data.severity,
            affectedPart: data.affectedPart,
            visiblePest: data.visiblePest,
            symptoms: data.symptoms,
            visualEvidence: data.visualEvidence,
            damageType: data.damageType,
            possibleCause: data.possibleCause,
            recommendedTreatment: data.recommendedTreatment,
            organicControl: data.organicControl,
            prevention: data.prevention,
            additionalAdvice: data.additionalAdvice,
            analysisSummary: data.analysisSummary,
            recommendations: recData
          });
        } catch (saveError) {
          console.error("[Pest Detection] SAVE ERROR:", saveError);
          setErrorMessage(saveError?.message || "The pest was detected, but the result could not be saved.");
          setReport(data);
          setRecommendations(recData);
          setSavedAnalysisId(null);
          return;
        }

        const returnedAnalysisId = savedRecord?.analysisId || savedRecord?.id;
        if (returnedAnalysisId) {
          setSavedAnalysisId(returnedAnalysisId);
          setReport({ ...data, ...savedRecord, id: returnedAnalysisId });
          setRecommendations(recData);
          console.log("[Pest Detection] Detection completed");
        } else {
          setErrorMessage("The pest was detected, but the result could not be saved.");
          setReport(null);
          setRecommendations(null);
          return;
        }
      }

    } catch (err) {
      console.error("[Disease Detection] SAVE ERROR:", {
        code: err?.code,
        message: err?.message,
        error: err
      });

      const code = err?.code || '';
      const msg = err?.message || '';

      let errorMsg = err.message || "Unable to analyze plant health right now. Please try again.";

      if (code === 'permission-denied' || msg.includes('permission-denied') || msg.includes('permissions are blocking')) {
        errorMsg = "Unable to save the analysis. Firebase permissions are blocking the save.";
      } else if (code === 'unauthenticated' || msg.includes('Please sign in') || msg.includes('authenticated before saving')) {
        errorMsg = "Please sign in before saving the disease analysis.";
      } else if (msg.includes('image could not be uploaded') || code?.startsWith('storage/')) {
        errorMsg = "The disease was detected, but the original image could not be uploaded.";
      } else if (code === 'unavailable' || code === 'network-request-failed' || msg.includes('connection')) {
        errorMsg = "The disease was detected, but the result could not be saved. Please check your connection and try again.";
      } else if (code === 'resource-exhausted' || msg.includes('quota')) {
        errorMsg = "The AI service quota has been exceeded. Please try again after the quota resets.";
      }

      setErrorMessage(errorMsg);
      setReport(null);
      setRecommendations(null);
    } finally {
      setIsAnalyzing(false);
      setIsGeneratingRecs(false);
    }
  };

  const getConfidenceTier = (score) => {
    if (score >= 90) return { label: 'Very High Confidence', color: 'bg-emerald-600 text-white' };
    if (score >= 75) return { label: 'High Confidence', color: 'bg-emerald-500 text-white' };
    if (score >= 60) return { label: 'Moderate Confidence', color: 'bg-amber-500 text-white' };
    return { label: 'Low Confidence', color: 'bg-rose-500 text-white' };
  };

  const getSeverityBadge = (sev) => {
    const s = (sev || 'None').toLowerCase();
    if (s === 'severe' || s === 'high') return 'bg-rose-100 text-rose-800 border-rose-200';
    if (s === 'moderate') return 'bg-amber-100 text-amber-800 border-amber-200';
    if (s === 'low') return 'bg-blue-100 text-blue-800 border-blue-200';
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  const getStatusBadge = (status, feature) => {
    const st = (status || 'Unclear').toLowerCase();
    if (st === 'healthy' || st === 'no pest detected') return 'bg-emerald-100 text-emerald-800 border-emerald-300';
    if (st === 'diseased' || st === 'possible deficiency' || st.includes('infest') || st.includes('detected')) return 'bg-amber-100 text-amber-800 border-amber-300';
    return 'bg-slate-100 text-slate-800 border-slate-300';
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 py-6 px-4">
      
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EAF6E8] text-[#16883D] text-[11px] font-bold mb-1">
          <span>Active Category:</span>
          <span className="underline">{selectedCategory || 'Garden Plants'}</span>
        </div>
        <h2 className="text-3xl font-extrabold text-slate-900 flex items-center justify-center gap-2">
          Plant Health Analysis <Shield className="w-7 h-7 text-[#16883D]" />
        </h2>
        <p className="text-xs font-semibold text-slate-500 max-w-xl mx-auto">
          Choose an analysis type below, upload an image of your plant or leaf, and receive AI health diagnostics.
        </p>
      </div>

      {/* Section 1: Select Health Analysis Feature */}
      <div className="space-y-4">
        <h3 className="font-bold text-slate-900 text-sm">Select Health Analysis Feature</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((feat) => {
            const Icon = feat.icon;
            const isSelected = selectedFeature === feat.id;
            return (
              <div
                key={feat.id}
                onClick={() => { setSelectedFeature(feat.id); setErrorMessage(null); setReport(null); setRecommendations(null); setLowConfidenceNotice(null); setInvalidPlantNotice(null); setUnclearImageNotice(null); setIsAnalyzing(false); setIsGeneratingRecs(false); }}
                className={`cursor-pointer bg-white rounded-3xl p-6 border transition-all flex flex-col justify-between h-56 ${
                  isSelected 
                    ? 'border-[#16883D] ring-2 ring-[#16883D]/20 shadow-md' 
                    : 'border-slate-100 shadow-sm hover:shadow-md'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="p-3 rounded-full bg-[#EAF6E8] text-[#16883D]">
                    <Icon className="w-5 h-5 stroke-[2.5]" />
                  </div>

                  <span className="text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#16883D] text-white">
                    {feat.badge}
                  </span>
                </div>

                <div className="space-y-1">
                  <h4 className="font-bold text-slate-900 text-sm">{feat.title}</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {feat.desc}
                  </p>
                </div>

              </div>
            );
          })}
        </div>
      </div>

      {/* Section 2: Upload Image & Guidelines */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm space-y-6">
        
        <h3 className="font-bold text-slate-900 text-base">
          Upload Plant Image for {selectedFeature === 'disease' ? 'Disease' : selectedFeature === 'nutrient' ? 'Nutrient Deficiency' : 'Pest'} Detection
        </h3>

        {/* Dashed Upload Box */}
        <div className="border-2 border-dashed border-emerald-300/80 rounded-2xl p-6 text-center bg-slate-50/50 flex flex-col items-center justify-center min-h-[160px] relative">
          {preview ? (
            <div className="relative w-full max-w-sm h-40 rounded-xl overflow-hidden mx-auto bg-slate-100 flex items-center justify-center">
              <img 
                src={preview} 
                alt="Upload preview" 
                className="w-full h-full object-cover" 
                onError={(e) => {
                  e.target.style.display = 'none';
                  const fallback = e.target.nextSibling;
                  if (fallback) fallback.style.display = 'flex';
                }}
              />
              <div className="hidden flex-col items-center gap-1.5 text-amber-600 p-2 text-center">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                <span className="text-[10px] font-bold">Original image unavailable</span>
              </div>
              <button 
                onClick={() => { setFile(null); setPreview(null); setReport(null); setRecommendations(null); setErrorMessage(null); setLowConfidenceNotice(null); setInvalidPlantNotice(null); setUnclearImageNotice(null); setIsAnalyzing(false); setIsGeneratingRecs(false); }}
                className="absolute top-2 right-2 px-2.5 py-1 bg-black/60 hover:bg-black/80 text-white rounded-lg text-[10px] font-bold transition-all"
              >
                Change Image
              </button>
            </div>
          ) : isCameraActive ? (
            <div className="relative w-full max-w-sm h-40 rounded-xl overflow-hidden bg-slate-900 flex flex-col items-center justify-center mx-auto">
              <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
              <div className="absolute bottom-3 left-0 right-0 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={handleCapturePhoto}
                  className="px-3.5 py-1.5 rounded-xl bg-[#16883D] hover:bg-[#127132] text-white text-xs font-bold transition-all shadow-md active:scale-95 flex items-center gap-1.5"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Capture Photo</span>
                </button>
                <button
                  type="button"
                  onClick={handleStopCamera}
                  className="px-3 py-1.5 rounded-xl bg-black/60 hover:bg-black/80 text-white text-xs font-bold transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="w-10 h-10 rounded-full bg-[#EAF6E8] text-[#16883D] flex items-center justify-center mb-2">
                <Upload className="w-5 h-5 stroke-[2.5]" />
              </div>
              <p className="text-xs font-semibold text-slate-700 mb-1">
                Drag and drop an image here
              </p>
              <span className="text-[10px] text-slate-400 mb-3">or</span>
              
              <div className="flex flex-wrap items-center justify-center gap-2">
                <label className="cursor-pointer px-4 py-2 rounded-xl bg-[#16883D] hover:bg-[#127132] text-white text-xs font-bold transition-all shadow-sm active:scale-95 flex items-center gap-1.5">
                  <span>Choose Image</span>
                  <input type="file" accept="image/png, image/jpeg, image/jpg, image/webp" onChange={handleFileChange} className="hidden" />
                </label>

                <button
                  type="button"
                  onClick={handleStartCamera}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition-all shadow-sm active:scale-95 flex items-center gap-1.5"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Take Photo</span>
                </button>
              </div>

              {cameraError && (
                <p className="text-[11px] font-semibold text-rose-600 mt-2">
                  {cameraError}
                </p>
              )}

              <p className="text-[10px] text-slate-400 mt-2">
                Supported formats: JPG, PNG, JPEG, WEBP (Max size: 5MB)
              </p>
            </>
          )}
        </div>

        {/* Image Guidelines Grid */}
        <div className="space-y-2">
          <h4 className="font-bold text-slate-800 text-xs">Image Guidelines</h4>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-[#EAF6E8]/40 border border-[#EAF6E8] space-y-1">
              <div className="w-7 h-7 rounded-full bg-[#EAF6E8] text-[#16883D] flex items-center justify-center">
                <Sun className="w-3.5 h-3.5" />
              </div>
              <h5 className="font-bold text-[#16883D] text-[11px]">Good lighting</h5>
              <p className="text-[10px] text-slate-500 leading-tight">Use natural light for better results.</p>
            </div>

            <div className="p-3 rounded-xl bg-[#EAF6E8]/40 border border-[#EAF6E8] space-y-1">
              <div className="w-7 h-7 rounded-full bg-[#EAF6E8] text-[#16883D] flex items-center justify-center">
                <Target className="w-3.5 h-3.5" />
              </div>
              <h5 className="font-bold text-[#16883D] text-[11px]">Clear focus</h5>
              <p className="text-[10px] text-slate-500 leading-tight">Ensure the plant is in focus.</p>
            </div>

            <div className="p-3 rounded-xl bg-[#EAF6E8]/40 border border-[#EAF6E8] space-y-1">
              <div className="w-7 h-7 rounded-full bg-[#EAF6E8] text-[#16883D] flex items-center justify-center">
                <Sprout className="w-3.5 h-3.5" />
              </div>
              <h5 className="font-bold text-[#16883D] text-[11px]">Whole plant or affected part</h5>
              <p className="text-[10px] text-slate-500 leading-tight">Capture relevant parts of the plant.</p>
            </div>

            <div className="p-3 rounded-xl bg-[#EAF6E8]/40 border border-[#EAF6E8] space-y-1">
              <div className="w-7 h-7 rounded-full bg-[#EAF6E8] text-[#16883D] flex items-center justify-center">
                <Eye className="w-3.5 h-3.5" />
              </div>
              <h5 className="font-bold text-[#16883D] text-[11px]">Avoid blur</h5>
              <p className="text-[10px] text-slate-500 leading-tight">Upload sharp and clear images.</p>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div>
          <button
            onClick={handleRunAnalysis}
            disabled={isAnalyzing || !file}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 shadow-sm active:scale-95 ${
              isAnalyzing
                ? 'bg-slate-300 text-slate-600 cursor-not-allowed'
                : file
                ? 'bg-[#16883D] hover:bg-[#127132] text-white'
                : 'bg-slate-200 text-slate-500 cursor-not-allowed'
            }`}
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>
                  {selectedFeature === 'pest' 
                    ? 'Analyzing plant for pests...' 
                    : selectedFeature === 'nutrient' 
                    ? 'Analyzing plant nutrition...' 
                    : 'Analyzing plant health...'}
                </span>
              </>
            ) : (
              <>
                <span>Run {selectedFeature === 'nutrient' ? 'Nutrient Deficiency' : selectedFeature === 'disease' ? 'Disease' : 'Pest'} Detection</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>

        {/* Error Alert Box */}
        {errorMessage && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 font-medium">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Invalid Plant Image Notice */}
        {invalidPlantNotice && (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs space-y-1">
            <div className="flex items-center gap-2 font-bold text-amber-900 text-sm">
              <AlertTriangle className="w-4.5 h-4.5 shrink-0 text-amber-600" />
              <span>No plant detected</span>
            </div>
            <p className="text-amber-800 font-medium pl-6">
              {typeof invalidPlantNotice === 'string' ? invalidPlantNotice : "Please upload a valid plant image. The uploaded image does not appear to contain a plant."}
            </p>
          </div>
        )}

        {/* Unclear / Poor Quality Image Notice */}
        {unclearImageNotice && (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs space-y-1">
            <div className="flex items-center gap-2 font-bold text-amber-900 text-sm">
              <AlertTriangle className="w-4.5 h-4.5 shrink-0 text-amber-600" />
              <span>Image quality issue</span>
            </div>
            <p className="text-amber-800 font-medium pl-6">
              {typeof unclearImageNotice === 'string' ? unclearImageNotice : "Image is unclear for analysis. Please upload a clear, well-lit photo of the plant or affected part."}
            </p>
          </div>
        )}

        {/* HEALTH ANALYSIS DIAGNOSTIC RESULT CARD */}
        {report && report.isPlant !== false && (
          <div className="p-6 rounded-3xl bg-white border border-slate-200 text-xs space-y-6 shadow-sm animate-fadeIn">
            {/* Header / Title Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-extrabold text-[#16883D] uppercase tracking-wider">
                    {selectedFeature === 'disease' ? 'Disease Detection Result' : selectedFeature === 'nutrient' ? 'Nutrient Scan Result' : 'Pest Detection Result'}
                  </span>
                  
                  {/* Status Badge */}
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${getStatusBadge(report.healthStatus || report.nutritionStatus || report.pestStatus, selectedFeature)}`}>
                    {report.healthStatus || report.nutritionStatus || report.pestStatus || 'Analyzed'}
                  </span>

                  {/* Confidence Badge */}
                  {report.confidence !== undefined && (
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${getConfidenceTier(report.confidence).color}`}>
                      {report.confidence}% Confidence
                    </span>
                  )}

                  {/* Severity Badge */}
                  {report.severity && (
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${getSeverityBadge(report.severity)}`}>
                      Severity: {report.severity}
                    </span>
                  )}
                </div>

                <h4 className="font-extrabold text-xl text-slate-900 flex items-center gap-2 mt-1">
                  <Activity className="w-5 h-5 text-[#16883D]" />
                  <span>
                    {selectedFeature === 'disease' 
                      ? (report.diseaseName || (report.diseaseDetected ? 'Plant Disease' : 'No specific disease detected'))
                      : selectedFeature === 'nutrient'
                      ? (report.primaryNutrient ? `${report.primaryNutrient} (${report.nutrientSymbol || ''}) Deficiency` : 'Nutrient Deficiency')
                      : (report.primaryPest || 'Pest Infestation')}
                  </span>
                </h4>

                {report.affectedPart && (
                  <p className="text-[11px] text-slate-500 font-medium">
                    Affected Plant Part: <strong className="text-slate-800">{report.affectedPart}</strong>
                  </p>
                )}
              </div>

              {selectedFeature === 'disease' && report.diseaseDetected !== false && (
                <button
                  onClick={() => {
                    const targetId = savedAnalysisId || report?.id || report?.analysisId;
                    console.log("[Health Analysis] Navigating to tracker with analysisId:", targetId);
                    sessionStorage.setItem('reset_health_analysis_on_next_visit', 'true');
                    navigate('/tracker', { state: { analysisId: targetId, fromHealthAnalysis: true } });
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#EAF6E8] text-[#16883D] hover:bg-[#16883D] hover:text-white font-bold text-xs transition-all shadow-sm shrink-0 self-start sm:self-center"
                >
                  <TrendingUp className="w-4 h-4" />
                  <span>Track Recovery</span>
                </button>
              )}
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Symptoms / Visual Evidence */}
              {((report.symptoms && report.symptoms.length > 0) || (report.visualEvidence && report.visualEvidence.length > 0)) && (
                <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 space-y-2">
                  <h5 className="font-extrabold text-amber-900 text-xs flex items-center gap-2">
                    <Eye className="w-4 h-4 text-amber-700" />
                    <span>Visual Symptoms & Evidence</span>
                  </h5>
                  <ul className="space-y-1.5 text-amber-950 font-medium">
                    {(report.symptoms || report.visualEvidence || []).map((sym, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-600 shrink-0 mt-1.5" />
                        <span className="leading-relaxed">{sym}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Suspected Cause / Root Cause */}
              {report.possibleCause && (
                <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200/80 space-y-2">
                  <h5 className="font-extrabold text-blue-900 text-xs flex items-center gap-2">
                    <Info className="w-4 h-4 text-blue-700" />
                    <span>Suspected Cause & Root Factor</span>
                  </h5>
                  <p className="text-blue-950 leading-relaxed font-medium">
                    {report.possibleCause}
                  </p>
                </div>
              )}

              {/* Treatment Protocols */}
              {((report.treatment && report.treatment.length > 0) || (report.recommendedTreatment && report.recommendedTreatment.length > 0)) && (
                <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 space-y-2">
                  <h5 className="font-extrabold text-[#16883D] text-xs flex items-center gap-2">
                    <Stethoscope className="w-4 h-4" />
                    <span>Immediate Treatment Protocols</span>
                  </h5>
                  <ul className="space-y-1.5 text-slate-800 font-medium">
                    {(report.treatment || report.recommendedTreatment || []).map((trt, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#16883D] shrink-0 mt-0.5" />
                        <span className="leading-relaxed">{trt}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Prevention & Long-term Care */}
              {report.prevention && report.prevention.length > 0 && (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <h5 className="font-extrabold text-slate-900 text-xs flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#16883D]" />
                    <span>Prevention & Management</span>
                  </h5>
                  <ul className="space-y-1.5 text-slate-700 font-medium">
                    {report.prevention.map((prv, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#16883D] shrink-0 mt-1.5" />
                        <span className="leading-relaxed">{prv}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

            </div>

            {/* Analysis Summary */}
            {report.analysisSummary && (
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-700 font-medium leading-relaxed">
                <strong className="text-slate-900 font-bold">Analysis Summary: </strong>
                <span>{report.analysisSummary}</span>
              </div>
            )}
          </div>
        )}

        {/* No Issue / Healthy Plant Message Banner */}
        {report && (
          (selectedFeature === 'pest' && (report.pestDetected === false || (report.pestStatus && String(report.pestStatus).toLowerCase().includes('no pest')) || report.primaryPest === 'None' || report.primaryPest === 'No significant issue detected')) ||
          (selectedFeature === 'disease' && (report.diseaseDetected === false || report.diseaseName === 'Healthy Plant' || report.diseaseName === 'No significant issue detected')) ||
          (selectedFeature === 'nutrient' && (report.deficiencyDetected === false || report.primaryNutrient === 'None' || report.primaryNutrient === 'No significant issue detected'))
        ) && (
          <div className="p-4 rounded-2xl bg-[#EAF6E8] border border-[#EAF6E8] text-[#16883D] text-xs flex items-center gap-2 font-semibold shadow-sm">
            <CheckCircle2 className="w-4.5 h-4.5 text-[#16883D] shrink-0" />
            <span>No significant issue detected. Plant specimen appears healthy and well-maintained.</span>
          </div>
        )}

        {/* Loading Indicator for Recommendations */}
        {isGeneratingRecs && !recommendations && !errorMessage && (
          <div className="p-6 rounded-3xl bg-[#EAF6E8]/60 border border-[#EAF6E8] text-xs flex items-center justify-center gap-3 animate-pulse">
            <Loader2 className="w-5 h-5 text-[#16883D] animate-spin" />
            <span className="font-bold text-[#063D24]">Generating AI Treatment, Fertilizer & Plant Care Recommendations...</span>
          </div>
        )}

        {/* RECOMMENDATION SYSTEM CARD CONTAINER */}
        {report && report.confidence >= 60 && recommendations && (
          <div className="p-6 rounded-3xl bg-white border border-emerald-200 text-xs space-y-6 shadow-sm animate-fadeIn">
            
            {/* Header / Care Priority Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-extrabold text-[#16883D] uppercase tracking-wider">AI Care Recommendations</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${
                    (recommendations.urgency || 'Moderate') === 'High' 
                      ? 'bg-rose-100 text-rose-800 border-rose-200' 
                      : (recommendations.urgency || 'Moderate') === 'Moderate'
                      ? 'bg-amber-100 text-amber-800 border-amber-200'
                      : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                  }`}>
                    Care Priority: {recommendations.urgency || 'Moderate'}
                  </span>
                </div>
                <h4 className="font-extrabold text-xl text-slate-900 flex items-center gap-2">
                  <Sprout className="w-5 h-5 text-[#16883D]" />
                  Treatment, Fertilizer & Plant Care Recommendations
                </h4>
                <p className="text-[11px] text-slate-500 font-medium">
                  Tailored specifically for <strong className="text-slate-900">{recommendations.plantName || report.diseaseName || report.primaryNutrient || report.primaryPest || 'your plant'}</strong> ({recommendations.problemName || report.analysisSummary})
                </p>
              </div>

              {recommendations.followUpTime && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#EAF6E8] text-[#16883D] rounded-xl font-bold text-[11px] shrink-0">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Follow-up: {recommendations.followUpTime}</span>
                </div>
              )}
            </div>

            {/* Grid 1: Treatment & Fertilizer */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Card 1: Treatment Recommendations */}
              {recommendations.treatmentRecommendations && recommendations.treatmentRecommendations.length > 0 && (
                <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100 space-y-2">
                  <h5 className="font-extrabold text-[#16883D] text-xs flex items-center gap-2">
                    <Stethoscope className="w-4 h-4" />
                    <span>1. Treatment Recommendations</span>
                  </h5>
                  <ul className="space-y-2 text-slate-700">
                    {recommendations.treatmentRecommendations.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#16883D] shrink-0 mt-0.5" />
                        <span className="leading-relaxed">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Card 2: Fertilizer & Nutrition */}
              {recommendations.fertilizerRecommendations && recommendations.fertilizerRecommendations.length > 0 && (
                <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100 space-y-2">
                  <h5 className="font-extrabold text-[#16883D] text-xs flex items-center gap-2">
                    <Zap className="w-4 h-4 text-emerald-600" />
                    <span>2. Fertilizer & Nutrition Suggestions</span>
                  </h5>
                  <ul className="space-y-2 text-slate-700">
                    {recommendations.fertilizerRecommendations.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span className="leading-relaxed">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

            </div>

            {/* Grid 2: Plant-Specific Care & Watering */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Card 3: Plant Care Suggestions */}
              {recommendations.plantCareSuggestions && recommendations.plantCareSuggestions.length > 0 && (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <h5 className="font-extrabold text-slate-900 text-xs flex items-center gap-2">
                    <Sprout className="w-4 h-4 text-[#16883D]" />
                    <span>3. Plant Care Suggestions ({recommendations.plantName || 'Specimen'})</span>
                  </h5>
                  <ul className="space-y-2 text-slate-700">
                    {recommendations.plantCareSuggestions.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#16883D] shrink-0 mt-1.5" />
                        <span className="leading-relaxed">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Card 4: Watering Suggestions */}
              {recommendations.wateringSuggestions && recommendations.wateringSuggestions.length > 0 && (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <h5 className="font-extrabold text-slate-900 text-xs flex items-center gap-2">
                    <Droplets className="w-4 h-4 text-sky-600" />
                    <span>4. Watering Suggestions</span>
                  </h5>
                  <ul className="space-y-2 text-slate-700">
                    {recommendations.wateringSuggestions.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-sky-500 shrink-0 mt-1.5" />
                        <span className="leading-relaxed">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

            </div>

            {/* Grid 3: Soil & Environment */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Card 5: Soil Suggestions */}
              {recommendations.soilSuggestions && recommendations.soilSuggestions.length > 0 && (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <h5 className="font-extrabold text-slate-900 text-xs flex items-center gap-2">
                    <Mountain className="w-4 h-4 text-amber-700" />
                    <span>5. Soil & Soil Health Suggestions</span>
                  </h5>
                  <ul className="space-y-2 text-slate-700">
                    {recommendations.soilSuggestions.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-600 shrink-0 mt-1.5" />
                        <span className="leading-relaxed">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Card 6: Environment Suggestions */}
              {recommendations.environmentSuggestions && recommendations.environmentSuggestions.length > 0 && (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <h5 className="font-extrabold text-slate-900 text-xs flex items-center gap-2">
                    <Sun className="w-4 h-4 text-amber-500" />
                    <span>6. Environment & Placement</span>
                  </h5>
                  <ul className="space-y-2 text-slate-700">
                    {recommendations.environmentSuggestions.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 mt-1.5" />
                        <span className="leading-relaxed">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

            </div>

            {/* Grid 4: Prevention & Monitoring */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Card 7: Prevention */}
              {recommendations.preventionSuggestions && recommendations.preventionSuggestions.length > 0 && (
                <div className="p-4 rounded-2xl bg-emerald-50/40 border border-emerald-100 space-y-2">
                  <h5 className="font-extrabold text-slate-900 text-xs flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#16883D]" />
                    <span>7. Prevention & Long-term Care</span>
                  </h5>
                  <ul className="space-y-2 text-slate-700">
                    {recommendations.preventionSuggestions.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#16883D] shrink-0 mt-1.5" />
                        <span className="leading-relaxed">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Card 8: Monitoring Plan */}
              {recommendations.monitoringSuggestions && recommendations.monitoringSuggestions.length > 0 && (
                <div className="p-4 rounded-2xl bg-emerald-50/40 border border-emerald-100 space-y-2">
                  <h5 className="font-extrabold text-slate-900 text-xs flex items-center gap-2">
                    <Eye className="w-4 h-4 text-[#16883D]" />
                    <span>8. Monitoring Plan</span>
                  </h5>
                  <ul className="space-y-2 text-slate-700">
                    {recommendations.monitoringSuggestions.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#16883D] shrink-0 mt-1.5" />
                        <span className="leading-relaxed">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

            </div>

            {/* Important Notes */}
            {recommendations.importantNotes && recommendations.importantNotes.length > 0 && (
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1">
                <strong className="font-bold flex items-center gap-1.5 text-amber-900">
                  <AlertCircle className="w-4 h-4 text-amber-700" />
                  Important Safety & Usage Notes:
                </strong>
                <ul className="list-disc list-inside space-y-1 pl-1 text-amber-800 font-medium">
                  {recommendations.importantNotes.map((note, idx) => (
                    <li key={idx}>{note}</li>
                  ))}
                </ul>
              </div>
            )}

          </div>
        )}

        {/* Bottom Info Banner */}
        <div className="p-3.5 rounded-xl bg-[#EAF6E8] border border-[#EAF6E8] text-[#16883D] text-xs flex items-center gap-2">
          <Info className="w-4 h-4 shrink-0" />
          <span>Your uploaded image will be analyzed by Google Gemini AI to identify potential plant diseases and provide diagnostic findings and care recommendations.</span>
        </div>

      </div>

    </div>
  );
};
