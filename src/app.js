// ==============================
// Agrícola BE — Editor (UX centrado)
// app.js (renderer)
// ==============================

// --- Referencias DOM principales ---
const svg = document.getElementById('logo');
const arcTop = document.getElementById('arcTop');
const arcBottom = document.getElementById('arcBottom');
const tpTop = document.getElementById('tpTop');
const tpBottom = document.getElementById('tpBottom');
const txtTopNode = document.getElementById('txtTop');
const txtBottomNode = document.getElementById('txtBottom');
const mandala = document.getElementById('mandala');
const ringOuter = document.getElementById('ringOuter');
const ringInner = document.getElementById('ringInner');
const dotL = document.getElementById('dotL');
const dotR = document.getElementById('dotR');

// Mapa de si la fuente es variable (todas del HTML lo son)
const VARIABLE_FONT = {
  "Inter, sans-serif": true,
  "Playfair Display, serif": true,
  "Montserrat, sans-serif": true,
  "Roboto Slab, serif": true,
  "Lora, serif": true,
  "Oswald, sans-serif": true,
  "Poppins, sans-serif": true,
  "Raleway, sans-serif": true,
  "Source Serif Pro, serif": true,
  "Work Sans, sans-serif": true
};

// --- BASE: valores del SVG original (sliders en 0 = original) ---
const BASE = {
  color: '#234b3f',
  top:    { fs:100, letter:10, weight:700, sx:100, sy:100, skew:0, radius:329, start:201, span:180, offset:38, shiftX:0, shiftY:0, font:'Inter, sans-serif', text:'AGRÍCOLA BE', upper:true, anchor:'middle' },
  bottom: { fs:100, letter:10, weight:700, sx:100, sy:100, skew:0, radius:412, start:187, span:177, offset:53, shiftX:0, shiftY:0, font:'Inter, sans-serif', text:'DESDE LA TIERRA', upper:true, anchor:'middle' },
  ring:   { outerR:445, outerW:19, innerR:282, innerW:12 },
  dotL:   { angle:183, orbit:445, x:68,  y:489, r:18, useXY:false },
  dotR:   { angle:0,   orbit:332, x:844, y:512, r:9,  useXY:false },
  mandala:{ petals:18, curv:31, length:229, width:115, stroke:8, scale:99, rot:166, center:4 }
};

// --- Utils ---
function arcPath(cx, cy, r, startDeg, spanDeg, flip=false){
  const toRad = d => d * Math.PI/180;
  const fromDeg = startDeg;
  const toDeg = flip ? (startDeg + spanDeg) : (startDeg - spanDeg);
  const start = { x: cx + r * Math.cos(toRad(fromDeg)), y: cy + r * Math.sin(toRad(fromDeg)) };
  const end   = { x: cx + r * Math.cos(toRad(toDeg)),   y: cy + r * Math.sin(toRad(toDeg))   };
  const sweep = flip ? 0 : 1;
  const large = (Math.abs(spanDeg) > 180) ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${large} ${sweep} ${end.x} ${end.y}`;
}
function petalPath(len, wid, curv/*0..100*/){
  const a = wid/2;
  const c = (curv/100) * len * 0.7;
  return `M 0 0 C ${a} ${-c}, ${a} ${-len+c}, 0 ${-len} C ${-a} ${-len+c}, ${-a} ${-c}, 0 0 Z`;
}
function drawMandala(petals, len, wid, curv, stroke, color, scale, rot, center){
  mandala.innerHTML = '';
  mandala.setAttribute('stroke-width', stroke);
  mandala.setAttribute('stroke', color);
  const gAll = document.createElementNS('http://www.w3.org/2000/svg','g');
  gAll.setAttribute('transform', `translate(512,512) rotate(${rot}) scale(${(scale/100)})`);
  const p1 = document.createElementNS('http://www.w3.org/2000/svg','path');
  p1.setAttribute('d', petalPath(len,wid,curv));
  p1.setAttribute('fill','none');
  for(let i=0;i<petals;i++){
    const g = document.createElementNS('http://www.w3.org/2000/svg','g');
    g.setAttribute('transform', `rotate(${(360/petals)*i})`);
    g.appendChild(p1.cloneNode());
    gAll.appendChild(g);
  }
  const p2 = document.createElementNS('http://www.w3.org/2000/svg','path');
  p2.setAttribute('d', petalPath(len*0.65, wid*0.9, Math.min(100,curv*1.1)));
  p2.setAttribute('fill','none'); p2.setAttribute('opacity','0.9');
  for(let i=0;i<petals;i++){
    const g2 = document.createElementNS('http://www.w3.org/2000/svg','g');
    g2.setAttribute('transform', `rotate(${(360/petals)*i + 180/petals})`);
    g2.appendChild(p2.cloneNode());
    gAll.appendChild(g2);
  }
  const c = document.createElementNS('http://www.w3.org/2000/svg','circle');
  c.setAttribute('cx','0'); c.setAttribute('cy','0'); c.setAttribute('r', center); c.setAttribute('fill', color);
  gAll.appendChild(c);
  mandala.appendChild(gAll);
}
function placeDotPolar(node, r, angleDeg){
  const rad = angleDeg * Math.PI/180;
  const x = 512 + r * Math.cos(rad);
  const y = 512 + r * Math.sin(rad);
  node.setAttribute('cx', x); node.setAttribute('cy', y);
}
function placeDotXY(node, x, y){ node.setAttribute('cx', x); node.setAttribute('cy', y); }

function setTextStyle(node, tpNode, ff, size, ls, color, anchor, shiftX, shiftY, upper, content, weight, scaleX, scaleY, skew){
  node.setAttribute('font-family', ff);
  node.setAttribute('font-size', size);
  node.setAttribute('letter-spacing', ls);
  node.setAttribute('fill', color);
  node.setAttribute('text-anchor', anchor);

  // Font weight con variable fonts
  if (VARIABLE_FONT[ff]) {
    node.style.fontVariationSettings = `'wght' ${weight}`;
    node.removeAttribute('font-weight'); // evitar conflictos
    document.getElementById(node.id.includes('Top') ? 'topWeightDelta' : 'bottomWeightDelta').disabled = false;
  } else {
    node.style.removeProperty('font-variation-settings');
    node.setAttribute('font-weight', Math.round(weight));
    document.getElementById(node.id.includes('Top') ? 'topWeightDelta' : 'bottomWeightDelta').disabled = true;
  }

  // Geo transform
  node.setAttribute('transform', `translate(${shiftX},${shiftY}) skewX(${skew}) scale(${(scaleX/100)},${(scaleY/100)})`);
  tpNode.textContent = upper ? content.toUpperCase() : content;
}

// --- SYNC principal ---
function sync(){
  // TOP
  const ffTop = document.getElementById('topFont').value || BASE.top.font;
  const fsTop = BASE.top.fs + (+document.getElementById('topFontSizeDelta').value || 0);
  const letTop= BASE.top.letter + (+document.getElementById('topLetterDelta').value || 0);
  const wTop  = Math.max(1, BASE.top.weight + (+document.getElementById('topWeightDelta').value || 0));
  const sxTop = BASE.top.sx + (+document.getElementById('topScaleXDelta').value || 0);
  const syTop = BASE.top.sy + (+document.getElementById('topScaleYDelta').value || 0);
  const skTop = BASE.top.skew + (+document.getElementById('topSkewDelta').value || 0);
  const rTop  = Math.max(1, BASE.top.radius + (+document.getElementById('topRadiusDelta').value || 0));
  const stTop = BASE.top.start + (+document.getElementById('topStartDelta').value || 0);
  const spTop = Math.max(1, BASE.top.span + (+document.getElementById('topSpanDelta').value || 0));
  const offTop= Math.min(100, Math.max(0, BASE.top.offset + (+document.getElementById('topOffsetDelta').value || 0)));
  const shxT  = BASE.top.shiftX + (+document.getElementById('topShiftXDelta').value || 0);
  const shyT  = BASE.top.shiftY + (+document.getElementById('topShiftYDelta').value || 0);
  const ancT  = document.getElementById('topAnchor').value || BASE.top.anchor;
  const upTop = document.getElementById('topUpper').checked;
  const txtT  = document.getElementById('topText').value || BASE.top.text;
  const topColor = document.getElementById('topColor')?.value || BASE.color;

  document.getElementById('topFontSizeVal').textContent = fsTop;
  document.getElementById('topLetterVal').textContent = letTop;
  document.getElementById('topWeightVal').textContent = wTop;
  document.getElementById('topScaleXVal').textContent = sxTop + '%';
  document.getElementById('topScaleYVal').textContent = syTop + '%';
  document.getElementById('topSkewVal').textContent = skTop + '°';
  document.getElementById('topRadiusVal').textContent = rTop;
  document.getElementById('topStartVal').textContent = stTop + '°';
  document.getElementById('topSpanVal').textContent = spTop + '°';
  document.getElementById('topOffsetVal').textContent = offTop + '%';
  document.getElementById('topShiftXVal').textContent = shxT;
  document.getElementById('topShiftYVal').textContent = shyT;

  arcTop.setAttribute('d', arcPath(512,512,rTop, stTop, spTop, false));
  tpTop.setAttribute('startOffset', offTop + '%');
  setTextStyle(txtTopNode, tpTop, ffTop, fsTop, letTop, topColor, ancT, shxT, shyT, upTop, txtT, wTop, sxTop, syTop, skTop);

  // BOTTOM
  const ffBot = document.getElementById('bottomFont').value || BASE.bottom.font;
  const fsBot = BASE.bottom.fs + (+document.getElementById('bottomFontSizeDelta').value || 0);
  const letBot= BASE.bottom.letter + (+document.getElementById('bottomLetterDelta').value || 0);
  const wBot  = Math.max(1, BASE.bottom.weight + (+document.getElementById('bottomWeightDelta').value || 0));
  const sxBot = BASE.bottom.sx + (+document.getElementById('bottomScaleXDelta').value || 0);
  const syBot = BASE.bottom.sy + (+document.getElementById('bottomScaleYDelta').value || 0);
  const skBot = BASE.bottom.skew + (+document.getElementById('bottomSkewDelta').value || 0);
  const rBot  = Math.max(1, BASE.bottom.radius + (+document.getElementById('bottomRadiusDelta').value || 0));
  const stBot = BASE.bottom.start + (+document.getElementById('bottomStartDelta').value || 0);
  const spBot = Math.max(1, BASE.bottom.span + (+document.getElementById('bottomSpanDelta').value || 0));
  const offBot= Math.min(100, Math.max(0, BASE.bottom.offset + (+document.getElementById('bottomOffsetDelta').value || 0)));
  const shxB  = BASE.bottom.shiftX + (+document.getElementById('bottomShiftXDelta').value || 0);
  const shyB  = BASE.bottom.shiftY + (+document.getElementById('bottomShiftYDelta').value || 0);
  const ancB  = document.getElementById('bottomAnchor').value || BASE.bottom.anchor;
  const upBot = document.getElementById('bottomUpper').checked;
  const txtB  = document.getElementById('bottomText').value || BASE.bottom.text;
  const bottomColor = document.getElementById('bottomColor')?.value || BASE.color;

  document.getElementById('bottomFontSizeVal').textContent = fsBot;
  document.getElementById('bottomLetterVal').textContent = letBot;
  document.getElementById('bottomWeightVal').textContent = wBot;
  document.getElementById('bottomScaleXVal').textContent = sxBot + '%';
  document.getElementById('bottomScaleYVal').textContent = syBot + '%';
  document.getElementById('bottomSkewVal').textContent = skBot + '°';
  document.getElementById('bottomRadiusVal').textContent = rBot;
  document.getElementById('bottomStartVal').textContent = stBot + '°';
  document.getElementById('bottomSpanVal').textContent = spBot + '°';
  document.getElementById('bottomOffsetVal').textContent = offBot + '%';
  document.getElementById('bottomShiftXVal').textContent = shxB;
  document.getElementById('bottomShiftYVal').textContent = shyB;

  arcBottom.setAttribute('d', arcPath(512,512,rBot, stBot, spBot, true));
  tpBottom.setAttribute('startOffset', offBot + '%');
  setTextStyle(txtBottomNode, tpBottom, ffBot, fsBot, letBot, bottomColor, ancB, shxB, shyB, upBot, txtB, wBot, sxBot, syBot, skBot);

  // Anillos
  const rOut = Math.max(1, BASE.ring.outerR + (+document.getElementById('ringOuterRDelta').value || 0));
  const wOut = Math.max(1, BASE.ring.outerW + (+document.getElementById('ringOuterWDelta').value || 0));
  const rIn  = Math.max(1, BASE.ring.innerR + (+document.getElementById('ringInnerRDelta').value || 0));
  const wIn  = Math.max(1, BASE.ring.innerW + (+document.getElementById('ringInnerWDelta').value || 0));
  ringOuter.setAttribute('r', rOut); ringOuter.setAttribute('stroke-width', wOut); ringOuter.setAttribute('stroke', topColor);
  ringInner.setAttribute('r', rIn);  ringInner.setAttribute('stroke-width', wIn);  ringInner.setAttribute('stroke', topColor);
  document.getElementById('ringOuterRVal').textContent = rOut;
  document.getElementById('ringOuterWVal').textContent = wOut;
  document.getElementById('ringInnerRVal').textContent = rIn;
  document.getElementById('ringInnerWVal').textContent = wIn;

  // Puntos (izq)
  const useXL = document.getElementById('dotLUseXY').checked;
  const aL = BASE.dotL.angle + (+document.getElementById('dotLADelta').value || 0);
  const oL = Math.max(0, BASE.dotL.orbit + (+document.getElementById('dotLOrbitDelta').value || 0));
  const xL = BASE.dotL.x + (+document.getElementById('dotLXDelta').value || 0);
  const yL = BASE.dotL.y + (+document.getElementById('dotLYDelta').value || 0);
  const rL = Math.max(1, BASE.dotL.r + (+document.getElementById('dotLRDelta').value || 0));
  document.getElementById('dotLAVal').textContent = aL + '°';
  document.getElementById('dotLOrbitVal').textContent = oL;
  document.getElementById('dotLXVal').textContent = xL;
  document.getElementById('dotLYVal').textContent = yL;
  document.getElementById('dotLRVal').textContent = rL;
  if(useXL) placeDotXY(dotL, xL, yL); else placeDotPolar(dotL, oL, aL);
  dotL.setAttribute('r', rL); dotL.setAttribute('fill', topColor);

  // Puntos (der)
  const useXR = document.getElementById('dotRUseXY').checked;
  const aR = BASE.dotR.angle + (+document.getElementById('dotRADelta').value || 0);
  const oR = Math.max(0, BASE.dotR.orbit + (+document.getElementById('dotROrbitDelta').value || 0));
  const xR = BASE.dotR.x + (+document.getElementById('dotRXDelta').value || 0);
  const yR = BASE.dotR.y + (+document.getElementById('dotRYDelta').value || 0);
  const rR = Math.max(1, BASE.dotR.r + (+document.getElementById('dotRRDelta').value || 0));
  document.getElementById('dotRAVal').textContent = aR + '°';
  document.getElementById('dotROrbitVal').textContent = oR;
  document.getElementById('dotRXVal').textContent = xR;
  document.getElementById('dotRYVal').textContent = yR;
  document.getElementById('dotRRVal').textContent = rR;
  if(useXR) placeDotXY(dotR, xR, yR); else placeDotPolar(dotR, oR, aR);
  dotR.setAttribute('r', rR); dotR.setAttribute('fill', topColor);

  // Mandala
  const petals = Math.max(1, BASE.mandala.petals + (+document.getElementById('petalsDelta').value || 0));
  const curv   = Math.min(100, Math.max(0, BASE.mandala.curv + (+document.getElementById('curvinessDelta').value || 0)));
  const len    = Math.max(1, BASE.mandala.length + (+document.getElementById('lengthDelta').value || 0));
  const wid    = Math.max(1, BASE.mandala.width + (+document.getElementById('widthDelta').value || 0));
  const mStroke= Math.max(1, BASE.mandala.stroke + (+document.getElementById('mandalaStrokeDelta').value || 0));
  const mScale = Math.max(1, BASE.mandala.scale + (+document.getElementById('mandalaScaleDelta').value || 0));
  const mRot   = ((+document.getElementById('mandalaRotDelta').value) || 0) % 360;
  const center = Math.max(1, BASE.mandala.center + (+document.getElementById('centerDotDelta').value || 0));
  document.getElementById('petalsVal').textContent = petals;
  document.getElementById('curvVal').textContent = (curv/100).toFixed(2);
  document.getElementById('lenVal').textContent = len;
  document.getElementById('widVal').textContent = wid;
  document.getElementById('mandalaStrokeVal').textContent = mStroke;
  document.getElementById('mandalaScaleVal').textContent = mScale + '%';
  document.getElementById('mandalaRotVal').textContent = mRot + '°';
  document.getElementById('centerDotVal').textContent = center;
  drawMandala(petals, len, wid, curv, mStroke, topColor, mScale, mRot, center);
}

// --- Presets ---
const qs = sel => document.getElementById(sel);
qs('variantSoft').onclick = () => {
  qs('curvinessDelta').value = +15;
  qs('lengthDelta').value = -10;
  qs('widthDelta').value = +15;
  qs('petalsDelta').value = +2;
  qs('mandalaScaleDelta').value = +5;
  qs('mandalaRotDelta').value = 0;
  sync();
};
qs('variantElong').onclick = () => {
  qs('curvinessDelta').value = -10;
  qs('lengthDelta').value = +60;
  qs('widthDelta').value = -10;
  qs('petalsDelta').value = 0;
  qs('mandalaScaleDelta').value = 0;
  qs('mandalaRotDelta').value = 10;
  sync();
};
qs('variantMinimal').onclick = () => {
  qs('curvinessDelta').value = -25;
  qs('lengthDelta').value = -30;
  qs('widthDelta').value = -20;
  qs('petalsDelta').value = -4;
  qs('mandalaScaleDelta').value = -5;
  qs('mandalaRotDelta').value = 0;
  sync();
};

// --- Descargar SVG ---
qs('downloadSVG').onclick = () => {
  const s = new XMLSerializer().serializeToString(svg);
  const blob = new Blob([s], {type:'image/svg+xml'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'agricola-be-logo.svg'; a.click();
  URL.revokeObjectURL(url);
};

// --- Exportar PNG transparente con auto-recorte ---
function getTrimBounds(ctx, w, h){
  const imgData = ctx.getImageData(0,0,w,h).data;
  let top=h, left=w, right=0, bottom=0;
  for(let y=0; y<h; y++){
    for(let x=0; x<w; x++){
      const a = imgData[(y*w + x)*4 + 3];
      if(a !== 0){
        if(x < left) left = x;
        if(x > right) right = x;
        if(y < top) top = y;
        if(y > bottom) bottom = y;
      }
    }
  }
  if(right < left || bottom < top) return {left:0, top:0, right:w-1, bottom:h-1};
  return {left, top, right, bottom};
}
qs('pngSize').addEventListener('input', e=>{ qs('pngSizeVal').textContent = e.target.value; });
qs('pngPad').addEventListener('input', e=>{ qs('pngPadVal').textContent = e.target.value; });

qs('exportPNG').onclick = async () => {
  const size = +qs('pngSize').value;
  const pad = +qs('pngPad').value;
  const doTrim = qs('pngTrim').checked;
  const s = new XMLSerializer().serializeToString(svg);
  const svgBlob = new Blob([s], {type:'image/svg+xml'});
  const svgUrl = URL.createObjectURL(svgBlob);
  const baseSize = 1024;
  const img = new Image();
  img.onload = () => {
    const tmp = document.createElement('canvas');
    tmp.width = baseSize; tmp.height = baseSize;
    const tctx = tmp.getContext('2d');
    tctx.clearRect(0,0,baseSize,baseSize);
    tctx.drawImage(img, 0, 0, baseSize, baseSize);
    let srcX=0, srcY=0, srcW=baseSize, srcH=baseSize;
    if(doTrim){
      const b = getTrimBounds(tctx, baseSize, baseSize);
      srcX = Math.max(0, b.left - pad);
      srcY = Math.max(0, b.top - pad);
      srcW = Math.min(baseSize - srcX, (b.right - b.left + 1) + pad*2);
      srcH = Math.min(baseSize - srcY, (b.bottom - b.top + 1) + pad*2);
    }
    const out = document.createElement('canvas');
    out.width = size; out.height = size;
    const octx = out.getContext('2d');
    octx.clearRect(0,0,size,size);
    const scale = Math.min(size/srcW, size/srcH);
    const drawW = Math.floor(srcW * scale);
    const drawH = Math.floor(srcH * scale);
    const dx = Math.floor((size - drawW) / 2);
    const dy = Math.floor((size - drawH) / 2);
    octx.drawImage(tmp, srcX, srcY, srcW, srcH, dx, dy, drawW, drawH);
    out.toBlob(blob=>{
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `agricola-be-logo_${size}.png`;
      a.click();
      URL.revokeObjectURL(url);
    }, 'image/png');
    URL.revokeObjectURL(svgUrl);
  };
  img.src = svgUrl;
};

// --- IDs a persistir en sesiones ---
const DELTA_IDS = [
  // texto top
  'topText','topUpper','topFont','topFontSizeDelta','topLetterDelta','topWeightDelta','topScaleXDelta','topScaleYDelta','topSkewDelta','topColor','topRadiusDelta','topStartDelta','topSpanDelta','topOffsetDelta','topAnchor','topShiftXDelta','topShiftYDelta',
  // texto bottom
  'bottomText','bottomUpper','bottomFont','bottomFontSizeDelta','bottomLetterDelta','bottomWeightDelta','bottomScaleXDelta','bottomScaleYDelta','bottomSkewDelta','bottomColor','bottomRadiusDelta','bottomStartDelta','bottomSpanDelta','bottomOffsetDelta','bottomAnchor','bottomShiftXDelta','bottomShiftYDelta',
  // anillos y puntos
  'ringOuterRDelta','ringOuterWDelta','ringInnerRDelta','ringInnerWDelta',
  'dotLUseXY','dotLADelta','dotLOrbitDelta','dotLXDelta','dotLYDelta','dotLRDelta',
  'dotRUseXY','dotRADelta','dotROrbitDelta','dotRXDelta','dotRYDelta','dotRRDelta',
  // mandala
  'petalsDelta','curvinessDelta','lengthDelta','widthDelta','mandalaStrokeDelta','mandalaScaleDelta','mandalaRotDelta','centerDotDelta',
  // export
  'pngSize','pngPad','pngTrim'
];

// --- Guardar/Cargar sesión a archivo (.json) ---
function collectStateForSession(){
  const data = {};
  DELTA_IDS.forEach(id=>{
    const el = document.getElementById(id);
    if(!el) return;
    data[id] = (el.type === 'checkbox') ? el.checked : el.value;
  });
  return data;
}
function applyStateFromSession(data){
  Object.entries(data || {}).forEach(([id,val])=>{
    const el = document.getElementById(id);
    if(!el) return;
    if (el.type === 'checkbox') el.checked = !!val; else el.value = val;
  });
}
async function saveSessionFS(){
  const name = prompt("Nombre de la versión (ej: version-1):");
  if (!name) return;
  const state = collectStateForSession();
  const payload = { name, state, date: Date.now(), app: "AgricolaBE-Editor", version: "1" };
  if (!window.electronAPI?.saveFile) { alert("Guardado no disponible (preload)."); return; }
  const res = await window.electronAPI.saveFile(payload);
  if (res?.success) alert("Sesión guardada en:\n" + res.path);
}
async function loadSessionFS(){
  if (!window.electronAPI?.loadFile) { alert("Carga no disponible (preload)."); return; }
  const session = await window.electronAPI.loadFile();
  if (!session) return;
  applyStateFromSession(session.state);
  sync();
  alert("Sesión cargada: " + (session.name || "(sin nombre)"));
}

// Conecta a los botones del dock
document.getElementById('saveState').addEventListener('click', saveSessionFS);
document.getElementById('loadState').addEventListener('click', loadSessionFS);

// --- Reset a 0 (como lo tenías)
function resetZero(){
  DELTA_IDS.forEach(id=>{
    const el = document.getElementById(id);
    if(!el) return;
    if(el.type === 'checkbox'){
      if(id === 'dotLUseXY' || id === 'dotRUseXY') el.checked = false;
      else if(id === 'topUpper' || id === 'bottomUpper' || id === 'pngTrim') el.checked = true;
      else el.checked = false;
    } else if (el.tagName === 'SELECT') {
      if(id === 'topAnchor' || id === 'bottomAnchor') el.value = 'middle';
      else el.value = 'Inter, sans-serif';
    } else {
      if (id.endsWith('Color')) return;
      el.value = (id.includes('Delta') ? 0 : el.value);
    }
  });
  document.getElementById('topColor').value = BASE.color;
  document.getElementById('bottomColor').value = BASE.color;
  sync();
}
document.getElementById('resetZero').addEventListener('click', resetZero);

// --- Flips rápido ---
document.getElementById('flipTop').onclick = () => {
  document.getElementById('topStartDelta').value = (+document.getElementById('topStartDelta').value + 180) % 360;
  sync();
};
document.getElementById('flipBottom').onclick = () => {
  document.getElementById('bottomStartDelta').value = (+document.getElementById('bottomStartDelta').value + 180) % 360;
  sync();
};

// --- Listeners de TODOS los controles (input) ---
[
  // texto top
  'topText','topUpper','topFont','topFontSizeDelta','topLetterDelta','topWeightDelta','topScaleXDelta','topScaleYDelta','topSkewDelta','topColor','topRadiusDelta','topStartDelta','topSpanDelta','topOffsetDelta','topAnchor','topShiftXDelta','topShiftYDelta',
  // texto bottom
  'bottomText','bottomUpper','bottomFont','bottomFontSizeDelta','bottomLetterDelta','bottomWeightDelta','bottomScaleXDelta','bottomScaleYDelta','bottomSkewDelta','bottomColor','bottomRadiusDelta','bottomStartDelta','bottomSpanDelta','bottomOffsetDelta','bottomAnchor','bottomShiftXDelta','bottomShiftYDelta',
  // anillos y puntos
  'ringOuterRDelta','ringOuterWDelta','ringInnerRDelta','ringInnerWDelta',
  'dotLUseXY','dotLADelta','dotLOrbitDelta','dotLXDelta','dotLYDelta','dotLRDelta',
  'dotRUseXY','dotRADelta','dotROrbitDelta','dotRXDelta','dotRYDelta','dotRRDelta',
  // mandala
  'petalsDelta','curvinessDelta','lengthDelta','widthDelta','mandalaStrokeDelta','mandalaScaleDelta','mandalaRotDelta','centerDotDelta',
  // export
  'pngSize','pngPad','pngTrim'
].forEach(id => {
  const el = document.getElementById(id);
  if(el) el.addEventListener('input', sync);
});

// ======= Ocultar/mostrar paneles =======
const panelsBtn = document.getElementById('togglePanels');
function togglePanels(){
  document.body.classList.toggle('panels-hidden');
  const hidden = document.body.classList.contains('panels-hidden');
  panelsBtn.textContent = hidden ? 'Mostrar paneles' : 'Ocultar paneles';
  panelsBtn.title = (hidden ? 'Mostrar' : 'Ocultar') + ' paneles (Tab)';
}
panelsBtn.addEventListener('click', togglePanels);
window.addEventListener('keydown', (e)=>{
  if (e.key === 'Tab' && !e.ctrlKey && !e.metaKey && !e.altKey){
    e.preventDefault();
    togglePanels();
  }
});

// --- Inicial ---
sync();
