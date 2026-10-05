
const BOXES={
 street:{cost:25,items:[
  ["Chrome Buds","Common",8,19,40,"🎧","Tech","#9aa8ba","#4d596b"],
  ["Pixel Pad","Uncommon",20,42,29,"🎮","Gaming","#57a3ff","#3459bd"],
  ["Neon Relic","Rare",42,92,20,"💿","Collectibles","#9277ff","#5e42d7"],
  ["Ghost Runner","Ultra",95,190,11,"👟","Fashion","#ee8cff","#8b4ad0"]]},
 collector:{cost:75,items:[
  ["Arcade Core","Uncommon",42,80,24,"🕹️","Gaming","#57a3ff","#3459bd"],
  ["Prism Relic","Rare",75,155,37,"🔮","Collectibles","#a78bfa","#6647df"],
  ["Signed Number 7","Ultra",155,325,29,"🏀","Sports","#f38fd7","#8a4fd0"],
  ["Midnight Grail","Jackpot",330,650,10,"⌚","Vintage","#f6ca62","#9f7221"]]},
 vault:{cost:200,items:[
  ["Obsidian Relic","Rare",145,255,22,"🗿","Collectibles","#8f7aff","#4d42a9"],
  ["Apex Timepiece","Ultra",230,500,39,"⌚","Luxury","#ee8cff","#6e4ccd"],
  ["Golden Archive","Jackpot",520,1000,30,"🏆","Vintage","#ffd96a","#a77718"],
  ["Zero-One Prototype","Mythic",1150,2100,9,"⚡","Mythic","#ff7994","#7e3658"]]}
};
const ALL=[...new Map(Object.values(BOXES).flatMap(b=>b.items).map(x=>[x[0],x])).values()];
let state=load()||{cash:175,level:1,upgrades:0,opened:0,sold:0,best:0,nextId:1,inventory:[],discovered:[],claimed:[],lastDaily:null,market:{Tech:1,Gaming:1,Collectibles:1,Fashion:1,Sports:1,Vintage:1,Luxury:1,Mythic:1}};
const $=id=>document.getElementById(id), money=n=>"$"+Math.round(n).toLocaleString();
const MISSIONS=[
 {id:"open5",label:"Open 5 drops",reward:60,done:()=>state.opened>=5},
 {id:"sell5",label:"Sell 5 pulls",reward:80,done:()=>state.sold>=5},
 {id:"discover5",label:"Discover 5 collectibles",reward:110,done:()=>state.discovered.length>=5},
 {id:"worth1500",label:"Reach $1,500 net worth",reward:175,done:()=>netWorth()>=1500}
];
function today(){const d=new Date();return `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`}
function canDaily(){return state.lastDaily!==today()}
function saleMult(){return 1+state.upgrades*.08}
function marketMult(i){return state.market[i.category]||1}
function saleValue(i){return Math.max(1,Math.round(i.value*saleMult()*marketMult(i)))}
function netWorth(){return state.cash+state.inventory.reduce((s,i)=>s+saleValue(i),0)}
function upgradeCost(){return 125+state.upgrades*175}
function pick(table){const total=table.reduce((s,r)=>s+r[4],0);let roll=Math.random()*total;for(const r of table){roll-=r[4];if(roll<=0)return{name:r[0],rarity:r[1],value:Math.round(r[2]+Math.random()*(r[3]-r[2])),mark:r[5],category:r[6],c1:r[7],c2:r[8]}}}
function shiftMarket(){Object.keys(state.market).forEach(k=>state.market[k]=Math.min(1.34,Math.max(.72,state.market[k]+Math.random()*.18-.09)))}
function serial(){return "#"+String(Math.floor(Math.random()*9999)+1).padStart(4,"0")}
function rarityGlow(r){return {Common:"rgba(180,190,205,.24)",Uncommon:"rgba(87,163,255,.34)",Rare:"rgba(139,92,246,.45)",Ultra:"rgba(238,140,255,.5)",Jackpot:"rgba(247,198,75,.55)",Mythic:"rgba(255,107,134,.60)"}[r]}

function openBox(type){
 const b=BOXES[type];if(state.cash<b.cost)return;
 state.cash-=b.cost;state.opened++;shiftMarket();
 const i=pick(b.items);i.id=state.nextId++;i.serial=serial();state.inventory.push(i);state.best=Math.max(state.best,i.value);
 if(!state.discovered.includes(i.name))state.discovered.push(i.name);
 const st=$("stage");st.className="stage";st.style.setProperty("--stageGlow",rarityGlow(i.rarity));void st.offsetWidth;st.classList.add("reveal","flash");
 st.innerHTML=`<div class="collect-card" style="--c1:${i.c1};--c2:${i.c2}">
   <div class="card-inner">
    <div class="card-top"><span class="card-brand">FLIP SHOP // SERIES 01</span><span class="rarity rarity-${i.rarity}">${i.rarity}</span></div>
    <div class="art"><div class="art-icon">${i.mark}</div></div>
    <div class="card-name">${i.name}</div>
    <div class="card-meta"><div><div class="card-value">${money(i.value)}</div><div class="card-category">${i.category}</div></div><div class="serial">${i.serial}<br>FOUND ${state.opened}</div></div>
   </div></div>`;
 save();render()
}
function sellOne(id){const x=state.inventory.findIndex(i=>i.id===id);if(x<0)return;state.cash+=saleValue(state.inventory[x]);state.sold++;state.inventory.splice(x,1);save();render()}
function sellAll(){if(!state.inventory.length)return;state.cash+=state.inventory.reduce((s,i)=>s+saleValue(i),0);state.sold+=state.inventory.length;state.inventory=[];save();render()}
function claimDaily(){if(!canDaily())return;const r=80+Math.floor(Math.random()*71);state.cash+=r;state.lastDaily=today();$("dailyStatus").textContent=`Claimed ${money(r)}. Nice.`;save();render()}
function upgrade(){const c=upgradeCost();if(state.cash<c)return;state.cash-=c;state.upgrades++;state.level++;save();render()}
function claimMission(id){const m=MISSIONS.find(m=>m.id===id);if(!m||!m.done()||state.claimed.includes(id))return;state.claimed.push(id);state.cash+=m.reward;save();render()}
function save(){localStorage.setItem("flipShopSaveV4",JSON.stringify(state))}
function load(){try{return JSON.parse(localStorage.getItem("flipShopSaveV4"))}catch{return null}}

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
function renderCollection(){
 $("collectionCount").textContent=`${state.discovered.length} / ${ALL.length}`;
 $("collectionBook").innerHTML=ALL.map(r=>{const unlocked=state.discovered.includes(r[0]);return `<article class="collection-tile ${unlocked?"":"locked"}"><div class="collection-art" style="${unlocked?`background:linear-gradient(145deg,${r[7]},${r[8]})`:""}">${unlocked?r[5]:"?"}</div><b>${unlocked?r[0]:"Unknown pull"}</b><small>${unlocked?r[1]:"Keep ripping"}</small></article>`}).join("")
}
function render(){
 $("cash").textContent=money(state.cash);$("worth").textContent=money(netWorth());$("level").textContent=state.level;$("best").textContent=state.best?money(state.best):"—";$("openedCount").textContent=`${state.opened} opened`;
 $("upgradeBoost").textContent=`+${state.upgrades*8}%`;$("upgradeBtn").textContent=`Upgrade — ${money(upgradeCost())}`;$("upgradeBtn").disabled=state.cash<upgradeCost();$("sellAllBtn").disabled=!state.inventory.length;
 $("goalWorth").textContent=`${money(netWorth())} / $10,000`;$("meterFill").style.width=Math.min(100,netWorth()/10000*100)+"%";$("progressText").textContent=`${state.opened} opened · ${state.sold} sold`;
 document.querySelectorAll(".box").forEach(b=>b.disabled=state.cash<BOXES[b.dataset.box].cost);
 $("dailyBtn").disabled=!canDaily();$("dailyBtn").textContent=canDaily()?"Claim reward":"Claimed";if(!canDaily()&&!$("dailyStatus").textContent.startsWith("Claimed"))$("dailyStatus").textContent="Come back tomorrow for another drop.";
 renderMissions();renderMarket();renderInventory();renderCollection()
}
document.querySelectorAll(".box").forEach(b=>b.addEventListener("click",()=>openBox(b.dataset.box)));
$("dailyBtn").addEventListener("click",claimDaily);$("sellAllBtn").addEventListener("click",sellAll);$("upgradeBtn").addEventListener("click",upgrade);
$("resetBtn").addEventListener("click",()=>{if(confirm("Reset Flip Shop V4 progress?")){localStorage.removeItem("flipShopSaveV4");location.reload()}});
render();
