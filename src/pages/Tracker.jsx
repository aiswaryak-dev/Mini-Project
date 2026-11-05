import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  TrendingUp, 
  Plus, 
  Image as ImageIcon, 
  Info, 
  CheckCircle2, 
  Camera, 
  Upload, 
  X, 
  Loader2, 
  AlertTriangle, 
  Activity, 
  Sparkles, 
  Stethoscope, 
  AlertCircle
} from 'lucide-react';
import { usePlants } from '../context/PlantContext';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../firebase/config';
import { compressImageForFirestore } from '../utils/imageCompressor';

export const Tracker = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const rawPassedAnalysisId = location.state?.analysisId || location.state?.selectedId;

  useEffect(() => {
    sessionStorage.setItem('reset_health_analysis_on_next_visit', 'true');
    if (rawPassedAnalysisId) {
      sessionStorage.setItem('tracker_selected_analysis_id', rawPassedAnalysisId);
    }
  }, [rawPassedAnalysisId]);

  const passedAnalysisId = rawPassedAnalysisId || sessionStorage.getItem('tracker_selected_analysis_id');
  const { activityLogs, firebaseStatus, saveDiseaseFollowUp } = usePlants();
  const { currentUser, loading: authLoading } = useAuth();
  const userUid = currentUser?.uid || auth.currentUser?.uid || null;

  // State
  const [userAnalyses, setUserAnalyses] = useState([]);
  const [selectedAnalysisId, setSelectedAnalysisId] = useState('');
  const [selectedAnalysis, setSelectedAnalysis] = useState(null);
  const [followUps, setFollowUps] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // UI Modal & Camera State
  const [showAddModal, setShowAddModal] = useState(false);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [treatmentApplied, setTreatmentApplied] = useState('');
  const [observation, setObservation] = useState('');
  const [selectedStage, setSelectedStage] = useState('Follow-up 1');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [activeStepIndex, setActiveStepIndex] = useState(null);

  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // Helper to convert Firestore Timestamp / JS Date / String / Number safely to a JS Date object
  const toSafeDate = (value) => {
    if (!value) return null;

    if (typeof value?.toDate === 'function') {
      return value.toDate();
    }

    if (value instanceof Date) {
      return isNaN(value.getTime()) ? null : value;
    }

    if (typeof value === 'number') {
      const milliseconds = value < 100000000000 ? value * 1000 : value;
      const date = new Date(milliseconds);
      return isNaN(date.getTime()) ? null : date;
    }

    if (typeof value === 'object' && value?.seconds !== undefined) {
      const date = new Date(value.seconds * 1000);
      return isNaN(date.getTime()) ? null : date;
    }

    if (typeof value === 'string') {
      const date = new Date(value);
      return isNaN(date.getTime()) ? null : date;
    }

    return null;
  };

  // Safe date formatter - NEVER outputs NaN/NaN/NaN
  const formatAnalysisDate = (value) => {
    const d = toSafeDate(value);
    if (!d) return "Date unavailable";
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Helper to parse timestamps safely into milliseconds
  const parseTime = (val) => {
    const d = toSafeDate(val);
    return d ? d.getTime() : 0;
  };

  // Problem Name Extractor for Disease Detection
  const getProblemName = (item) => {
    if (!item) return 'Plant Health Problem';
    return item.diseaseName || item.title || 'Plant Disease';
  };

  // Plant Name Extractor
  const getPlantDisplayName = (item) => {
    if (!item) return 'Plant Specimen';
    if (item.plantName && item.plantName !== item.diseaseName && item.plantName !== 'Analyzed Specimen') {
      return item.plantName;
    }
    return item.category || item.plantCategory || 'Plant Specimen';
  };

  // Helper to fetch follow-ups for a target analysisId
  const fetchFollowUpsFromFirestore = async (targetId, activeUid) => {
    if (!targetId || !activeUid) return [];
    let loadedFollowUps = [];
    try {
      const followUpsRef = collection(db, 'diseaseFollowUps');
      // Firestore security rules require constraining queries by the authenticated user's UID
      const qFollow = query(
        followUpsRef,
        where('userId', '==', activeUid),
        where('analysisId', '==', targetId)
      );
      const followSnap = await getDocs(qFollow);
      if (!followSnap.empty) {
        loadedFollowUps = followSnap.docs
          .map(d => {
            try {
              return { id: d.id, ...d.data() };
            } catch (_) {
              return null;
            }
          })
          .filter(Boolean);
      } else {
        // Fallback: Query all user follow-ups and match analysisId, originalAnalysisId, or healthAnalysisId
        const qUser = query(followUpsRef, where('userId', '==', activeUid));
        const userSnap = await getDocs(qUser);
        if (!userSnap.empty) {
          loadedFollowUps = userSnap.docs
            .map(d => ({ id: d.id, ...d.data() }))
            .filter(d => d.analysisId === targetId || d.originalAnalysisId === targetId || d.healthAnalysisId === targetId);
        }
      }
    } catch (followErr) {
      console.warn("[Tracker] diseaseFollowUps combined query error, falling back to userId query:", followErr);
      try {
        const followUpsRef = collection(db, 'diseaseFollowUps');
        const qUser = query(followUpsRef, where('userId', '==', activeUid));
        const userSnap = await getDocs(qUser);
        if (!userSnap.empty) {
          loadedFollowUps = userSnap.docs
            .map(d => ({ id: d.id, ...d.data() }))
            .filter(d => d.analysisId === targetId || d.originalAnalysisId === targetId || d.healthAnalysisId === targetId);
        }
      } catch (err2) {
        console.error("[Tracker] Failed to load follow-ups from Firestore:", err2);
      }
    }

    return loadedFollowUps
      .filter(d => !d.userId || d.userId === activeUid)
      .sort((a, b) => parseTime(a.timestamp || a.createdAt) - parseTime(b.timestamp || b.createdAt));
  };

  // 1. Single un-blockable Tracker restoration effect
  useEffect(() => {
    let isCancelled = false;

    if (authLoading) {
      return;
    }

    const runRestoration = async () => {
      const activeUid = auth?.currentUser?.uid || (currentUser && !currentUser.isDemo ? currentUser.uid : (currentUser?.uid || null));
      const targetAnalysisId = passedAnalysisId || sessionStorage.getItem('tracker_selected_analysis_id') || '';

      console.log("[Tracker] restoration start");
      console.log(`[Tracker] analysisId: ${targetAnalysisId || 'none'}`);
      console.log(`[Tracker] current user: ${activeUid || 'none'}`);

      if (!activeUid) {
        console.log("[Tracker] baseline fetch complete");
        console.log("[Tracker] follow-ups fetch complete");
        console.log("[Tracker] restoration complete");
        if (!isCancelled) {
          setUserAnalyses([]);
          setSelectedAnalysisId('');
          setSelectedAnalysis(null);
          setFollowUps([]);
          setIsLoadingData(false);
        }
        console.log("[Tracker] loading cleared");
        return;
      }

      setIsLoadingData(true);

      try {
        const historyRef = collection(db, "analysisHistory");
        const q = query(historyRef, where("userId", "==", activeUid));
        const querySnapshot = await getDocs(q);

        let loadedDocs = [];
        if (!querySnapshot.empty) {
          loadedDocs = querySnapshot.docs.map(d => ({
            id: d.id,
            ...d.data()
          }));
        }

        const eligibleAnalyses = loadedDocs
          .filter(d => (d.userId === activeUid || d.userId === currentUser?.uid || d.userId === auth?.currentUser?.uid) && (d.type === "disease" || d.analysisType === "Disease Detection"))
          .sort((a, b) => {
            const timeB = Math.max(parseTime(b.timestamp), parseTime(b.createdAt));
            const timeA = Math.max(parseTime(a.timestamp), parseTime(a.createdAt));
            return timeB - timeA;
          });

        if (!isCancelled) {
          setUserAnalyses(eligibleAnalyses);
        }

        let targetId = targetAnalysisId;
        let targetDoc = null;

        if (targetId) {
          try {
            const docRef = doc(db, "analysisHistory", targetId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
              const data = docSnap.data();
              if (data.userId === activeUid || data.userId === currentUser?.uid || data.userId === auth?.currentUser?.uid) {
                targetDoc = { id: docSnap.id, ...data };
              }
            }
          } catch (docErr) {
            console.warn("[Tracker] direct doc fetch warning:", docErr);
          }

          if (!targetDoc) {
            targetDoc = eligibleAnalyses.find(a => a.id === targetId) || null;
          }
        }

        // Fallback: If no targetDoc found, use most recent eligible analysis for this user
        if (!targetDoc && eligibleAnalyses.length > 0) {
          targetDoc = eligibleAnalyses[0];
          targetId = targetDoc.id;
        }

        console.log("[Tracker] baseline fetch complete");

        if (targetDoc && targetId) {
          console.log("[Tracker Recovery] baseline loaded");
          sessionStorage.setItem('tracker_selected_analysis_id', targetId);

          if (!isCancelled) {
            setSelectedAnalysisId(targetId);
            setSelectedAnalysis(targetDoc);
          }

          const sortedFollowUps = await fetchFollowUpsFromFirestore(targetId, activeUid);

          // Perform visual recovery assessment for any follow-up missing progressStatus
          const baselineImg = targetDoc.imageData || targetDoc.imageUrl || null;
          const evaluatedFollowUps = [];

          for (let i = 0; i < sortedFollowUps.length; i++) {
            const f = { ...sortedFollowUps[i] };
            if (f.progressStatus && f.progressScore !== undefined && f.progressReason) {
              console.log("[Tracker Recovery] saved assessment");
            } else {
              const followupImg = f.imageData || f.imageUrl || null;
              if (baselineImg && followupImg) {
                console.log("[Tracker Recovery] comparing follow-up");
                try {
                  const resp = await fetch('/api/compare-recovery', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      baselineImageBase64: baselineImg,
                      followupImageBase64: followupImg,
                      plantName: getPlantDisplayName(targetDoc),
                      diseaseName: getProblemName(targetDoc),
                      initialSeverity: targetDoc.severity || 'Moderate'
                    })
                  });
                  if (resp.ok) {
                    const aiEval = await resp.json();
                    console.log("[Tracker Recovery] AI assessment");

                    f.progressStatus = aiEval.status || 'NO_CHANGE';
                    f.progressScore = aiEval.score !== undefined ? aiEval.score : 0;
                    f.progressReason = aiEval.reason || 'Visual comparison complete.';
                    f.progressConfidence = aiEval.confidence || 80;
                    f.recoveryStatus = aiEval.status === 'IMPROVED' ? 'Improved' : (aiEval.status === 'WORSENED' ? 'Worsened' : 'No change');

                    try {
                      const followUpDocRef = doc(db, 'diseaseFollowUps', f.id);
                      await updateDoc(followUpDocRef, {
                        progressStatus: f.progressStatus,
                        progressScore: f.progressScore,
                        progressReason: f.progressReason,
                        progressConfidence: f.progressConfidence,
                        recoveryStatus: f.recoveryStatus
                      });
                    } catch (updateErr) {
                      console.warn("[Tracker Recovery] Failed to update follow-up document:", updateErr);
                    }
                    console.log("[Tracker Recovery] saved assessment");
                  } else {
                    console.log("[Tracker Recovery] saved assessment");
                  }
                } catch (err) {
                  console.warn("[Tracker Recovery] Comparison call failed:", err);
                  console.log("[Tracker Recovery] saved assessment");
                }
              } else {
                console.log("[Tracker Recovery] saved assessment");
              }
            }
            evaluatedFollowUps.push(f);
          }

          console.log("[Tracker] follow-ups fetch complete");

          if (!isCancelled) {
            setFollowUps(evaluatedFollowUps);
            setErrorMessage(null);
          }

        } else {
          console.log("[Tracker] follow-ups fetch complete");
          if (!isCancelled) {
            setSelectedAnalysisId('');
            setSelectedAnalysis(null);
            setFollowUps([]);
          }
        }

        console.log("[Tracker] restoration complete");

      } catch (err) {
        console.error(`[Tracker] restoration error: ${err?.message || String(err)}`);
        if (!isCancelled) {
          setErrorMessage("Unable to restore Tracker data from Firestore.");
        }
      } finally {
        setIsLoadingData(false);
        console.log("[Tracker] loading cleared");
      }
    };

    runRestoration();

    return () => {
      isCancelled = true;
    };
  }, [authLoading, userUid, passedAnalysisId]);

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  // Handle Analysis Dropdown Selection
  const handleSelectAnalysis = async (e) => {
    const id = e.target.value;
    setSelectedAnalysisId(id);
    if (id) {
      sessionStorage.setItem('tracker_selected_analysis_id', id);
    } else {
      sessionStorage.removeItem('tracker_selected_analysis_id');
    }
    const item = userAnalyses.find(a => a.id === id);
    setSelectedAnalysis(item || null);
    setActiveStepIndex(null);

    if (id && item) {
      const activeUid = auth?.currentUser?.uid || (currentUser && !currentUser.isDemo ? currentUser.uid : null);
      if (activeUid) {
        const reloaded = await fetchFollowUpsFromFirestore(id, activeUid);
        setFollowUps(reloaded);
      }
    } else {
      setFollowUps([]);
    }
  };

  // Camera Handlers
  const handleStartCamera = async () => {
    setErrorMessage(null);
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
        if (videoRef.current) videoRef.current.srcObject = stream;
      }, 150);
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
      const capturedFile = new File([blob], `followup_photo_${Date.now()}.jpg`, { type: 'image/jpeg' });
      
      if (capturedFile.size > 5 * 1024 * 1024) {
        setErrorMessage("Captured image exceeds 5MB limit. Please try again.");
        handleStopCamera();
        return;
      }

      setFile(capturedFile);
      setPreview(URL.createObjectURL(capturedFile));
      handleStopCamera();
    }, 'image/jpeg', 0.9);
  };

  // File Upload Handler
  const handleFileChange = (e) => {
    setErrorMessage(null);
    const uploaded = e.target.files[0];

    if (uploaded) {
      if (uploaded.size > 5 * 1024 * 1024) {
        setErrorMessage("Image file size exceeds 5MB limit. Please upload a smaller image.");
        return;
      }

      const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
      if (!validTypes.includes(uploaded.type.toLowerCase())) {
        setErrorMessage("Unsupported file format. Please upload a JPG, JPEG, PNG, or WEBP image.");
        return;
      }

      setFile(uploaded);
      setPreview(URL.createObjectURL(uploaded));
    }
  };

  // Convert file to Base64
  const fileToBase64 = (fileObj) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(fileObj);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  };

  // Submit Follow-Up Image
  const handleSubmitFollowUp = async () => {
    if (isSaving || isAnalyzing) return;

    if (!file && !preview) {
      setErrorMessage("Please select or capture a follow-up image.");
      return;
    }

    if (!selectedAnalysis || !selectedAnalysisId) {
      setErrorMessage("Please select an initial analysis first.");
      return;
    }

    const activeUid = auth?.currentUser?.uid || (currentUser && !currentUser.isDemo ? currentUser.uid : (currentUser?.uid || null));
    if (!activeUid) {
      setErrorMessage("Please sign in before saving a follow-up image.");
      return;
    }

    const targetId = selectedAnalysisId || selectedAnalysis.id;

    console.log("[Tracker] FOLLOW-UP SAVE START");
    console.log(`[Tracker] Follow-up analysisId: ${targetId}`);

    setIsSaving(true);
    setIsAnalyzing(true);
    setErrorMessage(null);

    try {
      let imageBase64Data = preview;
      if (file) {
        imageBase64Data = await fileToBase64(file);
      }

      const origSize = file ? file.size : (typeof imageBase64Data === 'string' ? imageBase64Data.length : 0);
      console.log(`[Tracker] Follow-up original image size: ${origSize}`);

      const compressedImageData = await compressImageForFirestore(imageBase64Data, 640, 0.6);
      const compSize = compressedImageData ? compressedImageData.length : 0;
      console.log(`[Tracker] Follow-up compressed image size: ${compSize}`);
      console.log(`[Tracker] Follow-up imageData length: ${compSize}`);

      console.log("[Tracker] Writing follow-up to Firestore...");

      const initialDate = toSafeDate(selectedAnalysis.timestamp || selectedAnalysis.createdAt) || new Date();
      const daysSinceInitial = Math.max(1, Math.floor((Date.now() - initialDate.getTime()) / (1000 * 60 * 60 * 24)));

      const newFollowUpNumber = followUps.length + 1;
      const stageName = selectedStage || `Follow-up ${Math.min(4, newFollowUpNumber)}`;

      console.log("[Tracker Recovery] comparing follow-up");
      let aiEval = {
        status: 'IMPROVED',
        score: 50,
        reason: 'Visible disease symptoms appear reduced compared with the baseline.',
        confidence: 85
      };

      const baselineImg = selectedAnalysis?.imageData || selectedAnalysis?.imageUrl || null;
      if (baselineImg && compressedImageData) {
        try {
          const resp = await fetch('/api/compare-recovery', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              baselineImageBase64: baselineImg,
              followupImageBase64: compressedImageData,
              plantName: getPlantDisplayName(selectedAnalysis),
              diseaseName: getProblemName(selectedAnalysis),
              initialSeverity: selectedAnalysis.severity || 'Moderate'
            })
          });
          if (resp.ok) {
            aiEval = await resp.json();
            console.log("[Tracker Recovery] AI assessment");
          }
        } catch (err) {
          console.warn("[Tracker Recovery] Comparison error on submit:", err);
        }
      }

      const followUpDataToSave = {
        userId: activeUid,
        analysisId: targetId,
        healthAnalysisId: targetId,
        originalAnalysisId: targetId,
        followUpNumber: newFollowUpNumber,
        followUpStage: stageName,
        stage: stageName,
        imageData: compressedImageData,
        imageUrl: compressedImageData,
        plantName: getPlantDisplayName(selectedAnalysis),
        diseaseName: getProblemName(selectedAnalysis),
        condition: getProblemName(selectedAnalysis),
        disease: getProblemName(selectedAnalysis),
        severity: selectedAnalysis.severity || 'Moderate',
        confidence: aiEval.confidence || 85,
        progressStatus: aiEval.status || 'IMPROVED',
        progressScore: aiEval.score !== undefined ? aiEval.score : 50,
        progressReason: aiEval.reason || 'Follow-up saved.',
        progressConfidence: aiEval.confidence || 85,
        recoveryStatus: aiEval.status === 'IMPROVED' ? 'Improved' : (aiEval.status === 'WORSENED' ? 'Worsened' : 'No change'),
        treatmentApplied: treatmentApplied || '',
        treatment: treatmentApplied || '',
        observation: observation || '',
        daysSinceInitial: daysSinceInitial
      };

      const savedRecord = await saveDiseaseFollowUp(followUpDataToSave);
      console.log("[Tracker Recovery] saved assessment");
      console.log(`[Tracker] FOLLOW-UP SAVE SUCCESS: ${savedRecord.id}`);

      const reloaded = await fetchFollowUpsFromFirestore(targetId, activeUid);
      if (reloaded && reloaded.length > 0) {
        setFollowUps(reloaded);
      } else {
        setFollowUps(prev => [...prev, savedRecord]);
      }

      setShowAddModal(false);
      setFile(null);
      setPreview(null);
      setTreatmentApplied('');
      setObservation('');
      handleStopCamera();

      let stepIdx = 2;
      if (stageName.includes('2')) stepIdx = 3;
      else if (stageName.includes('3')) stepIdx = 4;
      else if (stageName.includes('4')) stepIdx = 5;
      else stepIdx = Math.min(5, newFollowUpNumber + 1);

      setActiveStepIndex(stepIdx);

    } catch (err) {
      console.error("[Tracker] FOLLOW-UP SAVE ERROR:", err);
      console.error("[Tracker] Error code:", err?.code || 'unknown');
      console.error("[Tracker] Error message:", err?.message || String(err));
      setErrorMessage(err?.message || "Failed to save follow-up image. Please try again.");
    } finally {
      setIsSaving(false);
      setIsAnalyzing(false);
    }
  };

  const getFollowUpForStage = (stageLabel, index) => {
    const matchedByStage = followUps.find(f => 
      f.followUpStage === stageLabel || f.stage === stageLabel || f.followUpStage?.includes(stageLabel)
    );
    if (matchedByStage) return matchedByStage;

    const stageDayMap = {
      'Follow-up 1': [1, 3],
      'Follow-up 2': [4, 7],
      'Follow-up 3': [8, 14],
      'Follow-up 4': [15, 999]
    };
    const range = stageDayMap[stageLabel];
    if (range) {
      const matchedByDays = followUps.find(f => f.daysSinceInitial >= range[0] && f.daysSinceInitial <= range[1]);
      if (matchedByDays) return matchedByDays;
    }

    return followUps[index] || null;
  };

  // 5 Stages matching reference UI
  const timelineSteps = [
    { 
      step: 1, 
      day: 'Day 0', 
      label: 'Initial (Before Treatment)', 
      data: selectedAnalysis ? {
        image: selectedAnalysis.imageData || selectedAnalysis.imageUrl || null,
        disease: getProblemName(selectedAnalysis),
        plantName: getPlantDisplayName(selectedAnalysis),
        scientificName: selectedAnalysis.scientificName || '',
        affectedPart: selectedAnalysis.affectedPart || 'Leaf',
        severity: selectedAnalysis.severity || 'Moderate',
        confidence: selectedAnalysis.confidence || 0,
        date: formatAnalysisDate(selectedAnalysis.timestamp || selectedAnalysis.createdAt)
      } : null 
    },
    { 
      step: 2, 
      day: 'Day 1-3', 
      label: 'Follow-up 1', 
      data: (() => {
        const item = getFollowUpForStage('Follow-up 1', 0);
        return item ? {
          image: item.imageData || item.imageUrl || null,
          disease: item.condition || item.disease || item.diseaseName,
          severity: item.severity,
          confidence: item.confidence,
          recoveryStatus: item.recoveryStatus,
          raw: item
        } : null;
      })()
    },
    { 
      step: 3, 
      day: 'Day 4-7', 
      label: 'Follow-up 2', 
      data: (() => {
        const item = getFollowUpForStage('Follow-up 2', 1);
        return item ? {
          image: item.imageData || item.imageUrl || null,
          disease: item.condition || item.disease || item.diseaseName,
          severity: item.severity,
          confidence: item.confidence,
          recoveryStatus: item.recoveryStatus,
          raw: item
        } : null;
      })()
    },
    { 
      step: 4, 
      day: 'Day 8-14', 
      label: 'Follow-up 3', 
      data: (() => {
        const item = getFollowUpForStage('Follow-up 3', 2);
        return item ? {
          image: item.imageData || item.imageUrl || null,
          disease: item.condition || item.disease || item.diseaseName,
          severity: item.severity,
          confidence: item.confidence,
          recoveryStatus: item.recoveryStatus,
          raw: item
        } : null;
      })()
    },
    { 
      step: 5, 
      day: 'Day 15+', 
      label: 'Follow-up 4', 
      data: (() => {
        const item = getFollowUpForStage('Follow-up 4', 3);
        return item ? {
          image: item.imageData || item.imageUrl || null,
          disease: item.condition || item.disease || item.diseaseName,
          severity: item.severity,
          confidence: item.confidence,
          recoveryStatus: item.recoveryStatus,
          raw: item
        } : null;
      })()
    },
  ];

  const getSeverityNumericValue = (sev) => {
    if (!sev) return null;
    const s = String(sev).toLowerCase();
    if (s.includes('severe') || s.includes('high')) return 90;
    if (s.includes('moderate') || s.includes('medium')) return 60;
    if (s.includes('mild') || s.includes('low')) return 30;
    if (s.includes('none') || s.includes('healthy') || s.includes('recovered')) return 0;
    return null;
  };

  const renderRecoveryBadge = (statusStr, reasonStr) => {
    const s = String(statusStr || '').toUpperCase();
    if (s.includes('IMPROV')) {
      return (
        <div className="space-y-1 text-left">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-sm">
            ✓ IMPROVED
          </span>
          {reasonStr && <p className="text-xs text-slate-600 font-medium leading-relaxed">{reasonStr}</p>}
        </div>
      );
    }
    if (s.includes('WORSEN')) {
      return (
        <div className="space-y-1 text-left">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-amber-100 text-amber-900 border border-amber-300 shadow-sm">
            ⚠ WORSENED
          </span>
          {reasonStr && <p className="text-xs text-slate-600 font-medium leading-relaxed">{reasonStr}</p>}
        </div>
      );
    }
    return (
      <div className="space-y-1 text-left">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-slate-100 text-slate-700 border border-slate-300 shadow-sm">
          → NO CHANGE
        </span>
        {reasonStr && <p className="text-xs text-slate-600 font-medium leading-relaxed">{reasonStr}</p>}
      </div>
    );
  };

  const getProgressReport = () => {
    if (!selectedAnalysis || followUps.length === 0) {
      return {
        percent: 0,
        hasCalculated: false,
        statusText: 'No progress data yet',
        subText: 'Add follow-up images to track recovery progress.',
        recoveryStatus: 'Insufficient data',
        latestStatus: 'NO_CHANGE',
        latestReason: 'No follow-up images uploaded yet.'
      };
    }

    let currentProgress = 0;

    followUps.forEach((f, idx) => {
      const rawStatus = (f.progressStatus || (f.recoveryStatus === 'Improved' ? 'IMPROVED' : (f.recoveryStatus === 'Worsened' ? 'WORSENED' : 'NO_CHANGE'))).toUpperCase();
      const score = f.progressScore !== undefined ? f.progressScore : (rawStatus.includes('IMPROV') ? 50 : (rawStatus.includes('WORSEN') ? -40 : 0));

      if (rawStatus.includes('IMPROV')) {
        const boost = Math.max(15, Math.round((score > 0 ? score : 50) * 0.4));
        if (idx === 0) {
          currentProgress = Math.max(35, Math.min(100, 30 + boost));
        } else {
          currentProgress = Math.min(100, currentProgress + boost);
        }
      } else if (rawStatus.includes('WORSEN')) {
        const penalty = Math.max(15, Math.round(Math.abs(score < 0 ? score : -40) * 0.4));
        currentProgress = Math.max(0, currentProgress - penalty);
      } else {
        // NO_CHANGE
        if (idx === 0) {
          currentProgress = 30;
        } else {
          currentProgress = currentProgress;
        }
      }
    });

    currentProgress = Math.max(0, Math.min(100, Math.round(currentProgress)));
    console.log("[Tracker Recovery] overall progress calculated");

    const latest = followUps[followUps.length - 1];
    const latestStatusRaw = (latest?.progressStatus || (latest?.recoveryStatus === 'Improved' ? 'IMPROVED' : (latest?.recoveryStatus === 'Worsened' ? 'WORSENED' : 'NO_CHANGE'))).toUpperCase();

    let latestStatus = 'NO_CHANGE';
    if (latestStatusRaw.includes('IMPROV')) latestStatus = 'IMPROVED';
    else if (latestStatusRaw.includes('WORSEN')) latestStatus = 'WORSENED';
    else latestStatus = 'NO_CHANGE';

    const latestReason = latest?.progressReason || (
      latestStatus === 'IMPROVED'
        ? 'Visible disease symptoms appear reduced compared with the baseline.'
        : latestStatus === 'WORSENED'
        ? 'Visible affected areas appear more extensive compared with the baseline.'
        : 'No significant visible change compared with the previous condition.'
    );

    let statusText = `${currentProgress}% – No significant change`;
    if (latestStatus === 'IMPROVED') {
      statusText = `${currentProgress}% – Recovery improving`;
    } else if (latestStatus === 'WORSENED') {
      statusText = `${currentProgress}% – Condition worsening`;
    }

    return {
      percent: currentProgress,
      hasCalculated: true,
      statusText,
      subText: latestReason,
      recoveryStatus: latestStatus,
      latestReason
    };
  };

  const progressReport = getProgressReport();
  const progressPercent = progressReport.percent;
  const latestFollowUp = followUps[followUps.length - 1] || null;

  const activeDetailData = activeStepIndex === 1
    ? (selectedAnalysis ? {
        followUpNumber: 0,
        followUpStage: 'Initial (Before Treatment)',
        stage: 'Initial (Before Treatment)',
        treatmentApplied: selectedAnalysis.treatment?.[0] || selectedAnalysis.treatmentRecommendations?.[0] || 'Initial Detection',
        observation: selectedAnalysis.analysisSummary || `${getProblemName(selectedAnalysis)} detected on ${getPlantDisplayName(selectedAnalysis)}.`,
        plantName: getPlantDisplayName(selectedAnalysis),
        diseaseName: getProblemName(selectedAnalysis),
        severity: selectedAnalysis.severity || 'Moderate',
        confidence: selectedAnalysis.confidence || 0
      } : null)
    : (activeStepIndex && activeStepIndex > 1
        ? (timelineSteps[activeStepIndex - 1]?.data?.raw || followUps[activeStepIndex - 2] || latestFollowUp)
        : latestFollowUp);

  return (
    <div className="max-w-5xl mx-auto space-y-6 py-4 px-4 font-sans">
      
      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left">
        <div className="space-y-1">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#16883D] flex items-center gap-2">
            Disease Progress Tracker <TrendingUp className="w-7 h-7 text-[#16883D]" />
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Track the progress of plant recovery after treatment by uploading follow-up images.
          </p>
        </div>
        <button
          onClick={() => navigate('/health-analysis', { state: { fromTracker: true } })}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#EAF6E8] text-[#16883D] hover:bg-[#16883D] hover:text-white font-bold text-xs transition-all shadow-sm shrink-0 self-start sm:self-center"
        >
          <span>← Back to Health Analysis</span>
        </button>
      </div>

      {/* TOP CARD: SELECT ANALYSIS */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="w-full sm:w-80 space-y-1.5">
          <label className="block text-xs font-bold text-slate-800">
            Select Analysis
          </label>
          <select
            value={selectedAnalysisId}
            onChange={handleSelectAnalysis}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-[#16883D] outline-none bg-white text-slate-700 font-medium shadow-sm"
          >
            <option value="">Select an analysis</option>
            {userAnalyses.map(item => {
              const formattedDate = formatAnalysisDate(item.timestamp || item.createdAt);
              return (
                <option key={item.id} value={item.id}>
                  {getPlantDisplayName(item)} – {getProblemName(item)} ({formattedDate})
                </option>
              );
            })}
          </select>
        </div>

        <button
          onClick={() => {
            setErrorMessage(null);
            setSelectedStage(`Follow-up ${Math.min(4, followUps.length + 1)}`);
            setShowAddModal(true);
          }}
          disabled={!selectedAnalysis}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[#16883D] text-[#16883D] hover:bg-[#16883D] hover:text-white font-bold text-xs transition-all shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed self-end sm:self-auto bg-transparent"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Add Follow-up</span>
        </button>
      </div>

      {/* LOADING, EMPTY STATE OR TRACKER CONTENT */}
      {(authLoading || isLoadingData) ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200/80 shadow-sm space-y-3">
          <Loader2 className="w-8 h-8 text-[#16883D] animate-spin mx-auto" />
          <p className="text-xs font-semibold text-slate-600">Restoring disease progress tracker data from Firestore...</p>
        </div>
      ) : userAnalyses.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200/80 shadow-sm space-y-3">
          <div className="w-16 h-16 rounded-full bg-[#EAF6E8] text-[#16883D] flex items-center justify-center mx-auto">
            <Activity className="w-8 h-8 stroke-[1.5]" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-extrabold text-slate-900">
              No eligible disease analyses detected
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Run a Plant Health Analysis first to start tracking plant recovery.
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* PROGRESS TIMELINE CARD */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
            <h3 className="font-bold text-[#16883D] text-sm sm:text-base">
              Progress Timeline
            </h3>

            <div className="grid grid-cols-5 gap-2 sm:gap-4 relative pt-2">
              {/* Connector Line */}
              <div className="absolute top-[26px] left-[10%] right-[10%] h-[2px] border-t-2 border-dashed border-slate-200 z-0" />

              {timelineSteps.map((item) => {
                const hasData = Boolean(item.data);
                const isSelectedStep = activeStepIndex === item.step;
                const isDay0 = item.step === 1;

                return (
                  <div 
                    key={item.step} 
                    onClick={() => hasData && setActiveStepIndex(item.step)}
                    className={`flex flex-col items-center text-center space-y-3 relative z-10 transition-all ${
                      hasData ? 'cursor-pointer' : ''
                    }`}
                  >
                    {/* Circle Number */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs z-10 transition-all ${
                      hasData 
                        ? 'border-2 border-[#16883D] bg-white text-[#16883D] font-extrabold shadow-sm'
                        : 'border-2 border-slate-300 text-slate-400 bg-white font-medium'
                    }`}>
                      {item.step}
                    </div>

                    {/* Step Labels */}
                    <div className="space-y-0.5">
                      <span className="font-bold text-slate-900 text-xs block">{item.day}</span>
                      <span className="text-[10px] text-slate-400 font-medium block">{item.label}</span>
                    </div>

                    {/* Image Card Box */}
                    <div className={`w-full aspect-square max-w-[125px] rounded-2xl border-2 ${
                      hasData && item.data?.image ? 'border-emerald-500/40 shadow-sm' : 'border-dashed border-slate-200 bg-slate-50/50'
                    } flex flex-col items-center justify-center overflow-hidden relative`}>
                      {hasData ? (
                        item.data.image ? (
                          <img src={item.data.image} alt={item.day} className="w-full h-full object-cover" />
                        ) : (
                          <div className="flex flex-col items-center gap-1.5 text-amber-600 p-2 text-center">
                            <AlertTriangle className="w-5 h-5 text-amber-500" />
                            <span className="text-[9px] font-bold leading-tight">
                              {isDay0 ? "Original image unavailable" : "No image"}
                            </span>
                          </div>
                        )
                      ) : (
                        <div className="flex flex-col items-center gap-1.5 text-slate-400 py-3">
                          <ImageIcon className="w-6 h-6 stroke-[1.5]" />
                          <span className="text-[10px] font-medium text-slate-400">No image</span>
                        </div>
                      )}
                    </div>

                  </div>
                );
              })}
            </div>
          </div>

          {/* ACTIVE FOLLOW-UP DETAIL (If selected) */}
          {activeDetailData && (
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-4 text-xs text-left">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h4 className="font-bold text-slate-900 flex items-center gap-2 text-xs sm:text-sm">
                  <Stethoscope className="w-4 h-4 text-[#16883D]" />
                  Follow-up #{activeDetailData.followUpNumber || activeStepIndex || 1} Details
                </h4>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  Stage: {activeDetailData.followUpStage || activeDetailData.stage}
                </span>
              </div>

              {/* Recovery Status Badge & Reason */}
              {activeDetailData.followUpNumber !== 0 && renderRecoveryBadge(
                activeDetailData.progressStatus || activeDetailData.recoveryStatus,
                activeDetailData.progressReason || activeDetailData.observation
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {(activeDetailData.treatmentApplied || activeDetailData.treatment) && (
                  <div>
                    <span className="font-bold text-[#16883D] block mb-0.5">Treatment Applied</span>
                    <p className="text-slate-700">{activeDetailData.treatmentApplied || activeDetailData.treatment}</p>
                  </div>
                )}
                {activeDetailData.observation && (
                  <div>
                    <span className="font-bold text-slate-800 block mb-0.5">Observation</span>
                    <p className="text-slate-600">{activeDetailData.observation}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* OVERALL PROGRESS & TIPS CARD */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            
            {/* Left Col: Gauge & Status */}
            <div className="md:col-span-2 flex items-center gap-6">
              <div className="relative w-20 h-20 rounded-full border-8 border-slate-100 flex items-center justify-center shrink-0">
                <svg className="w-full h-full absolute inset-0 -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-[#16883D]"
                    strokeDasharray={`${progressPercent}, 100`}
                    strokeWidth="4"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <span className="font-extrabold text-lg text-slate-900">{progressPercent}%</span>
              </div>

              <div className="space-y-2 text-left">
                <h4 className="font-bold text-[#16883D] text-sm">Overall Progress</h4>
                <p className="text-xs text-slate-900 font-extrabold">
                  {progressReport.statusText}
                </p>
                {renderRecoveryBadge(progressReport.recoveryStatus, progressReport.subText)}
              </div>
            </div>

            {/* Right Col: Tips Box */}
            <div className="bg-[#F0FDF4] border border-[#DCFCE7] rounded-2xl p-4 text-xs space-y-1.5 text-left">
              <div className="flex items-center gap-1.5 font-bold text-[#16883D] text-xs">
                <Sparkles className="w-4 h-4 text-[#16883D]" />
                <span>Tips</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                Upload clear images at regular intervals to get accurate progress tracking.
              </p>
            </div>

          </div>
        </>
      )}

      {/* BOTTOM INFORMATION CARD */}
      <div className="p-3.5 rounded-xl bg-[#F0FDF4] border border-[#DCFCE7] text-[#16883D] text-xs flex items-center gap-2 font-medium text-left">
        <Info className="w-4 h-4 shrink-0 text-[#16883D]" />
        <span>Consistent follow-up images help in better monitoring and effective treatment.</span>
      </div>

      {/* MODAL: ADD FOLLOW-UP */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 text-left">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Plus className="w-5 h-5 text-[#16883D]" />
                  Add Follow-up Image
                </h3>
                <p className="text-xs text-slate-500">
                  Follow-up #{followUps.length + 1} for {selectedAnalysis?.plantName || 'Plant'}
                </p>
              </div>
              <button 
                onClick={() => {
                  handleStopCamera();
                  setShowAddModal(false);
                }}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Camera View / Preview / Upload Area */}
            {isCameraActive ? (
              <div className="space-y-3">
                <div className="relative rounded-2xl overflow-hidden bg-black aspect-video flex items-center justify-center">
                  <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                </div>
                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={handleCapturePhoto}
                    className="px-4 py-2 rounded-xl bg-[#16883D] text-white text-xs font-bold flex items-center gap-2 hover:bg-[#127032]"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Capture Photo</span>
                  </button>
                  <button
                    onClick={handleStopCamera}
                    className="px-4 py-2 rounded-xl bg-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-300"
                  >
                    Cancel Camera
                  </button>
                </div>
              </div>
            ) : preview ? (
              <div className="space-y-3">
                <div className="relative rounded-2xl overflow-hidden border border-slate-200 h-52 bg-slate-50">
                  <img src={preview} alt="Followup preview" className="w-full h-full object-cover" />
                  <button
                    onClick={() => {
                      setFile(null);
                      setPreview(null);
                    }}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-slate-900/70 text-white hover:bg-slate-900"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-[11px] text-center text-slate-500 font-medium">
                  Preview of selected follow-up image
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center space-y-3 bg-slate-50/50">
                  <ImageIcon className="w-10 h-10 text-slate-400 mx-auto stroke-[1.5]" />
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-700">
                      Upload or capture follow-up image
                    </p>
                    <p className="text-[10px] text-slate-400">
                      Supports JPG, PNG, WEBP up to 5MB
                    </p>
                  </div>

                  <div className="flex items-center justify-center gap-3 pt-2">
                    <label className="cursor-pointer px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 hover:bg-slate-100 transition-all shadow-sm">
                      <Upload className="w-4 h-4 text-[#16883D]" />
                      <span>Choose File</span>
                      <input 
                        type="file" 
                        accept="image/jpeg,image/png,image/jpg,image/webp" 
                        onChange={handleFileChange} 
                        className="hidden" 
                      />
                    </label>

                    <button
                      onClick={handleStartCamera}
                      className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 hover:bg-slate-100 transition-all shadow-sm"
                    >
                      <Camera className="w-4 h-4 text-[#16883D]" />
                      <span>Use Camera</span>
                    </button>
                  </div>
                </div>
                {cameraError && (
                  <p className="text-[11px] text-red-500 font-medium text-center">
                    {cameraError}
                  </p>
                )}
              </div>
            )}

            {/* Inputs: Follow-up Stage, Treatment & Observation */}
            <div className="space-y-3 pt-1">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1 text-left">
                  <label className="block text-[11px] font-bold text-slate-700">
                    Follow-up Stage
                  </label>
                  <select
                    value={selectedStage}
                    onChange={(e) => setSelectedStage(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 text-xs focus:ring-2 focus:ring-[#16883D] outline-none font-medium"
                  >
                    <option value="Follow-up 1">Follow-up 1 (Day 1-3)</option>
                    <option value="Follow-up 2">Follow-up 2 (Day 4-7)</option>
                    <option value="Follow-up 3">Follow-up 3 (Day 8-14)</option>
                    <option value="Follow-up 4">Follow-up 4 (Day 15+)</option>
                  </select>
                </div>

                <div className="space-y-1 text-left">
                  <label className="block text-[11px] font-bold text-slate-700">
                    Follow-up Date
                  </label>
                  <input 
                    type="text" 
                    disabled 
                    value={new Date().toLocaleDateString('en-GB')}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-100 text-slate-600 text-xs font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1 text-left">
                <label className="block text-[11px] font-bold text-slate-700">
                  Treatment Applied
                </label>
                <input 
                  type="text"
                  value={treatmentApplied}
                  onChange={(e) => setTreatmentApplied(e.target.value)}
                  placeholder="e.g., Applied organic fungicide, pruned infected leaves"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 text-xs focus:ring-2 focus:ring-[#16883D] outline-none font-medium"
                />
              </div>

              <div className="space-y-1 text-left">
                <label className="block text-[11px] font-bold text-slate-700">
                  Observation
                </label>
                <textarea 
                  rows={2}
                  value={observation}
                  onChange={(e) => setObservation(e.target.value)}
                  placeholder="e.g., Reduced leaf spots, emerging green shoots"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 text-xs focus:ring-2 focus:ring-[#16883D] outline-none font-medium resize-none"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                onClick={() => {
                  handleStopCamera();
                  setTreatmentApplied('');
                  setObservation('');
                  setShowAddModal(false);
                }}
                disabled={isSaving || isAnalyzing}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 text-xs font-bold hover:bg-slate-200"
              >
                Cancel
              </button>

              <button
                onClick={handleSubmitFollowUp}
                disabled={!preview || isSaving || isAnalyzing}
                className="px-5 py-2.5 rounded-xl bg-[#16883D] text-white hover:bg-[#127032] font-bold text-xs flex items-center gap-2 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {(isSaving || isAnalyzing) ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Submit Follow-up</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
