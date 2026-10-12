import test from 'node:test';
import assert from 'node:assert/strict';
import {exposure,blurDiameter,depthOfField,subjectX,motionPixels,preset,APERTURES,SHUTTERS,ISOS,LIGHTS,LENSES,projectX,SUBJECTS} from './model.mjs';
const base={aperture:4,shutter:1/1000,iso:100,light:'daylight'};
test('one shutter stop doubles light; ISO changes gain only',()=>{
  const a=exposure(base),b=exposure({...base,shutter:1/500}),c=exposure({...base,iso:200});
  assert.equal(b.photons,a.photons*2);assert.equal(c.photons,a.photons);assert.equal(c.brightness,a.brightness*2);
  assert.equal(exposure({...base,shutter:1/2000,iso:200}).brightness,a.brightness);
});
test('aperture area and scene EV determine collected light',()=>{
  assert.equal(exposure({...base,aperture:8}).photons,exposure(base).photons/4);
  assert.equal(exposure({...base,light:'overcast'}).photons,exposure(base).photons/8);
});
test('focus plane stays sharp; stopping down broadens depth of field',()=>{
  assert.equal(blurDiameter(1.4,6000),0);
  assert.ok(blurDiameter(1.4,3000)>blurDiameter(16,3000));
  assert.ok(blurDiameter(1.4,25000)>blurDiameter(16,25000));
  assert.ok(depthOfField(16).near<3);assert.ok(depthOfField(16).far>25);
  assert.ok(depthOfField(1.4).near>depthOfField(16).near);
});
test('motion uses physical elapsed time and shutter interval independently',()=>{
  assert.ok(Math.abs(subjectX(1)-subjectX(0)-motionPixels(1))<1e-8);
  assert.ok(Math.abs(motionPixels(1/15)/motionPixels(1/1000)-1000/15)<1e-10);
  for(const t of [-100,0,7,100]) assert.ok(subjectX(t)>=-1400 && subjectX(t)<2600);
});
test('all goal/light presets use real controls; achievable targets meter close to zero',()=>{
  for(const light of Object.keys(LIGHTS)) for(const goal of ['freeze','background','sharp','motion']) {
    const p=preset(goal,light);assert.ok(APERTURES.includes(p.aperture));assert.ok(SHUTTERS.includes(p.shutter));assert.ok(ISOS.includes(p.iso));
    assert.ok(Math.abs(exposure(p).stops)<0.55,`${goal}/${light}`);
  }
});

test('lens changes preserve exposure but change projection and depth of field',()=>{
  for(const {mm} of LENSES){
    assert.deepEqual(exposure({...base,focalLength:mm}),exposure(base));
    assert.ok(Math.abs((subjectX(1,1000,mm)-500)/(mm/50)-(subjectX(1,1000,50)-500))<1e-8);
    assert.ok(Math.abs(subjectX(1,1000,mm)-subjectX(0,1000,mm)-motionPixels(1,1000,mm))<1e-8);
    assert.equal(blurDiameter(2.8,6000,1000,mm),0);
  }
  assert.equal(motionPixels(.1,1000,100),motionPixels(.1,1000,50)*2);
  assert.ok(blurDiameter(2.8,25000,1000,135)>blurDiameter(2.8,25000,1000,24));
  assert.ok(depthOfField(8,24).near<depthOfField(8,135).near);
  assert.equal(projectX(500,1000,135),500);
});
test('goals retain every lens and do not claim impossible whole-scene sharpness',()=>{
  for(const {mm} of LENSES) for(const light of Object.keys(LIGHTS)) for(const goal of ['freeze','background','sharp','motion']) {
    const p=preset(goal,light,mm);assert.equal(p.focalLength,mm);
    assert.ok(Math.abs(exposure(p).stops)<.55,`${mm} mm / ${goal} / ${light}`);
    assert.ok(APERTURES.includes(p.aperture));assert.ok(SHUTTERS.includes(p.shutter));assert.ok(ISOS.includes(p.iso));
    if(goal==='sharp') {const d=depthOfField(p.aperture,mm);assert.ok((d.near<=3&&d.far>=25)||p.aperture===22);}
  }
  assert.ok(depthOfField(preset('sharp','daylight',135).aperture,135).near>3);
});

test('subject speed controls both real-time position and integrated motion, without altering exposure',()=>{
  for(const subject of Object.keys(SUBJECTS)) for(const {mm} of LENSES){
    const delta=subjectX(.1,1000,mm,subject)-subjectX(0,1000,mm,subject);
    assert.ok(Math.abs(delta-motionPixels(.1,1000,mm,subject))<1e-8);
    assert.deepEqual(exposure({...base,subject}),exposure(base));
    assert.equal(subjectX(0,1000,mm,subject),subjectX(0,1000,mm));
  }
  assert.ok(motionPixels(.1,1000,50,'walker')<motionPixels(.1,1000,50,'cyclist'));
  assert.equal(motionPixels(.1,1000,50,'car'),motionPixels(.1,1000,50,'cyclist')*3);
});
test('every subject survives every lens/light/goal preset with a usable exposure',()=>{
  for(const subject of Object.keys(SUBJECTS)) for(const {mm} of LENSES) for(const light of Object.keys(LIGHTS)) for(const goal of ['freeze','background','sharp','motion']){
    const p=preset(goal,light,mm,subject);assert.equal(p.subject,subject);assert.equal(p.focalLength,mm);
    assert.ok(APERTURES.includes(p.aperture));assert.ok(SHUTTERS.includes(p.shutter));assert.ok(ISOS.includes(p.iso));
    assert.ok(Math.abs(exposure(p).stops)<.55,`${subject}/${mm}/${light}/${goal}`);
    if(goal==='freeze')assert.ok(motionPixels(p.shutter,1000,mm,subject)<1);
  }
});
