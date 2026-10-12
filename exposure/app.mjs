import {APERTURES,SHUTTERS,ISOS,LIGHTS,LENSES,SUBJECTS,subjectSpeedLabel,exposure,depthOfField,motionPixels,preset,shutterLabel} from './model.mjs';
import {Scene,W,H} from './scene.mjs';
const $=id=>document.getElementById(id);
let state={aperture:2.8,shutter:1/250,iso:100,light:'golden',focalLength:50,subject:'cyclist'};
let goal=null,edited=false,time=0,lastTime=performance.now(),lastFrame=0,shotId=0;
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
let paused=reduced.matches;
const photos=new Map();
let photoA=null,photoB=null;
const scene=new Scene($('scene'));
for(const lens of LENSES){const option=document.createElement('option');option.value=lens.mm;option.textContent=`${lens.mm} mm — ${lens.name}`;$('lens').append(option);}
const names={freeze:'Freeze movement',background:'Blur the background',sharp:'Keep the scene sharp',motion:'Show motion'};
const tips={freeze:'A fast shutter holds the subject still in the photo. It collects less light, so in dim conditions ISO rises and noise becomes more visible.',background:'A wide aperture separates the subject from the flowers and trees. It admits more light, so daylight needs a fast shutter.',sharp:'A small aperture extends the range of acceptable sharpness. Less light gets in, so ISO rises or the shutter slows in dim conditions. Depth of field cannot freeze movement.',motion:'A longer exposure records a trail while the subject keeps the same pace. The stationary camera keeps the park still. More light gets in, so use a smaller aperture or lower ISO.'};
function evText(n){return `${n>=0?'+':'−'}${Math.abs(n).toFixed(1)}`;}
function settingsText(s){return `f/${s.aperture}  ·  ${shutterLabel(s.shutter)}  ·  ISO ${s.iso}`;}
function drawHistogram(){
  const c=$('histogram').getContext('2d'),bins=scene.histogram,max=Math.max(1,...bins);
  c.clearRect(0,0,164,76);c.fillStyle='#e5dec9';
  for(let i=0;i<bins.length;i++){const h=bins[i]/max*70;c.fillRect(i*164/32,76-h,164/32+.3,h);}
}
function update(){
  const e=exposure(state),d=depthOfField(state.aperture,state.focalLength),motion=motionPixels(state.shutter,W,state.focalLength,state.subject);
  for(const [id,key,values,format] of [['aperture','aperture',APERTURES,v=>`f/${v}`],['shutter','shutter',SHUTTERS,shutterLabel],['iso','iso',ISOS,String]]){
    $(id).value=values.indexOf(state[key]);$(id+'-value').textContent=format(state[key]);$(id).setAttribute('aria-valuetext',format(state[key]));$(id).setAttribute('aria-describedby',id+'-help');
  }
  document.querySelectorAll('[data-subject]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.subject===state.subject));
  $('subject-help').textContent=`${subjectSpeedLabel(state.subject)} · Slow park pace`;
  $('lens').value=state.focalLength;$('lens-summary').textContent=`${state.focalLength} mm`;
  $('lens-help').textContent=`${state.focalLength<50?'Wider view, smaller subjects and more depth of field.':state.focalLength>50?'Tighter view, larger subjects and shallower depth of field.':'A natural starting view between wide and telephoto.'} Camera position and focus stay fixed. Idealized lens.`;
  $('strip-a').textContent=`f/${state.aperture}`;$('strip-s').textContent=shutterLabel(state.shutter);$('strip-i').textContent=state.iso;
  const soft=[['flowers',3],['trees',25]].filter(([,distance])=>distance<d.near||distance>d.far).map(([name])=>name);
  $('aperture-help').textContent=`Acceptably sharp: ${d.near.toFixed(1)} m to ${Number.isFinite(d.far)?d.far.toFixed(1)+' m':'infinity'}. ${soft.length?'Softer: '+soft.join(' and ')+'.':'Flowers and trees are in range.'}`;
  $('shutter-help').textContent=motion<1?'The subject is frozen. A short exposure collects less light.':motion<7?'A little movement shows. A longer exposure collects more light.':'A visible motion trail. The subject is moving at the same speed.';
  $('iso-help').textContent=`${state.iso/100}× digital gain. ${state.iso>=800?'Noise becomes more visible. ':''}ISO does not collect more light.`;
  $('exposure-equation').textContent=`${LIGHTS[state.light].name}: EV ${LIGHTS[state.light].ev} · Gain ×${state.iso/100}`;
  const judgment=Math.abs(e.stops)<.35?'Balanced':e.stops>0?'Brighter':'Darker';
  $('meter-reading').textContent=`${evText(e.stops)} EV · ${judgment}`;
  $('needle').style.left=`${(Math.max(-3,Math.min(3,e.stops))+3)/6*100}%`;
  const meter=document.querySelector('[role=meter]');meter.setAttribute('aria-valuenow',Math.max(-3,Math.min(3,e.stops)).toFixed(1));meter.setAttribute('aria-valuetext',`${evText(e.stops)} stops, ${judgment.toLowerCase()}${Math.abs(e.stops)>3?', outside meter scale':''}`);
  document.querySelectorAll('[data-light]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.light===state.light));
  document.querySelectorAll('[data-goal]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.goal===goal));
  if(goal){
    const start=preset(goal,state.light,state.focalLength,state.subject);
    $('guidance').replaceChildren();const title=document.createElement('strong');title.textContent=`${names[goal]}${edited?' · Your variation':''}. `;$('guidance').append(title,`Starting point: ${settingsText(start)}. ${tips[goal]}`);
    if(goal==='sharp'){const target=depthOfField(start.aperture,state.focalLength);if(target.near>3||target.far<25)$('guidance').append(' With this lens, even f/22 cannot keep both 3 m flowers and 25 m trees sharp at a 6 m focus distance. Try a wider lens.');}
    if(goal==='motion'&&state.light==='daylight')$('guidance').append(' In daylight, f/22 needs 1/60 s at ISO 100. Try overcast or dusk for a longer trail; a real camera could use an ND filter.');
  }
  if(Math.abs(e.stops)>1 && goal)$('guidance').append(e.stops>1?' Your current image is bright; highlights may clip. Try a faster shutter, smaller aperture or lower ISO.':' Your current image is dark. A longer shutter or wider aperture collects more light; higher ISO only brightens the result.');
  $('scene').setAttribute('aria-label',`Simulated ${LIGHTS[state.light].name.toLowerCase()} park photograph of a ${SUBJECTS[state.subject].name.toLowerCase()} moving at ${subjectSpeedLabel(state.subject)}, with a ${state.focalLength} mm lens. ${settingsText(state)}. ${judgment}. Sharpness from ${d.near.toFixed(1)} metres to ${Number.isFinite(d.far)?d.far.toFixed(1)+' metres':'infinity'}. ${motion<1?'Subject frozen.':'Subject shows motion blur.'}`);
  scene.render(state,time);drawHistogram();
}
for(const [id,key,values] of [['aperture','aperture',APERTURES],['shutter','shutter',SHUTTERS],['iso','iso',ISOS]])$(id).addEventListener('input',e=>{state={...state,[key]:values[Number(e.target.value)]};edited=true;update();});
document.querySelectorAll('[data-subject]').forEach(b=>b.addEventListener('click',()=>{if(b.dataset.subject===state.subject)return;state={...state,subject:b.dataset.subject};time=0;lastTime=performance.now();edited=true;update();}));
$('lens').addEventListener('change',()=>{state={...state,focalLength:Number($('lens').value)};edited=true;update();});
document.querySelectorAll('[data-light]').forEach(b=>b.addEventListener('click',()=>{state={...state,light:b.dataset.light};edited=true;update();}));
document.querySelectorAll('[data-goal]').forEach(b=>b.addEventListener('click',()=>{goal=b.dataset.goal;edited=false;state=preset(goal,state.light,state.focalLength,state.subject);update();}));
function syncPause(){ $('pause').textContent=paused?'▷ Play':'Ⅱ Pause';$('pause').setAttribute('aria-pressed',String(paused));$('live-label').textContent=paused?'Scene paused':'Live view'; }
$('pause').addEventListener('click',()=>{paused=!paused;lastTime=performance.now();syncPause();});
reduced.addEventListener('change',e=>{paused=e.matches;syncPause();});
document.addEventListener('visibilitychange',()=>{lastTime=performance.now();});
function animate(now){
  const elapsed=(now-lastTime)/1000;lastTime=now;
  if(!paused&&!document.hidden)time+=elapsed;
  if(!paused&&!document.hidden&&now-lastFrame>=1000/24){scene.render(state,time);drawHistogram();lastFrame=now;}
  requestAnimationFrame(animate);
}
function countPhotos(){const n=photos.size;$('shot-count').textContent=`${n} ${n===1?'photo':'photos'} · saved in this tab`;$('empty').hidden=!!n;$('shots').hidden=!n;$('clear').hidden=!n;}
function removePhoto(id){const photo=photos.get(id);if(!photo)return;URL.revokeObjectURL(photo.url);URL.revokeObjectURL(photo.download);photo.card.remove();photos.delete(id);countPhotos();updateComparison();}
function formatDepth(photo){const d=depthOfField(photo.aperture,photo.focalLength);return `${d.near.toFixed(1)} m–${Number.isFinite(d.far)?d.far.toFixed(1)+' m':'∞'}`;}
function assignPhoto(slot,id){
  if(slot==='A'){if(photoB===id)photoB=photoA;photoA=id;}
  else {if(photoA===id)photoA=photoB;photoB=id;}
  updateComparison();$('status').textContent=`Photo ${id} selected as ${slot}.`;
}
function updateComparison(){
  const ids=[...photos.keys()];
  if(!photos.has(photoA))photoA=ids.find(id=>id!==photoB)??ids[0]??null;
  if(!photos.has(photoB)||photoB===photoA)photoB=ids.find(id=>id!==photoA)??null;
  for(const [id,p] of photos){p.card.dataset.a=String(id===photoA);p.card.dataset.b=String(id===photoB);p.card.querySelector('[data-assign=A]').setAttribute('aria-pressed',String(id===photoA));p.card.querySelector('[data-assign=B]').setAttribute('aria-pressed',String(id===photoB));}
  const a=photos.get(photoA),b=photos.get(photoB);$('comparison').hidden=!(a&&b);
  if(!a||!b){$('compare-a').removeAttribute('src');$('compare-b').removeAttribute('src');return;}
  for(const [side,p,id] of [['a',a,photoA],['b',b,photoB]]){
    if($('compare-'+side).getAttribute('src')!==p.url)$('compare-'+side).src=p.url;
    $('compare-'+side).alt=`Photo ${id}: ${settingsText(p)}, ${p.focalLength} mm, ${SUBJECTS[p.subject].name}, ${LIGHTS[p.light].name}`;
    $('tag-'+side).textContent=`${side.toUpperCase()} · ${id}`;$('compare-title-'+side).textContent=`${side.toUpperCase()} · Photo ${id}`;
  }
  const ea=exposure(a),eb=exposure(b);
  const rows=[['Subject',SUBJECTS[a.subject].name,SUBJECTS[b.subject].name],['Speed',subjectSpeedLabel(a.subject),subjectSpeedLabel(b.subject)],['Aperture',`f/${a.aperture}`,`f/${b.aperture}`],['Shutter',shutterLabel(a.shutter),shutterLabel(b.shutter)],['ISO',a.iso,b.iso],['Lens',`${a.focalLength} mm`,`${b.focalLength} mm`],['Light',LIGHTS[a.light].name,LIGHTS[b.light].name],['Exposure',`${evText(ea.stops)} EV`,`${evText(eb.stops)} EV`],['Sharp range',formatDepth(a),formatDepth(b)],['Motion trail',`${motionPixels(a.shutter,W,a.focalLength,a.subject).toFixed(1)} px`,`${motionPixels(b.shutter,W,b.focalLength,b.subject).toFixed(1)} px`]];
  $('compare-values').replaceChildren();for(const row of rows){const tr=document.createElement('tr');row.forEach((value,i)=>{const cell=document.createElement(i?'td':'th');if(!i)cell.scope='row';cell.textContent=value;tr.append(cell);});$('compare-values').append(tr);}
  const delta=eb.stops-ea.stops,ma=motionPixels(a.shutter,W,a.focalLength,a.subject),mb=motionPixels(b.shutter,W,b.focalLength,b.subject),ratio=eb.photons/ea.photons;
  const notes=[Math.abs(delta)<.2?'Both photos have about the same rendered exposure.':`B is ${Math.abs(delta).toFixed(1)} stops ${delta>0?'brighter':'darker'} than A.`,Math.abs(ma-mb)<.5?'Both settings record a similar amount of motion.':`${mb<ma?'B':'A'} records less motion blur. A longer trail can be a deliberate choice.`];
  if(Math.abs(Math.log2(ratio))>.2)notes.push(`${ratio>1?'B':'A'} collected ${(ratio>1?ratio:1/ratio).toFixed(1)}× as much light. Raising ISO cannot replace that light.`);
  if(a.subject!==b.subject)notes.push('These subjects move at different speeds, so motion blur changes even at the same shutter speed.');
  if(a.focalLength!==b.focalLength)notes.push('The lenses frame the scene differently; the wipe is not an aligned overlay.');
  else if(a.subject===b.subject&&Math.abs(a.time-b.time)>.1)notes.push('The subject moved between captures; compare the effect as well as the position.');
  $('compare-copy').replaceChildren(...notes.map(text=>{const li=document.createElement('li');li.textContent=text;return li;}));
}
$('compare-slider').addEventListener('input',e=>{$('wipe').style.setProperty('--split',e.target.value+'%');e.target.setAttribute('aria-valuetext',`${e.target.value}% photo A, ${100-Number(e.target.value)}% photo B`);});
function blobOf(canvas){return new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('Image export failed.')),'image/png'));}
$('capture').addEventListener('click',async()=>{
  const button=$('capture');button.disabled=true;
  try{
    scene.render(state,time);
    const saved={...state},savedTime=time,id=++shotId,e=exposure(saved);
    // Copy pixels synchronously before the next animation frame or control event.
    const photo=document.createElement('canvas');photo.width=W;photo.height=H;photo.getContext('2d').drawImage($('scene'),0,0);
    const output=document.createElement('canvas');output.width=W;output.height=H+110;const c=output.getContext('2d');c.drawImage(photo,0,0);c.fillStyle='#fbfcfd';c.fillRect(0,H,W,110);c.fillStyle='#14202b';c.font='600 23px system-ui';c.fillText(`Exposure playground — photo ${id}`,25,H+35);c.font='18px system-ui';c.fillText(`${settingsText(saved)}  ·  ${LIGHTS[saved.light].name}  ·  ${evText(e.stops)} EV`,25,H+65);c.fillStyle='#526372';c.font='13px system-ui';c.fillText(`${SUBJECTS[saved.subject].name} · ${subjectSpeedLabel(saved.subject)} · Full-frame / ${saved.focalLength} mm / focus 6 m · Illustrative noise · rtio.fast/exposure/`,25,H+91);
    const [blob,downloadBlob]=await Promise.all([blobOf(photo),blobOf(output)]);
    const url=URL.createObjectURL(blob),download=URL.createObjectURL(downloadBlob);
    const card=document.createElement('figure');card.className='shot';card.dataset.shot=String(id);
    const img=document.createElement('img');img.src=url;img.alt=`Photo ${id}: ${SUBJECTS[saved.subject].name}, ${LIGHTS[saved.light].name}, ${settingsText(saved)}, ${saved.focalLength} mm, ${evText(e.stops)} EV`;img.width=W;img.height=H;
    const caption=document.createElement('figcaption');
    // All interpolated values are from the local model, never user markup.
    caption.innerHTML=`<div class="shot-top"><strong>Photo ${String(id).padStart(2,'0')}</strong><span>${LIGHTS[saved.light].name}</span></div><p class="shot-values">${settingsText(saved)}</p><div class="shot-detail">${SUBJECTS[saved.subject].name} · ${subjectSpeedLabel(saved.subject)} · ${saved.focalLength} mm · ${evText(e.stops)} EV</div><div class="shot-actions"></div>`;
    const a=document.createElement('a');a.href=download;a.download=`exposure-${id}-${saved.subject}-${saved.focalLength}mm-f${saved.aperture}-iso${saved.iso}.png`;a.textContent='Download PNG';a.setAttribute('aria-label',`Download PNG for photo ${id} with settings`);
    const remove=document.createElement('button');remove.textContent='Remove';remove.setAttribute('aria-label',`Remove photo ${id}`);remove.addEventListener('click',()=>{removePhoto(id);$('capture').focus();$('status').textContent=`Photo ${id} removed.`;});caption.querySelector('.shot-actions').append(a,remove);
    const assign=document.createElement('div');assign.className='assign-actions';
    for(const slot of ['A','B']){const b=document.createElement('button');b.textContent=`Set ${slot}`;b.dataset.assign=slot;b.setAttribute('aria-label',`Set ${slot} to photo ${id}`);b.setAttribute('aria-pressed','false');b.addEventListener('click',()=>assignPhoto(slot,id));assign.append(b);}
    caption.append(assign);card.append(img,caption);
    photos.set(id,{...saved,time:savedTime,url,download,card});$('shots').append(card);
    if(photoA===null)photoA=id;else photoB=id;
    // Bound image memory; keep the most recent twelve photographs.
    if(photos.size>12){removePhoto(photos.keys().next().value);$('status').textContent=`Photo ${id} captured. Oldest photo removed; the contact sheet holds 12 photos.`;}else $('status').textContent=`Photo ${id} captured. ${photos.size} photos ready to compare below.`;
    countPhotos();updateComparison();$('shots').scrollLeft=$('shots').scrollWidth;
  }catch(err){$('status').textContent='Could not save this photo. Try capturing again.';console.error(err);}
  finally{button.disabled=false;}
});
$('clear').addEventListener('click',()=>{for(const id of [...photos.keys()])removePhoto(id);$('capture').focus();$('status').textContent='Photos cleared.';});
try{syncPause();update();requestAnimationFrame(animate);}catch(err){$('error').hidden=false;$('error').textContent='The scene could not start. Try a current browser with Canvas support.';console.error(err);}
