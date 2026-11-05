import React, { useState, useRef, useEffect } from 'react';
import { Search, Upload, CheckCircle, Info, ArrowRight, Leaf, Flower2, Apple, Sprout, Sparkles, Loader2, AlertCircle, AlertTriangle, Camera, X } from 'lucide-react';
import { usePlants } from '../context/PlantContext';

export const Identification = () => {
  const { selectedCategory, saveIdentificationAnalysis } = usePlants();
  const [selectedPart, setSelectedPart] = useState('Leaf');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [lowConfidenceNotice, setLowConfidenceNotice] = useState(null);
  const [invalidPlantNotice, setInvalidPlantNotice] = useState(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);

  const videoRef = useRef(null);
  const streamRef = useRef(null);

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
      const capturedFile = new File([blob], `plant_photo_${Date.now()}.jpg`, { type: 'image/jpeg' });

      if (capturedFile.size > 5 * 1024 * 1024) {
        setErrorMessage("Captured image exceeds 5MB limit. Please try again.");
        handleStopCamera();
        return;
      }

      setFile(capturedFile);
      setPreview(URL.createObjectURL(capturedFile));
      setResult(null);
      handleStopCamera();
    }, 'image/jpeg', 0.9);
  };

  const handleFileChange = (e) => {
    setErrorMessage(null);
    setLowConfidenceNotice(null);
    setInvalidPlantNotice(null);

    const uploaded = e.target.files[0];
    if (uploaded) {
      // Validate file size (max 5 MB)
      if (uploaded.size > 5 * 1024 * 1024) {
        setErrorMessage("Image file size exceeds 5MB limit. Please upload a smaller image.");
        return;
      }

      // Validate file format (JPG, JPEG, PNG)
      const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
      if (!validTypes.includes(uploaded.type.toLowerCase())) {
        setErrorMessage("Unsupported file format. Please upload a JPG, JPEG, or PNG image.");
        return;
      }

      setFile(uploaded);
      setPreview(URL.createObjectURL(uploaded));
      setResult(null);
    }
  };

  const handleRunIdentification = () => {
    if (!file || isAnalyzing) return;

    console.log("[Plant Identification] Request started");
    setIsAnalyzing(true);
    setResult(null);
    setErrorMessage(null);
    setLowConfidenceNotice(null);
    setInvalidPlantNotice(null);

    const reader = new FileReader();
    reader.onload = async () => {
      const base64Data = reader.result;
      console.log("[Plant Identification] Image prepared");
      try {
        const response = await fetch('/api/identify-plant', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: base64Data,
            mimeType: file.type || 'image/jpeg',
            selectedPart,
            category: selectedCategory || 'Garden Plants'
          })
        });

        const data = await response.json();
        console.log("[Plant Identification] API response received", data);

        if (!response.ok) {
          throw new Error(data.error || 'Identification API call failed');
        }

        console.log("[Plant Identification] Parsed result", data);
        setIsAnalyzing(false);

        if (data.isPlant === false) {
          setInvalidPlantNotice("No plant detected. Please upload a clear image of a plant.");
          return;
        }

        if (data.confidence < 60) {
          setLowConfidenceNotice("Identification is uncertain. Please upload a clearer image of the leaf, flower, fruit, or whole plant.");
          setResult(data);
          return;
        }

        setResult(data);

        // Save identification analysis to Firebase Firestore
        await saveIdentificationAnalysis({
          file,
          imageData: base64Data,
          plantName: data.plantName || data.name,
          scientificName: data.scientificName,
          commonNames: data.commonNames || data.commonName,
          family: data.family,
          confidence: data.confidence,
          description: data.description,
          uses: data.uses,
          careInstructions: data.careInstructions || data.careSummary,
          selectedPart,
          category: selectedCategory || 'Garden Plants',
          imageUrl: preview
        });

      } catch (err) {
        console.error("[Plant Identification] AI identification error:", err);
        setIsAnalyzing(false);
        setErrorMessage(err.message || "Unable to identify the plant right now. Please try again.");
      }
    };

    reader.onerror = () => {
      setIsAnalyzing(false);
      setErrorMessage("Unable to read the image file. Please try again.");
    };

    reader.readAsDataURL(file);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-6 px-4">

      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EAF6E8] text-[#16883D] text-[11px] font-bold mb-1">
          <span>Active Category:</span>
          <span className="underline">{selectedCategory || 'Garden Plants'}</span>
        </div>
        <h2 className="text-3xl font-extrabold text-slate-900 flex items-center justify-center gap-2">
          Plant Identification <Search className="w-7 h-7 text-[#16883D]" />
        </h2>
        <p className="text-xs font-semibold text-slate-500">
          Upload an image of a leaf, flower, fruit or whole plant to identify it using AI.
        </p>
      </div>

      {/* Main Card Container */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm space-y-6">

        <h3 className="font-bold text-slate-900 text-base">Upload Plant Image</h3>

        {/* Top Grid: Drag & Drop / Camera + Tips */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* Left 2 Cols: Dashed Upload / Camera Box */}
          <div className="md:col-span-2 border-2 border-dashed border-emerald-300/80 rounded-2xl p-6 text-center bg-slate-50/50 flex flex-col items-center justify-center min-h-[200px] relative">
            {preview ? (
              <div className="relative w-full h-44 rounded-xl overflow-hidden">
                <img src={preview} alt="Upload preview" className="w-full h-full object-cover" />
                <button
                  onClick={() => { setFile(null); setPreview(null); setResult(null); setErrorMessage(null); setLowConfidenceNotice(null); setInvalidPlantNotice(null); }}
                  className="absolute top-2 right-2 px-2 py-1 bg-black/60 hover:bg-black/80 text-white rounded text-[10px] font-bold transition-all"
                >
                  Change Image
                </button>
              </div>
            ) : isCameraActive ? (
              <div className="relative w-full h-44 rounded-xl overflow-hidden bg-slate-900 flex flex-col items-center justify-center">
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
                <div className="w-12 h-12 rounded-full bg-[#EAF6E8] text-[#16883D] flex items-center justify-center mb-3">
                  <Upload className="w-6 h-6 stroke-[2.5]" />
                </div>
                <p className="text-xs font-semibold text-slate-700 mb-1">
                  Drag and drop an image here
                </p>
                <span className="text-[11px] text-slate-400 mb-3">or</span>

                <div className="flex flex-wrap items-center justify-center gap-2">
                  <label className="cursor-pointer px-4 py-2 rounded-xl bg-[#16883D] hover:bg-[#127132] text-white text-xs font-bold transition-all shadow-sm active:scale-95 flex items-center gap-1.5">
                    <span>Choose Image</span>
                    <input type="file" accept="image/png, image/jpeg, image/jpg" onChange={handleFileChange} className="hidden" />
                  </label>

                  <button
                    type="button"
                    onClick={handleStartCamera}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-sm active:scale-95 flex items-center gap-1.5"
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

                <p className="text-[10px] text-slate-400 mt-3">
                  Supported formats: JPG, PNG, JPEG (Max size: 5MB)
                </p>
              </>
            )}
          </div>

          {/* Right Col: Tips Box */}
          <div className="bg-[#EAF6E8]/70 border border-[#EAF6E8] rounded-2xl p-4 text-xs space-y-3">
            <h4 className="font-bold text-[#16883D] flex items-center gap-1.5 text-xs">
              💡 Tips for better results
            </h4>

            <ul className="space-y-2 text-[11px] text-[#063D24]">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-[#16883D] shrink-0 mt-0.5" />
                <span>Upload clear and high-quality images.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-[#16883D] shrink-0 mt-0.5" />
                <span>Ensure the plant is well-lit.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-[#16883D] shrink-0 mt-0.5" />
                <span>Capture the whole plant or relevant parts.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-[#16883D] shrink-0 mt-0.5" />
                <span>Avoid blurry or dark images.</span>
              </li>
            </ul>
          </div>

        </div>


        {/* Identify Plant Action Button */}
        <div>
          <button
            onClick={handleRunIdentification}
            disabled={isAnalyzing || !file}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 shadow-sm active:scale-95 ${isAnalyzing
              ? 'bg-slate-300 text-slate-600 cursor-not-allowed'
              : file
                ? 'bg-[#16883D] hover:bg-[#127132] text-white'
                : 'bg-slate-200 text-slate-500 cursor-not-allowed'
              }`}
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Analyzing plant image...</span>
              </>
            ) : (
              <>
                <span>Identify Plant</span>
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
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2 font-medium">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
            <span>{invalidPlantNotice}</span>
          </div>
        )}

        {/* Low Confidence Notice */}
        {lowConfidenceNotice && (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs space-y-1">
            <div className="flex items-center gap-2 font-bold">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
              <span>{lowConfidenceNotice}</span>
            </div>
          </div>
        )}

        {/* AI Analysis Results Box (High Confidence >= 60%) */}
        {result && result.confidence >= 60 && (
          <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-emerald-200/80 pb-3">
              <div>
                <span className="text-[10px] font-bold text-[#16883D] uppercase tracking-wider block">Plant Identified</span>
                <h4 className="font-extrabold text-lg text-slate-900 flex items-center gap-2 mt-0.5">
                  <Sparkles className="w-5 h-5 text-[#16883D]" />
                  {result.plantName || result.name}
                </h4>
              </div>
              <span className="px-3 py-1 rounded-full bg-[#16883D] text-white font-extrabold text-xs shadow-sm">
                {result.confidence}% Match
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-700">
              <div className="bg-white/70 p-2.5 rounded-xl border border-emerald-100">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Scientific Name</span>
                <span className="font-bold text-slate-900 text-xs italic">{result.scientificName}</span>
              </div>
              <div className="bg-white/70 p-2.5 rounded-xl border border-emerald-100">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Family</span>
                <span className="font-bold text-slate-900 text-xs">{result.family}</span>
              </div>
              {result.description && (
                <div className="sm:col-span-2 bg-white/70 p-2.5 rounded-xl border border-emerald-100">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block mb-0.5">Description</span>
                  <span className="text-slate-800 font-medium leading-relaxed">{result.description}</span>
                </div>
              )}
              {result.uses && (
                <div className="sm:col-span-2 bg-white/70 p-2.5 rounded-xl border border-emerald-100">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block mb-0.5">Uses</span>
                  <span className="text-slate-800 font-medium leading-relaxed">{result.uses}</span>
                </div>
              )}
            </div>

            {(result.careInstructions || result.careSummary) && (
              <div className="pt-2 border-t border-emerald-200">
                <strong className="text-slate-900 block mb-0.5 font-bold">Care Instructions:</strong>
                <span className="text-slate-700 leading-relaxed font-medium">{result.careInstructions || result.careSummary}</span>
              </div>
            )}
          </div>
        )}

        {/* Bottom Green Info Banner */}
        <div className="p-3.5 rounded-xl bg-[#EAF6E8] border border-[#EAF6E8] text-[#16883D] text-xs flex items-center gap-2">
          <Info className="w-4 h-4 shrink-0" />
          <span>Our Gemini AI model analyzes your image to identify the plant species, scientific details, family classification, uses and care instructions.</span>
        </div>

      </div>

    </div>
  );
};
