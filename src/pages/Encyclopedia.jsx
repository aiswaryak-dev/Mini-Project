import React, { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';
import { getPlantImage } from '../utils/plantAssets';
import { 
  BookOpen, 
  Search, 
  Info, 
  Sprout, 
  Sun, 
  Droplets, 
  Thermometer, 
  Layers, 
  ShieldAlert, 
  Bug, 
  X, 
  CheckCircle2, 
  ChevronRight,
  AlertTriangle
} from 'lucide-react';

import roseImg from '../assets/plants/rose.jpg';
import hibiscusImg from '../assets/plants/hibiscus.jpg';
import jasmineImg from '../assets/plants/jasmine.jpg';
import marigoldImg from '../assets/plants/marigold.jpg';
import sunflowerImg from '../assets/plants/sunflower.jpg';
import tomatoImg from '../assets/plants/tomato.jpg';
import chilliImg from '../assets/plants/chilli.jpg';
import brinjalImg from '../assets/plants/brinjal.jpg';
import spinachImg from '../assets/plants/spinach.jpg';
import mintImg from '../assets/plants/mint.jpg';
import corianderImg from '../assets/plants/coriander.jpg';

const ENCYCLOPEDIA_DATASET = [
  // GARDEN PLANTS (5)
  {
    id: 'rose',
    name: 'Rose',
    scientificName: 'Rosa spp.',
    category: 'Garden Plants',
    type: 'Garden Plant',
    image: roseImg,
    water: {
      guidance: 'Deep watering when soil begins to dry. Avoid overhead watering on foliage to prevent black spot fungal infection.',
      frequency: 'Soil-moisture based (1-2 times/week)',
      amount: 'Moderate to Deep'
    },
    sunlight: {
      preferred: 'Full Sun',
      dailyHours: '6 - 8 hours daily'
    },
    soil: {
      preferredType: 'Fertile, well-draining loamy soil',
      drainage: 'High drainage capability with organic compost',
      characteristics: 'pH 6.0 - 6.5, rich in organic matter'
    },
    temperature: {
      range: '15°C - 28°C',
      guidance: 'Prefers warm climates. Protect from severe frost and intense dry heatwaves.'
    },
    careInstructions: [
      'Water at the soil level early in the morning to keep foliage dry.',
      'Prune dead or diseased stems in late winter/early spring to promote ventilation.',
      'Deadhead spent flowers regularly to encourage continuous blooming.',
      'Apply balanced organic rose fertilizer or compost every 4-6 weeks during blooming season.'
    ],
    commonDiseases: [
      { name: 'Black Spot', info: 'Fungal leaf disease causing black spots with yellow halos, leading to premature leaf drop.' },
      { name: 'Powdery Mildew', info: 'White powdery fungal coating on young leaves and flower buds under high humidity.' },
      { name: 'Rose Rust', info: 'Orange-yellow pustules underneath foliage during cool, humid weather.' },
      { name: 'Botrytis Blight', info: 'Grey mold causing flower buds to turn brown and fail to open properly.' }
    ],
    commonPests: [
      { name: 'Aphids', info: 'Soft-bodied green or black insects clustering on buds and sucking plant sap.' },
      { name: 'Spider Mites', info: 'Microscopic pests causing foliage speckling and fine webbing under leaves.' },
      { name: 'Thrips', info: 'Tiny slender insects that blemish petals and distort opening flower buds.' },
      { name: 'Rose Sawfly', info: 'Larvae skeletonizing leaves from the undersides.' }
    ]
  },
  {
    id: 'hibiscus',
    name: 'Hibiscus',
    scientificName: 'Hibiscus rosa-sinensis',
    category: 'Garden Plants',
    type: 'Garden Plant',
    image: hibiscusImg,
    water: {
      guidance: 'Keep soil consistently moist but never waterlogged during active blooming. Reduce watering in winter.',
      frequency: 'Daily during hot weather, 2-3 times weekly in winter',
      amount: 'High (requires regular hydration)'
    },
    sunlight: {
      preferred: 'Full Sun to Partial Shade',
      dailyHours: '6+ hours daily'
    },
    soil: {
      preferredType: 'Rich, fertile loamy soil',
      drainage: 'Excellent drainage, moist and humus-rich',
      characteristics: 'pH 6.5 - 7.0, rich in potassium and organic content'
    },
    temperature: {
      range: '18°C - 32°C',
      guidance: 'Warm/tropical conditions. Sensitive to cold; protect from temperatures below 10°C.'
    },
    careInstructions: [
      'Water thoroughly when top inch of soil feels dry to touch.',
      'Feed with high-potassium, low-phosphorus fertilizer monthly for abundant flowers.',
      'Prune lightly in early spring to encourage bushy growth and new flower shoots.',
      'Ensure good drainage and protect from cold temperatures.'
    ],
    commonDiseases: [
      { name: 'Leaf Spot', info: 'Brown or tan circular spots on leaves during wet monsoon periods.' },
      { name: 'Root Rot', info: 'Fungal rotting of roots caused by poor drainage or stagnant water.' },
      { name: 'Leaf Yellowing (Chlorosis)', info: 'Nutrient imbalance or overwatering causing leaves to turn pale yellow.' }
    ],
    commonPests: [
      { name: 'Aphids', info: 'Clusters of small sap-sucking insects on tender shoots.' },
      { name: 'Whiteflies', info: 'Tiny white winged pests fluttering under foliage and excreting sticky honeydew.' },
      { name: 'Spider Mites', info: 'Tiny pests causing leaf yellowing and webbing during hot dry weather.' },
      { name: 'Mealybugs', info: 'White cottony wax-covered insects attached to leaf stems and branches.' }
    ]
  },
  {
    id: 'jasmine',
    name: 'Jasmine',
    scientificName: 'Jasminum officinale',
    category: 'Garden Plants',
    type: 'Garden Plant',
    image: jasmineImg,
    water: {
      guidance: 'Water regularly during growth and flowering season. Allow topsoil to dry slightly between waterings.',
      frequency: '2-3 times per week',
      amount: 'Moderate'
    },
    sunlight: {
      preferred: 'Full Sun to Partial Shade',
      dailyHours: '4 - 6 hours daily'
    },
    soil: {
      preferredType: 'Fertile, well-drained loamy soil with compost',
      drainage: 'Moderate to high drainage capability',
      characteristics: 'pH 6.0 - 7.5, adaptable and fertile'
    },
    temperature: {
      range: '16°C - 30°C',
      guidance: 'Thrives in warm, sunny locations with pleasant breeze. Protect from hard frost.'
    },
    careInstructions: [
      'Provide sturdy trellis or fence climbing support for vining branches.',
      'Prune immediately after flowering season to maintain compact shape.',
      'Apply organic compost or balanced plant food in spring and summer.',
      'Pinch growing tips to encourage branching and fragrant flower buds.'
    ],
    commonDiseases: [
      { name: 'Leaf Spot', info: 'Fungal brown spots forming on foliage in high humidity.' },
      { name: 'Rust', info: 'Orange-brown rust pustules on lower leaf surfaces.' },
      { name: 'Wilt / Root Rot', info: 'Fungal rotting of roots caused by poor drainage or stagnant water.' }
    ],
    commonPests: [
      { name: 'Aphids', info: 'Clusters of small green insects on soft growing tips.' },
      { name: 'Scale Insects', info: 'Small brown shell-like bumps along stems sucking plant sap.' },
      { name: 'Spider Mites', info: 'Fine web spinners causing speckled yellow foliage during dry weather.' },
      { name: 'Whiteflies', info: 'Tiny white winged insects fluttering under leaves.' }
    ]
  },
  {
    id: 'marigold',
    name: 'Marigold',
    scientificName: 'Tagetes spp.',
    category: 'Garden Plants',
    type: 'Garden Plant',
    image: marigoldImg,
    water: {
      guidance: 'Water moderately when surface soil dries out. Avoid overwatering to keep roots healthy.',
      frequency: 'Moderate (allow surface to dry)',
      amount: 'Low to Moderate'
    },
    sunlight: {
      preferred: 'Full Sun',
      dailyHours: '6 - 8 hours daily'
    },
    soil: {
      preferredType: 'Well-drained soil',
      drainage: 'High drainage capacity',
      characteristics: 'pH 6.0 - 7.0, tolerant of poor soil conditions'
    },
    temperature: {
      range: '18°C - 35°C',
      guidance: 'Heat tolerant and resilient under bright sunny conditions.'
    },
    careInstructions: [
      'Deadhead spent flowers regularly to extend blooming period into late season.',
      'Water at soil level rather than spraying flowers directly to avoid botrytis rot.',
      'Plant near vegetable gardens as a natural pest deterrent.',
      'Ensure full sun exposure for vibrant yellow and orange flower heads.'
    ],
    commonDiseases: [
      { name: 'Leaf Spot', info: 'Dark circular spots on leaves under wet foliage conditions.' },
      { name: 'Botrytis Flower Rot', info: 'Gray mold decay rotting spent flower heads in rainy weather.' },
      { name: 'Stem / Root Rot', info: 'Fungal decay of roots under overly wet waterlogged soil.' },
      { name: 'Wilt', info: 'Fungal wilting of stems under high heat and damp soil.' }
    ],
    commonPests: [
      { name: 'Spider Mites', info: 'Microscopic pests causing foliage speckling in dry conditions.' },
      { name: 'Slugs and Snails', info: 'Chewing pests devouring tender leaves during moist evenings.' },
      { name: 'Beetles', info: 'Leaf-chewing beetles feeding on foliage.' }
    ]
  },
  {
    id: 'sunflower',
    name: 'Sunflower',
    scientificName: 'Helianthus annuus',
    category: 'Garden Plants',
    type: 'Garden Plant',
    image: sunflowerImg,
    water: {
      guidance: 'Water regularly and deeply while establishing and during dry flowering periods.',
      frequency: '1-2 times per week (deep soaking)',
      amount: 'Moderate (Deep)'
    },
    sunlight: {
      preferred: 'Full Sun',
      dailyHours: '6 - 8+ hours daily'
    },
    soil: {
      preferredType: 'Well-drained fertile soil',
      drainage: 'Deep, loose soil allowing taproot expansion',
      characteristics: 'pH 6.0 - 7.5, heavy feeder requiring organic compost'
    },
    temperature: {
      range: '20°C - 33°C',
      guidance: 'Loves summer heat and direct bright sunshine.'
    },
    careInstructions: [
      'Provide adequate space and support/staking for tall giant varieties.',
      'Water 3-4 inches away from main stem to encourage deep taproot development.',
      'Apply organic compost or nitrogen-rich fertilizer in early growing stages.',
      'Ensure bright unshaded sunlight for maximum flower head size.'
    ],
    commonDiseases: [
      { name: 'Powdery Mildew', info: 'White dusty film coating foliage in late summer.' },
      { name: 'Rust', info: 'Cinnamon-brown powdery spots appearing on lower leaf surfaces.' },
      { name: 'Leaf Spot', info: 'Dark brown spots on mature leaves.' }
    ],
    commonPests: [
      { name: 'Caterpillars', info: 'Larvae devouring foliage and tender shoot tips.' },
      { name: 'Beetles', info: 'Foliage-chewing beetles feeding on leaves.' },
      { name: 'Slugs and Snails', info: 'Chewing pests targeting young sunflower seedlings.' },
      { name: 'Aphids', info: 'Soft-bodied insects clustering under leaves.' }
    ]
  },

  // KITCHEN GARDEN (6)
  {
    id: 'tomato',
    name: 'Tomato',
    scientificName: 'Solanum lycopersicum',
    category: 'Kitchen Garden',
    type: 'Kitchen Garden Plant',
    image: tomatoImg,
    water: {
      guidance: 'Consistent watering; avoid extreme fluctuations between wet and dry to prevent blossom end rot and fruit splitting.',
      frequency: 'Consistent soil moisture (2-3 times/week)',
      amount: 'High'
    },
    sunlight: {
      preferred: 'Full Sun',
      dailyHours: '6 - 8 hours daily'
    },
    soil: {
      preferredType: 'Fertile, well-drained loamy soil',
      drainage: 'High drainage, rich in organic matter and calcium',
      characteristics: 'pH 6.0 - 6.8, compost-enriched with calcium balance'
    },
    temperature: {
      range: '21°C - 29°C',
      guidance: 'Requires warm soil. Cold nights below 13°C cause blossom drop and slow fruiting.'
    },
    careInstructions: [
      'Provide stakes, cages, or trellises early to support growing vines and heavy fruit clusters.',
      'Prune suckers (side shoots) between main stem and branches to focus energy on fruiting.',
      'Mulch base with organic material to retain consistent moisture and prevent soil splash rot.',
      'Ensure adequate soil calcium and steady moisture to prevent blossom end rot.'
    ],
    commonDiseases: [
      { name: 'Early Blight', info: 'Concentric dark target-like spots on mature lower leaves leading to defoliation.' },
      { name: 'Late Blight', info: 'Rapid water-soaked dark lesions on leaves and fruit under cool rainy conditions.' },
      { name: 'Fusarium / Verticillium Wilt', info: 'Fungal wilting of stems progressing upward from lower leaves.' },
      { name: 'Blossom End Rot', info: 'Dark sunken leathery rot on fruit bottom due to calcium deficiency or moisture stress.' }
    ],
    commonPests: [
      { name: 'Tomato Hornworm', info: 'Large green caterpillars with horn tail rapidly consuming leaves and fruit.' },
      { name: 'Aphids', info: 'Clusters of small green insects underneath leaves secreting sticky honeydew.' },
      { name: 'Whiteflies', info: 'Tiny white sap-sucking pests vectoring plant viruses.' },
      { name: 'Cutworms', info: 'Soil caterpillars severing young stems at soil level.' },
      { name: 'Fruitworms', info: 'Caterpillars boring holes into green and ripe fruits.' }
    ]
  },
  {
    id: 'chilli',
    name: 'Chilli',
    scientificName: 'Capsicum annuum',
    category: 'Kitchen Garden',
    type: 'Kitchen Garden Plant',
    image: chilliImg,
    water: {
      guidance: 'Regular watering when topsoil becomes dry; allow good drainage. Slight water stress increases pepper heat.',
      frequency: '2 times per week',
      amount: 'Moderate'
    },
    sunlight: {
      preferred: 'Full Sun',
      dailyHours: '6 - 8 hours daily'
    },
    soil: {
      preferredType: 'Fertile, well-drained soil',
      drainage: 'High drainage capability',
      characteristics: 'pH 6.0 - 7.0, organic compost enriched'
    },
    temperature: {
      range: '20°C - 32°C',
      guidance: 'Warm conditions, good sunlight, avoid waterlogging and cold frost.'
    },
    careInstructions: [
      'Pinch top growing tip on young plants (6-8 in tall) to stimulate bushier branching.',
      'Avoid excess nitrogen fertilizer which causes lush foliage but few chilli peppers.',
      'Provide light staking for erect upright growth loaded with pepper pods.',
      'Harvest peppers regularly with sharp shears to promote continuous flower setting.'
    ],
    commonDiseases: [
      { name: 'Leaf Spot', info: 'Fungal brown spots forming on leaves in wet humid conditions.' },
      { name: 'Chilli Leaf Curl Virus', info: 'Leaves curling upward and puckering with stunted plant growth transmitted by whiteflies.' },
      { name: 'Anthracnose (Fruit Rot)', info: 'Circular dark sunken lesions on chilli fruits during wet weather.' },
      { name: 'Root Rot / Wilt', info: 'Fungal root decay caused by excess water retention.' }
    ],
    commonPests: [
      { name: 'Aphids', info: 'Soft-bodied sap-sucking insects on tender shoot tips.' },
      { name: 'Whiteflies', info: 'Sap-sucking vector insects under foliage.' },
      { name: 'Thrips & Mites', info: 'Causes leaf curling, bronzing, and silvery leaf streaks.' },
      { name: 'Cutworms', info: 'Soil caterpillars severing young transplants.' }
    ]
  },
  {
    id: 'brinjal',
    name: 'Brinjal (Eggplant)',
    scientificName: 'Solanum melongena',
    category: 'Kitchen Garden',
    type: 'Kitchen Garden Plant',
    image: brinjalImg,
    water: {
      guidance: 'Consistent moisture in root zone without waterlogging during flowering and fruit development.',
      frequency: '2-3 times per week',
      amount: 'Moderate to High'
    },
    sunlight: {
      preferred: 'Full Sun',
      dailyHours: '6 - 8 hours daily'
    },
    soil: {
      preferredType: 'Fertile, well-drained loamy/sandy soil',
      drainage: 'High drainage capacity, organic rich',
      characteristics: 'pH 5.5 - 6.8, loose and well-aerated'
    },
    temperature: {
      range: '22°C - 33°C',
      guidance: 'Warm-growing crop requiring warm day and night temperatures.'
    },
    careInstructions: [
      'Warm soil, regular feeding, support plants with stakes if needed to keep heavy fruit off ground.',
      'Mulch soil around base to conserve moisture and suppress weeds.',
      'Feed with balanced organic liquid fertilizer every 2-3 weeks.',
      'Harvest fruits when skin is glossy and smooth before seeds harden.'
    ],
    commonDiseases: [
      { name: 'Wilt (Fusarium/Verticillium)', info: 'Wilting of lower foliage progressing up stems despite moist soil.' },
      { name: 'Leaf Spot', info: 'Brown circular fungal lesions on mature leaves.' },
      { name: 'Phomopsis Blight', info: 'Dark spots on foliage and pale rotting soft patches on fruits.' },
      { name: 'Damping-Off', info: 'Fungal decay of seedlings in wet soil.' }
    ],
    commonPests: [
      { name: 'Aphids & Whiteflies', info: 'Sap-sucking vector insects underneath foliage.' },
      { name: 'Fruit and Shoot Borer', info: 'Larvae boring into growing shoot tips causing wilting, and tunneling inside fruits.' },
      { name: 'Mites', info: 'Tiny pests causing foliage yellowing and speckling.' },
      { name: 'Flea Beetles', info: 'Tiny dark jumping beetles creating shot-holes in leaves.' }
    ]
  },
  {
    id: 'spinach',
    name: 'Spinach',
    scientificName: 'Spinacia oleracea',
    category: 'Kitchen Garden',
    type: 'Kitchen Garden Plant',
    image: spinachImg,
    water: {
      guidance: 'Keep soil consistently moist with regular gentle watering for tender leaves.',
      frequency: 'Consistent soil dampness (3-4 times/week)',
      amount: 'Moderate'
    },
    sunlight: {
      preferred: 'Full Sun to Partial Shade',
      dailyHours: '4 - 6 hours daily'
    },
    soil: {
      preferredType: 'Rich, moist, well-drained soil',
      drainage: 'Good drainage with high organic humus',
      characteristics: 'pH 6.5 - 7.5, rich in nitrogen for leafy growth'
    },
    temperature: {
      range: '10°C - 24°C',
      guidance: 'Cool-season crop; excessive heat causes rapid bolting (going to seed).'
    },
    careInstructions: [
      'Grow during cooler weather or provide afternoon shade in warm weather to delay bolting.',
      'Harvest outer leaves regularly (cut-and-come-again method) to encourage continuous foliage.',
      'Keep soil consistently damp; dry soil triggers bitterness and seed stalk growth.',
      'Apply high-nitrogen organic liquid fertilizer every 2 weeks.'
    ],
    commonDiseases: [
      { name: 'Downy Mildew', info: 'Yellow spots on upper leaf surfaces with grayish-purple mold underneath.' },
      { name: 'White Rust', info: 'White chalky blisters on underside of leaves.' },
      { name: 'Damping-Off', info: 'Fungal seedling collapse in wet soil.' }
    ],
    commonPests: [
      { name: 'Aphids', info: 'Clusters of small insects on underside of leaves.' },
      { name: 'Cutworms', info: 'Caterpillars severing young seedling stems.' },
      { name: 'Caterpillars / Leafminers', info: 'Chewing larvae or serpentine miners inside leaf tissue.' }
    ]
  },
  {
    id: 'mint',
    name: 'Mint',
    scientificName: 'Mentha spp.',
    category: 'Kitchen Garden',
    type: 'Kitchen Garden Plant',
    image: mintImg,
    water: {
      guidance: 'Keep soil evenly moist. Never let root system dry out completely.',
      frequency: 'Consistent moisture (3-4 times/week)',
      amount: 'Moderate to High'
    },
    sunlight: {
      preferred: 'Full Sun to Partial Shade',
      dailyHours: '3 - 5 hours daily'
    },
    soil: {
      preferredType: 'Moist, fertile, well-drained soil',
      drainage: 'Moist soil with adequate drainage',
      characteristics: 'pH 6.0 - 7.0, organic rich and moisture-retentive'
    },
    temperature: {
      range: '15°C - 26°C',
      guidance: 'Adaptable cool herb. Grows vigorously in container pots.'
    },
    careInstructions: [
      'Regular trimming, adequate moisture, grow in containers if spreading needs control.',
      'Harvest leaf tips frequently to maintain compact bushy growth and prevent flowering.',
      'Trim back woody stems near soil level every few months to stimulate fresh fragrant shoots.',
      'Keep soil consistently damp and provide bright indirect light.'
    ],
    commonDiseases: [
      { name: 'Rust', info: 'Orange or brown raised spots on leaf undersides causing leaf drop.' },
      { name: 'Leaf Spot', info: 'Fungal brown spots forming on foliage.' },
      { name: 'Fungal Root Rot', info: 'Root decay from stagnant waterlogging.' }
    ],
    commonPests: [
      { name: 'Aphids', info: 'Sucking insects targeting soft green stem tips.' },
      { name: 'Spider Mites', info: 'Tiny pests causing leaf yellowing and speckling in dry conditions.' },
      { name: 'Whiteflies', info: 'Small winged insects fluttering under leaves.' }
    ]
  },
  {
    id: 'coriander',
    name: 'Coriander (Cilantro)',
    scientificName: 'Coriandrum sativum',
    category: 'Kitchen Garden',
    type: 'Kitchen Garden Plant',
    image: corianderImg,
    water: {
      guidance: 'Moderate, consistent moisture with light spray. Avoid soggy waterlogged soil.',
      frequency: '2-3 times per week',
      amount: 'Moderate'
    },
    sunlight: {
      preferred: 'Full Sun to Light Shade',
      dailyHours: '4 - 6 hours daily'
    },
    soil: {
      preferredType: 'Moist, well-drained loamy soil',
      drainage: 'High drainage capability',
      characteristics: 'pH 6.2 - 7.5, friable and moderately fertile'
    },
    temperature: {
      range: '15°C - 25°C',
      guidance: 'Prefers cooler conditions; bolts quickly in excessive heat above 28°C.'
    },
    careInstructions: [
      'Sow successively, keep soil moist, provide some shade in very hot conditions.',
      'Sow seeds directly in final pots as taproots dislike transplanting.',
      'Harvest outer leaves when plant reaches 4-6 inches tall.',
      'Pinch off flower stems immediately to prolong leafy green production.'
    ],
    commonDiseases: [
      { name: 'Powdery Mildew', info: 'White powder film on foliage during dry humid days.' },
      { name: 'Leaf Spot', info: 'Brown circular spots on foliage in wet weather.' },
      { name: 'Damping-off', info: 'Fungal seedling collapse in wet cold soil.' }
    ],
    commonPests: [
      { name: 'Aphids', info: 'Small green or black insects feeding on soft stems and leaves.' },
      { name: 'Caterpillars', info: 'Chewing larvae feeding on tender foliage and young stems.' }
    ]
  }
];

export const Encyclopedia = () => {
  const [plantsList, setPlantsList] = useState(ENCYCLOPEDIA_DATASET);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [selectedType, setSelectedType] = useState('All Types');
  const [selectedPlant, setSelectedPlant] = useState(null);

  // Real-time Firestore subscription to 'plants' collection
  useEffect(() => {
    const plantsRef = collection(db, 'plants');
    const unsubscribe = onSnapshot(plantsRef, (snapshot) => {
      if (!snapshot.empty) {
        const loadedPlants = snapshot.docs.map((docSnap) => {
          const d = docSnap.data();
          const docId = docSnap.id.toLowerCase();
          const fallback = ENCYCLOPEDIA_DATASET.find(p => p.id === docId || p.name.toLowerCase() === (d.commonName || d.name || '').toLowerCase());

          return {
            id: docSnap.id,
            name: d.commonName || d.name || d.plantName || fallback?.name || 'Unnamed Plant',
            scientificName: d.scientificName || d.species || fallback?.scientificName || 'N/A',
            category: d.category || fallback?.category || 'Garden Plants',
            type: d.type || fallback?.type || 'Garden Plant',
            image: getPlantImage(docSnap.id || d.commonName || d.name, d.imageUrl || d.image || fallback?.image || ''),
            water: d.water || {
              guidance: d.watering || fallback?.water?.guidance || 'Water regularly.',
              frequency: d.watering || fallback?.water?.frequency || '1-2 times/week',
              amount: fallback?.water?.amount || 'Moderate'
            },
            sunlight: d.sunlightObj || {
              preferred: typeof d.sunlight === 'string' ? d.sunlight : fallback?.sunlight?.preferred || 'Full Sun',
              dailyHours: fallback?.sunlight?.dailyHours || '6-8 hours daily'
            },
            soil: d.soilObj || {
              preferredType: typeof d.soil === 'string' ? d.soil : fallback?.soil?.preferredType || 'Well-drained soil',
              drainage: fallback?.soil?.drainage || 'High drainage',
              characteristics: fallback?.soil?.characteristics || ''
            },
            temperature: d.tempObj || {
              range: d.temperature || fallback?.temperature?.range || '18°C - 30°C',
              guidance: fallback?.temperature?.guidance || ''
            },
            careInstructions: Array.isArray(d.careInstructions) 
              ? d.careInstructions 
              : (typeof d.careInstructions === 'string' && d.careInstructions ? d.careInstructions.split('\n').filter(Boolean) : (fallback?.careInstructions || [])),
            commonDiseases: d.commonDiseases || fallback?.commonDiseases || [],
            commonPests: d.commonPests || fallback?.commonPests || []
          };
        });

        setPlantsList(loadedPlants);
      }
    }, (err) => {
      console.error("Error listening to Firestore plants collection:", err);
    });

    return () => unsubscribe();
  }, []);

  // Filter Plants
  const filteredPlants = plantsList.filter(plant => {
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch = query === '' || 
      plant.name.toLowerCase().includes(query) ||
      plant.scientificName.toLowerCase().includes(query);

    const matchesCategory = selectedCategory === 'All Categories' || plant.category === selectedCategory;
    const matchesType = selectedType === 'All Types' || plant.type === selectedType;

    return matchesSearch && matchesCategory && matchesType;
  });

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All Categories');
    setSelectedType('All Types');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 py-6 px-4 font-sans">
      
      {/* Header Title */}
      <div className="space-y-1 text-left">
        <h2 className="text-3xl font-extrabold text-[#063D24] dark:text-emerald-400 flex items-center gap-2">
          Plant Encyclopedia <BookOpen className="w-7 h-7 text-[#16883D]" />
        </h2>
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 max-w-2xl">
          Explore information about various plants, their care, diseases, pests and more.
        </p>
      </div>

      {/* Top Search & Filters Card */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 border border-slate-100 dark:border-slate-700 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end">
          
          {/* Search Input */}
          <div className="sm:col-span-6 space-y-1 text-left">
            <label className="block text-[11px] font-bold text-slate-800 dark:text-slate-200">
              Search Plants
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by plant name or scientific name..."
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-[#16883D] outline-none bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-medium placeholder-slate-400"
              />
            </div>
          </div>

          {/* Category Dropdown */}
          <div className="sm:col-span-3 space-y-1 text-left">
            <label className="block text-[11px] font-bold text-slate-800 dark:text-slate-200">
              Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-[#16883D] outline-none bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-medium"
            >
              <option value="All Categories">All Categories</option>
              <option value="Garden Plants">Garden Plants</option>
              <option value="Kitchen Garden">Kitchen Garden</option>
            </select>
          </div>

          {/* Type Dropdown */}
          <div className="sm:col-span-3 space-y-1 text-left">
            <label className="block text-[11px] font-bold text-slate-800 dark:text-slate-200">
              Type
            </label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-[#16883D] outline-none bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-medium"
            >
              <option value="All Types">All Types</option>
              <option value="Garden Plant">Garden Plant</option>
              <option value="Kitchen Garden Plant">Kitchen Garden Plant</option>
            </select>
          </div>

        </div>
      </div>

      {/* Main Content: Plant Cards Grid or Empty State */}
      {filteredPlants.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-12 border border-slate-100 dark:border-slate-700 shadow-sm text-center min-h-[320px] flex flex-col items-center justify-center space-y-3">
          <div className="w-16 h-16 rounded-full bg-[#EAF6E8] dark:bg-emerald-950/60 text-[#16883D] flex items-center justify-center">
            <BookOpen className="w-8 h-8 stroke-[1.75]" />
          </div>

          <div className="space-y-1">
            <h3 className="font-extrabold text-slate-900 dark:text-white text-base">No plants found</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
              Search for a plant or select different filters to explore information.
            </p>
          </div>

          <button
            onClick={handleClearFilters}
            className="px-4 py-2 rounded-xl bg-[#16883D] text-white text-xs font-bold hover:bg-[#127032] transition-all shadow-sm"
          >
            Reset All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPlants.map((plant) => (
            <div 
              key={plant.id}
              onClick={() => setSelectedPlant(plant)}
              className="group cursor-pointer bg-white dark:bg-slate-800 rounded-3xl overflow-hidden border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                {/* Plant Image Container */}
                <div className="relative h-48 w-full bg-slate-100 dark:bg-slate-900 overflow-hidden flex items-center justify-center">
                  <img 
                    src={plant.image} 
                    alt={plant.name} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                  <div className="hidden flex-col items-center justify-center gap-1 text-emerald-600 bg-slate-100 dark:bg-slate-900 w-full h-full p-4 text-center">
                    <Sprout className="w-8 h-8 text-emerald-500" />
                    <span className="text-[10px] font-bold text-slate-500">{plant.name}</span>
                  </div>
                  <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm text-[#16883D] dark:text-emerald-400 text-[10px] font-extrabold shadow-sm">
                    {plant.category}
                  </div>
                </div>

                {/* Plant Card Info */}
                <div className="p-5 text-left space-y-2">
                  <div>
                    <h3 className="text-lg font-extrabold text-slate-900 dark:text-white group-hover:text-[#16883D] transition-colors">
                      {plant.name}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 italic font-semibold">
                      {plant.scientificName}
                    </p>
                  </div>

                  {/* Summary badges */}
                  <div className="flex flex-wrap items-center gap-2 text-[11px] pt-1">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-semibold border border-emerald-100 dark:border-emerald-900/40">
                      <Sun className="w-3 h-3 text-amber-500 shrink-0" />
                      <span>{plant.sunlight.preferred}</span>
                    </span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 font-semibold border border-blue-100 dark:border-blue-900/40">
                      <Droplets className="w-3 h-3 text-blue-500 shrink-0" />
                      <span>{plant.water.frequency}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* View Info Footer Button */}
              <div className="px-5 pb-5 pt-1 text-left">
                <button className="w-full py-2.5 px-4 rounded-xl bg-[#EAF6E8] dark:bg-emerald-950/50 text-[#16883D] dark:text-emerald-300 font-bold text-xs flex items-center justify-between group-hover:bg-[#16883D] group-hover:text-white transition-all">
                  <span>View Plant Guide</span>
                  <ChevronRight className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Bottom Info Banner */}
      <div className="p-4 rounded-2xl bg-[#EAF6E8] dark:bg-emerald-950/30 border border-[#EAF6E8] dark:border-emerald-900/50 text-[#16883D] dark:text-emerald-300 text-xs flex items-center gap-2 text-left">
        <Info className="w-4 h-4 shrink-0" />
        <span>Find detailed information about plants including care tips, ideal conditions, common diseases, pests and more.</span>
      </div>

      {/* PLANT DETAIL MODAL */}
      {selectedPlant && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-2xl w-full p-6 sm:p-7 space-y-6 shadow-2xl border border-slate-100 dark:border-slate-700 max-h-[90vh] overflow-y-auto text-left animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm shrink-0 bg-slate-100 dark:bg-slate-900 flex items-center justify-center">
                  <img 
                    src={selectedPlant.image} 
                    alt={selectedPlant.name} 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                  <div className="hidden flex-col items-center justify-center text-emerald-600">
                    <Sprout className="w-6 h-6" />
                  </div>
                </div>
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-[#16883D] text-white">
                    {selectedPlant.category}
                  </span>
                  <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
                    {selectedPlant.name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 italic font-semibold">
                    {selectedPlant.scientificName}
                  </p>
                </div>
              </div>

              <button 
                onClick={() => setSelectedPlant(null)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* SECTION A: BASIC INFORMATION */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Common Name</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{selectedPlant.name}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Scientific Name</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 italic">{selectedPlant.scientificName}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Category / Type</span>
                <span className="font-bold text-[#16883D] dark:text-emerald-400">{selectedPlant.category} ({selectedPlant.type})</span>
              </div>
            </div>

            {/* SECTION B: WATER REQUIREMENTS */}
            <div className="space-y-2">
              <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                <Droplets className="w-4 h-4" />
                Water Requirements
              </h4>
              <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 text-xs space-y-1.5">
                <p className="text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                  {selectedPlant.water.guidance}
                </p>
                <div className="flex flex-wrap gap-4 pt-1 font-semibold text-slate-600 dark:text-slate-400">
                  <span><strong>Frequency:</strong> {selectedPlant.water.frequency}</span>
                  <span>•</span>
                  <span><strong>Water Amount:</strong> {selectedPlant.water.amount}</span>
                </div>
              </div>
            </div>

            {/* SECTION C: SUNLIGHT REQUIREMENTS */}
            <div className="space-y-2">
              <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                <Sun className="w-4 h-4" />
                Sunlight Requirements
              </h4>
              <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40 text-xs space-y-1.5">
                <div className="flex flex-wrap gap-4 font-semibold text-slate-700 dark:text-slate-300">
                  <span><strong>Preferred Sunlight:</strong> {selectedPlant.sunlight.preferred}</span>
                  <span>•</span>
                  <span><strong>Daily Sunlight:</strong> {selectedPlant.sunlight.dailyHours}</span>
                </div>
              </div>
            </div>

            {/* SECTION D: SOIL REQUIREMENTS */}
            <div className="space-y-2">
              <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                <Layers className="w-4 h-4" />
                Soil Requirements
              </h4>
              <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 text-xs space-y-1.5">
                <div className="space-y-1 text-slate-700 dark:text-slate-300 font-medium">
                  <p><strong>Preferred Soil Type:</strong> {selectedPlant.soil.preferredType}</p>
                  <p><strong>Drainage Requirement:</strong> {selectedPlant.soil.drainage}</p>
                  <p><strong>Soil Characteristics:</strong> {selectedPlant.soil.characteristics}</p>
                </div>
              </div>
            </div>

            {/* SECTION E: TEMPERATURE REQUIREMENTS */}
            <div className="space-y-2">
              <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
                <Thermometer className="w-4 h-4" />
                Temperature Requirements
              </h4>
              <div className="p-4 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 text-xs space-y-1.5">
                <div className="space-y-1 text-slate-700 dark:text-slate-300 font-medium">
                  <p><strong>Preferred Temperature Range:</strong> {selectedPlant.temperature.range}</p>
                  <p><strong>Guidance:</strong> {selectedPlant.temperature.guidance}</p>
                </div>
              </div>
            </div>

            {/* SECTION F: CARE INSTRUCTIONS */}
            <div className="space-y-2">
              <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider flex items-center gap-1.5 text-[#16883D] dark:text-emerald-400">
                <Sprout className="w-4 h-4" />
                Care Instructions & Maintenance
              </h4>
              <ul className="space-y-2 text-xs">
                {selectedPlant.careInstructions.map((instruction, idx) => (
                  <li key={idx} className="flex items-start gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-[#16883D] shrink-0 mt-0.5" />
                    <span>{instruction}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* SECTION G: COMMON DISEASES */}
            <div className="space-y-2">
              <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider flex items-center gap-1.5 text-amber-700 dark:text-amber-400">
                <ShieldAlert className="w-4 h-4" />
                Common Plant Diseases
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {selectedPlant.commonDiseases.map((dis, idx) => (
                  <div key={idx} className="p-3 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/50 space-y-1">
                    <span className="font-bold text-amber-900 dark:text-amber-300 block">{dis.name}</span>
                    <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">{dis.info}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* SECTION H: COMMON PESTS */}
            <div className="space-y-2">
              <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider flex items-center gap-1.5 text-purple-700 dark:text-purple-400">
                <Bug className="w-4 h-4" />
                Common Plant Pests
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {selectedPlant.commonPests.map((pst, idx) => (
                  <div key={idx} className="p-3 rounded-2xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200/60 dark:border-purple-900/50 space-y-1">
                    <span className="font-bold text-purple-900 dark:text-purple-300 block">{pst.name}</span>
                    <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">{pst.info}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Close Footer */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-700 flex justify-end">
              <button
                onClick={() => setSelectedPlant(null)}
                className="px-5 py-2.5 rounded-xl bg-[#16883D] text-white hover:bg-[#127032] font-bold text-xs transition-all shadow-sm"
              >
                Close Guide
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
