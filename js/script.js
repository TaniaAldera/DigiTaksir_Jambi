/* STATE */
let selectedProduct = "";
let currentType = "perhiasan";
let currentTab = "taksir";
let currentMargin = 0.0092;
let myChart = null;
let items = []; // array of { type, berat, kadar, merek, denominasi }
let itemIdCounter = 0;

const STL_PERHIASAN = 2271391;
const STL_GALERI24 = 2400000;
const STL_ANTAM = 2271391;
const STL_UBS = 2271391;

const KADAR_OPTIONS = [
  { label: "24K (99%)", val: 24 },
  { label: "22K (91.7%)", val: 22 },
  { label: "21K (87.5%)", val: 21 },
  { label: "20K (83.3%)", val: 20 },
  { label: "18K (75%)", val: 18 },
  { label: "17K (70.8%)", val: 17 },
  { label: "16K (66.7%)", val: 16 },
  { label: "14K (58.3%)", val: 14 },
];

const DENOM_OPTIONS = [0.5, 1, 2, 5, 10, 25, 50, 100, 250, 500, 1000];

const hargaEmas = {
  0.5: 1462000,
  1: 2788000,
  2: 5509000,
  5: 13671000,
  10: 27270000,
  25: 67806000,
  50: 135505000,
  100: 270877000,
  250: 675529000,
  500: 1351056000,
  1000: 2702112000,
};

/* INIT */
window.onload = function () {
  let c = localStorage.getItem("digitaksir_usage") || 0;
  document.getElementById("countDisplay").innerText = c;
  document.getElementById("date-display").innerText =
    "Last Update: " +
    new Date().toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  renderTable();
};

/* TAB SWITCH */
function switchTab(tab) {
  currentTab = tab;
  document
    .getElementById("sectionTaksir")
    .classList.toggle("hidden", tab !== "taksir");
  document
    .getElementById("sectionCicil")
    .classList.toggle("hidden", tab !== "cicil");
  document
    .getElementById("tabTaksir")
    .classList.toggle("active", tab === "taksir");
  document
    .getElementById("tabCicil")
    .classList.toggle("active", tab === "cicil");
}

/* PILIH PRODUK */
function pilihProduk(prod) {
  selectedProduct = prod;
  ["KCA", "FLEKSI", "KRASIDA"].forEach((p) => {
    document.getElementById("pill-" + p).classList.toggle("active", p === prod);
  });
  document.getElementById("labelProdukAktif").innerText = "— " + prod;
  document.getElementById("lblProdukHasil").innerText = prod;
  document.getElementById("stepPilihProduk").classList.add("hidden");
  document.getElementById("stepInput").classList.remove("hidden");
  document.getElementById("panelHasil").classList.add("hidden");

  // Reset items & add first item
  items = [];
  itemIdCounter = 0;
  renderItemList();
  tambahItem();

  updateTenorOptions();
}

function kembali() {
  document.getElementById("stepPilihProduk").classList.remove("hidden");
  document.getElementById("stepInput").classList.add("hidden");
  document.getElementById("panelHasil").classList.add("hidden");
  selectedProduct = "";
  ["KCA", "FLEKSI", "KRASIDA"].forEach((p) =>
    document.getElementById("pill-" + p).classList.remove("active")
  );
}

/* SWITCH TYPE: perhiasan / batangan */
function switchType(type) {
  currentType = type;
  document
    .getElementById("btnPerh")
    .classList.toggle("active", type === "perhiasan");
  document
    .getElementById("btnBat")
    .classList.toggle("active", type === "batangan");
  // Reset all items to new type
  items = items.map((it) => ({ ...it, type }));
  renderItemList();
  updateSubtotal();
}

/* ITEM MANAGEMENT */
function tambahItem() {
  if (items.length >= 10) {
    alert("Maksimal 10 item dapat ditambahkan.");
    return;
  }
  const id = ++itemIdCounter;
  items.push({
    id,
    type: currentType,
    berat: "",
    kadar: 24,
    merek: "galeri24",
    denominasi: 1,
  });
  renderItemList();

  // Focus last berat/denom input
  setTimeout(() => {
    const el =
      document.getElementById("berat_" + id) ||
      document.getElementById("denom_" + id);
    if (el) el.focus();
  }, 50);
}

function hapusItem(id) {
  if (items.length <= 1) {
    alert("Minimal 1 item diperlukan.");
    return;
  }
  items = items.filter((it) => it.id !== id);
  renderItemList();
  updateSubtotal();
}

function onItemChange(id, field, val) {
  const item = items.find((it) => it.id === id);
  if (!item) return;
  if (field === "berat") item.berat = parseFloat(val) || 0;
  if (field === "kadar") item.kadar = parseFloat(val) || 24;
  if (field === "merek") item.merek = val;
  if (field === "denominasi") item.denominasi = parseFloat(val) || 1;
  updatePreview(id);
  updateSubtotal();
}

/* RENDER ITEM LIST */
function renderItemList() {
  const list = document.getElementById("itemList");
  list.innerHTML = "";
  items.forEach((item, idx) => {
    const div = document.createElement("div");
    div.className = "item-card";
    div.id = "card_" + item.id;
    div.innerHTML = buildItemHTML(item, idx + 1);
    list.appendChild(div);
  });
  // Update add button state
  const addBtn = document.getElementById("addItemBtn");
  addBtn.style.opacity = items.length >= 10 ? "0.4" : "1";
  addBtn.style.pointerEvents = items.length >= 10 ? "none" : "auto";
}

function buildItemHTML(item, num) {
  const id = item.id;
  if (currentType === "perhiasan") {
    const kadarOpts = KADAR_OPTIONS.map(
      (k) =>
        `<option value="${k.val}" ${item.kadar == k.val ? "selected" : ""}>${
          k.label
        }</option>`
    ).join("");
    return `
      <div class="item-card-num">${num}</div>
      <div class="item-card-fields">
        <div class="item-field">
          <label>Berat (gr)</label>
          <input type="number" id="berat_${id}" min="0.01" step="0.01" max="1000"
            value="${item.berat || ""}" placeholder="0.00"
            oninput="onItemChange(${id},'berat',this.value)"/>
        </div>
        <div class="item-field">
          <label>Kadar</label>
          <select id="kadar_${id}" onchange="onItemChange(${id},'kadar',this.value)">
            ${kadarOpts}
          </select>
        </div>
        <div class="item-field">
          <label>Taksiran</label>
          <div class="taksiran-preview" id="prev_${id}">—</div>
        </div>
        <div class="item-field">
          <label>UP Est.</label>
          <div class="taksiran-preview" id="up_${id}" style="color:var(--gold)">—</div>
        </div>
      </div>
      <button class="item-remove" onclick="hapusItem(${id})" title="Hapus item">✕</button>
    `;
  } else {
    const denomOpts = DENOM_OPTIONS.map(
      (d) =>
        `<option value="${d}" ${item.denominasi == d ? "selected" : ""}>${
          d >= 1 ? d : "0,5"
        } gr</option>`
    ).join("");
    return `
      <div class="item-card-num">${num}</div>
      <div class="item-card-fields batangan-fields">
        <div class="item-field">
          <label>Merek</label>
          <select id="merek_${id}" onchange="onItemChange(${id},'merek',this.value)">
            <option value="galeri24" ${
              item.merek === "galeri24" ? "selected" : ""
            }>Galeri 24</option>
            <option value="antam" ${
              item.merek === "antam" ? "selected" : ""
            }>ANTAM</option>
            <option value="ubs" ${
              item.merek === "ubs" ? "selected" : ""
            }>UBS</option>
          </select>
        </div>
        <div class="item-field">
          <label>Denominasi</label>
          <select id="denom_${id}" onchange="onItemChange(${id},'denominasi',this.value)">
            ${denomOpts}
          </select>
        </div>
        <div class="item-field">
          <label>Taksiran</label>
          <div class="taksiran-preview" id="prev_${id}">—</div>
        </div>
        <div class="item-field">
          <label>UP Est.</label>
          <div class="taksiran-preview" id="up_${id}" style="color:var(--gold)">—</div>
        </div>
      </div>
      <button class="item-remove" onclick="hapusItem(${id})" title="Hapus item">✕</button>
    `;
  }
}

/* PREVIEW & SUBTOTAL */
function getSTL(item) {
  if (item.type === "batangan") {
    if (item.merek === "galeri24") return STL_GALERI24;
    return STL_ANTAM;
  }
  return STL_PERHIASAN;
}

function getTaksiran(item) {
  if (item.type === "perhiasan") {
    if (!item.berat || item.berat <= 0) return 0;
    return item.berat * (item.kadar / 24) * STL_PERHIASAN;
  } else {
    return item.denominasi * getSTL(item);
  }
}

function getPlafonRate() {
  const tenor = parseInt(document.getElementById("tenor")?.value) || 0;
  if (selectedProduct === "KRASIDA") return 0.95;
  if (selectedProduct === "FLEKSI" && tenor === 15) return 0.96;
  return 0.92;
}

function formatRp(n) {
  return "Rp " + Math.round(n).toLocaleString("id-ID");
}

function updatePreview(id) {
  const item = items.find((it) => it.id === id);
  if (!item) return;
  const taks = getTaksiran(item);
  const plafon = getPlafonRate();
  const up = Math.floor((taks * plafon) / 1000) * 1000;
  const prevEl = document.getElementById("prev_" + id);
  const upEl = document.getElementById("up_" + id);
  if (prevEl) prevEl.innerText = taks > 0 ? formatRp(taks) : "—";
  if (upEl) upEl.innerText = up > 0 ? formatRp(up) : "—";
}

function updateSubtotal() {
  items.forEach((it) => updatePreview(it.id));
  const plafon = getPlafonRate();
  let totalTaks = 0;
  items.forEach((it) => {
    totalTaks += getTaksiran(it);
  });
  const totalUP = Math.floor((totalTaks * plafon) / 1000) * 1000;
  document.getElementById("sbJumlah").innerText = items.length + " item";
  document.getElementById("sbTaksiran").innerText = formatRp(totalTaks);
  document.getElementById("sbUP").innerText = formatRp(totalUP);
}

/* TENOR OPTIONS */
function updateTenorOptions() {
  const tenor = document.getElementById("tenor");
  tenor.innerHTML = "";
  if (selectedProduct === "KCA") {
    tenor.add(new Option("120 Hari", "120"));
  } else if (selectedProduct === "FLEKSI") {
    [15, 30, 60, 180].forEach((d) => tenor.add(new Option(d + " Hari", d)));
  } else if (selectedProduct === "KRASIDA") {
    [6, 12, 18, 24, 36, 48].forEach((m) =>
      tenor.add(new Option(m + " Bulan", m))
    );
  }
  updateSubtotal();
}

/* HITUNG TAKSIRAN (MULTI ITEM) */
function hitungTaksiran() {
  // Validate
  let valid = true;
  items.forEach((it) => {
    if (it.type === "perhiasan" && (!it.berat || it.berat <= 0)) {
      valid = false;
      const el = document.getElementById("berat_" + it.id);
      if (el) {
        el.style.borderColor = "var(--red)";
        setTimeout(() => (el.style.borderColor = ""), 2000);
      }
    }
  });
  if (!valid) {
    alert("Lengkapi berat emas untuk semua item.");
    return;
  }

  const plafon = getPlafonRate();
  const tenorVal = parseInt(document.getElementById("tenor").value);

  let totalTaks = 0;
  items.forEach((it) => {
    totalTaks += getTaksiran(it);
  });
  const upFinal = Math.floor((totalTaks * plafon) / 1000) * 1000;

  if (upFinal < 50000) {
    alert(
      "Total estimasi UP terlalu kecil (min Rp 50.000). Tambah atau perbesar item."
    );
    return;
  }

  // Build breakdown
  const breakdownEl = document.getElementById("breakdownItems");
  breakdownEl.innerHTML = items
    .map((it, idx) => {
      const taks = getTaksiran(it);
      const up = Math.floor((taks * plafon) / 1000) * 1000;
      const label =
        it.type === "perhiasan"
          ? `Item ${idx + 1}: ${it.berat}gr ${it.kadar}K`
          : `Item ${idx + 1}: ${it.denominasi >= 1 ? it.denominasi : "0,5"}gr ${
              it.merek === "galeri24"
                ? "Galeri 24"
                : it.merek === "antam"
                ? "ANTAM"
                : "UBS"
            }`;
      return `<div class="breakdown-item">
      <span class="bi-name">${label}</span>
      <span class="bi-val">${formatRp(taks)}</span>
    </div>`;
    })
    .join("");

  // Summary rows
  document.getElementById("resTotalTaksiran").innerText = formatRp(totalTaks);
  document.getElementById("resUP").innerText = formatRp(upFinal);

  let sewaDesc = "",
    estimasiSewa = 0,
    unitWaktu = "",
    totalSewaGrafik = 0;
  const dt = new Date();

  document.getElementById("sectionDetailKCA").classList.add("hidden");
  document.getElementById("bodyTabelKCA").innerHTML = "";

  if (selectedProduct === "KCA") {
    const tarif = upFinal > 20100000 ? 0.011 : 0.012;
    sewaDesc = (tarif * 100).toFixed(1) + "% / 15 Hari";
    estimasiSewa = upFinal * tarif;
    unitWaktu = " / 15 Hari";
    dt.setDate(dt.getDate() + 120);
    document.getElementById("lblSewaNominal").innerText =
      "Estimasi Sewa (Per 15 Hari):";
    totalSewaGrafik = estimasiSewa * 8;
    document.getElementById("sectionDetailKCA").classList.remove("hidden");
    let html = "";
    for (let i = 1; i <= 8; i++) {
      html += `<tr><td>Ke-${i}</td><td>${i * 15}</td><td>${formatRp(
        upFinal * tarif * i
      )}</td></tr>`;
    }
    document.getElementById("bodyTabelKCA").innerHTML = html;
  } else if (selectedProduct === "FLEKSI") {
    sewaDesc = "0.07% / Hari";
    estimasiSewa = upFinal * 0.0007;
    unitWaktu = " / Hari";
    dt.setDate(dt.getDate() + tenorVal);
    document.getElementById("lblSewaNominal").innerText = "Estimasi Sewa:";
    totalSewaGrafik = estimasiSewa * tenorVal;
  } else if (selectedProduct === "KRASIDA") {
    let tarif = 0.0125;
    if (tenorVal === 18 || tenorVal === 36) tarif = 0.013;
    else if (tenorVal === 48) tarif = 0.014;
    sewaDesc = (tarif * 100).toFixed(2) + "% / Bulan";
    estimasiSewa = upFinal / tenorVal + upFinal * tarif;
    unitWaktu = " / Bulan";
    dt.setMonth(dt.getMonth() + tenorVal);
    document.getElementById("lblSewaNominal").innerText = "Angsuran Tetap:";
    totalSewaGrafik = upFinal * tarif * tenorVal;
  }

  document.getElementById("resSewaDesc").innerText = sewaDesc;
  document.getElementById("resSewaNominal").innerText =
    "± " + formatRp(estimasiSewa) + unitWaktu;
  document.getElementById("resJatuhTempo").innerText = dt.toLocaleDateString(
    "id-ID",
    { day: "numeric", month: "long", year: "numeric" }
  );

  // Chart
  const ctx = document.getElementById("loanChart").getContext("2d");
  if (myChart) myChart.destroy();
  myChart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["Uang Diterima", "Total Sewa"],
      datasets: [
        {
          data: [upFinal, totalSewaGrafik],
          backgroundColor: ["#00703C", "#C89B2A"],
          borderWidth: 2,
          borderColor: "#fff",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          position: "bottom",
          labels: { boxWidth: 10, font: { size: 10 } },
        },
        tooltip: {
          callbacks: {
            label: (ctx) => "  " + ctx.label + ": " + formatRp(ctx.raw),
          },
        },
      },
      cutout: "65%",
    },
  });

  // Counter
  let c = parseInt(localStorage.getItem("digitaksir_usage") || 0) + 1;
  localStorage.setItem("digitaksir_usage", c);
  document.getElementById("countDisplay").innerText = c;

  // Show
  document.getElementById("panelHasil").classList.remove("hidden");
  document.getElementById("panelHasil").scrollIntoView({ behavior: "smooth" });
  resetRating();
}

/* RATING */
function setRating(n) {
  document.querySelectorAll("#starContainer .star").forEach((s, i) => {
    s.classList.toggle("active", i < n);
  });
  setTimeout(
    () =>
      alert("Terima kasih! Rating " + n + " bintang Anda telah terekam. 🙏"),
    100
  );
}
function resetRating() {
  document
    .querySelectorAll("#starContainer .star")
    .forEach((s) => s.classList.remove("active"));
}

/* CICIL EMAS */
const adminFee = 50000,
  dpRate = 0.15;
function formatIDR(num) {
  return Math.floor(num).toLocaleString("id-ID");
}

function switchMargin(val, btn) {
  currentMargin = val;
  document
    .querySelectorAll(".tab-btn")
    .forEach((b) => b.classList.remove("active"));
  btn.classList.add("active");
  renderTable();
}

function renderTable() {
  const tbody = document.getElementById("simulation-table");
  tbody.innerHTML = "";
  [0.5, 1, 2, 5, 10, 25, 50, 100, 250, 500, 1000].forEach((d) => {
    const tunai = hargaEmas[d];
    const dpMurni = tunai * dpRate;
    const totalDP = dpMurni + adminFee;
    const pinjaman = tunai - dpMurni;
    const bungaBulan = tunai * currentMargin;
    const row = document.createElement("tr");
    let html = `
      <td>${d >= 1 ? d : "0,5"} Gram</td>
      <td>${formatIDR(totalDP)}</td>
      <td>${formatIDR(pinjaman)}</td>
    `;
    [3, 6, 12, 18, 24, 36].forEach((t) => {
      html += `<td>${formatIDR(pinjaman / t + bungaBulan)}</td>`;
    });
    row.innerHTML = html;
    tbody.appendChild(row);
  });
}

/* ================= TAMBAHAN VARIABEL BARU ================= */
let customDPRupiah = 0; // Menampung input nominal DP dari user

/**
 * Fungsi baru untuk menangani input nominal DP
 * Memastikan input hanya angka dan memperbarui tabel secara real-time
 */
function handleDPInput(val) {
  // Hapus semua karakter non-angka
  let cleanVal = val.replace(/\D/g, "");

  // Format input agar ada titik ribuan saat diketik
  if (cleanVal) {
    document.getElementById("dp-rupiah-input").value =
      parseInt(cleanVal).toLocaleString("id-ID");
  }

  customDPRupiah = parseInt(cleanVal) || 0;
  renderTable(); // Update tabel otomatis
}

/* ================= MODIFIKASI RENDER TABLE ================= */
function renderTable() {
  const tbody = document.getElementById("simulation-table");
  const infoText = document.getElementById("dp-info-text"); // Elemen info opsional
  tbody.innerHTML = "";
  const denoms = [0.5, 1, 2, 5, 10, 25, 50, 100, 250, 500, 1000];

  denoms.forEach((d) => {
    const tunai = hargaEmas[d];

    /* LOGIKA BARU: 
        Gunakan DP minimal 15% jika input kosong atau input lebih kecil dari 15% harga emas.
        Ini menjaga agar simulasi tetap sesuai aturan internal Pegadaian. */
    const dpMinimal = tunai * dpRate;
    let dpDipakai = customDPRupiah > dpMinimal ? customDPRupiah : dpMinimal;

    const totalDP = dpDipakai + adminFee;
    const pinjaman = tunai - dpDipakai;
    const bungaBulan = tunai * currentMargin;

    const row = document.createElement("tr");
    let html = `
            <td>${d >= 1 ? d : "0,5"} Gram</td>
            <td>${formatIDR(totalDP)}</td>
            <td class="val-pinjaman">${formatIDR(pinjaman)}</td>
        `;

    [3, 6, 12, 18, 24, 36].forEach((tenor) => {
      const angsuran = pinjaman / tenor + bungaBulan;
      html += `<td>${formatIDR(angsuran)}</td>`;
    });

    row.innerHTML = html;
    tbody.appendChild(row);
  });

  // Update teks info (opsional, jika elemen ID 'dp-info-text' ada di HTML)
  if (infoText) {
    infoText.innerText =
      customDPRupiah > 0
        ? `Menggunakan DP Rp ${formatIDR(
            customDPRupiah
          )} (atau minimal 15% per item)`
        : "Menggunakan standar minimal DP 15% per item";
  }
}

/* EXPORT PDF (FULL HASIL PANEL) */
async function exportPDF() {
  const el = document.getElementById("panelHasil");

  const canvas = await html2canvas(el, {
    scale: 2,
    useCORS: true,
  });

  const img = canvas.toDataURL("image/png");

  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF("p", "mm", "a4");

  const width = pdf.internal.pageSize.getWidth();
  const height = (canvas.height * width) / canvas.width;

  pdf.addImage(img, "PNG", 0, 0, width, height);
  pdf.save("hasil-digi-taksir.pdf");
}

/* SAVE HISTORY SIMULASI */
function saveHistory() {
  let data = {
    waktu: new Date().toLocaleString("id-ID"),
    produk: selectedProduct,
    totalTaksiran: document.getElementById("resTotalTaksiran")?.innerText,
    up: document.getElementById("resUP")?.innerText,
    tenor: document.getElementById("tenor")?.value,
    items: items,
  };

  let history = JSON.parse(localStorage.getItem("dg_history") || "[]");

  history.unshift(data);

  localStorage.setItem("dg_history", JSON.stringify(history));

  alert("History berhasil disimpan ✔️");
}

/* Install Tring */
function openTringApp() {
  const playStoreUrl =
    "https://play.google.com/store/apps/details?id=com.pegadaiandigital";

  // langsung ke Play Store (aman 100%)
  window.open(playStoreUrl, "_blank");
}

function switchMode(mode) {
    const contTaksir = document.getElementById('containerTaksirEmas');
    const contPinjaman = document.getElementById('containerInputPinjaman');
    const btnTaksir = document.getElementById('btnModeTaksir');
    const btnPinjaman = document.getElementById('btnModePinjaman');
    
    // Selalu sembunyikan panel hasil saat pindah tab agar tidak tumpang tindih
    document.getElementById('panelHasil').classList.add('hidden');

    if (mode === 'taksir') {
        // Tampilkan Taksir Emas, Sembunyikan Input Pinjaman
        contTaksir.style.display = 'block';
        contPinjaman.style.display = 'none';
        
        btnTaksir.classList.add('active');
        btnPinjaman.classList.remove('active');
    } else {
        // Sembunyikan Taksir Emas, Tampilkan Input Pinjaman
        contTaksir.style.display = 'none';
        contPinjaman.style.display = 'block';
        
        btnTaksir.classList.remove('active');
        btnPinjaman.classList.add('active');
    }
}

function hitungPinjamanLangsung() {
    const inputNominal = document.getElementById('inputNominalPinjaman');
    const nominal = parseFloat(inputNominal.value) || 0;
    
    if (nominal <= 0) {
        alert("Silakan masukkan nominal pinjaman terlebih dahulu.");
        inputNominal.classList.add('input-error');
        inputNominal.focus();
        return;
    }
    inputNominal.classList.remove('input-error');

    // --- 1. LOGIKA PERHITUNGAN ---
    const tarif15Hari = 0.012; // 1.2% per 15 hari
    const sewaPerPeriode = nominal * tarif15Hari;
    const biayaAdmin = 50000; 

    // --- 2. UPDATE HEADER & INFO ---
    document.getElementById('resUP').innerText = "Rp " + nominal.toLocaleString('id-ID');
    document.getElementById('resTotalTaksiran').innerText = "Rp " + Math.round(nominal / 0.9).toLocaleString('id-ID');
    document.getElementById('lblProdukHasil').innerText = selectedProduct || "KCA";

    // Hitung Jatuh Tempo
    const dt = new Date();
    dt.setDate(dt.getDate() + 120);
    document.getElementById('resJatuhTempo').innerText = dt.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

    // --- 3. ISI TABEL (Periode, Hari Ke-, Sewa Modal) ---
    const tableBody = document.getElementById('bodyTabelKCA');
    let tableHTML = "";
    let totalSewa120 = 0;

    for (let i = 1; i <= 8; i++) {
        let hariKe = i * 15;
        let sewaKumulatif = sewaPerPeriode * i;
        totalSewa120 = sewaKumulatif; 

        tableHTML += `
            <tr>
                <td style="text-align: center; padding: 8px; border: 1px solid rgba(255,255,255,0.1);">${i}</td>
                <td style="text-align: center; padding: 8px; border: 1px solid rgba(255,255,255,0.1);">Hari ke-${hariKe}</td>
                <td style="text-align: right; padding: 8px; border: 1px solid rgba(255,255,255,0.1);">Rp ${sewaKumulatif.toLocaleString('id-ID')}</td>
            </tr>
        `;
    }
    tableBody.innerHTML = tableHTML;
    
    // Tampilkan rincian tabel
    document.getElementById('sectionDetailKCA').classList.remove('hidden');

    // --- 4. UPDATE PIE CHART ---
    updatePieChart(nominal, totalSewa120, biayaAdmin);

    // Tampilkan Panel Hasil
    document.getElementById('panelHasil').classList.remove('hidden');
    document.getElementById('panelHasil').scrollIntoView({ behavior: 'smooth' });
}

function updatePieChart(up, sewa, admin) {
    const ctx = document.getElementById('loanChart').getContext('2d');
    
    if (window.myLoanChart) { 
        window.myLoanChart.destroy(); 
    }

    window.myLoanChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: [
                `Uang Pinjaman (Rp ${up.toLocaleString('id-ID')})`, 
                `Total Sewa (Rp ${sewa.toLocaleString('id-ID')})`, 
                `Biaya Admin (Rp ${admin.toLocaleString('id-ID')})`
            ],
            datasets: [{
                data: [up, sewa, admin],
                backgroundColor: [
                    '#00703C', // Hijau Pegadaian untuk Uang Pinjaman
                    '#FFD700', // Kuning Emas untuk Sewa Modal
                    '#DEE2E6'  // Abu-abu untuk Admin
                ],
                borderColor: '#ffffff',
                borderWidth: 3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#333333', // Warna teks legenda hitam agar terbaca di latar putih
                        font: {
                            size: 12,
                            weight: '600'
                        },
                        padding: 20,
                        usePointStyle: true // Mengubah kotak warna jadi lingkaran kecil
                    }
                }
            }
        }
    });
}
