
(() => {
  const KEY = "lz_products_v1";
  const ADM_OK = "vxv23m@lzmktgg";

  const ILLEGAL = [
    /horned\s*lizard/i,            // e.g., Texas horned lizard
    /protected/i,                   // any 'protected' literal
  ];

  const seed = [
    { id: "green-anole", name: "Green Anole", scientific: "Anolis carolinensis", category: "Anole", price: 19, stock: 12, image: "assets/images/anole.svg", desc: "Small, curious, and charming climber."},
    { id: "bearded-dragon", name: "Bearded Dragon", scientific: "Pogona vitticeps", category: "Bearded Dragon", price: 119, stock: 5, image: "assets/images/bearded.svg", desc: "Gentle personalities, great for beginners."},
    { id: "texas-spiny-lizard", name: "Texas Spiny Lizard", scientific: "Sceloporus olivaceus", category: "Texas Spiny Lizard", price: 89, stock: 7, image: "assets/images/spiny.svg", desc: "Active climber with tons of character."},
    { id: "house-gecko", name: "Common House Gecko", scientific: "Hemidactylus frenatus", category: "Gecko", price: 15, stock: 10, image: "assets/images/gecko.svg", desc: "Hardy and beginner-friendly."}
  ];

// Supabase client setup
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

async function getAll(){
  const { data, error } = await supabase.from("lizards").select("*").order("name");
  if(error){
    console.error("Error fetching from Supabase:", error);
    return [];
  }
  return data;
}

async function setAll(list){
  // Wipes table and re-inserts — for admin bulk updates
  const { error: delError } = await supabase.from("lizards").delete().neq("id", "");
  if(delError){
    console.error("Error clearing table:", delError);
    return;
  }
  const { error: insError } = await supabase.from("lizards").insert(list);
  if(insError){
    console.error("Error inserting to table:", insError);
  }
}

  // Scroll reveal
  const io = new IntersectionObserver(entries => {
    for(const e of entries){
      if(e.isIntersecting){ e.target.classList.add("show"); io.unobserve(e.target); }
    }
  }, { threshold:.2 });
  document.querySelectorAll(".reveal").forEach(el => io.observe(el));

  // Simple modal helpers
  const modal = document.getElementById("purchase-modal");
  const backdrop = document.getElementById("modal-backdrop");
  function openModal(){ if(modal){ modal.style.display="block"; modal.classList.add("open"); if(backdrop) backdrop.style.display="grid"; } }
  function closeModal(){ if(modal){ modal.style.display="none"; modal.classList.remove("open"); if(backdrop) backdrop.style.display="none"; } }
  document.getElementById("pm-cancel")?.addEventListener("click", closeModal);
  document.getElementById("pm-confirm")?.addEventListener("click", () => { alert("Reservation placed! We'll email next steps."); closeModal(); });

  // Shop page rendering
  function renderShop(){
    const list = getAll();
    const wrap = document.getElementById("products");
    if(!wrap) return;

    function applyFilters(items){
      const cat = document.getElementById("filter-category")?.value || "";
      const avail = document.getElementById("filter-availability")?.value || "";
      return items.filter(p => {
        const okCat = !cat || p.category === cat;
        const okAvail = !avail || (avail === "in" ? p.stock > 0 : p.stock === 0);
        return okCat && okAvail;
      });
    }

    function card(p){
      const disabled = p.stock <= 0;
      const btnLabel = disabled ? "Out of stock" : "Reserve with Special Delivery";
      return `
        <article class="card" id="${p.id}">
          <img src="${p.image}" alt="${p.name}"/>
          <h3 class="title">${p.name}</h3>
          <p class="muted"><em>${p.scientific}</em></p>
          <p class="muted">${p.desc}</p>
          <div style="display:flex; align-items:center; justify-content:space-between; gap:.5rem">
            <span class="price">$${p.price}</span>
            <button class="btn ${disabled ? "alt" : ""}" data-buy="${p.id}" ${disabled ? "disabled" : ""}>${btnLabel}</button>
          </div>
          <p class="stock"><small>${p.stock} in stock</small></p>
        </article>`;
    }

    function paint(){
      const items = applyFilters(list);
      wrap.innerHTML = items.map(card).join("");
      wrap.querySelectorAll("[data-buy]").forEach(btn => {
        btn.addEventListener("click", e => {
          const id = e.currentTarget.getAttribute("data-buy");
          const idx = list.findIndex(x => x.id === id);
          if(idx >= 0 && list[idx].stock > 0){
            openModal();
            // decrement on confirm would be more realistic; for demo we do it here:
            list[idx].stock -= 1;
            setAll(list);
            setTimeout(paint, 200);
          }
        });
      });
    }

    document.getElementById("filter-category")?.addEventListener("change", paint);
    document.getElementById("filter-availability")?.addEventListener("change", paint);
    paint();

    // If URL has hash, scroll to that item
    if(location.hash){
      const el = document.querySelector(location.hash);
      if(el) el.scrollIntoView({ behavior:"smooth", block:"center" });
    }
  }

  // Admin
  function renderAdmin(){
    const pass = document.getElementById("adm-pass");
    const login = document.getElementById("adm-login");
    const status = document.getElementById("adm-status");
    const body = document.getElementById("adm-body");
    const tbl = document.getElementById("tbl")?.querySelector("tbody");
    const warn = document.getElementById("adm-warn");

    if(!pass || !login || !status || !body || !tbl) return;

    let authed = false;
    function setAuth(ok){
      authed = ok;
      status.textContent = ok ? "Unlocked" : "Locked";
      body.style.display = ok ? "grid" : "none";
    }
    login.addEventListener("click", () => {
      setAuth(pass.value === ADM_OK);
      if(!authed){ alert("Incorrect password"); }
    });

    const name = document.getElementById("lz-name");
    const sci = document.getElementById("lz-sci");
    const cat = document.getElementById("lz-cat");
    const price = document.getElementById("lz-price");
    const stock = document.getElementById("lz-stock");
    const img = document.getElementById("lz-img");
    const desc = document.getElementById("lz-desc");
    const btnAdd = document.getElementById("btn-add");
    const btnClear = document.getElementById("btn-clear");
    const btnExport = document.getElementById("btn-export");
    const fileImport = document.getElementById("file-import");

    function anyIllegal(text){
      return ILLEGAL.some(rx => rx.test(text));
    }

    function repaintTable(){
      const list = getAll();
      tbl.innerHTML = list.map((p, i) => `
        <tr>
          <td><strong>${p.name}</strong><br/><small><em>${p.scientific}</em></small></td>
          <td>${p.category}</td>
          <td>$${p.price}</td>
          <td>${p.stock}</td>
          <td style="display:flex; gap:.4rem">
            <button class="btn alt" data-inc="${p.id}">+1</button>
            <button class="btn alt" data-dec="${p.id}">-1</button>
            <button class="btn" data-del="${p.id}" style="background:linear-gradient(135deg, #ef4444, #f59e0b)">Delete</button>
          </td>
        </tr>
      `).join("");

      tbl.querySelectorAll("[data-inc]").forEach(b => b.addEventListener("click", e => {
        const id = e.currentTarget.getAttribute("data-inc");
        const list = getAll();
        const idx = list.findIndex(x => x.id === id);
        if(idx>=0){ list[idx].stock += 1; setAll(list); repaintTable(); }
      }));
      tbl.querySelectorAll("[data-dec]").forEach(b => b.addEventListener("click", e => {
        const id = e.currentTarget.getAttribute("data-dec");
        const list = getAll();
        const idx = list.findIndex(x => x.id === id);
        if(idx>=0 && list[idx].stock>0){ list[idx].stock -= 1; setAll(list); repaintTable(); }
      }));
      tbl.querySelectorAll("[data-del]").forEach(b => b.addEventListener("click", e => {
        const id = e.currentTarget.getAttribute("data-del");
        if(!confirm("Delete this lizard?")) return;
        const list = getAll().filter(x => x.id !== id);
        setAll(list); repaintTable();
      }));
    }

    btnAdd.addEventListener("click", () => {
      const nm = (name.value || "").trim();
      const sc = (sci.value || "").trim();
      const ct = (cat.value || "").trim();
      const pr = +price.value || 0;
      const st = Math.max(0, (+stock.value || 0));
      const im = (img.value || "").trim() || "assets/images/gecko.svg";
      const ds = (desc.value || "").trim();

      const blob = [nm, sc, ct, ds].join(" ");
      if(anyIllegal(blob) || /texas\s*horned\s*lizard/i.test(blob)){
        warn.textContent = "⚠️ Protected species detected (e.g., Texas horned lizard). Entry blocked.";
        warn.style.color = "var(--error)";
        return;
      } else {
        warn.textContent = "";
      }

      if(!nm){ alert("Name is required"); return; }
      const id = nm.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/(^-|-$)/g,"");

      const list = getAll();
      if(list.some(x => x.id === id)){ alert("A lizard with that name already exists."); return; }

      list.push({ id, name:nm, scientific:sc, category:ct, price:pr, stock:st, image:im, desc:ds });
      setAll(list);
      repaintTable();
      [name,sci,cat,price,stock,img,desc].forEach(el => el.value = "");
    });

    btnClear.addEventListener("click", () => [name,sci,cat,price,stock,img,desc].forEach(el => el.value = ""));

    btnExport.addEventListener("click", () => {
      const blob = new Blob([JSON.stringify(getAll(), null, 2)], {type: "application/json"});
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = "lizard-inventory.json";
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
    });

    fileImport.addEventListener("change", () => {
      const f = fileImport.files?.[0];
      if(!f) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const data = JSON.parse(reader.result);
          if(Array.isArray(data)) setAll(data);
          repaintTable();
        } catch (e) {
          alert("Invalid JSON");
        }
      };
      reader.readAsText(f);
    });

    repaintTable();
  }

  // route
  const page = window.__PAGE__ || (location.pathname.endsWith("admin.html") ? "admin" : location.pathname.endsWith("shop.html") ? "shop" : "home");
  if(page === "shop") renderShop();
  if(page === "admin") renderAdmin();

})();
