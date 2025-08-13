(() => {
  // =============================
  // Admin Password
  // =============================
  const ADM_OK = "vxv23m@lzmktgg"; // password checked here only

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
    if (error) alert("Error adding lizard: " + error.message);
  }

  // =============================
  // Update Lizard
  // =============================
  async function updateLizard(id, fields) {
    const { error } = await supabase.from("lizards").update(fields).eq("id", id);
    if (error) alert("Error updating lizard: " + error.message);
  }

  // =============================
  // Delete Lizard
  // =============================
  async function deleteLizard(id) {
    const { error } = await supabase.from("lizards").delete().eq("id", id);
    if (error) alert("Error deleting lizard: " + error.message);
  }

  // =============================
  // Render Admin Table
  // =============================
  async function repaintAdminTable() {
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
        <td style="display:flex; gap:.4rem">
          <button class="btn alt" data-inc="${l.id}">+1</button>
          <button class="btn alt" data-dec="${l.id}">-1</button>
          <button class="btn" data-del="${l.id}" style="background:linear-gradient(135deg, #ef4444, #f59e0b)">Delete</button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    // Event listeners for each row
    tbody.querySelectorAll("[data-inc]").forEach(btn => {
      btn.addEventListener("click", async e => {
        const id = e.currentTarget.getAttribute("data-inc");
        const item = (await getAll()).find(x => x.id === id);
        if (item) {
          await updateLizard(id, { stock: item.stock + 1 });
          repaintAdminTable();
        }
      });
    });
    tbody.querySelectorAll("[data-dec]").forEach(btn => {
      btn.addEventListener("click", async e => {
        const id = e.currentTarget.getAttribute("data-dec");
        const item = (await getAll()).find(x => x.id === id);
        if (item && item.stock > 0) {
          await updateLizard(id, { stock: item.stock - 1 });
          repaintAdminTable();
        }
      });
    });
    tbody.querySelectorAll("[data-del]").forEach(btn => {
      btn.addEventListener("click", async e => {
        const id = e.currentTarget.getAttribute("data-del");
        if (confirm("Delete this lizard?")) {
          await deleteLizard(id);
          repaintAdminTable();
        }
      });
    });
  }

  // =============================
  // Admin Password Page
  // =============================
  function setupAdminAuth() {
    const passInput = document.getElementById("adm-pass");
    const loginBtn = document.getElementById("adm-login");
    const status = document.getElementById("adm-status");
    const body = document.getElementById("adm-body");

    if (!passInput || !loginBtn || !status || !body) return;

    body.style.display = "none"; // hide content until login

    loginBtn.addEventListener("click", () => {
      const pw = passInput.value;
      if (pw === ADM_OK) {
        body.style.display = "grid";
        status.textContent = "Unlocked";
        repaintAdminTable();
      } else {
        status.textContent = "Locked";
        alert("Incorrect password");
      }
    });
  }

  // =============================
  // Render Shop
  // =============================
  async function repaintShop() {
    const grid = document.querySelector("#products");
    if (!grid) return;

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
        <button class="btn" onclick="window.open('https://gl.me/u/zQHlRkWldrqc','_blank')">Buy Now</button>
      `;
      grid.appendChild(card);
    });

    // Scroll reveal
    document.querySelectorAll(".reveal").forEach(el => {
      setTimeout(() => el.classList.add("show"), 100);
    });
  }

  // =============================
  // Admin Add Form
  // =============================
  function setupAdminAdd() {
    const btn = document.getElementById("btnAdd");
    if (!btn) return;

    btn.addEventListener("click", async () => {
      const nm = document.getElementById("name").value.trim();
      if (!nm) { alert("Name required"); return; }
      const sci = document.getElementById("sci").value.trim();
      const cat = document.getElementById("cat").value.trim();
      const price = parseFloat(document.getElementById("price").value) || 0;
      const stock = parseInt(document.getElementById("stock").value) || 0;
      const img = document.getElementById("img").value.trim() || "assets/images/gecko.svg";
      const desc = document.getElementById("desc").value.trim();

      const id = nm.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      await addLizard({ id, name: nm, scientific: sci, category: cat, price, stock, image: img, desc });

      await repaintAdminTable();
      ["name","sci","cat","price","stock","img","desc"].forEach(id => document.getElementById(id).value = "");
    });
  }

  // =============================
  // Init
  // =============================
  document.addEventListener("DOMContentLoaded", () => {
    setupAdminAuth();
    setupAdminAdd();
    repaintShop();
  });

  // Optional real-time sync
  supabase.channel('lizard_changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'lizards' }, payload => {
      repaintAdminTable();
      repaintShop();
    })
    .subscribe();

})();
