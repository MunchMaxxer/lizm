(() => {
  // =============================
  // Supabase Config
  // =============================
  const SUPABASE_URL = "https://icqjefaxvuaxmlgyusgc.supabase.co";
  const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImljcWplZmF4dnVheG1sZ3l1c2djIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMjAyODAsImV4cCI6MjA3MDY5NjI4MH0.prPCfB2CryD7dOb9LeRxU6obsCVXCTYTmTUMuWi97jg";
  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

  // =============================
  // Fetch & Manage Lizards
  // =============================
  async function getAll() {
    const { data, error } = await supabase.from("lizards").select("*").order("name");
    if (error) { console.error("Error fetching lizards:", error); return []; }
    return data;
  }

  async function addLizard(lizard) {
    const { error } = await supabase.from("lizards").insert([lizard]);
    if (error) alert("Error adding lizard: " + error.message);
  }

  async function updateLizard(id, fields) {
    const { error } = await supabase.from("lizards").update(fields).eq("id", id);
    if (error) alert("Error updating lizard: " + error.message);
  }

  async function deleteLizard(id) {
    const { error } = await supabase.from("lizards").delete().eq("id", id);
    if (error) alert("Error deleting lizard: " + error.message);
  }

  // =============================
  // Admin Table
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

    tbody.querySelectorAll("[data-inc]").forEach(btn => {
      btn.addEventListener("click", async e => {
        const id = e.currentTarget.getAttribute("data-inc");
        const item = (await getAll()).find(x => x.id === id);
        if (item) { await updateLizard(id, { stock: item.stock + 1 }); repaintAdminTable(); repaintShop(); }
      });
    });

    tbody.querySelectorAll("[data-dec]").forEach(btn => {
      btn.addEventListener("click", async e => {
        const id = e.currentTarget.getAttribute("data-dec");
        const item = (await getAll()).find(x => x.id === id);
        if (item && item.stock > 0) { await updateLizard(id, { stock: item.stock - 1 }); repaintAdminTable(); repaintShop(); }
      });
    });

    tbody.querySelectorAll("[data-del]").forEach(btn => {
      btn.addEventListener("click", async e => {
        const id = e.currentTarget.getAttribute("data-del");
        if (confirm("Delete this lizard?")) { await deleteLizard(id); repaintAdminTable(); repaintShop(); }
      });
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
      repaintShop();
    });
  }

  // =============================
  // Google Login
  // =============================
  async function loginWithGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin + "/admin.html" }
    });
    if (error) console.error("Login error:", error.message);
  }

  async function checkSession() {
    const { data: { session } } = await supabase.auth.getSession();
    const loginSection = document.getElementById("login-section");
    const adminBody = document.getElementById("adm-body");
    const logoutBtn = document.getElementById("btn-logout");
    const status = document.getElementById("adm-status");

    if (session && session.user.email === "fileppcat@gmail.com") {
      loginSection.style.display = "none";
      adminBody.style.display = "block";
      logoutBtn.style.display = "inline-flex";
      status.textContent = "";
      repaintAdminTable();
    } else {
      loginSection.style.display = "block";
      adminBody.style.display = "none";
      logoutBtn.style.display = "none";
      if (session) status.textContent = "Unauthorized user";
    }
  }

  async function logout() {
    await supabase.auth.signOut();
    checkSession();
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
        <div class="desc">${l.desc || ""}</div>
      `;
      grid.appendChild(card);
    });
  }

  // =============================
  // Init
  // =============================
  document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("btn-login")?.addEventListener("click", loginWithGoogle);
    document.getElementById("btn-logout")?.addEventListener("click", logout);

    setupAdminAdd();
    checkSession();
    repaintShop();
  });

  // Real-time updates
  supabase.channel('lizard_changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'lizards' }, payload => {
      repaintAdminTable();
      repaintShop();
    })
    .subscribe();

})();
