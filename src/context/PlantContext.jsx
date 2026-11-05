import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp,
  query,
  orderBy
} from 'firebase/firestore';
import { auth, db, storage } from '../firebase/config';
import { ref, uploadBytes, uploadString, getDownloadURL } from 'firebase/storage';
import { useAuth } from './AuthContext';
import { compressImageForFirestore } from '../utils/imageCompressor';


const PlantContext = createContext();

export const usePlants = () => useContext(PlantContext);

// Initial curated plant data for rich visual demonstration
const INITIAL_PLANTS = [
  {
    id: 'plant-1',
    name: 'Monstera Deliciosa',
    species: 'Swiss Cheese Plant',
    category: 'Indoor',
    location: 'Living Room Corner',
    moisture: 42,
    moistureMin: 35,
    light: 650, // lux rating
    temp: 22.5, // °C
    humidity: 58, // %
    pH: 6.4,
    status: 'Optimal', // Optimal, Needs Water, High Temp, Alert
    lastWatered: new Date(Date.now() - 36 * 3600 * 1000).toISOString(),
    autoWater: true,
    image: 'https://images.unsplash.com/photo-1614594975525-e45190c55d0b?auto=format&fit=crop&q=80&w=600',
    notes: 'Thriving near bright indirect sunlight. Spray leaves weekly.'
  },
  {
    id: 'plant-2',
    name: 'Ficus Lyrata',
    species: 'Fiddle Leaf Fig',
    category: 'Indoor',
    location: 'Balcony Doorway',
    moisture: 28,
    moistureMin: 30,
    light: 820,
    temp: 24.1,
    humidity: 45,
    pH: 6.2,
    status: 'Needs Water',
    lastWatered: new Date(Date.now() - 72 * 3600 * 1000).toISOString(),
    autoWater: true,
    image: 'https://images.unsplash.com/photo-1545241047-6083a3684587?auto=format&fit=crop&q=80&w=600',
    notes: 'Sensitive to drafts. Needs moisture replenishment soon.'
  },
  {
    id: 'plant-3',
    name: 'Sansevieria Trifasciata',
    species: 'Snake Plant / Mother-in-Law Tongue',
    category: 'Indoor',
    location: 'Bedroom Shelf',
    moisture: 65,
    moistureMin: 20,
    light: 310,
    temp: 21.0,
    humidity: 50,
    pH: 6.8,
    status: 'Optimal',
    lastWatered: new Date(Date.now() - 120 * 3600 * 1000).toISOString(),
    autoWater: false,
    image: 'https://images.unsplash.com/photo-1599598425947-020645161044?auto=format&fit=crop&q=80&w=600',
    notes: 'Extremely drought tolerant. Purifies air.'
  },
  {
    id: 'plant-4',
    name: 'Calathea Orbifolia',
    species: 'Peacock Plant',
    category: 'Greenhouse',
    location: 'Humid Terrace',
    moisture: 32,
    moistureMin: 40,
    light: 450,
    temp: 23.8,
    humidity: 72,
    pH: 6.1,
    status: 'Alert',
    lastWatered: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
    autoWater: true,
    image: 'https://images.unsplash.com/photo-1592150621744-aca64f48394a?auto=format&fit=crop&q=80&w=600',
    notes: 'Requires high humidity. Edge crisping detected.'
  },
  {
    id: 'plant-5',
    name: 'Epipremnum Aureum',
    species: 'Golden Pothos',
    category: 'Balcony',
    location: 'Hanging Basket',
    moisture: 55,
    moistureMin: 25,
    light: 710,
    temp: 25.0,
    humidity: 52,
    pH: 6.5,
    status: 'Optimal',
    lastWatered: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    autoWater: true,
    image: 'https://images.unsplash.com/photo-1596724817763-9216d4590d59?auto=format&fit=crop&q=80&w=600',
    notes: 'Fast growing vine. Trailing nicely.'
  }
];

const INITIAL_LOGS = [];

export const PlantProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const [plants, setPlants] = useState(INITIAL_PLANTS);
  const [activityLogs, setActivityLogs] = useState(INITIAL_LOGS);
  const [reservoirLevel, setReservoirLevel] = useState(78); // Water reservoir %
  const [isPumpActive, setIsPumpActive] = useState(false);
  const [autoIrrigationEnabled, setAutoIrrigationEnabled] = useState(true);
  const [firebaseStatus, setFirebaseStatus] = useState('connecting'); // connected, offline, demo
  const [selectedPlant, setSelectedPlant] = useState(null);
  const [simulationActive, setSimulationActive] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Firestore Real-Time Listener & Sync
  useEffect(() => {
    let unsubscribePlants = () => {};
    let unsubscribeLogs = () => {};

    try {
      const plantsCol = collection(db, 'plants');
      const qPlants = query(plantsCol);

      unsubscribePlants = onSnapshot(qPlants, (snapshot) => {
        if (!snapshot.empty) {
          const loaded = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setPlants(loaded);
          setFirebaseStatus('connected');
        } else {
          // Store initial plants to Firestore if empty
          INITIAL_PLANTS.forEach(async (p) => {
            try {
              const { id, ...data } = p;
              await addDoc(collection(db, 'plants'), {
                ...data,
                userId: currentUser?.uid || 'public',
                createdAt: serverTimestamp()
              });
            } catch (err) {
              console.warn("Firestore addDoc error:", err);
            }
          });
          setFirebaseStatus('connected');
        }
      }, (error) => {
        console.warn("Firestore listener fallback to local mode:", error);
        setFirebaseStatus('demo');
      });

      const logsCol = collection(db, 'activity_logs');
      const qLogs = query(logsCol, orderBy('timestamp', 'desc'));
      unsubscribeLogs = onSnapshot(qLogs, (snapshot) => {
        if (!snapshot.empty) {
          const loadedLogs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setActivityLogs(loadedLogs);
        }
      }, () => {});

    } catch (e) {
      console.warn("Firebase Firestore connection error, using local reactive state:", e);
      setFirebaseStatus('demo');
    }

    return () => {
      unsubscribePlants();
      unsubscribeLogs();
    };
  }, [currentUser]);

  // IoT Sensor Telemetry Simulation Engine (Live moisture decay & auto watering check)
  useEffect(() => {
    if (!simulationActive) return;

    const interval = setInterval(() => {
      setPlants((prevPlants) => {
        return prevPlants.map((plant) => {
          // Decay moisture slightly over time (0.2% - 0.8% per heartbeat)
          const decay = (Math.random() * 0.5 + 0.1);
          let newMoisture = Math.max(10, Math.round((plant.moisture - decay) * 10) / 10);
          
          // Random slight fluctuation in light and temp
          const lightVar = Math.floor((Math.random() - 0.5) * 30);
          const newLight = Math.max(100, Math.min(1200, plant.light + lightVar));
          
          const tempVar = Math.round((Math.random() - 0.5) * 0.4 * 10) / 10;
          const newTemp = Math.max(15, Math.min(35, Math.round((plant.temp + tempVar) * 10) / 10));

          // Determine health status
          let status = 'Optimal';
          if (newMoisture < plant.moistureMin) {
            status = 'Needs Water';
          } else if (newMoisture < plant.moistureMin - 5) {
            status = 'Alert';
          } else if (newTemp > 28) {
            status = 'High Temp';
          }

          // Trigger Auto-Irrigation if enabled and below min moisture threshold
          if (autoIrrigationEnabled && plant.autoWater && newMoisture <= plant.moistureMin) {
            // Auto Water action
            newMoisture = Math.min(95, newMoisture + 40);
            status = 'Optimal';
            
            // Douse water reservoir
            setReservoirLevel(prev => Math.max(0, prev - 4));
            setIsPumpActive(true);
            setTimeout(() => setIsPumpActive(false), 2500);

            // Log event
            logActivity({
              type: 'water',
              title: 'Auto-Irrigation Dosed Water',
              plantName: plant.name,
              timestamp: new Date().toISOString(),
              details: `Smart pump auto-dosed plant to ${newMoisture}% moisture`
            });
          }

          return {
            ...plant,
            moisture: newMoisture,
            light: newLight,
            temp: newTemp,
            status
          };
        });
      });
    }, 4000); // Pulse every 4 seconds

    return () => clearInterval(interval);
  }, [simulationActive, autoIrrigationEnabled]);

  // Log Activity function
  const logActivity = async (logItem) => {
    const newLog = {
      ...logItem,
      id: 'log-' + Date.now(),
      timestamp: logItem.timestamp || new Date().toISOString()
    };
    
    setActivityLogs(prev => [newLog, ...prev.slice(0, 49)]);

    if (firebaseStatus === 'connected') {
      try {
        await addDoc(collection(db, 'activity_logs'), {
          ...logItem,
          timestamp: serverTimestamp()
        });
      } catch (err) {
        console.warn("Could not save log to Firestore:", err);
      }
    }
  };

  // Water a plant manually
  const waterPlant = async (plantId, amount = 35) => {
    setIsPumpActive(true);
    setTimeout(() => setIsPumpActive(false), 2000);

    setReservoirLevel(prev => Math.max(0, prev - 5));

    let updatedPlantName = 'Plant';
    setPlants(prev => prev.map(p => {
      if (p.id === plantId) {
        updatedPlantName = p.name;
        const newMoisture = Math.min(98, p.moisture + amount);
        return {
          ...p,
          moisture: newMoisture,
          status: 'Optimal',
          lastWatered: new Date().toISOString()
        };
      }
      return p;
    }));

    logActivity({
      type: 'water',
      title: 'Manual Water Pump Dosed',
      plantName: updatedPlantName,
      timestamp: new Date().toISOString(),
      details: `Added ${amount}% moisture boost via manual control`
    });

    if (firebaseStatus === 'connected') {
      try {
        const plantRef = doc(db, 'plants', plantId);
        await updateDoc(plantRef, {
          moisture: 85,
          status: 'Optimal',
          lastWatered: new Date().toISOString()
        });
      } catch (e) {
        console.warn("Firestore update error:", e);
      }
    }
  };

  // Water ALL plants
  const waterAllPlants = () => {
    setIsPumpActive(true);
    setTimeout(() => setIsPumpActive(false), 3000);

    setReservoirLevel(prev => Math.max(0, prev - 15));
    setPlants(prev => prev.map(p => ({
      ...p,
      moisture: 85,
      status: 'Optimal',
      lastWatered: new Date().toISOString()
    })));

    logActivity({
      type: 'water',
      title: 'Full Garden Irrigation Executed',
      plantName: 'All Plants',
      timestamp: new Date().toISOString(),
      details: 'All garden zones irrigated to 85% moisture'
    });
  };

  // Add new plant
  const addPlant = async (plantData) => {
    const newId = 'plant-' + Date.now();
    const newPlant = {
      id: newId,
      ...plantData,
      moisture: plantData.moisture || 60,
      moistureMin: plantData.moistureMin || 30,
      light: plantData.light || 500,
      temp: plantData.temp || 23,
      humidity: plantData.humidity || 50,
      pH: plantData.pH || 6.5,
      status: 'Optimal',
      lastWatered: new Date().toISOString(),
      autoWater: plantData.autoWater ?? true,
      image: plantData.image || 'https://images.unsplash.com/photo-1512428559087-560fa5ceab42?auto=format&fit=crop&q=80&w=600'
    };

    setPlants(prev => [newPlant, ...prev]);

    logActivity({
      type: 'plant',
      title: 'New Plant Added to Garden',
      plantName: newPlant.name,
      timestamp: new Date().toISOString(),
      details: `Added ${newPlant.species} in ${newPlant.location}`
    });

    if (firebaseStatus === 'connected') {
      try {
        const { id, ...firestoreData } = newPlant;
        const docRef = await addDoc(collection(db, 'plants'), {
          ...firestoreData,
          userId: currentUser?.uid || 'public',
          createdAt: serverTimestamp()
        });
        // Update local with Firestore ID
        setPlants(prev => prev.map(p => p.id === newId ? { ...p, id: docRef.id } : p));
      } catch (err) {
        console.warn("Error adding plant to Firestore:", err);
      }
    }
  };

  // Edit existing plant
  const updatePlant = async (plantId, updatedFields) => {
    setPlants(prev => prev.map(p => p.id === plantId ? { ...p, ...updatedFields } : p));

    if (firebaseStatus === 'connected') {
      try {
        const plantRef = doc(db, 'plants', plantId);
        await updateDoc(plantRef, updatedFields);
      } catch (e) {
        console.warn("Error updating plant in Firestore:", e);
      }
    }
  };

  // Delete plant
  const deletePlant = async (plantId) => {
    const p = plants.find(item => item.id === plantId);
    setPlants(prev => prev.filter(item => item.id !== plantId));

    if (p) {
      logActivity({
        type: 'alert',
        title: 'Plant Removed',
        plantName: p.name,
        timestamp: new Date().toISOString(),
        details: `Removed ${p.name} from monitoring list`
      });
    }

    if (firebaseStatus === 'connected') {
      try {
        await deleteDoc(doc(db, 'plants', plantId));
      } catch (e) {
        console.warn("Error deleting plant from Firestore:", e);
      }
    }
  };

  // Refill Water Reservoir
  const refillReservoir = () => {
    setReservoirLevel(100);
    logActivity({
      type: 'water',
      title: 'Water Reservoir Refilled',
      plantName: 'Irrigation System',
      timestamp: new Date().toISOString(),
      details: 'Reservoir refilled to 100% capacity (5.0 Liters)'
    });
  };

  const saveIdentificationAnalysis = async (analysisData) => {
    const activeUid = auth.currentUser?.uid || (currentUser && !currentUser.isDemo ? currentUser.uid : null);
    const isDemoUser = !activeUid || currentUser?.isDemo || activeUid === 'demo-gardener-123' || activeUid === 'guest' || !String(activeUid).trim();

    if (isDemoUser) {
      console.log("[Plant Identification] UID: null");
      const unauthErr = new Error("Please sign in before saving the plant identification.");
      unauthErr.code = "unauthenticated";
      throw unauthErr;
    }

    console.log(`[Plant Identification] UID: ${activeUid}`);

    let compressedImageData = '';
    const imageSource = analysisData.file || analysisData.imageUrl || analysisData.imageData;

    if (imageSource) {
      try {
        compressedImageData = await compressImageForFirestore(imageSource, 640, 0.6);
      } catch (compressErr) {
        console.warn("[Plant Identification] Image compression warning:", compressErr);
        compressedImageData = '';
      }
    }

    const isInvalidPlantName = (name) => {
      if (!name || typeof name !== 'string') return true;
      const l = name.trim().toLowerCase();
      if (!l) return true;
      return l.includes('specimen') || l.includes('unknown plant') || l.includes('detected plant') || l.includes('identified plant');
    };

    const rawPlantName = (analysisData.plantName || analysisData.name || '').trim();
    const rawScientificName = (analysisData.scientificName || '').trim();

    let cleanPlantName = rawPlantName
      .replace(/^(identified\s+plant|detected\s+plant|specimen)\s*[:\-]?\s*/i, '')
      .replace(/\s+(specimen|plant)$/i, '')
      .trim();

    const plantName = cleanPlantName || rawPlantName || rawScientificName || 'Plant Specimen';
    const scientificName = rawScientificName ? rawScientificName : undefined;
    const commonNames = analysisData.commonNames || analysisData.commonName || [];
    const plantCategory = selectedCategory || analysisData.plantCategory || analysisData.category || 'Garden Plants';
    const confidence = analysisData.confidence !== undefined ? analysisData.confidence : 0;
    const description = analysisData.description || '';

    const sanitizeObj = (obj) => {
      const res = {};
      Object.keys(obj).forEach(key => {
        if (obj[key] !== undefined) {
          res[key] = obj[key];
        }
      });
      return res;
    };

    const displayTitle = plantName && plantName !== 'Plant Specimen'
      ? `Plant Identified: ${plantName}`
      : (scientificName ? `Plant Identified: ${scientificName}` : 'Plant Identification');

    const savedAnalysisData = sanitizeObj({
      userId: activeUid,
      type: "identification",
      analysisType: "Plant Identification",
      title: displayTitle,
      plantName,
      scientificName,
      commonNames,
      plantCategory,
      confidence,
      description,
      family: analysisData.family || '',
      uses: analysisData.uses || [],
      careInstructions: analysisData.careInstructions || analysisData.careSummary || '',
      selectedPart: analysisData.selectedPart || 'Leaf',
      imageData: compressedImageData || '',
      category: plantCategory,
      details: `Identified ${scientificName || plantName} (${confidence}% match)`
    });

    console.log("[Plant Identification] FIRESTORE SAVE START", activeUid);

    let docRef;
    try {
      const historyRef = collection(db, "analysisHistory");
      docRef = await addDoc(historyRef, {
        ...savedAnalysisData,
        timestamp: serverTimestamp(),
        createdAt: serverTimestamp()
      });
      console.log("[Plant Identification] FIRESTORE SAVE SUCCESS", docRef.id);
    } catch (firstSaveErr) {
      console.error("[Plant Identification] FIRESTORE SAVE ERROR", firstSaveErr);
      if (savedAnalysisData.imageData) {
        console.warn("[Plant Identification] Attempting fallback save without imageData...");
        try {
          const fallbackData = { ...savedAnalysisData, imageData: '' };
          const historyRef = collection(db, "analysisHistory");
          docRef = await addDoc(historyRef, {
            ...fallbackData,
            timestamp: serverTimestamp(),
            createdAt: serverTimestamp()
          });
          savedAnalysisData.imageData = '';
          console.log("[Plant Identification] FIRESTORE SAVE SUCCESS (Fallback)", docRef.id);
        } catch (fallbackErr) {
          console.error("[Plant Identification] Fallback save failed", fallbackErr);
          throw fallbackErr;
        }
      } else {
        throw firstSaveErr;
      }
    }

    const resultToReturn = {
      analysisId: docRef.id,
      id: docRef.id,
      ...savedAnalysisData,
      timestamp: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };

    setActivityLogs(prev => [resultToReturn, ...prev.slice(0, 49)]);

    try {
      await addDoc(collection(db, 'activity_logs'), {
        ...savedAnalysisData,
        analysisId: docRef.id,
        timestamp: serverTimestamp(),
        createdAt: serverTimestamp()
      });
    } catch (logErr) {
      console.warn("Could not save activity_log:", logErr);
    }

    return resultToReturn;
  };

  const saveDiseaseAnalysis = async (analysisData) => {
    const activeUid = auth.currentUser?.uid || (currentUser && !currentUser.isDemo ? currentUser.uid : null);
    const isDemoUser = !activeUid || currentUser?.isDemo || activeUid === 'demo-gardener-123' || activeUid === 'guest' || !String(activeUid).trim();

    if (isDemoUser) {
      console.log("[Disease Detection] UID: null");
      console.log("[Disease Detection] Authenticated UID: null");
      const unauthErr = new Error("Please sign in before saving the disease analysis.");
      unauthErr.code = "unauthenticated";
      throw unauthErr;
    }

    console.log(`[Disease Detection] UID: ${activeUid}`);
    console.log(`[Disease Detection] Authenticated UID: ${activeUid}`);

    // Compress image to JPEG Data URL (max 640px, JPEG quality 0.6)
    let compressedImageData = '';
    const imageSource = analysisData.file || analysisData.imageUrl || analysisData.imageData;

    if (imageSource) {
      try {
        compressedImageData = await compressImageForFirestore(imageSource, 640, 0.6);
        console.log(`[Disease Detection] Image data present: ${Boolean(compressedImageData)}`);
        console.log(`[Disease Detection] Image data size: ${compressedImageData ? compressedImageData.length : 0}`);
        console.log(`[Disease Detection] Final compressed image size: ${compressedImageData ? compressedImageData.length : 0}`);
      } catch (compressErr) {
        console.warn("[Disease Detection] Image compression warning:", compressErr);
        compressedImageData = '';
      }
    } else {
      console.log("[Disease Detection] Image data present: false");
      console.log("[Disease Detection] Image data size: 0");
      console.log("[Disease Detection] Final compressed image size: 0");
    }

    const diseaseName = analysisData.diseaseName || 'Plant Disease';

    const isInvalidPlantName = (name) => {
      if (!name || typeof name !== 'string') return true;
      const l = name.trim().toLowerCase();
      if (!l) return true;
      return l.includes('specimen') || l.includes('unknown plant') || l.includes('detected plant') || l.endsWith('damage') || l.endsWith('deficiency');
    };

    const rawPlantName = (analysisData.plantName || selectedPlant?.name || selectedPlant?.commonName || selectedPlant?.plantName || '').trim();
    const rawScientificName = (analysisData.scientificName || analysisData.plantScientificName || selectedPlant?.scientificName || selectedPlant?.species || '').trim();

    const plantName = !isInvalidPlantName(rawPlantName) ? rawPlantName : undefined;
    const scientificName = rawScientificName ? rawScientificName : undefined;
    const plantCategory = selectedCategory || analysisData.plantCategory || analysisData.category || 'Garden Plants';
    const confidence = analysisData.confidence !== undefined ? analysisData.confidence : 0;
    const severity = analysisData.severity || 'Moderate';
    const affectedPart = analysisData.affectedPart || 'Leaf';
    const healthStatus = analysisData.healthStatus || 'Diseased';
    const diseaseDetected = analysisData.diseaseDetected ?? true;

    // Sanitize object for Firestore write
    const sanitizeObj = (obj) => {
      const res = {};
      Object.keys(obj).forEach(key => {
        if (obj[key] !== undefined) {
          res[key] = obj[key];
        }
      });
      return res;
    };

    const savedAnalysisData = sanitizeObj({
      userId: activeUid,
      type: "disease",
      analysisType: "Disease Detection",
      diseaseName,
      plantName,
      scientificName,
      plantCategory,
      confidence,
      severity,
      affectedPart,
      healthStatus,
      diseaseDetected,
      imageData: compressedImageData || '',
      symptoms: analysisData.symptoms || [],
      possibleCause: analysisData.possibleCause || '',
      treatment: analysisData.treatment || [],
      prevention: analysisData.prevention || [],
      additionalAdvice: analysisData.additionalAdvice || [],
      analysisSummary: analysisData.analysisSummary || '',
      category: plantCategory,
      details: `${healthStatus}: ${diseaseName} (${confidence}% match)`,
      treatmentRecommendations: analysisData.recommendations?.treatmentRecommendations || analysisData.treatmentRecommendations || [],
      fertilizerRecommendations: analysisData.recommendations?.fertilizerRecommendations || analysisData.fertilizerRecommendations || [],
      plantCareSuggestions: analysisData.recommendations?.plantCareSuggestions || analysisData.plantCareSuggestions || [],
      wateringSuggestions: analysisData.recommendations?.wateringSuggestions || analysisData.wateringSuggestions || [],
      soilSuggestions: analysisData.recommendations?.soilSuggestions || analysisData.soilSuggestions || [],
      environmentSuggestions: analysisData.recommendations?.environmentSuggestions || analysisData.environmentSuggestions || [],
      preventionSuggestions: analysisData.recommendations?.preventionSuggestions || analysisData.preventionSuggestions || [],
      monitoringSuggestions: analysisData.recommendations?.monitoringSuggestions || analysisData.monitoringSuggestions || [],
      urgency: analysisData.recommendations?.urgency || analysisData.urgency || 'Moderate',
      followUpTime: analysisData.recommendations?.followUpTime || analysisData.followUpTime || '7-14 days',
      importantNotes: analysisData.recommendations?.importantNotes || analysisData.importantNotes || []
    });

    console.log("[Disease Detection] FIRESTORE SAVE START");
    console.log(`[Disease Detection] UID: ${activeUid}`);
    console.log(`[Disease Detection] Image data present: ${Boolean(savedAnalysisData.imageData)}`);
    console.log(`[Disease Detection] Image data size: ${savedAnalysisData.imageData ? savedAnalysisData.imageData.length : 0}`);
    console.log(`[Disease Detection] Payload size estimate: ${JSON.stringify(savedAnalysisData).length}`);
    console.log("[Disease Detection] Firestore collection: analysisHistory");

    let docRef;
    try {
      const historyRef = collection(db, "analysisHistory");
      docRef = await addDoc(historyRef, {
        ...savedAnalysisData,
        timestamp: serverTimestamp(),
        createdAt: serverTimestamp()
      });
      console.log("[Disease Detection] FIRESTORE SAVE SUCCESS", docRef.id);
      console.log(`[Disease Detection] analysisId: ${docRef.id}`);
    } catch (firstSaveErr) {
      console.error("[Disease Detection] FIRESTORE SAVE ERROR", firstSaveErr);
      console.error("[Disease Detection] ERROR CODE", firstSaveErr?.code);
      console.error("[Disease Detection] ERROR MESSAGE", firstSaveErr?.message);

      // Fallback: If payload was too large or image data caused error, retry saving WITHOUT imageData so metadata is NEVER lost
      if (savedAnalysisData.imageData) {
        console.warn("[Disease Detection] Attempting fallback Firestore save without imageData...");
        try {
          const fallbackData = { ...savedAnalysisData, imageData: '' };
          const historyRef = collection(db, "analysisHistory");
          docRef = await addDoc(historyRef, {
            ...fallbackData,
            timestamp: serverTimestamp(),
            createdAt: serverTimestamp()
          });
          console.log("[Disease Detection] FIRESTORE SAVE SUCCESS (Fallback without image)", docRef.id);
          console.log(`[Disease Detection] analysisId: ${docRef.id}`);
          savedAnalysisData.imageData = '';
        } catch (fallbackErr) {
          console.error("[Disease Detection] FIRESTORE SAVE ERROR (Fallback failed)", fallbackErr);
          console.error("[Disease Detection] ERROR CODE", fallbackErr?.code);
          console.error("[Disease Detection] ERROR MESSAGE", fallbackErr?.message);
          throw fallbackErr;
        }
      } else {
        throw firstSaveErr;
      }
    }

    const resultToReturn = {
      analysisId: docRef.id,
      id: docRef.id,
      ...savedAnalysisData,
      timestamp: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };

    setActivityLogs(prev => [resultToReturn, ...prev.slice(0, 49)]);

    try {
      await addDoc(collection(db, 'activity_logs'), {
        ...savedAnalysisData,
        analysisId: docRef.id,
        timestamp: serverTimestamp(),
        createdAt: serverTimestamp()
      });
    } catch (logErr) {
      console.warn("Could not save activity_log:", logErr);
    }

    return resultToReturn;
  };

  const saveNutrientAnalysis = async (analysisData) => {
    const activeUid = auth.currentUser?.uid || (currentUser && !currentUser.isDemo ? currentUser.uid : null);
    const isDemoUser = !activeUid || currentUser?.isDemo || activeUid === 'demo-gardener-123' || activeUid === 'guest' || !String(activeUid).trim();

    if (isDemoUser) {
      console.log("[Nutrient Detection] UID: null");
      const unauthErr = new Error("Please sign in before saving the nutrient analysis.");
      unauthErr.code = "unauthenticated";
      throw unauthErr;
    }

    console.log(`[Nutrient Detection] UID: ${activeUid}`);

    let compressedImageData = '';
    const imageSource = analysisData.file || analysisData.imageUrl || analysisData.imageData;

    if (imageSource) {
      try {
        compressedImageData = await compressImageForFirestore(imageSource, 640, 0.6);
      } catch (compressErr) {
        console.warn("[Nutrient Detection] Image compression warning:", compressErr);
        compressedImageData = '';
      }
    }

    const primaryNutrient = analysisData.primaryNutrient || '';
    const nutrientSymbol = analysisData.nutrientSymbol || '';
    const titleNutrient = primaryNutrient ? `${primaryNutrient}${nutrientSymbol ? ` (${nutrientSymbol})` : ''}` : 'Nutrient Analysis';

    const isInvalidPlantName = (name) => {
      if (!name || typeof name !== 'string') return true;
      const l = name.trim().toLowerCase();
      if (!l) return true;
      return l.includes('specimen') || l.includes('unknown plant') || l.includes('detected plant') || l.endsWith('damage') || l.endsWith('deficiency');
    };

    const rawPlantName = (analysisData.plantName || selectedPlant?.name || selectedPlant?.commonName || selectedPlant?.plantName || '').trim();
    const rawScientificName = (analysisData.scientificName || analysisData.plantScientificName || selectedPlant?.scientificName || selectedPlant?.species || '').trim();

    const plantName = !isInvalidPlantName(rawPlantName) ? rawPlantName : undefined;
    const scientificName = rawScientificName ? rawScientificName : undefined;
    const plantCategory = selectedCategory || analysisData.plantCategory || analysisData.category || 'Garden Plants';
    const confidence = analysisData.confidence !== undefined ? analysisData.confidence : 0;
    const severity = analysisData.severity || 'Moderate';
    const affectedPart = analysisData.affectedPart || 'Leaf';
    const nutritionStatus = analysisData.nutritionStatus || 'Possible Deficiency';
    const deficiencyDetected = analysisData.deficiencyDetected ?? true;

    const sanitizeObj = (obj) => {
      const res = {};
      Object.keys(obj).forEach(key => {
        if (obj[key] !== undefined) {
          res[key] = obj[key];
        }
      });
      return res;
    };

    const savedAnalysisData = sanitizeObj({
      userId: activeUid,
      type: "nutrient",
      analysisType: "Nutrient Deficiency Detection",
      title: `Nutrient Scan: ${titleNutrient}`,
      plantName,
      scientificName,
      plantCategory,
      nutritionStatus,
      deficiencyDetected,
      primaryNutrient,
      nutrientSymbol,
      confidence,
      severity,
      affectedPart,
      imageData: compressedImageData || '',
      symptoms: analysisData.symptoms || [],
      visualEvidence: analysisData.visualEvidence || [],
      possibleCause: analysisData.possibleCause || '',
      recommendedTreatment: analysisData.recommendedTreatment || [],
      fertilizerRecommendation: analysisData.fertilizerRecommendation || [],
      prevention: analysisData.prevention || [],
      additionalAdvice: analysisData.additionalAdvice || [],
      analysisSummary: analysisData.analysisSummary || '',
      category: plantCategory,
      details: `${nutritionStatus}: ${primaryNutrient} (${confidence}% match)`,
      treatmentRecommendations: analysisData.recommendations?.treatmentRecommendations || analysisData.treatmentRecommendations || [],
      fertilizerRecommendations: analysisData.recommendations?.fertilizerRecommendations || analysisData.fertilizerRecommendations || [],
      plantCareSuggestions: analysisData.recommendations?.plantCareSuggestions || analysisData.plantCareSuggestions || [],
      wateringSuggestions: analysisData.recommendations?.wateringSuggestions || analysisData.wateringSuggestions || [],
      soilSuggestions: analysisData.recommendations?.soilSuggestions || analysisData.soilSuggestions || [],
      environmentSuggestions: analysisData.recommendations?.environmentSuggestions || analysisData.environmentSuggestions || [],
      preventionSuggestions: analysisData.recommendations?.preventionSuggestions || analysisData.preventionSuggestions || [],
      monitoringSuggestions: analysisData.recommendations?.monitoringSuggestions || analysisData.monitoringSuggestions || [],
      urgency: analysisData.recommendations?.urgency || analysisData.urgency || 'Moderate',
      followUpTime: analysisData.recommendations?.followUpTime || analysisData.followUpTime || '7-14 days',
      importantNotes: analysisData.recommendations?.importantNotes || analysisData.importantNotes || []
    });

    console.log("[Nutrient Detection] FIRESTORE SAVE START", activeUid);

    let docRef;
    try {
      const historyRef = collection(db, "analysisHistory");
      docRef = await addDoc(historyRef, {
        ...savedAnalysisData,
        timestamp: serverTimestamp(),
        createdAt: serverTimestamp()
      });
      console.log("[Nutrient Detection] FIRESTORE SAVE SUCCESS", docRef.id);
    } catch (firstSaveErr) {
      console.error("[Nutrient Detection] FIRESTORE SAVE ERROR", firstSaveErr);
      if (savedAnalysisData.imageData) {
        console.warn("[Nutrient Detection] Attempting fallback save without imageData...");
        try {
          const fallbackData = { ...savedAnalysisData, imageData: '' };
          const historyRef = collection(db, "analysisHistory");
          docRef = await addDoc(historyRef, {
            ...fallbackData,
            timestamp: serverTimestamp(),
            createdAt: serverTimestamp()
          });
          savedAnalysisData.imageData = '';
          console.log("[Nutrient Detection] FIRESTORE SAVE SUCCESS (Fallback)", docRef.id);
        } catch (fallbackErr) {
          console.error("[Nutrient Detection] Fallback save failed", fallbackErr);
          throw fallbackErr;
        }
      } else {
        throw firstSaveErr;
      }
    }

    const resultToReturn = {
      analysisId: docRef.id,
      id: docRef.id,
      ...savedAnalysisData,
      timestamp: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };

    setActivityLogs(prev => [resultToReturn, ...prev.slice(0, 49)]);

    try {
      await addDoc(collection(db, 'activity_logs'), {
        ...savedAnalysisData,
        analysisId: docRef.id,
        timestamp: serverTimestamp(),
        createdAt: serverTimestamp()
      });
    } catch (logErr) {
      console.warn("Could not save activity_log:", logErr);
    }

    return resultToReturn;
  };

  const savePestAnalysis = async (analysisData) => {
    const activeUid = auth.currentUser?.uid || (currentUser && !currentUser.isDemo ? currentUser.uid : null);
    const isDemoUser = !activeUid || currentUser?.isDemo || activeUid === 'demo-gardener-123' || activeUid === 'guest' || !String(activeUid).trim();

    if (isDemoUser) {
      console.log("[Pest Detection] UID: null");
      const unauthErr = new Error("Please sign in before saving the pest analysis.");
      unauthErr.code = "unauthenticated";
      throw unauthErr;
    }

    console.log(`[Pest Detection] UID: ${activeUid}`);

    let compressedImageData = '';
    const imageSource = analysisData.file || analysisData.imageUrl || analysisData.imageData;

    if (imageSource) {
      try {
        compressedImageData = await compressImageForFirestore(imageSource, 640, 0.6);
      } catch (compressErr) {
        console.warn("[Pest Detection] Image compression warning:", compressErr);
        compressedImageData = '';
      }
    }

    const primaryPest = analysisData.primaryPest || analysisData.pestName || '';
    const pestName = primaryPest || 'Pest Detection';

    const isInvalidPlantName = (name) => {
      if (!name || typeof name !== 'string') return true;
      const l = name.trim().toLowerCase();
      if (!l) return true;
      return l.includes('specimen') || l.includes('unknown plant') || l.includes('detected plant') || l.endsWith('damage') || l.endsWith('deficiency');
    };

    const rawPlantName = (analysisData.plantName || selectedPlant?.name || selectedPlant?.commonName || selectedPlant?.plantName || '').trim();
    const rawScientificName = (analysisData.scientificName || analysisData.plantScientificName || selectedPlant?.scientificName || selectedPlant?.species || '').trim();

    const plantName = !isInvalidPlantName(rawPlantName) ? rawPlantName : undefined;
    const scientificName = rawScientificName ? rawScientificName : undefined;
    const plantCategory = selectedCategory || analysisData.plantCategory || analysisData.category || 'Garden Plants';
    const confidence = analysisData.confidence !== undefined ? analysisData.confidence : 0;
    const severity = analysisData.severity || 'Moderate';
    const affectedPart = analysisData.affectedPart || 'Leaf';
    const healthStatus = analysisData.healthStatus || analysisData.pestStatus || 'Pest Infestation Detected';
    const pestStatus = analysisData.pestStatus || healthStatus;
    const pestDetected = analysisData.pestDetected ?? true;

    const sanitizeObj = (obj) => {
      const res = {};
      Object.keys(obj).forEach(key => {
        if (obj[key] !== undefined) {
          res[key] = obj[key];
        }
      });
      return res;
    };

    const savedAnalysisData = sanitizeObj({
      userId: activeUid,
      type: "pest",
      analysisType: "Pest Detection",
      title: `Pest Scan: ${pestName}`,
      pestName,
      plantName,
      scientificName,
      plantCategory,
      healthStatus,
      pestStatus,
      pestDetected,
      primaryPest,
      confidence,
      severity,
      affectedPart,
      visiblePest: analysisData.visiblePest ?? true,
      imageData: compressedImageData || '',
      symptoms: analysisData.symptoms || [],
      visualEvidence: analysisData.visualEvidence || [],
      damageType: analysisData.damageType || '',
      possibleCause: analysisData.possibleCause || '',
      recommendedTreatment: analysisData.recommendedTreatment || [],
      organicControl: analysisData.organicControl || [],
      prevention: analysisData.prevention || [],
      additionalAdvice: analysisData.additionalAdvice || [],
      analysisSummary: analysisData.analysisSummary || '',
      category: plantCategory,
      details: `${pestStatus}: ${primaryPest} (${confidence}% match)`,
      treatmentRecommendations: analysisData.recommendations?.treatmentRecommendations || analysisData.treatmentRecommendations || [],
      fertilizerRecommendations: analysisData.recommendations?.fertilizerRecommendations || analysisData.fertilizerRecommendations || [],
      plantCareSuggestions: analysisData.recommendations?.plantCareSuggestions || analysisData.plantCareSuggestions || [],
      wateringSuggestions: analysisData.recommendations?.wateringSuggestions || analysisData.wateringSuggestions || [],
      soilSuggestions: analysisData.recommendations?.soilSuggestions || analysisData.soilSuggestions || [],
      environmentSuggestions: analysisData.recommendations?.environmentSuggestions || analysisData.environmentSuggestions || [],
      preventionSuggestions: analysisData.recommendations?.preventionSuggestions || analysisData.preventionSuggestions || [],
      monitoringSuggestions: analysisData.recommendations?.monitoringSuggestions || analysisData.monitoringSuggestions || [],
      urgency: analysisData.recommendations?.urgency || analysisData.urgency || 'Moderate',
      followUpTime: analysisData.recommendations?.followUpTime || analysisData.followUpTime || '7-14 days',
      importantNotes: analysisData.recommendations?.importantNotes || analysisData.importantNotes || []
    });

    console.log("[Pest Detection] FIRESTORE SAVE START", activeUid);

    let docRef;
    try {
      const historyRef = collection(db, "analysisHistory");
      docRef = await addDoc(historyRef, {
        ...savedAnalysisData,
        timestamp: serverTimestamp(),
        createdAt: serverTimestamp()
      });
      console.log("[Pest Detection] FIRESTORE SAVE SUCCESS", docRef.id);
    } catch (firstSaveErr) {
      console.error("[Pest Detection] FIRESTORE SAVE ERROR", firstSaveErr);
      if (savedAnalysisData.imageData) {
        console.warn("[Pest Detection] Attempting fallback save without imageData...");
        try {
          const fallbackData = { ...savedAnalysisData, imageData: '' };
          const historyRef = collection(db, "analysisHistory");
          docRef = await addDoc(historyRef, {
            ...fallbackData,
            timestamp: serverTimestamp(),
            createdAt: serverTimestamp()
          });
          savedAnalysisData.imageData = '';
          console.log("[Pest Detection] FIRESTORE SAVE SUCCESS (Fallback)", docRef.id);
        } catch (fallbackErr) {
          console.error("[Pest Detection] Fallback save failed", fallbackErr);
          throw fallbackErr;
        }
      } else {
        throw firstSaveErr;
      }
    }

    const resultToReturn = {
      analysisId: docRef.id,
      id: docRef.id,
      ...savedAnalysisData,
      timestamp: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };

    setActivityLogs(prev => [resultToReturn, ...prev.slice(0, 49)]);

    try {
      await addDoc(collection(db, 'activity_logs'), {
        ...savedAnalysisData,
        analysisId: docRef.id,
        timestamp: serverTimestamp(),
        createdAt: serverTimestamp()
      });
    } catch (logErr) {
      console.warn("Could not save activity_log:", logErr);
    }

    return resultToReturn;
  };

  const saveDiseaseFollowUp = async (followUpData) => {
    const activeUid = auth.currentUser?.uid || (currentUser && !currentUser.isDemo ? currentUser.uid : (currentUser?.uid || null));
    if (!activeUid) {
      console.warn("[Tracker] saveDiseaseFollowUp: unauthenticated user");
      const unauthErr = new Error("Please sign in before saving a follow-up image.");
      unauthErr.code = "unauthenticated";
      throw unauthErr;
    }

    const targetAnalysisId = followUpData.analysisId || followUpData.healthAnalysisId || followUpData.originalAnalysisId;
    const stageStr = followUpData.stage || followUpData.followUpStage || (`Follow-up ${followUpData.followUpNumber || 1}`);

    // Compress follow-up image to JPEG data URL for Firestore (max 640px, JPEG quality 0.6)
    let compressedImageData = followUpData.imageData || '';
    const rawImage = followUpData.file || followUpData.imageUrl || followUpData.imageData;

    const origSize = followUpData.file ? followUpData.file.size : (typeof rawImage === 'string' ? rawImage.length : 0);
    console.log(`[Tracker] Follow-up original image size: ${origSize}`);

    if (rawImage && !compressedImageData) {
      try {
        compressedImageData = await compressImageForFirestore(rawImage, 640, 0.6);
      } catch (compressErr) {
        console.warn("[Tracker] Image compression error:", compressErr);
        compressedImageData = '';
      }
    }

    const compSize = compressedImageData ? compressedImageData.length : 0;
    console.log(`[Tracker] Follow-up compressed image size: ${compSize}`);

    const followUpRecord = {
      userId: activeUid,
      analysisId: targetAnalysisId,
      healthAnalysisId: targetAnalysisId,
      originalAnalysisId: targetAnalysisId,
      followUpNumber: followUpData.followUpNumber || 1,
      followUpStage: stageStr,
      stage: stageStr,
      plantName: followUpData.plantName || 'Plant Specimen',
      diseaseName: followUpData.diseaseName || followUpData.condition || 'Plant Disease',
      disease: followUpData.diseaseName || followUpData.condition || 'Plant Disease',
      condition: followUpData.condition || followUpData.diseaseName || 'Plant Disease',
      severity: followUpData.severity || 'Moderate',
      confidence: followUpData.confidence || 0,
      recoveryStatus: followUpData.recoveryStatus || (followUpData.progressStatus === 'WORSENED' ? 'Worsened' : (followUpData.progressStatus === 'NO_CHANGE' ? 'No change' : 'Improved')),
      progressStatus: followUpData.progressStatus || 'IMPROVED',
      progressScore: followUpData.progressScore !== undefined ? followUpData.progressScore : 50,
      progressReason: followUpData.progressReason || followUpData.observation || 'Follow-up saved.',
      progressConfidence: followUpData.progressConfidence !== undefined ? followUpData.progressConfidence : 85,
      treatmentApplied: followUpData.treatmentApplied || followUpData.treatment || '',
      treatment: followUpData.treatmentApplied || followUpData.treatment || '',
      observation: followUpData.observation || '',
      imageData: compressedImageData,
      imageUrl: compressedImageData,
      followUpDate: followUpData.followUpDate || new Date().toISOString(),
      timestamp: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      daysSinceInitial: followUpData.daysSinceInitial || 0
    };

    const logItem = {
      type: 'disease_followup',
      analysisType: 'Disease Follow-up',
      title: `Disease Follow-up #${followUpRecord.followUpNumber}`,
      plantName: followUpRecord.plantName,
      timestamp: new Date().toISOString(),
      details: `Follow-up ${followUpRecord.followUpNumber}: ${followUpRecord.recoveryStatus} (${followUpRecord.severity} severity)`,
      ...followUpRecord
    };

    try {
      const followUpsRef = collection(db, 'diseaseFollowUps');
      const docRef = await addDoc(followUpsRef, {
        ...followUpRecord,
        createdAt: serverTimestamp(),
        timestamp: serverTimestamp()
      });

      console.log(`[Tracker] Firestore follow-up saved: ${docRef.id}`);

      const savedRecord = { ...followUpRecord, id: docRef.id };
      setActivityLogs(prev => [{ ...logItem, id: docRef.id }, ...prev.slice(0, 49)]);

      try {
        await addDoc(collection(db, 'activity_logs'), {
          ...logItem,
          createdAt: serverTimestamp(),
          timestamp: serverTimestamp()
        });
      } catch (logErr) {
        console.warn("Could not save activity_log:", logErr);
      }

      return savedRecord;
    } catch (err) {
      console.error("[Tracker] Firestore follow-up save error:", err);
      throw new Error("Failed to save follow-up record to Firestore. Please try again.");
    }
  };

  const value = {
    plants,
    activityLogs,
    reservoirLevel,
    isPumpActive,
    autoIrrigationEnabled,
    setAutoIrrigationEnabled,
    firebaseStatus,
    selectedPlant,
    setSelectedPlant,
    selectedCategory,
    setSelectedCategory,
    simulationActive,
    setSimulationActive,
    waterPlant,
    waterAllPlants,
    addPlant,
    updatePlant,
    deletePlant,
    refillReservoir,
    logActivity,
    saveIdentificationAnalysis,
    saveDiseaseAnalysis,
    saveNutrientAnalysis,
    savePestAnalysis,
    saveDiseaseFollowUp
  };




  return (
    <PlantContext.Provider value={value}>
      {children}
    </PlantContext.Provider>
  );
};
