(() => {
  // =============================
  // Supabase Config
  // =============================
  const SUPABASE_URL = "https://icqjefaxvuaxmlgyusgc.supabase.co";
  const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImljcWplZmF4dnVheG1sZ3l1c2djIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMjAyODAsImV4cCI6MjA3MDY5NjI4MH0.prPCfB2CryD7dOb9LeRxU6obsCVXCTYTmTUMuWi97jg";
  const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

  // =============================
  // Google Login & Admin Check
  // =============================
  async function handleLogin() {
    const { data } = await supabase.auth.getSession();
    if (data?.session) checkAdmin(data.session.user.email);

    const loginBtn = document.getElementById("loginGoogle");
    if (loginBtn) {
      loginBtn.addEventListener("click", async () => {
        await supabase.auth.signInWithOAuth({
          provider: "google",
          options: { redirectTo: window.location.href }
        });
      });
    }

    supabase.auth.onAuthStateChange((_event, session) => {
      if (session) checkAdmin(session.user.email);
    });
  }

  function checkAdmin(email) {
    if (email === "fileppcat@gmail.com") {
      const body = document.getElementById("adminBody");
      const tab = document.getElementById("adminTab");
      const loginSection = document.getElementById("loginSection");
      if (body) body.style.display = "grid";
      if (tab) tab.style.display = "inline-flex";
      if (loginSection) loginSection.style.display = "none";
      repaintAdminTable();
    } else {
      alert("Access denied: Not authorized for admin panel.");
    }
  }

  // =============================
  // Fetch All Lizards
  // =============================
  async function getAll() {
    const { data, error } = await supabase.from("lizards").select("*").order("name");
    if (error) { console.error(error); return []; }
    return data;
  }

  // =============================
  // CRUD Functions
  // =============================
  async function addLizard(l) { await supabase.from("lizards").insert([l]); }
  async function updateLizard(id, fields) { await supabase.from("lizards").update(fields).eq("id", id); }
  async function deleteLizard(id) { await supabase.from("lizards").delete().eq("id", id); }

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
        <td><small>${l.scientific||""}</small></td>
        <td>${l.category||""}</td>
        <td>$${l.price?.toFixed(2)||0}</td>
        <td>${l.stock||0}</td>
        <td style="display:flex; gap:.4rem">
          <button class="btn alt" data-inc="${l.id}">+1</button>
          <button class="btn alt" data-dec="${l.id}">-1</button>
          <button class="btn" data-del="${l.id}" style="background:linear-gradient(135deg, #ef4444, #f59e0b)">Delete</button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    // Increment / Decrement / Delete
    tbody.querySelectorAll("[data-inc]").forEach(btn => btn.addEventListener("click", async e => {
      const id = e.currentTarget.dataset.inc;
      const item = (await getAll()).find(x => x.id === id);
      if(item) { await updateLizard(id, {stock: item.stock+1}); repaintAdminTable(); }
    }));
    tbody.querySelectorAll("[data-dec]").forEach(btn => btn.addEventListener("click", async e => {
      const id = e.currentTarget.dataset.dec;
      const item = (await getAll()).find(x => x.id === id);
      if(item && item.stock>0) { await updateLizard(id, {stock: item.stock-1}); repaintAdminTable(); }
    }));
    tbody.querySelectorAll("[data-del]").forEach(btn => btn.addEventListener("click", async e => {
      const id = e.currentTarget.dataset.del;
      if(confirm("Delete this lizard?")) { await deleteLizard(id); repaintAdminTable(); }
    }));
  }

  // =============================
  // Admin Add Form
  // =============================
  function setupAdminAdd() {
    const btn = document.getElementById("btnAdd");
    if(!btn) return;

    btn.addEventListener("click", async () => {
      const nm = document.getElementById("name").value.trim();
      if(!nm) { alert("Name required"); return; }
      const sci = document.getElementById("sci").value.trim();
      const cat = document.getElementById("cat").value.trim();
      const price = parseFloat(document.getElementById("price").value)||0;
      const stock = parseInt(document.getElementById("stock").value)||0;
      const img = document.getElementById("img").value.trim()||"assets/images/gecko.svg";
      const desc = document.getElementById("desc").value.trim();
      const id = nm.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/(^-|-$)/g,"");

      await addLizard({id,name:nm,scientific:sci,category:cat,price,stock,image:img,desc});
      repaintAdminTable();
      ["name","sci","cat","price","stock","img","desc"].forEach(id=>document.getElementById(id).value="");
    });
  }

  // =============================
  // Initialize
  // =============================
  document.addEventListener("DOMContentLoaded", () => {
    handleLogin();
    setupAdminAdd();
  });

  // =============================
  // Real-time Updates
  // =============================
  supabase.channel('lizard_changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'lizards' }, payload => {
      repaintAdminTable();
    })
    .subscribe();

})();
