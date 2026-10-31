// Isolated entrance study. Inserted into a copy of building/index.html.
const study = new THREE.Group();
floorGroups[0].add(study);
// Frame the existing 2.4 m entrance without narrowing its opening.
box(.16,3.5,.32,C.black,-1.94,1.75,8.72,study);
box(.16,3.5,.32,C.black,.74,1.75,8.72,study);
box(2.84,.24,.32,C.black,-.6,3.5,8.72,study);
function studySign(text,w,h,x,y,z){
  const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=256;
  const ctx=canvas.getContext('2d');ctx.fillStyle='#151515';ctx.fillRect(0,0,1024,256);
  ctx.fillStyle='#F4F4F2';ctx.font='700 88px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,512,128);
  const mesh=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(canvas)}));
  mesh.position.set(x,y,z);study.add(mesh);
}
studySign('PROJECT.CD',2.4,.6,-.6,3.06,8.9);
// Repeated vertical detail gives the existing counter a readable rhythm.
for(let z=-3.6;z<5.1;z+=.24)box(.025,.44,.025,C.mid,-5.89,.27,z,study);
studySign('COFFEE  /  PASTRY',2.8,.7,-6.4,2.7,-5.9);

const sheet=document.createElement('section');sheet.id='entrance-study';
sheet.setAttribute('aria-label','一樓空間設計示範');
sheet.innerHTML='<small>PROJECT.CD ／ 空間提案 01</small><h1>從一杯咖啡，<br>走進品牌。</h1><p>入口門框、吧台細節與三個導覽視角。<br>品牌概念空間，非實體營業門市。</p><div class="study-controls"><button type="button" data-view="entry">01 入口</button><button type="button" data-view="bar">02 咖啡吧台</button><button type="button" data-view="room">03 一樓全貌</button><button type="button" data-view="all">返回整棟</button></div><a href="index.html">查看原版 ↗</a>';
document.getElementById('app').appendChild(sheet);
const studyStyle=document.createElement('style');
studyStyle.textContent=`
#entrance-study{position:absolute;z-index:5;left:24px;top:112px;width:288px;padding:24px;box-sizing:border-box;background:var(--surface);color:var(--fg);border:1px solid var(--line);border-radius:16px}
#entrance-study small{font-size:12px;color:var(--muted)}
#entrance-study h1{font-family:var(--display);font-size:32px;line-height:1.4;margin:16px 0}
#entrance-study p{font-size:14px;line-height:1.8;color:var(--muted);margin:0 0 20px}
.study-controls{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.study-controls button{min-height:48px;padding:8px;font:inherit;font-size:14px;border:1px solid var(--line);border-radius:8px;background:var(--surface);color:var(--fg);cursor:pointer}
.study-controls button[aria-pressed="true"]{background:var(--fg);color:var(--surface)}
#entrance-study a{display:inline-flex;align-items:center;min-height:44px;margin-top:8px;color:var(--fg);font-size:14px}
@media(max-width:1024px){#entrance-study{top:auto;bottom:104px;left:16px;right:16px;width:auto;padding:16px}#entrance-study h1{font-size:20px;margin:8px 0}#entrance-study h1 br{display:none}#entrance-study p{margin-bottom:8px;font-size:12px}#entrance-study a{position:absolute;right:16px;top:0}.study-controls{grid-template-columns:repeat(4,1fr)}.study-controls button{font-size:12px}aside#panel:not([hidden])~#entrance-study{display:none}}
`;
document.head.appendChild(studyStyle);
function studyView(view){
  focusFloor(view==='all'?-1:0);
  if(view==='entry')flyTo(new THREE.Vector3(8,6,25),new THREE.Vector3(-.6,1.8,7));
  if(view==='bar')flyTo(new THREE.Vector3(8,9,15),new THREE.Vector3(-5.7,1.3,.7));
  if(view==='room')flyTo(new THREE.Vector3(24,22,28),new THREE.Vector3(-1,1,0));
  sheet.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===view)));
}
sheet.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>studyView(b.dataset.view)));
studyView('room');
