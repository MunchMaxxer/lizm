// =============================
// Supabase Config
// =============================
const SUPABASE_URL = "https://icqjefaxvuaxmlgyusgc.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImljcWplZmF4dnVheG1sZ3l1c2djIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMjAyODAsImV4cCI6MjA3MDY5NjI4MH0.prPCfB2CryD7dOb9LeRxU6obsCVXCTYTmTUMuWi97jg";
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// =============================
// Fetch All Lizards
// =============================
async function getAll() {
  const { data, error } = await supabase.from("lizards").select("*").order("name");
  if (error) {
    console.error("Error fetching lizards:", error);
    return [];
  }
  return data;
}

// =============================
// Add Lizard
// =============================
async function addLizard(lizard) {
  const { error } = await supabase.from("lizards").insert([lizard]);
  if (error) {
    alert("Error adding lizard: " + error.message);
  }
}

// =============================
// Update Lizard
// =============================
async function updateLizard(id, fields) {
  const { error } = await supabase.from("lizards").update(fields).eq("id", id);
  if (error) {
    alert("Error updating lizard: " + error.message);
  }
}

// =============================
// Delete Lizard
// =============================
async function deleteLizard(id) {
  const { error } = await supabase.from("lizards").delete().eq("id", id);
  if (error) {
    alert("Error deleting lizard: " + error.message);
  }
}

// =============================
// Render Admin Table
// =============================
async function repaintTable() {
  const list = await getAll();
  const tbody = document.querySelector("#lizardTable tbody");
  if (!tbody) return; // not on admin page

  tbody.innerHTML = "";
  list.forEach(l => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${l.name}</td>
      <td><small>${l.scientific || ""}</small></td>
      <td>${l.category || ""}</td>
      <td>$${l.price.toFixed(2)}</td>
      <td>${l.stock}</td>
    `;
    tbody.appendChild(tr);
  });
}

// =============================
// Render Shop Products
// =============================
async function repaintShop() {
  const grid = document.querySelector("#productGrid");
  if (!grid) return; // not on shop page

  const list = await getAll();
  grid.innerHTML = "";
  list.forEach(l => {
    const card = document.createElement("div");
    card.className = "card reveal";
    card.innerHTML = `
      <img src="${l.image}" alt="${l.name}">
      <div class="title">${l.name}</div>
      <div class="muted"><small>${l.scientific || ""}</small></div>
      <div class="price">$${l.price.toFixed(2)}</div>
      <div class="stock">Stock: ${l.stock}</div>
    `;
    grid.appendChild(card);
  });

  // trigger scroll reveal
  document.querySelectorAll(".reveal").forEach(el => {
    setTimeout(() => el.classList.add("show"), 100);
  });
}

// =============================
// Event Listeners for Admin Add
// =============================
document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("btnAdd");

  if (btn) {
    btn.addEventListener("click", async () => {
      const nm = document.getElementById("name").value.trim();
      if (!nm) { alert("Name is required"); return; }
      const sci = document.getElementById("sci").value.trim();
      const cat = document.getElementById("cat").value.trim();
      const price = parseFloat(document.getElementById("price").value) || 0;
      const stock = parseInt(document.getElementById("stock").value) || 0;
      const img = document.getElementById("img").value.trim() || "assets/images/gecko.svg";
      const desc = document.getElementById("desc").value.trim();

      const id = nm.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

      await addLizard({ id, name: nm, scientific: sci, category: cat, price, stock, image: img, desc });
      await repaintTable();

      // reset form
      ["name", "sci", "cat", "price", "stock", "img", "desc"].forEach(id => document.getElementById(id).value = "");
    });

    repaintTable();
  }

  repaintShop();
});

// =============================
// Optional: Real-time Sync
// =============================
supabase.channel('lizard_changes')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'lizards' }, payload => {
    repaintTable();
    repaintShop();
  })
  .subscribe();
