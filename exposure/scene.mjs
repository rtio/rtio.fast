import {blurDiameter,subjectX,motionPixels,exposure,SUBJECTS} from './model.mjs';
export const W=1000,H=625;
const WORLD_X=W*.6,WORLD_Y=H*.6;
const worldCanvas=()=>Object.assign(document.createElement('canvas'),{width:W*2.2,height:H*2.2});
const canvas=()=>Object.assign(document.createElement('canvas'),{width:W,height:H});
function random(seed) {return ()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};}
function ellipse(c,x,y,rx,ry,color){c.fillStyle=color;c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fill();}
function line(c,pts,color,width){c.strokeStyle=color;c.lineWidth=width;c.lineCap='round';c.beginPath();pts.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.stroke();}
// Palette and scene direction adapted from the user's Exposure Lab reference.
const PALETTES={
  daylight:{sky:['#608fba','#b3d1da','#e2e6c8'],city:'#8da0a3',window:'#e1d9ac',tree:['#486342','#5e7c46','#768a50'],grass:['#7f9959','#506f3f'],path:['#bba580','#d3be98'],bulbs:.25},
  overcast:{sky:['#7a899a','#b1bec8','#d9ded8'],city:'#82909b',window:'#cdc9a8',tree:['#3f5d49','#57775a','#708569'],grass:['#6f885f','#506c4b'],path:['#a59f8f','#c5bfad'],bulbs:.35},
  golden:{sky:['#56638b','#c68c7b','#f5c685'],city:'#92736d',window:'#ffdba1',tree:['#535630','#717344','#85814a'],grass:['#90924e','#596b38'],path:['#ba936c','#dfb485'],bulbs:1},
  dusk:{sky:['#344367','#797b9e','#d4a5a2'],city:'#5a5d76',window:'#ffd699',tree:['#354746','#45605b','#5d6f5c'],grass:['#597467','#3b564c'],path:['#8b8a92','#b2a7a0'],bulbs:1}
};
function tree(c,x,y,size,r,p){
  line(c,[[x,y],[x-2*size,y-115*size]],'#615e47',8*size);
  for(let i=0;i<12;i++){
    const xx=x+(r()-.5)*100*size,yy=y-100*size-r()*64*size;
    ellipse(c,xx,yy,(25+r()*20)*size,(28+r()*20)*size,p.tree[i%3]);
  }
}
function makeLayers(light){
  const r=random(921),p=PALETTES[light];
  const back=worldCanvas(),ground=worldCanvas(),front=worldCanvas(),bulbs=[];
  const c=back.getContext('2d');c.translate(WORLD_X,WORLD_Y);
  const sky=c.createLinearGradient(0,-80,0,360);
  p.sky.forEach((v,i)=>sky.addColorStop(i/2,v));c.fillStyle=sky;c.fillRect(-W,-H,W*3,H*3);
  if(light==='golden'||light==='daylight'){
    const x=light==='golden'?145:810,y=light==='golden'?245:80,rad=light==='golden'?36:24;
    const glow=c.createRadialGradient(x,y,0,x,y,rad*5);glow.addColorStop(0,'#fff3cc');glow.addColorStop(.2,'#ffedbead');glow.addColorStop(1,'#ffdf9900');c.fillStyle=glow;c.fillRect(x-rad*5,y-rad*5,rad*10,rad*10);ellipse(c,x,y,rad,rad,'#fff1c3');
  }
  if(light==='overcast')for(let i=0;i<24;i++)ellipse(c,r()*W*3-W,r()*130,50+r()*100,9+r()*12,'#d4dcdf45');
  for(let x=-W;x<2*W;){
    const width=28+r()*60,height=65+r()*125,top=320-height;
    c.fillStyle=p.city;c.fillRect(x,top,width,height+25);
    if(r()<.3)c.fillRect(x+width*.6,top-13,2,13);
    for(let yy=top+9;yy<318;yy+=13)for(let xx=x+7;xx<x+width-5;xx+=11){c.fillStyle=r()<.25?p.window:'#15212622';c.fillRect(xx,yy,4,6);}
    x+=width+7+r()*13;
  }
  const haze=c.createLinearGradient(0,150,0,355);haze.addColorStop(0,p.sky[2]+'00');haze.addColorStop(1,p.sky[2]+'77');c.fillStyle=haze;c.fillRect(-W,150,W*3,210);
  c.fillStyle=p.grass[0];c.fillRect(-W,335,W*3,H*2);
  for(let i=-8;i<18;i++)tree(c,i*120+r()*40,357+r()*7,.7+r()*.45,r,p);
  // Lamps and sagging strings provide point highlights for optical defocus.
  for(let x=-W+70;x<2*W;x+=220){
    line(c,[[x,350],[x,219]],'#373b32',4);line(c,[[x-7,219],[x+7,219]],'#373b32',4);bulbs.push({x,y:215,r:3.5});
    const points=[];for(let j=0;j<=24;j++){const xx=x+j/24*220,yy=225+Math.sin(j/24*Math.PI)*29;points.push([xx,yy]);if(j%2===1)bulbs.push({x:xx,y:yy+2,r:1.5});}line(c,points,'#373b3299',1);
  }
  for(let i=0;i<3;i++)line(c,[[730,330+i*6],[801,330+i*6]],'#735c46',4);
  line(c,[[729,351],[803,351]],'#695540',5);line(c,[[738,352],[735,365]],'#3b4338',3);line(c,[[793,352],[796,365]],'#3b4338',3);
  const g=ground.getContext('2d');g.translate(WORLD_X,WORLD_Y);
  const grass=g.createLinearGradient(0,350,0,750);grass.addColorStop(0,p.grass[0]);grass.addColorStop(1,p.grass[1]);g.fillStyle=grass;g.fillRect(-W,354,W*3,H*2);
  const path=g.createLinearGradient(0,374,0,492);path.addColorStop(0,p.path[0]);path.addColorStop(1,p.path[1]);g.fillStyle=path;g.fillRect(-W,374,W*3,118);
  line(g,[[-W,376],[2*W,376]],'#27291c26',3);g.setLineDash([24,22]);line(g,[[-W,438],[2*W,438]],'#f7e7bb45',2);g.setLineDash([]);
  for(let i=0;i<12000;i++){const x=r()*W*3-W,y=360+r()*800;g.fillStyle=i%2?'#f4e5a518':'#14271b14';g.fillRect(x,y,1+r()*2,y>497?2+r()*4:1);}
  const f=front.getContext('2d');f.translate(WORLD_X,WORLD_Y);
  for(let i=0;i<550;i++){
    const x=r()*W*3-W,y=620+r()*400,h=12+r()*65;
    line(f,[[x,y],[x-10+r()*20,y-h]],p.grass[i%2],1+r()*3);
  }
  for(let i=0;i<90;i++){
    const x=i<38?r()*W:r()*W*3-W,y=535+r()*(i<38?95:420),h=15+r()*30;
    line(f,[[x,y+65],[x+7,y-h]],p.grass[1],2);ellipse(f,x+3,y+18,10,3,p.grass[0]);
    const xx=x+7,yy=y-h,sz=4+r()*4,col=['#d99198','#e8c975','#eee2c3','#bca3c5'][i%4];
    for(let j=0;j<6;j++){const a=j*Math.PI/3;ellipse(f,xx+Math.cos(a)*sz,yy+Math.sin(a)*sz,sz*.65,sz*.55,col);}ellipse(f,xx,yy,sz*.35,sz*.35,'#8b6c36');
  }
  for(let i=0;i<22;i++){const side=i%2,x=side?W-r()*75:r()*75;f.strokeStyle=p.grass[i%2];f.lineWidth=3+r()*4;f.beginPath();f.moveTo(x,700);f.quadraticCurveTo(x+(side?-20:20),545,x+(side?-70:70),450+r()*100);f.stroke();}
  return {back,ground,front,bulbs,palette:p};
}
function cyclist(c,x,time,y=430){
  c.save();c.translate(x,y);c.scale(.83,.83);
  ellipse(c,0,9,101,8,'#4f594b33');
  for(const xx of [-68,66]){
    ellipse(c,xx,-34,38,38,'#303d3e');ellipse(c,xx,-34,33,33,'#c3b9a133');
    c.strokeStyle='#d5d4c2';c.lineWidth=1.1;
    for(let i=0;i<12;i++){const a=i*Math.PI/6+time*5;c.beginPath();c.moveTo(xx,-34);c.lineTo(xx+Math.cos(a)*33,-34+Math.sin(a)*33);c.stroke();}
    c.strokeStyle='#d7ddd5';c.lineWidth=2;c.beginPath();c.arc(xx,-34,34,0,Math.PI*2);c.stroke();
  }
  line(c,[[-68,-34],[-28,-91],[1,-34],[-68,-34]],'#be654a',5);
  line(c,[[-28,-91],[44,-94],[1,-34],[66,-34],[44,-111]],'#be654a',5);
  line(c,[[-30,-93],[-35,-108]],'#344846',4);line(c,[[-49,-109],[-22,-109]],'#263e40',7);
  line(c,[[44,-110],[51,-117],[63,-115]],'#263e40',4);
  const a=time*5,px=1+Math.cos(a)*17,py=-34+Math.sin(a)*17;
  line(c,[[-31,-117],[-14,-79],[2-Math.cos(a)*17,-34-Math.sin(a)*17]],'#334956',13);
  line(c,[[-31,-119],[-42,-76],[px,py]],'#253e4b',14);
  line(c,[[px-8,py],[px+10,py]],'#f0e9da',6);
  line(c,[[-34,-122],[-14,-162],[17,-151]],'#dbb957',30);
  line(c,[[-9,-157],[25,-132],[52,-115]],'#d7a37e',9);
  line(c,[[-9,-157],[14,-140]],'#e0c268',15);
  line(c,[[16,-160],[26,-177]],'#d5a079',12);
  ellipse(c,29,-183,13,16,'#d5a079');
  ellipse(c,26,-195,18,10,'#f0dfb6');line(c,[[13,-192],[43,-191]],'#334d4f',3);
  line(c,[[30,-177],[35,-189]],'#344a45',1.8);
  ellipse(c,39,-185,1.3,1.3,'#2a3434');
  c.restore();
}
function walker(c,x,time,y=430){
  c.save();c.translate(x,y);
  const stride=Math.sin(time*4),bob=Math.cos(time*8)*1.5;
  ellipse(c,0,6,41,6,'#34433235');c.translate(0,bob);
  line(c,[[0,-76],[-13-stride*18,-39],[-stride*30,0]],'#394856',12);
  line(c,[[0,-76],[12+stride*18,-39],[stride*30,0]],'#526371',13);
  line(c,[[-stride*30-6,0],[-stride*30+10,0]],'#e9dfce',6);
  line(c,[[stride*30-5,0],[stride*30+12,0]],'#e9dfce',6);
  line(c,[[0,-123],[-stride*16,-98],[-stride*25,-79]],'#bd9277',8);
  line(c,[[-2,-120],[0,-76]],'#5b9290',29);
  line(c,[[3,-119],[stride*15+7,-99],[stride*25+12,-83]],'#d6ab87',8);
  line(c,[[3,-122],[stride*7+5,-110]],'#6fa6a0',12);
  line(c,[[2,-124],[5,-138]],'#d6ab87',10);
  ellipse(c,7,-151,13,17,'#d6ab87');
  c.fillStyle='#544332';c.beginPath();c.arc(5,-158,14,Math.PI,Math.PI*2);c.lineTo(17,-151);c.lineTo(-8,-151);c.closePath();c.fill();
  ellipse(c,17,-151,1.2,1.2,'#3e4038');
  // Small backpack makes the silhouette readable at wide angles.
  line(c,[[-13,-116],[-17,-87]],'#bc8957',16);
  c.restore();
}
function car(c,x,time,y=430){
  c.save();c.translate(x,y);
  ellipse(c,0,6,168,10,'#29352e45');
  c.fillStyle='#658b9a';c.beginPath();c.moveTo(-155,-22);c.lineTo(-149,-63);c.quadraticCurveTo(-145,-72,-113,-73);c.lineTo(-76,-110);c.quadraticCurveTo(-62,-122,-42,-123);c.lineTo(41,-123);c.quadraticCurveTo(61,-122,77,-106);c.lineTo(105,-75);c.lineTo(152,-66);c.quadraticCurveTo(163,-62,164,-48);c.lineTo(165,-22);c.closePath();c.fill();
  c.fillStyle='#9bb8bd';c.beginPath();c.moveTo(-99,-76);c.lineTo(-64,-111);c.lineTo(-16,-111);c.lineTo(-16,-76);c.closePath();c.fill();
  c.beginPath();c.moveTo(-8,-111);c.lineTo(42,-111);c.lineTo(78,-76);c.lineTo(-8,-76);c.closePath();c.fill();
  // Driver and window reflections.
  ellipse(c,28,-97,7,8,'#696f69');line(c,[[23,-88],[35,-79]],'#6d7770',9);
  line(c,[[-84,-80],[-53,-107]],'#d5e2d54a',4);line(c,[[6,-106],[36,-80]],'#d5e2d54a',3);
  line(c,[[-146,-69],[-115,-69]],'#a7c1c4',3);line(c,[[-11,-69],[-11,-29]],'#3f626e',1);
  line(c,[[0,-65],[14,-65]],'#c3c7b8',3);line(c,[[-75,-65],[-62,-65]],'#c3c7b8',3);
  line(c,[[-150,-24],[158,-24]],'#314753',7);
  for(const xx of [-99,102]){
    ellipse(c,xx,-20,29,29,'#27333a');ellipse(c,xx,-20,19,19,'#a9b5b0');ellipse(c,xx,-20,13,13,'#5e7075');
    for(let i=0;i<5;i++){const a=time*8+i*Math.PI*2/5;line(c,[[xx,-20],[xx+Math.cos(a)*15,-20+Math.sin(a)*15]],'#bdc8c1',2);}
    ellipse(c,xx,-20,4,4,'#c7cdc1');
  }
  line(c,[[149,-57],[157,-56]],'#ffedb1',7);line(c,[[-146,-57],[-145,-48]],'#d88568',5);
  line(c,[[156,-30],[169,-30]],'#c4cbbb',4);line(c,[[-159,-30],[-146,-30]],'#c4cbbb',4);
  c.restore();
}
const SPRITES={walker:{draw:walker,width:120,height:200,x:60,y:180},cyclist:{draw:cyclist,width:250,height:220,x:125,y:195},car:{draw:car,width:360,height:160,x:180,y:140}};
export class Scene {
  constructor(target){
    this.target=target;target.width=W;target.height=H;
    this.ctx=target.getContext('2d');this.raw=canvas();this.c=this.raw.getContext('2d',{willReadFrequently:true});
    this.static=canvas();this.sc=this.static.getContext('2d');this.trail=canvas();this.tc=this.trail.getContext('2d');this.cacheKey='';this.light='';
    this.poses=new Map();this.histogram=new Uint32Array(32);
    this.linear=Float32Array.from({length:256},(_,i)=>{const v=i/255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;});
    this.encoding=Uint8Array.from({length:8193},(_,i)=>{const v=i/8192;return Math.round(255*(v<=.0031308?v*12.92:1.055*v**(1/2.4)-.055));});
  }
  render(state,time){
    if(this.light!==state.light){this.layers=makeLayers(state.light);this.light=state.light;}
    const focalLength=state.focalLength??50,z=focalLength/50,subject=state.subject??'cyclist',rate=SUBJECTS[subject].poseRate,shape=SPRITES[subject];
    const crop=(context,layer)=>context.drawImage(layer,WORLD_X+(W-W/z)/2-8/z,WORLD_Y+(H-H/z)/2-8/z,(W+16)/z,(H+16)/z,-8,-8,W+16,H+16);
    const key=`${state.light}/${state.aperture}/${focalLength}`;
    if(this.cacheKey!==key){
      this.sc.clearRect(0,0,W,H);this.sc.filter=`blur(${blurDiameter(state.aperture,25000,W,focalLength)/2}px)`;
      crop(this.sc,this.layers.back);this.sc.filter='none';
      // Defocus spreads point-light energy across an aperture-shaped disk.
      const blur=blurDiameter(state.aperture,25000,W,focalLength)/2;
      for(const bulb of this.layers.bulbs){
        const x=W/2+(bulb.x-W/2)*z,y=H/2+(bulb.y-H/2)*z;
        const base=bulb.r*z,radius=Math.sqrt(base*base+blur*blur);
        if(x+radius<0||x-radius>W||y+radius<0||y-radius>H)continue;
        const energy=Math.min(1,(base*base)/(radius*radius)*this.layers.palette.bulbs);
        this.sc.globalAlpha=energy;this.sc.fillStyle='#ffe8a7';this.sc.beginPath();
        for(let i=0;i<6;i++){const angle=i*Math.PI/3;const xx=x+Math.cos(angle)*radius,yy=y+Math.sin(angle)*radius;i?this.sc.lineTo(xx,yy):this.sc.moveTo(xx,yy);}this.sc.closePath();this.sc.fill();
        this.sc.globalAlpha=energy*.18;ellipse(this.sc,x,y,radius*2.5,radius*2.5,'#ffdf95');
      }
      this.sc.globalAlpha=1;crop(this.sc,this.layers.ground);
      // Preblur the transparent foreground once per aperture change.
      this.front=canvas();const fc=this.front.getContext('2d');fc.filter=`blur(${blurDiameter(state.aperture,3000,W,focalLength)/2}px)`;crop(fc,this.layers.front);
      this.cacheKey=key;
    }
    this.c.drawImage(this.static,0,0);
    this.tc.clearRect(0,0,W,H);
    const count=Math.max(1,Math.min(128,Math.ceil(motionPixels(state.shutter,W,focalLength,subject)/1.5)));
    // Add premultiplied samples, not source-over ghosts: one exposure integrates time.
    this.tc.globalCompositeOperation='lighter';this.tc.globalAlpha=1/count;
    for(let i=0;i<count;i++){
      const t=time-state.shutter*(i+.5)/count;
      const phase=((Math.round(t*rate/(Math.PI*2)*64)%64)+64)%64,key=`${subject}/${phase}`;
      if(!this.poses.has(key)){
        const sprite=Object.assign(document.createElement('canvas'),{width:shape.width,height:shape.height});
        shape.draw(sprite.getContext('2d'),shape.x,phase/64*Math.PI*2/rate,shape.y);this.poses.set(key,sprite);
      }
      this.tc.drawImage(this.poses.get(key),subjectX(t,W,focalLength,subject)-shape.x*z,H/2+(430-shape.y-H/2)*z,shape.width*z,shape.height*z);
    }
    this.tc.globalAlpha=1;this.tc.globalCompositeOperation='source-over';
    this.c.drawImage(this.trail,0,0);this.c.drawImage(this.front,0,0);
    const {brightness,photons,gain}=exposure(state);
    const frame=this.c.getImageData(0,0,W,H),d=frame.data;
    let seed=(Math.floor(time*24)+1)*17171;
    const noise=.008*gain*Math.sqrt(photons*.18+.0004); // illustrative photon + read noise, before encoding
    const linear=this.linear,encoding=this.encoding;
    this.histogram.fill(0);
    for(let i=0;i<d.length;i+=4){
      seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;
      const n=((seed>>>0)/4294967295-.5)*3.46*noise;
      for(let ch=0;ch<3;ch++){
        const value=linear[d[i+ch]]*brightness+n;
        d[i+ch]=encoding[Math.max(0,Math.min(8192,(value*8192)|0))];
      }
    }
    for(let i=0;i<d.length;i+=64)this.histogram[Math.min(31,Math.floor((d[i]*.2126+d[i+1]*.7152+d[i+2]*.0722)/8))]++;
    this.ctx.putImageData(frame,0,0);
  }
}
