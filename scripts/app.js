(() => {
  // =============================
  // Admin Password
  // =============================
  const ADM_OK = "vxv23m@lzmktgg";

  // Only prompt on admin page
  if (location.pathname.endsWith("admin.html")) {
    const password = prompt("Enter admin password:");
    if (password !== ADM_OK) {
      alert("Incorrect password. Access denied.");
      document.body.innerHTML = "<h2 style='color:red;text-align:center;margin-top:3rem'>Access Denied</h2>";
      throw new Error("Unauthorized access");
    }
  }

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
        <td style="display:flex;gap:.5rem">
          <button class="btn alt" data-inc="${l.id}">+1</button>
          <button class="btn alt" data-dec="${l.id}">-1</button>
          <button class="btn" data-del="${l.id}" style="background:linear-gradient(135deg,#ef4444,#f59e0b)">Delete</button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    // Increment
    tbody.querySelectorAll("[data-inc]").forEach(b => {
      b.addEventListener("click", async e => {
        const id = e.currentTarget.dataset.inc;
        const lizard = (await getAll()).find(x => x.id === id);
        if (lizard) {
          await updateLizard(id, { stock: lizard.stock + 1 });
          repaintTable();
        }
      });
    });

    // Decrement
    tbody.querySelectorAll("[data-dec]").forEach(b => {
      b.addEventListener("click", async e => {
        const id = e.currentTarget.dataset.dec;
        const lizard = (await getAll()).find(x => x.id === id);
        if (lizard && lizard.stock > 0) {
          await updateLizard(id, { stock: lizard.stock - 1 });
          repaintTable();
        }
      });
    });

    // Delete
    tbody.querySelectorAll("[data-del]").forEach(b => {
      b.addEventListener("click", async e => {
        const id = e.currentTarget.dataset.del;
        if (!confirm("Delete this lizard?")) return;
        await deleteLizard(id);
        repaintTable();
      });
    });
  }

  // =============================
  // Render Shop Products
  // =============================
  async function repaintShop() {
    const grid = document.querySelector("#productGrid");
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
      `;
      grid.appendChild(card);
    });

    // Scroll reveal
    document.querySelectorAll(".reveal").forEach((el, i) => setTimeout(() => el.classList.add("show"), 100 * i));
  }

  // =============================
  // DOM Ready
  // =============================
  document.addEventListener("DOMContentLoaded", () => {
    // Admin Add Form
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

        // Reset form
        ["name", "sci", "cat", "price", "stock", "img", "desc"].forEach(id => document.getElementById(id).value = "");
      });
      repaintTable();
    }

    // Render shop
    repaintShop();
  });

  // =============================
  // Real-time Sync
  // =============================
  supabase.channel('lizard_changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'lizards' }, () => {
      repaintTable();
      repaintShop();
    })
    .subscribe();
})();
