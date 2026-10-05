const BOXES = {
  street: {
    cost: 25,
    items: [
      ["Used Headphones","Common",6,18,46,"●"],
      ["Retro Controller","Uncommon",18,38,29,"◆"],
      ["Holo Collectible","Rare",40,85,17,"★"],
      ["Limited Sneaker","Ultra",90,180,8,"✦"]
    ]
  },
  collector: {
    cost: 75,
    items: [
      ["Retro Console","Uncommon",40,75,25,"◆"],
      ["Full-Art Collectible","Rare",70,145,40,"★"],
      ["Signed Jersey","Ultra",150,310,27,"✦"],
      ["Vintage Grail","Jackpot",320,600,8,"♛"]
    ]
  },
  vault: {
    cost: 200,
    items: [
      ["Premium Collectible","Rare",140,240,22,"★"],
      ["Luxury Flip","Ultra",220,480,41,"✦"],
      ["Vintage Grail","Jackpot",500,950,29,"♛"],
      ["Legendary Find","Mythic",1100,2000,8,"⚡"]
    ]
  }
};

let state = load() || {
  cash: 120,
  level: 1,
  upgrades: 0,
  opened: 0,
  sold: 0,
  best: 0,
  nextId: 1,
  inventory: []
};

const $ = id => document.getElementById(id);
const money = n => "$" + Math.round(n).toLocaleString();

function saleMultiplier() {
  return 1 + state.upgrades * 0.08;
}

function saleValue(item) {
  return Math.round(item.value * saleMultiplier());
}

function netWorth() {
  return state.cash + state.inventory.reduce((sum, item) => sum + saleValue(item), 0);
}

function upgradeCost() {
  return 125 + state.upgrades * 175;
}

function pick(table) {
  const total = table.reduce((sum, row) => sum + row[4], 0);
  let roll = Math.random() * total;
  for (const row of table) {
    roll -= row[4];
    if (roll <= 0) {
      return {
        name: row[0],
        rarity: row[1],
        value: Math.round(row[2] + Math.random() * (row[3] - row[2])),
        mark: row[5]
      };
    }
  }
}

function openBox(type) {
  const box = BOXES[type];
  if (state.cash < box.cost) return;

  state.cash -= box.cost;
  state.opened++;

  const item = pick(box.items);
  item.id = state.nextId++;
  state.inventory.push(item);
  state.best = Math.max(state.best, item.value);

  $("reveal").innerHTML = `
    <div>
      <div class="symbol">${item.mark}</div>
      <div class="name">${item.name}</div>
      <div class="rarity">${item.rarity}</div>
      <div class="value">${money(item.value)}</div>
      <small>Estimated resale value</small>
    </div>`;

  save();
  render();
}

function sellOne(id) {
  const index = state.inventory.findIndex(x => x.id === id);
  if (index < 0) return;
  const item = state.inventory[index];
  state.cash += saleValue(item);
  state.sold++;
  state.inventory.splice(index, 1);
  save();
  render();
}

function sellAll() {
  if (!state.inventory.length) return;
  state.cash += state.inventory.reduce((sum, item) => sum + saleValue(item), 0);
  state.sold += state.inventory.length;
  state.inventory = [];
  save();
  render();
}

function upgrade() {
  const cost = upgradeCost();
  if (state.cash < cost) return;
  state.cash -= cost;
  state.upgrades++;
  state.level++;
  save();
  render();
}

function save() {
  localStorage.setItem("flipShopSave", JSON.stringify(state));
}

function load() {
  try {
    return JSON.parse(localStorage.getItem("flipShopSave"));
  } catch {
    return null;
  }
}

function render() {
  $("cash").textContent = money(state.cash);
  $("worth").textContent = money(netWorth());
  $("level").textContent = state.level;
  $("best").textContent = state.best ? money(state.best) : "—";
  $("progressText").textContent = `${state.opened} boxes opened · ${state.sold} items sold`;

  const progress = Math.min(100, (netWorth() / 10000) * 100);
  $("meterFill").style.width = progress + "%";

  $("upgradeBtn").textContent = `Upgrade — ${money(upgradeCost())}`;
  $("upgradeBtn").disabled = state.cash < upgradeCost();
  $("sellAllBtn").disabled = !state.inventory.length;

  document.querySelectorAll(".box").forEach(btn => {
    btn.disabled = state.cash < BOXES[btn.dataset.box].cost;
  });

  const inv = $("inventory");
  inv.innerHTML = "";

  if (!state.inventory.length) {
    inv.innerHTML = `<div class="empty">Nothing in inventory yet.</div>`;
  } else {
    [...state.inventory].reverse().forEach(item => {
      const row = document.createElement("div");
      row.className = "item";
      row.innerHTML = `
        <div>
          <strong>${item.mark} ${item.name}</strong>
          <small>${item.rarity} · base value ${money(item.value)}</small>
        </div>`;

      const btn = document.createElement("button");
      btn.textContent = `Sell ${money(saleValue(item))}`;
      btn.addEventListener("click", () => sellOne(item.id));
      row.appendChild(btn);
      inv.appendChild(row);
    });
  }
}

document.querySelectorAll(".box").forEach(btn => {
  btn.addEventListener("click", () => openBox(btn.dataset.box));
});

$("upgradeBtn").addEventListener("click", upgrade);
$("sellAllBtn").addEventListener("click", sellAll);
$("resetBtn").addEventListener("click", () => {
  localStorage.removeItem("flipShopSave");
  location.reload();
});

render();
