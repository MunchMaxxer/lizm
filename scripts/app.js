// =============================
// Admin Password
// =============================
window.__ADMIN_PASSWORD__ = "vxv23m@lzmktgg"; // keep it here, not in HTML

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
  if (error) { console.error("Error fetching lizards:", error); return []; }
  return data;
}

// =============================
// Add Lizard
// =============================
async function addLizard(lizard) {
  const { error } = await supabase.from("lizards").insert([lizard]);
  if (error) alert("Error adding lizard: " + error.message);
}

// =============================
// Admin Table
// =============================
async function repaintTable() {
  const list = await getAll();
  const tbody = document.querySelector("#lizardTable tbody");
  if (!tbody) return;

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
// Password Overlay Handling
// =============================
document.addEventListener("DOMContentLoaded", () => {
  const overlay = document.getElementById("password-overlay");
  const content = document.getElementById("admin-content");
  const submit = document.getElementById("admin-submit");
  const input = document.getElementById("admin-pass");
  const error = document.getElementById("admin-error");

  submit.addEventListener("click", async () => {
    if (input.value === window.__ADMIN_PASSWORD__) {
      overlay.style.display = "none";
      content.style.display = "block";
      await repaintTable();
    } else {
      error.textContent = "Incorrect password!";
    }
  });

  input.addEventListener("keypress", (e) => { if (e.key === "Enter") submit.click(); });

  // Admin Add Button
  const btn = document.getElementById("btnAdd");
  btn?.addEventListener("click", async () => {
    const nm = document.getElementById("name").value.trim();
    if (!nm) { alert("Name required"); return; }
    const sci = document.getElementById("sci").value.trim();
    const cat = document.getElementById("cat").value.trim();
    const price = parseFloat(document.getElementById("price").value) || 0;
    const stock = parseInt(document.getElementById("stock").value) || 0;
    const img = document.getElementById("img").value.trim() || "assets/images/gecko.svg";
    const desc = document.getElementById("desc").value.trim();
    const id = nm.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    await addLizard({ id, name:nm, scientific:sci, category:cat, price, stock, image:img, desc });
    await repaintTable();
    ["name","sci","cat","price","stock","img","desc"].forEach(id=>document.getElementById(id).value="");
  });
});
