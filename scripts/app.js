(() => {
  // =============================
  // Supabase Config
  // =============================
  const SUPABASE_URL = "https://icqjefaxvuaxmlgyusgc.supabase.co";
  const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImljcWplZmF4dnVheG1sZ3l1c2djIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMjAyODAsImV4cCI6MjA3MDY5NjI4MH0.prPCfB2CryD7dOb9LeRxU6obsCVXCTYTmTUMuWi97jg";
  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

  // =============================
  // Admin Email
  // =============================
  const ADMIN_EMAIL = "fileppcat@gmail.com";

  // =============================
  // Fetch All Lizards
  // =============================
  async function getAll() {
    const { data, error } = await supabase.from("lizards").select("*").order("name");
    if (error) { console.error(error); return []; }
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
  // Admin Overlay
  // =============================
  function setupAdminOverlay(user) {
    const overlay = document.getElementById("adm-overlay");
    const body = document.getElementById("adm-body");
    const status = document.getElementById("adm-status");

    if (!overlay || !body || !status) return;

    if (user.email === ADMIN_EMAIL) {
      overlay.style.display = "none"; // hide login overlay
      body.style.display = "grid"; // show admin content
      status.textContent = "Unlocked";
      repaintAdminTable();
    } else {
      overlay.style.display = "grid"; // show login overlay
      body.style.display = "none"; // hide admin content
      status.textContent = "Access Denied";
    }
  }

  // =============================
  // Google Login
  // =============================
  async function loginWithGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.href }
    });
    if (error) alert("Login failed: " + error.message);
  }

  // =============================
  // Logout
  // =============================
  async function logout() {
    await supabase.auth.signOut();
    window.location.reload();
  }

  // =============================
  // Admin Table
  // =============================
  async function repaintAdminTable() {
    const tbody = document.querySelector("#lizardTable tbody");
    if (!tbody) return;

    const list = await getAll();
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
  // Initialize
  // =============================
  document.addEventListener("DOMContentLoaded", async () => {
    const loginBtn = document.getElementById("btn-login");
    if (loginBtn) loginBtn.addEventListener("click", loginWithGoogle);

    const logoutBtn = document.getElementById("btn-logout");
    if (logoutBtn) logoutBtn.addEventListener("click", logout);

    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) setupAdminOverlay(session.user);

    supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) setupAdminOverlay(session.user);
      else setupAdminOverlay({ email: "" });
    });

    setupAdminAdd();
  });

  // =============================
  // Real-time Sync
  // =============================
  supabase.channel('lizard_changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'lizards' }, () => {
      repaintAdminTable();
    })
    .subscribe();
})();
