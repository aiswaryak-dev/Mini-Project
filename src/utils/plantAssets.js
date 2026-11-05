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

export const PLANT_LOCAL_IMAGES = {
  rose: roseImg,
  hibiscus: hibiscusImg,
  jasmine: jasmineImg,
  marigold: marigoldImg,
  sunflower: sunflowerImg,
  tomato: tomatoImg,
  chilli: chilliImg,
  brinjal: brinjalImg,
  spinach: spinachImg,
  mint: mintImg,
  coriander: corianderImg
};

export const getPlantImage = (plantIdentifier, fallbackUrl = '') => {
  if (!plantIdentifier) return fallbackUrl;
  const key = String(plantIdentifier).toLowerCase().trim();

  // 1. Direct ID match
  if (PLANT_LOCAL_IMAGES[key]) return PLANT_LOCAL_IMAGES[key];

  // 2. Common name keyword match
  if (key.includes('rose')) return roseImg;
  if (key.includes('hibiscus')) return hibiscusImg;
  if (key.includes('jasmine')) return jasmineImg;
  if (key.includes('marigold')) return marigoldImg;
  if (key.includes('sunflower')) return sunflowerImg;
  if (key.includes('tomato')) return tomatoImg;
  if (key.includes('chilli') || key.includes('chili') || key.includes('pepper')) return chilliImg;
  if (key.includes('brinjal') || key.includes('eggplant')) return brinjalImg;
  if (key.includes('spinach')) return spinachImg;
  if (key.includes('mint')) return mintImg;
  if (key.includes('coriander') || key.includes('cilantro')) return corianderImg;

  return fallbackUrl || '';
};
