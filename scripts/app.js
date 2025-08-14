// ======= SUPABASE CONFIG =======
const SUPABASE_URL = "https://icqjefaxvuaxmlgyusgc.supabase.co"; // replace if needed
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImljcWplZmF4dnVheG1sZ3l1c2djIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMjAyODAsImV4cCI6MjA3MDY5NjI4MH0.prPCfB2CryD7dOb9LeRxU6obsCVXCTYTmTUMuWi97jg";
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ======= PAGE INIT =======
document.addEventListener("DOMContentLoaded", async () => {
    if (window.__PAGE__ === "shop") {
        await loadShopProducts(); // Load all products initially
        setupFilters();
    }
    if (window.__PAGE__ === "admin") {
        setupAdminLogin();
        setupAddLizardForm();
    }
});

// ======= ADMIN LOGIN =======
function setupAdminLogin() {
    const loginForm = document.getElementById("admin-login-form");
    const loginOverlay = document.getElementById("admin-login");
    const adminPanel = document.getElementById("admin-panel");

    loginForm?.addEventListener("submit", (e) => {
        e.preventDefault();
        const email = document.getElementById("admin-email").value;
        const password = document.getElementById("admin-password").value;

        // Hardcoded credentials example
        if (email === "fileppcat@gmail.com" && password === "admin123") {
            loginOverlay.style.display = "none";
            adminPanel.style.display = "block";
        } else {
            alert("Invalid credentials.");
        }
    });
}

// ======= ADD LIZARD FORM =======
function setupAddLizardForm() {
    const addForm = document.getElementById("add-lizard-form");

    addForm?.addEventListener("submit", async (e) => {
        e.preventDefault();

        const name = document.getElementById("lizard-name").value.trim();
        const scientific = document.getElementById("lizard-scientific").value.trim();
        const category = document.getElementById("lizard-category").value.trim();
        const desc = document.getElementById("lizard-desc").value.trim();
        const image = document.getElementById("lizard-image").value.trim();
        const price = parseFloat(document.getElementById("lizard-price").value) || 0;
        const availability = document.getElementById("lizard-availability").value.trim();

        const { error } = await supabaseClient
            .from("lizards")
            .insert([{ name, scientific, category, desc, image, price, availability }]);

        if (error) {
            console.error("Error adding lizard:", error);
            alert("Failed to add lizard.");
        } else {
            alert("Lizard added successfully!");
            addForm.reset();
        }
    });
}

// ======= LOAD SHOP PRODUCTS =======
async function loadShopProducts(filters = {}) {
    try {
        let query = supabaseClient.from("lizards").select("*");

        if (filters.category) query = query.eq("category", filters.category);
        if (filters.availability) query = query.eq("availability", filters.availability);

        const { data: lizards, error } = await query;

        const container = document.getElementById("products");
        container.innerHTML = "";

        if (error) throw error;

        if (!lizards || lizards.length === 0) {
            container.innerHTML = "<p>No lizards found.</p>";
            return;
        }

        const template = document.getElementById("product-template");

        lizards.forEach(lizard => {
            const clone = template.content.cloneNode(true);
            clone.querySelector(".product-image").src = lizard.image || "images/placeholder.jpg";
            clone.querySelector(".product-image").alt = lizard.name || "Unnamed Lizard";
            clone.querySelector(".product-name").textContent = lizard.name || "Unnamed Lizard";
            clone.querySelector(".product-desc").textContent = lizard.desc || "";
            clone.querySelector(".product-price").textContent = `$${lizard.price?.toFixed(2) || "0.00"}`;
            clone.querySelector(".btn-reserve").addEventListener("click", () => {
                openPurchaseModal(lizard.name);
            });
            container.appendChild(clone);
        });
    } catch (err) {
        console.error("Error fetching lizards:", err);
        document.getElementById("products").innerHTML = `<p class="error">Failed to load lizards.</p>`;
    }
}

// ======= FILTERS =======
function setupFilters() {
    const categorySelect = document.getElementById("filter-category");
    const availabilitySelect = document.getElementById("filter-availability");

    categorySelect?.addEventListener("change", applyFilters);
    availabilitySelect?.addEventListener("change", applyFilters);
}

function applyFilters() {
    const category = document.getElementById("filter-category").value;
    const availability = document.getElementById("filter-availability").value;
    loadShopProducts({ category, availability });
}

// ======= PURCHASE MODAL =======
function openPurchaseModal(lizardName) {
    const modal = document.getElementById("purchase-modal");
    const backdrop = document.getElementById("modal-backdrop");
    document.getElementById("pm-title").textContent = `Special Delivery breakdown — ${lizardName}`;
    modal.style.display = "block";
    backdrop.style.display = "block";
}

document.getElementById("pm-cancel")?.addEventListener("click", () => {
    document.getElementById("purchase-modal").style.display = "none";
    document.getElementById("modal-backdrop").style.display = "none";
});

document.getElementById("pm-confirm")?.addEventListener("click", () => {
    window.location.href = "https://gl.me/u/zQHlRkWldrqc";
    document.getElementById("purchase-modal").style.display = "none";
    document.getElementById("modal-backdrop").style.display = "none";
});
