const BOXES = {
  street: {
    cost: 25,
    items: [
      ["Used Headphones","Common",6,18,46,"◉","Tech"],
      ["Retro Controller","Uncommon",18,38,29,"◆","Gaming"],
      ["Holo Collectible","Rare",40,85,17,"★","Collectibles"],
      ["Limited Sneaker","Ultra",90,180,8,"✦","Fashion"]
    ]
  },
  collector: {
    cost: 75,
    items: [
      ["Retro Console","Uncommon",40,75,25,"◆","Gaming"],
      ["Full-Art Collectible","Rare",70,145,40,"★","Collectibles"],
      ["Signed Jersey","Ultra",150,310,27,"✦","Sports"],
      ["Vintage Grail","Jackpot",320,600,8,"♛","Vintage"]
    ]
  },
  vault: {
    cost: 200,
    items: [
      ["Premium Collectible","Rare",140,240,22,"★","Collectibles"],
      ["Luxury Flip","Ultra",220,480,41,"✦","Luxury"],
      ["Vintage Grail","Jackpot",500,950,29,"♛","Vintage"],
      ["Legendary Find","Mythic",1100,2000,8,"⚡","Mythic"]
    ]
  }
};

const ALL_NAMES = [...new Set(Object.values(BOXES).flatMap(b => b.items.map(x => x[0])))];

let state = load() || {
  cash:150, level:1, upgrades:0, opened:0, sold:0, best:0, nextId:1,
  inventory:[], discovered:[], claimedMissions:[], lastDaily:null,
  market:{Tech:1,Gaming:1,Collectibles:1,Fashion:1,Sports:1,Vintage:1,Luxury:1,Mythic:1}
};

const $ = id => document.getElementById(id);
const money = n => "$" + Math.round(n).toLocaleString();

const MISSIONS = [
  {id:"open5",label:"Open 5 boxes",reward:60,done:()=>state.opened>=5},
  {id:"sell5",label:"Sell 5 items",reward:75,done:()=>state.sold>=5},
  {id:"discover4",label:"Discover 4 item types",reward:100,done:()=>state.discovered.length>=4},
  {id:"worth1000",label:"Reach $1,000 net worth",reward:150,done:()=>netWorth()>=1000}
];

function todayKey(){
  const d=new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}
function canClaimDaily(){return state.lastDaily!==todayKey();}
function claimDaily(){
  if(!canClaimDaily())return;
  const reward=75+Math.floor(Math.random()*76);
  state.cash+=reward; state.lastDaily=todayKey();
  $("dailyStatus").textContent=`You claimed ${money(reward)} today.`;
  save();render();
}
function saleMultiplier(){return 1+state.upgrades*.08;}
function marketMultiplier(item){return state.market[item.category]||1;}
function saleValue(item){return Math.max(1,Math.round(item.value*saleMultiplier()*marketMultiplier(item)));}
function netWorth(){return state.cash+state.inventory.reduce((s,i)=>s+saleValue(i),0);}
function upgradeCost(){return 125+state.upgrades*175;}

function pick(table){
  const total=table.reduce((s,r)=>s+r[4],0);
  let roll=Math.random()*total;
  for(const r of table){
    roll-=r[4];
    if(roll<=0)return{name:r[0],rarity:r[1],value:Math.round(r[2]+Math.random()*(r[3]-r[2])),mark:r[5],category:r[6]};
  }
}

function shiftMarket(){
  Object.keys(state.market).forEach(key=>{
    const change=(Math.random()*.16)-.08;
    state.market[key]=Math.min(1.32,Math.max(.74,state.market[key]+change));
  });
}

function rarityClass(r){return "r-"+r.toLowerCase();}

function openBox(type){
  const box=BOXES[type];
  if(state.cash<box.cost)return;
  state.cash-=box.cost;state.opened++;shiftMarket();

  const item=pick(box.items);item.id=state.nextId++;
  state.inventory.push(item);state.best=Math.max(state.best,item.value);
  if(!state.discovered.includes(item.name))state.discovered.push(item.name);

  const reveal=$("reveal");
  reveal.className=`reveal ${rarityClass(item.rarity)}`;
  void reveal.offsetWidth;
  reveal.classList.add("pop");
  reveal.innerHTML=`
    <div class="reveal-inner">
      <div class="reveal-symbol">${item.mark}</div>
      <div class="reveal-name">${item.name}</div>
      <div class="reveal-rarity rarity-${item.rarity}">${item.rarity}</div>
      <div class="reveal-value">${money(item.value)}</div>
      <div class="reveal-meta">Base value · market ${Math.round(marketMultiplier(item)*100)}%</div>
    </div>`;
  save();render();
}

function sellOne(id){
  const idx=state.inventory.findIndex(x=>x.id===id);
  if(idx<0)return;
  const item=state.inventory[idx];
  state.cash+=saleValue(item);state.sold++;state.inventory.splice(idx,1);
  save();render();
}
function sellAll(){
  if(!state.inventory.length)return;
  state.cash+=state.inventory.reduce((s,i)=>s+saleValue(i),0);
  state.sold+=state.inventory.length;state.inventory=[];
  save();render();
}
function upgrade(){
  const cost=upgradeCost();
  if(state.cash<cost)return;
  state.cash-=cost;state.upgrades++;state.level++;
  save();render();
}
function claimMission(id){
  const m=MISSIONS.find(x=>x.id===id);
  if(!m||!m.done()||state.claimedMissions.includes(id))return;
  state.claimedMissions.push(id);state.cash+=m.reward;
  save();render();
}
function save(){localStorage.setItem("flipShopSaveV3",JSON.stringify(state));}
function load(){
  try{return JSON.parse(localStorage.getItem("flipShopSaveV3"));}
  catch{return null;}
}

function renderMarket(){
  const categories=["Collectibles","Gaming","Sports","Vintage"];
  $("marketList").innerHTML=categories.map(cat=>{
    const v=state.market[cat]||1;
    const pct=Math.round((v-1)*100);
    return `<div class="market-row"><span>${cat}</span><strong class="${pct>=0?"positive":"negative"}">${pct>=0?"+":""}${pct}%</strong></div>`;
  }).join("");
}

function renderMissions(){
  $("missions").innerHTML="";
  MISSIONS.forEach(m=>{
    const claimed=state.claimedMissions.includes(m.id);
    const complete=m.done();
    const row=document.createElement("div");
    row.className="mission";
    const text=document.createElement("div");
    text.innerHTML=`<strong>${claimed?"✓ ":complete?"★ ":"○ "}${m.label}</strong><small>Reward ${money(m.reward)}</small>`;
    const btn=document.createElement("button");
    btn.textContent=claimed?"Claimed":complete?"Claim":"Locked";
    btn.disabled=claimed||!complete;
    btn.addEventListener("click",()=>claimMission(m.id));
    row.append(text,btn);$("missions").appendChild(row);
  });
}

function renderCollection(){
  $("collectionBook").innerHTML=ALL_NAMES.map(name=>{
    const unlocked=state.discovered.includes(name);
    return `<div class="collectible ${unlocked?"":"locked"}"><strong>${unlocked?"✓":"?"} ${unlocked?name:"Undiscovered"}</strong><small>${unlocked?"Added to collection":"Keep opening boxes"}</small></div>`;
  }).join("");
}

function renderInventory(){
  const inv=$("inventory");inv.innerHTML="";
  $("inventoryMeta").textContent=`${state.inventory.length} item${state.inventory.length===1?"":"s"}`;

  if(!state.inventory.length){
    inv.innerHTML=`<div class="item"><div><strong>No pulls yet</strong><small>Open a box to start your inventory.</small></div></div>`;
    return;
  }

  [...state.inventory].reverse().forEach(item=>{
    const row=document.createElement("div");row.className="item";
    const marketPct=Math.round((marketMultiplier(item)-1)*100);
    row.innerHTML=`<div><strong class="rarity-${item.rarity}">${item.mark} ${item.name}</strong><small>${item.rarity} · base ${money(item.value)} · market ${marketPct>=0?"+":""}${marketPct}%</small></div>`;
    const btn=document.createElement("button");btn.textContent=`Sell ${money(saleValue(item))}`;
    btn.addEventListener("click",()=>sellOne(item.id));
    row.appendChild(btn);inv.appendChild(row);
  });
}

function render(){
  $("cash").textContent=money(state.cash);
  $("worth").textContent=money(netWorth());
  $("level").textContent=state.level;
  $("best").textContent=state.best?money(state.best):"—";
  $("openedCount").textContent=`${state.opened} opened`;
  $("goalWorth").textContent=`${money(netWorth())} / $10,000`;
  $("progressText").textContent=`${state.opened} boxes opened · ${state.sold} sold`;
  $("meterFill").style.width=Math.min(100,(netWorth()/10000)*100)+"%";

  $("upgradeBoost").textContent=`+${state.upgrades*8}%`;
  $("upgradeBtn").textContent=`Upgrade — ${money(upgradeCost())}`;
  $("upgradeBtn").disabled=state.cash<upgradeCost();
  $("sellAllBtn").disabled=!state.inventory.length;

  document.querySelectorAll(".box-card").forEach(btn=>{
    btn.disabled=state.cash<BOXES[btn.dataset.box].cost;
  });

  $("dailyBtn").disabled=!canClaimDaily();
  $("dailyBtn").textContent=canClaimDaily()?"Claim daily":"Claimed";
  if(!canClaimDaily()&&!$("dailyStatus").textContent.includes("claimed")){
    $("dailyStatus").textContent="Come back tomorrow for another reward.";
  }

  renderInventory();renderMarket();renderMissions();renderCollection();
}

document.querySelectorAll(".box-card").forEach(btn=>btn.addEventListener("click",()=>openBox(btn.dataset.box)));
$("upgradeBtn").addEventListener("click",upgrade);
$("sellAllBtn").addEventListener("click",sellAll);
$("dailyBtn").addEventListener("click",claimDaily);
$("resetBtn").addEventListener("click",()=>{
  if(confirm("Reset all Flip Shop V3 progress?")){
    localStorage.removeItem("flipShopSaveV3");
    location.reload();
  }
});
render();
