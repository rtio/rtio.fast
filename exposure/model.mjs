// A teaching model: linear light collection and digital gain are kept separate.
export const APERTURES = [1.4, 2, 2.8, 4, 5.6, 8, 11, 16, 22];
export const SHUTTERS = [1/4000, 1/2000, 1/1000, 1/500, 1/250, 1/125, 1/60, 1/30, 1/15, 1/8, 1/4, 1/2, 1];
export const ISOS = [100, 200, 400, 800, 1600, 3200, 6400, 12800];
export const LIGHTS = {daylight: {name:'Daylight', ev:15}, overcast:{name:'Overcast',ev:12}, golden:{name:'Golden hour',ev:11}, dusk:{name:'Dusk',ev:8}};
export const LENSES = [{mm:24,name:"Wide angle"},{mm:35,name:"Moderate wide"},{mm:50,name:"Standard"},{mm:85,name:"Short telephoto"},{mm:135,name:"Telephoto"}];
export const SUBJECTS = Object.freeze({
  walker:{name:'Walker',speed:400,poseRate:4},
  cyclist:{name:'Cyclist',speed:800,poseRate:5},
  car:{name:'Car',speed:2400,poseRate:8}
}); // Illustrative slow park speeds, mm/s.
export const subjectSpeedLabel = subject => `${(SUBJECTS[subject].speed*.0036).toFixed(1)} km/h`;
export const CAMERA = Object.freeze({mode:'digital', focalLength:50, focus:6000, sensorWidth:36, coc:0.03}); // mm, mm/s
export const shutterLabel = t => t < 1 ? `1/${Math.round(1/t)} s` : '1 s';
export function exposure({aperture, shutter, iso, light}) {
  const photons = 2 ** LIGHTS[light].ev * shutter / aperture ** 2;
  const gain = iso / 100;
  return {photons, gain, brightness:photons*gain, stops:Math.log2(photons*gain)};
}
export function blurDiameter(aperture, distance, width=1200, focalLength=50) {
  const f=focalLength, {focus:s, sensorWidth} = CAMERA;
  return f*f*Math.abs(distance-s)/(aperture*distance*(s-f))*width/sensorWidth;
}
export function depthOfField(aperture,focalLength=50) {
  const f=focalLength, {focus:s,coc} = CAMERA;
  const h = f*f/(aperture*coc)+f;
  return {near:h*s/(h+s-f)/1000, far:h <= s-f ? Infinity : h*s/(h-s+f)/1000};
}
// Repeat one world path outside the widest field of view, independently of the lens.
export function projectX(x,width=1200,focalLength=50) {
  return width/2+(x-width/2)*focalLength/50;
}
export function subjectX(seconds,width=1200,focalLength=50,subject='cyclist') {
  const speed = SUBJECTS[subject].speed*50/CAMERA.focus*width/CAMERA.sensorWidth;
  const span = width*3+400;
  const worldX=((seconds*speed+width*.47+width+200)%span+span)%span-width-200;
  return projectX(worldX,width,focalLength);
}
export function motionPixels(shutter,width=1200,focalLength=50,subject='cyclist') {
  return SUBJECTS[subject].speed*focalLength/CAMERA.focus*width/CAMERA.sensorWidth*shutter;
}
const closest = (values,target) => values.reduce((a,b)=>Math.abs(Math.log2(b/target))<Math.abs(Math.log2(a/target))?b:a);
export function preset(goal,light,focalLength=50,subject='cyclist') {
  const choices = {freeze:[5.6,1/1000], background:[2.8,1/4000], sharp:[16,1/125], motion:[16,1/15]};
  let [aperture,shutter] = choices[goal];
  const ev=LIGHTS[light].ev;
  if(goal==='freeze') {
    shutter={walker:1/500,cyclist:1/1000,car:1/2000}[subject];
    const neededISO=100*aperture**2/(2**ev*shutter);
    if(neededISO<100) shutter=closest(SHUTTERS,aperture**2/2**ev);
    if(neededISO>ISOS.at(-1)) aperture=APERTURES.filter(a=>100*a*a/(2**ev*shutter)<=ISOS.at(-1)).at(-1)??APERTURES[0];
  }
  if(goal==='sharp') {
    aperture=APERTURES.find(a=>{const d=depthOfField(a,focalLength);return d.near<=3&&d.far>=25;})??22;
    const neededISO=100*aperture**2/(2**ev*shutter);
    if(neededISO<100) shutter=closest(SHUTTERS,aperture**2/2**ev);
    if(neededISO>ISOS.at(-1)) shutter=closest(SHUTTERS,100*aperture**2/(2**ev*ISOS.at(-1)));
  }
  // Keep wide-open portraits at ISO 100 by choosing the nearest shutter.
  if(goal==='background') shutter=closest(SHUTTERS,aperture**2/2**ev);
  // Motion studies use a smaller aperture in bright light to preserve highlights.
  if(goal==='motion' && light==='daylight') { aperture=22; shutter=1/60; }
  const iso=closest(ISOS,100*aperture**2/(2**ev*shutter));
  return {aperture,shutter,iso,light,focalLength,subject};
}
