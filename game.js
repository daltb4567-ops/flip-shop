
const SERIES_01=[
 ["Chrome Buds","Common",8,19,36,"🎧","Tech","#9aa8ba","#4d596b"],
 ["Pixel Pad","Uncommon",20,42,26,"🎮","Gaming","#57a3ff","#3459bd"],
 ["Neon Relic","Rare",42,92,16,"💿","Collectibles","#9277ff","#5e42d7"],
 ["Ghost Runner","Ultra",95,190,8,"👟","Fashion","#ee8cff","#8b4ad0"],
 ["Pocket Deck","Common",9,21,34,"🃏","Collectibles","#94a3b8","#475569"],
 ["Cassette Zero","Uncommon",23,48,23,"📼","Vintage","#65a9ff","#385a9f"],
 ["Circuit Mouse","Common",7,18,36,"🖱️","Tech","#a6b1bf","#546171"],
 ["Arcade Core","Uncommon",42,80,23,"🕹️","Gaming","#57a3ff","#3459bd"],
 ["Prism Relic","Rare",75,155,34,"🔮","Collectibles","#a78bfa","#6647df"],
 ["Signed Number 7","Ultra",155,325,24,"🏀","Sports","#f38fd7","#8a4fd0"],
 ["Midnight Grail","Jackpot",330,650,7,"⌚","Vintage","#f6ca62","#9f7221"],
 ["Silver Rookie","Uncommon",46,88,22,"🏒","Sports","#64b5ff","#3563ae"],
 ["Neon Camera","Rare",84,165,18,"📷","Tech","#9f8aff","#5b46bb"],
 ["Vinyl One","Rare",72,150,19,"💿","Vintage","#a98cff","#6746b5"],
 ["Obsidian Relic","Rare",145,255,20,"🗿","Collectibles","#8f7aff","#4d42a9"],
 ["Apex Timepiece","Ultra",230,500,35,"⌚","Luxury","#ee8cff","#6e4ccd"],
 ["Golden Archive","Jackpot",520,1000,25,"🏆","Vintage","#ffd96a","#a77718"],
 ["Zero-One Prototype","Mythic",1150,2100,7,"⚡","Mythic","#ff7994","#7e3658"],
 ["Carbon Shades","Rare",135,260,18,"🕶️","Fashion","#9888ff","#5046a0"],
 ["Platinum Cleats","Ultra",260,520,15,"⚽","Sports","#ef8cff","#7a46b0"],
 ["First Press","Jackpot",560,1050,8,"🎵","Vintage","#ffd269","#a56d18"],
 ["Nova Console","Ultra",245,495,16,"🎮","Gaming","#e78cff","#6f48b8"],
 ["Crown Piece","Jackpot",620,1150,8,"💎","Luxury","#ffd968","#ac751e"],
 ["Genesis Sample","Mythic",1300,2300,5,"🧬","Mythic","#ff768f","#733249"]
];
const STREET_NAMES=new Set(["Chrome Buds","Pixel Pad","Neon Relic","Ghost Runner","Pocket Deck","Cassette Zero","Circuit Mouse"]);
const COLLECTOR_NAMES=new Set(["Arcade Core","Prism Relic","Signed Number 7","Midnight Grail","Silver Rookie","Neon Camera","Vinyl One","Nova Console"]);
const VAULT_NAMES=new Set(["Obsidian Relic","Apex Timepiece","Golden Archive","Zero-One Prototype","Carbon Shades","Platinum Cleats","First Press","Crown Piece","Genesis Sample"]);
function rowsFor(set){return SERIES_01.filter(r=>set.has(r[0]))}
const BOXES={
 street:{cost:25,items:rowsFor(STREET_NAMES)},
 collector:{cost:75,items:rowsFor(COLLECTOR_NAMES)},
 vault:{cost:200,items:rowsFor(VAULT_NAMES)}
};
let state=load()||{cash:200,level:1,upgrades:0,opened:0,sold:0,best:0,nextId:1,inventory:[],discovered:[],claimed:[],lastDaily:null,market:{Tech:1,Gaming:1,Collectibles:1,Fashion:1,Sports:1,Vintage:1,Luxury:1,Mythic:1}};
const $=id=>document.getElementById(id),money=n=>"$"+Math.round(n).toLocaleString();
const MISSIONS=[
 {id:"open5",label:"Open 5 drops",reward:60,done:()=>state.opened>=5},
 {id:"sell5",label:"Sell 5 pulls",reward:80,done:()=>state.sold>=5},
 {id:"discover6",label:"Discover 6 Series 01 pulls",reward:125,done:()=>state.discovered.length>=6},
 {id:"worth1500",label:"Reach $1,500 net worth",reward:175,done:()=>netWorth()>=1500}
];
function today(){const d=new Date();return `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`}
function canDaily(){return state.lastDaily!==today()}
function saleMult(){return 1+state.upgrades*.08}
function marketMult(i){return state.market[i.category]||1}
function saleValue(i){return Math.max(1,Math.round(i.value*saleMult()*marketMult(i)))}
function netWorth(){return state.cash+state.inventory.reduce((s,i)=>s+saleValue(i),0)}
function upgradeCost(){return 125+state.upgrades*175}
function pick(table){const total=table.reduce((s,r)=>s+r[4],0);let roll=Math.random()*total;for(const r of table){roll-=r[4];if(roll<=0)return{name:r[0],rarity:r[1],value:Math.round(r[2]+Math.random()*(r[3]-r[2])),mark:r[5],category:r[6],c1:r[7],c2:r[8]}}return null}
function shiftMarket(){Object.keys(state.market).forEach(k=>state.market[k]=Math.min(1.34,Math.max(.72,state.market[k]+Math.random()*.18-.09)))}
function serial(){return "#"+String(Math.floor(Math.random()*9999)+1).padStart(4,"0")}
function rarityGlow(r){return {Common:"rgba(180,190,205,.24)",Uncommon:"rgba(87,163,255,.34)",Rare:"rgba(139,92,246,.45)",Ultra:"rgba(238,140,255,.5)",Jackpot:"rgba(247,198,75,.55)",Mythic:"rgba(255,107,134,.60)"}[r]}

function openBox(type){
 const b=BOXES[type];if(state.cash<b.cost)return;
 state.cash-=b.cost;state.opened++;shiftMarket();
 const i=pick(b.items);if(!i)return;i.id=state.nextId++;i.serial=serial();state.inventory.push(i);state.best=Math.max(state.best,i.value);
 if(!state.discovered.includes(i.name))state.discovered.push(i.name);
 const st=$("stage");st.className="stage";st.style.setProperty("--stageGlow",rarityGlow(i.rarity));void st.offsetWidth;st.classList.add("reveal","flash");
 st.innerHTML=`<div class="collect-card" style="--c1:${i.c1};--c2:${i.c2}">
   <div class="card-inner">
    <div class="card-top"><span class="card-brand">FLIP SHOP // SERIES 01</span><span class="rarity rarity-${i.rarity}">${i.rarity}</span></div>
    <div class="art"><div class="art-icon">${i.mark}</div></div>
    <div class="card-name">${i.name}</div>
    <div class="card-meta"><div><div class="card-value">${money(i.value)}</div><div class="card-category">${i.category}</div></div><div class="serial">${i.serial}<br>S01-${String(SERIES_01.findIndex(r=>r[0]===i.name)+1).padStart(2,"0")}</div></div>
   </div></div>`;
 save();render()
}
function sellOne(id){const x=state.inventory.findIndex(i=>i.id===id);if(x<0)return;state.cash+=saleValue(state.inventory[x]);state.sold++;state.inventory.splice(x,1);save();render()}
function sellAll(){if(!state.inventory.length)return;state.cash+=state.inventory.reduce((s,i)=>s+saleValue(i),0);state.sold+=state.inventory.length;state.inventory=[];save();render()}
function claimDaily(){if(!canDaily())return;const r=80+Math.floor(Math.random()*71);state.cash+=r;state.lastDaily=today();$("dailyStatus").textContent=`Claimed ${money(r)}. Nice.`;save();render()}
function upgrade(){const c=upgradeCost();if(state.cash<c)return;state.cash-=c;state.upgrades++;state.level++;save();render()}
function claimMission(id){const m=MISSIONS.find(m=>m.id===id);if(!m||!m.done()||state.claimed.includes(id))return;state.claimed.push(id);state.cash+=m.reward;save();render()}
function save(){localStorage.setItem("flipShopSaveV5",JSON.stringify(state))}
function load(){try{return JSON.parse(localStorage.getItem("flipShopSaveV5"))}catch{return null}}

function renderMissions(){
 $("missions").innerHTML="";
 MISSIONS.forEach(m=>{const got=state.claimed.includes(m.id),done=m.done(),row=document.createElement("div");row.className="row";
  const l=document.createElement("div");l.innerHTML=`<b>${got?"✓ ":done?"★ ":"○ "}${m.label}</b><small>Reward ${money(m.reward)}</small>`;
  const btn=document.createElement("button");btn.textContent=got?"Claimed":done?"Claim":"Locked";btn.disabled=got||!done;btn.addEventListener("click",()=>claimMission(m.id));row.append(l,btn);$("missions").append(row)
 })
}
function renderMarket(){
 const cats=["Collectibles","Gaming","Sports","Vintage"];
 $("marketList").innerHTML=cats.map(c=>{const p=Math.round(((state.market[c]||1)-1)*100);return `<div class="row"><span>${c}</span><b class="${p>=0?"up":"down"}">${p>=0?"+":""}${p}%</b></div>`}).join("")
}
function renderInventory(){
 const el=$("inventory");el.innerHTML="";$("inventoryMeta").textContent=`${state.inventory.length} item${state.inventory.length===1?"":"s"}`;
 if(!state.inventory.length){el.innerHTML=`<div class="row"><div><b>No pulls yet</b><small>Crack a drop to start collecting.</small></div></div>`;return}
 [...state.inventory].reverse().forEach(i=>{const card=document.createElement("article");card.className="mini-card";
  card.innerHTML=`<div class="mini-art" style="--mc1:${i.c1};--mc2:${i.c2}">${i.mark}</div><strong class="rarity-${i.rarity}">${i.name}</strong><small>${i.rarity} · ${i.serial}</small><small>Market value ${money(saleValue(i))}</small>`;
  const btn=document.createElement("button");btn.textContent=`Sell ${money(saleValue(i))}`;btn.addEventListener("click",()=>sellOne(i.id));card.append(btn);el.append(card)
 })
}
function renderSet(){
 const total=SERIES_01.length,found=state.discovered.length,pct=Math.round(found/total*100);
 $("setCount").textContent=`${found} / ${total}`;$("setPercent").textContent=`${pct}% complete`;$("setMeter").style.width=pct+"%";
 $("setGrid").innerHTML=SERIES_01.map((r,idx)=>{const foundIt=state.discovered.includes(r[0]);return `<article class="set-card ${foundIt?"":"missing"}">
   <span class="set-num">S01-${String(idx+1).padStart(2,"0")}</span>
   <div class="set-art" style="${foundIt?`--sc1:${r[7]};--sc2:${r[8]}`:""}">${foundIt?r[5]:""}</div>
   <b>${foundIt?r[0]:"Unknown"}</b>
   <small>${foundIt?r[1]:"Not discovered"}</small>
 </article>`}).join("")
}
function render(){
 $("cash").textContent=money(state.cash);$("worth").textContent=money(netWorth());$("level").textContent=state.level;$("best").textContent=state.best?money(state.best):"—";$("openedCount").textContent=`${state.opened} opened`;
 $("upgradeBoost").textContent=`+${state.upgrades*8}%`;$("upgradeBtn").textContent=`Upgrade — ${money(upgradeCost())}`;$("upgradeBtn").disabled=state.cash<upgradeCost();$("sellAllBtn").disabled=!state.inventory.length;
 $("goalWorth").textContent=`${money(netWorth())} / $10,000`;$("meterFill").style.width=Math.min(100,netWorth()/10000*100)+"%";$("progressText").textContent=`${state.opened} opened · ${state.sold} sold`;
 document.querySelectorAll(".box").forEach(b=>b.disabled=state.cash<BOXES[b.dataset.box].cost);
 $("dailyBtn").disabled=!canDaily();$("dailyBtn").textContent=canDaily()?"Claim reward":"Claimed";if(!canDaily()&&!$("dailyStatus").textContent.startsWith("Claimed"))$("dailyStatus").textContent="Come back tomorrow for another drop.";
 renderMissions();renderMarket();renderInventory();renderSet()
}
document.querySelectorAll(".box").forEach(b=>b.addEventListener("click",()=>openBox(b.dataset.box)));
document.querySelectorAll(".tab").forEach(t=>t.addEventListener("click",()=>{document.querySelectorAll(".tab").forEach(x=>x.classList.toggle("active",x===t));document.querySelectorAll(".page").forEach(p=>p.classList.toggle("active",p.id==="page-"+t.dataset.page));if(t.dataset.page==="sets")renderSet()}));
$("dailyBtn").addEventListener("click",claimDaily);$("sellAllBtn").addEventListener("click",sellAll);$("upgradeBtn").addEventListener("click",upgrade);
$("resetBtn").addEventListener("click",()=>{if(confirm("Reset Flip Shop V5 progress?")){localStorage.removeItem("flipShopSaveV5");location.reload()}});
render();
