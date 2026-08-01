// ==========================================
// 0. UI INTERACTIVITY, AUTH & PRO STATE
// ==========================================
const sidebar = document.getElementById('sidebar');
document.getElementById('sidebarToggle')?.addEventListener('click', () => {
  if (sidebar?.classList.contains('w-64')) { sidebar.classList.remove('w-64'); sidebar.classList.add('w-0'); } 
  else { sidebar?.classList.remove('w-0'); sidebar?.classList.add('w-64'); }
});

// @ts-ignore
window.openTnc = () => document.getElementById('tncModal')?.classList.remove('hidden');
// @ts-ignore
window.closeTnc = () => document.getElementById('tncModal')?.classList.add('hidden');
// @ts-ignore
window.openAuth = () => { document.getElementById('authModal')?.classList.remove('hidden'); window.switchAuth('login'); };
// @ts-ignore
window.closeAuth = () => document.getElementById('authModal')?.classList.add('hidden');

let currentUser = "GUEST";
let isProUser = false; 

// @ts-ignore
window.switchAuth = (target: string) => {
  ['formLogin', 'formRegister', 'formForgot', 'formChangePass'].forEach(id => document.getElementById(id)?.classList.add('hidden'));
  if (target === 'login') document.getElementById('formLogin')?.classList.remove('hidden');
  else if (target === 'register') document.getElementById('formRegister')?.classList.remove('hidden');
  else if (target === 'forgot') document.getElementById('formForgot')?.classList.remove('hidden');
  else if (target === 'change') document.getElementById('formChangePass')?.classList.remove('hidden');
};

document.getElementById('loginAction')?.addEventListener('submit', (e) => {
  e.preventDefault();
  const emailInput = (document.getElementById('loginEmail') as HTMLInputElement).value;
  if(emailInput.includes("ilman")) currentUser = "Ilman Maulana"; else currentUser = emailInput.split('@')[0]; 
  
  isProUser = false; 
  document.getElementById('profileName')!.innerText = currentUser; 
  document.getElementById('profileRole')!.innerText = "Regular User • Free Plan"; 
  (document.getElementById('profileAvatar') as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${currentUser.replace(' ','+')}&background=f3f4f6&color=7e22ce&size=128&bold=true`;
  
  document.getElementById('btnTopAuth')?.classList.add('hidden'); 
  document.getElementById('btnLogout')?.classList.remove('hidden');
  document.getElementById('authModal')?.classList.add('hidden'); 
  
  const btnPro = document.getElementById('btnUpgradePro');
  if(btnPro) { btnPro.innerText = "⭐ Upgrade to Pro"; btnPro.classList.replace('bg-gray-300', 'bg-yellow-400'); btnPro.classList.add('hover:bg-yellow-300'); btnPro.removeAttribute('disabled'); }
  
  updateDashboardAndTrips();
  alert(`Selamat datang, ${currentUser}! Anda sekarang menggunakan akun Free Plan.`);
});

document.getElementById('btnLogout')?.addEventListener('click', () => {
  currentUser = "GUEST"; 
  isProUser = false; 

  document.getElementById('profileName')!.innerText = "GUEST"; document.getElementById('profileRole')!.innerText = "Belum Login";
  (document.getElementById('profileAvatar') as HTMLImageElement).src = `https://ui-avatars.com/api/?name=GUEST&background=f3f4f6&color=7e22ce&size=128&bold=true`;
  document.getElementById('btnTopAuth')?.classList.remove('hidden'); document.getElementById('btnLogout')?.classList.add('hidden');
  lockProFeatures(); updateDashboardAndTrips();
  alert("Anda telah keluar."); 
});

const menus = [
  { btn: 'navDashboard', view: 'viewDashboard', title: '📊 Dashboard Analytics' },
  { btn: 'navPlanTrip', view: 'viewPlanTrip', title: '✨ AI Destination Finder' },
  { btn: 'navMyTrips', view: 'viewMyTrips', title: '🗺️ My Trips History' },
  { btn: 'navPacking', view: 'viewPacking', title: '🎒 Smart Packing List' },
  { btn: 'navNearMe', view: 'viewNearMe', title: '📍 Wisata Terdekat' },
  { btn: 'navSettings', view: 'viewSettings', title: '⚙️ Preferences' }
];

function switchView(activeBtnId: string) {
  menus.forEach(menu => {
    const btn = document.getElementById(menu.btn)!; const view = document.getElementById(menu.view)!;
    if (menu.btn === activeBtnId) { 
      view.classList.remove('hidden'); view.classList.remove('view-enter'); void view.offsetWidth; view.classList.add('view-enter');
      btn.classList.add('bg-indigo-600', 'text-white', 'shadow-lg', 'shadow-indigo-900/50'); 
      btn.classList.remove('text-slate-400', 'hover:bg-slate-800');
      document.getElementById('topNavTitle')!.innerText = menu.title;

      if (activeBtnId === 'navDashboard') {
        setTimeout(() => { pieChart.reset(); pieChart.update(); barChart.reset(); barChart.update(); }, 100); 
      }
    } else { 
      view.classList.add('hidden'); view.classList.remove('view-enter'); 
      btn.classList.remove('bg-indigo-600', 'text-white', 'shadow-lg', 'shadow-indigo-900/50'); 
      btn.classList.add('text-slate-400', 'hover:bg-slate-800'); 
    }
  });
}
menus.forEach(menu => { document.getElementById(menu.btn)?.addEventListener('click', () => switchView(menu.btn)); });

// ==========================================
// 1. STATE & CORE INITIALIZATION
// ==========================================
let tripHistory: any[] = [];
let targetBudget: number = parseFloat(localStorage.getItem('savedTargetBudget') || '0');
let currentCurrency = localStorage.getItem('appCurrency') || 'IDR';

const formatRp = (num: number) => {
  if (currentCurrency === 'USD') return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(num / 16000); 
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
};

if (targetBudget > 0) (document.getElementById('targetBudgetInput') as HTMLInputElement).value = targetBudget.toString();

async function fetchTripsFromDB() {
  try {
    const res = await fetch('http://localhost:8000/api/v1/trips'); const data = await res.json();
    if (data.status === 'success') { tripHistory = data.data; updateDashboardAndTrips(); }
  } catch (error) { console.error(error); }
}
fetchTripsFromDB();

// @ts-ignore
const pieChart = new Chart(document.getElementById('expensePieChart').getContext('2d'), { 
  type: 'doughnut',
  data: { 
    labels: ['Penginapan', 'Transport', 'Food', 'Activity'], 
    datasets: [{ data: [0,0,0,0], backgroundColor: ['#4f46e5', '#0ea5e9', '#f59e0b', '#ec4899'], borderWidth: 3, borderColor: '#ffffff', hoverOffset: 15 }] 
  },
  options: { layout: { padding: 20 }, animation: { animateScale: true, animateRotate: true, duration: 1200, easing: 'easeOutQuart'}, cutout: '65%', plugins: { legend: { position: 'bottom', labels: { font: { family: 'Nunito', weight: 'bold' }, padding: 20 } } } }
});

// @ts-ignore
const barChart = new Chart(document.getElementById('expenseBarChart').getContext('2d'), { 
    type: 'bar', data: { labels: [], datasets: [{ label: 'Total per Kota', data: [], backgroundColor: '#4f46e5', borderRadius: 6 }] }, options: { animation: { duration: 1200, easing: 'easeOutQuart' } }
});

// ==========================================
// 2. DASHBOARD & MY TRIPS
// ==========================================
function updateDashboardAndTrips() {
  let totalExpense = 0; let cityCount: {[key:string]: number} = {};
  let tHotel = 0, tTransport = 0, tFood = 0, tActivity = 0;
  const tableBody = document.getElementById('tripHistoryTableBody')!; tableBody.innerHTML = ''; 

  if (tripHistory.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="5" class="p-12 text-center text-slate-400 font-bold italic text-lg">Belum ada riwayat.</td></tr>`;
    document.getElementById('emptyPacking')!.classList.remove('hidden'); document.getElementById('packingListContainer')!.classList.add('hidden');
  } else {
    document.getElementById('emptyPacking')!.classList.add('hidden'); document.getElementById('packingListContainer')!.classList.remove('hidden');
  }

  tripHistory.forEach((trip) => {
    totalExpense += trip.total; tHotel += trip.hotel; tTransport += trip.transport; tFood += trip.food; tActivity += trip.activity;
    cityCount[trip.city] = (cityCount[trip.city] || 0) + trip.total;

    let styleBadge = trip.style === 'Backpacker' ? '<span class="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold">🎒 Backpacker</span>' : 
                     trip.style === 'Comfort' ? '<span class="bg-sky-100 text-sky-700 px-3 py-1 rounded-full text-xs font-bold">👨‍👩‍👧‍👦 Comfort</span>' : '<span class="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-bold">💎 Luxury</span>';
    let packingBadge = trip.packing_weight > 0 ? `<span class="text-emerald-600 font-black">✅ Siap (${trip.packing_weight} Kg)</span>` : `<span class="text-rose-400 font-bold">⚠️ Belum Diatur</span>`;

    const rowHTML = `
      <tr class="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition border-b border-slate-100 dark:border-slate-700">
        <td class="p-5 font-black text-slate-800 dark:text-slate-200 text-lg">${trip.destName}<br><span class="text-sm font-semibold text-slate-400 dark:text-slate-500">${trip.city}</span></td>
        <td class="p-5">${styleBadge}<br><span class="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1 block">⏱️ ${trip.time} Menit</span></td>
        <td class="p-5">${packingBadge}</td>
        <td class="p-5 font-black text-indigo-700 dark:text-indigo-400 text-lg">${formatRp(trip.total)}</td>
        <td class="p-5 text-center no-print flex justify-center gap-2">
          <button onclick="window.editTrip(${trip.id})" class="text-sky-500 hover:text-white hover:bg-sky-500 px-4 py-2 rounded-lg font-bold text-xs transition border border-sky-500">Edit</button>
          <button onclick="window.deleteTrip(${trip.id})" class="text-rose-500 hover:text-white hover:bg-rose-500 px-4 py-2 rounded-lg font-bold text-xs transition border border-rose-500">Hapus</button>
        </td>
      </tr>`;
    tableBody.insertAdjacentHTML('beforeend', rowHTML);
  });

  document.getElementById('dashTotalExpense')!.innerText = formatRp(totalExpense); document.getElementById('dashTotalTrips')!.innerText = `${tripHistory.length} Trip`;
  const cities = Object.keys(cityCount); document.getElementById('dashFavCity')!.innerText = cities.length > 0 ? cities.reduce((a, b) => cityCount[a] > cityCount[b] ? a : b) : '-';

  const statusEl = document.getElementById('dashBudgetStatus')!; const progressBar = document.getElementById('budgetProgressBar')!; const progressText = document.getElementById('budgetPercentage')!;
  if(targetBudget > 0) {
    let p = (totalExpense / targetBudget) * 100; if (p > 100) p = 100; progressBar.style.width = `${p}%`; progressText.innerText = `${p.toFixed(1)}% Terpakai`;
    if(totalExpense > targetBudget) { statusEl.innerText = "OVER BUDGET ⚠️"; statusEl.className = "text-lg font-black text-rose-500 mt-1"; progressBar.className = "bg-rose-500 h-2.5 rounded-full transition-all duration-1000"; } 
    else { statusEl.innerText = "ON BUDGET ✅"; statusEl.className = "text-lg font-black text-emerald-500 mt-1"; progressBar.className = "bg-emerald-500 h-2.5 rounded-full transition-all duration-1000"; }
  }
  pieChart.data.datasets[0].data = [tHotel, tTransport, tFood, tActivity]; pieChart.update();
  barChart.data.labels = Object.keys(cityCount); barChart.data.datasets[0].data = Object.values(cityCount); barChart.update();
  
  if(document.getElementById('dashWelcomeName')) document.getElementById('dashWelcomeName')!.innerText = currentUser;
  if(document.getElementById('dashCurrencySymbol')) document.getElementById('dashCurrencySymbol')!.innerText = currentCurrency === 'USD' ? '$' : 'Rp';

  if (document.getElementById('insightAvgCost')) {
    if (tripHistory.length > 0) {
      document.getElementById('insightAvgCost')!.innerText = formatRp(totalExpense / tripHistory.length);
      let styleCounts = { 'Backpacker': 0, 'Comfort': 0, 'Luxury': 0 };
      tripHistory.forEach(t => styleCounts[t.style as keyof typeof styleCounts]++);
      let dominantStyle = Object.keys(styleCounts).reduce((a, b) => styleCounts[a as keyof typeof styleCounts] > styleCounts[b as keyof typeof styleCounts] ? a : b);
      document.getElementById('insightStyle')!.innerHTML = dominantStyle === 'Backpacker' ? '🎒 Backpacker' : dominantStyle === 'Comfort' ? '👨‍👩‍👧‍👦 Comfort' : '💎 Luxury';
      let packPercentage = Math.round((tripHistory.filter(t => t.packing_weight > 0).length / tripHistory.length) * 100);
      document.getElementById('insightPacking')!.innerText = `${packPercentage}% Siap`;
      
      document.getElementById('dashRecentTrips')!.innerHTML = '';
      [...tripHistory].reverse().slice(0, 3).forEach(trip => {
        let badge = trip.packing_weight > 0 ? `<span class="bg-emerald-100 text-emerald-700 px-2 py-1 rounded text-[10px] font-black">✅ ${trip.packing_weight}Kg</span>` : '';
        document.getElementById('dashRecentTrips')!.insertAdjacentHTML('beforeend', `
          <div class="flex justify-between items-center p-3 hover:bg-indigo-50 rounded-xl border border-transparent hover:border-indigo-100 transition cursor-default">
            <div><h5 class="font-black text-slate-800 text-sm">${trip.destName}</h5><p class="text-xs text-slate-500 font-bold">${trip.city} • ${trip.time} Menit</p></div>
            <div class="flex items-center gap-3 text-right">${badge}<span class="font-black text-indigo-700 text-sm">${formatRp(trip.total)}</span></div>
          </div>
        `);
      });
    } else {
      document.getElementById('insightAvgCost')!.innerText = formatRp(0); document.getElementById('insightStyle')!.innerText = "-"; document.getElementById('insightPacking')!.innerText = "0%";
      document.getElementById('dashRecentTrips')!.innerHTML = `<p class="text-center text-slate-400 font-bold italic py-6 text-sm">Belum ada aktivitas.</p>`;
    }
  }
  generatePackingUI(); 
}

document.getElementById('btnSetTarget')?.addEventListener('click', () => {
  const inputVal = (document.getElementById('targetBudgetInput') as HTMLInputElement).value;
  if(inputVal) { targetBudget = parseFloat(inputVal); localStorage.setItem('savedTargetBudget', targetBudget.toString()); updateDashboardAndTrips(); }
});

// @ts-ignore
window.deleteTrip = async (id: number) => { if(confirm('Hapus trip ini secara permanen?')) { await fetch(`http://localhost:8000/api/v1/trips/${id}`, { method: 'DELETE' }); fetchTripsFromDB(); } };

// @ts-ignore
window.editTrip = (id: number) => {
  const trip = tripHistory.find(t => t.id === id); if(!trip) return;
  document.getElementById('modalTitle')!.innerText = "Edit Trip & Recalculate"; document.getElementById('modalDestName')!.innerText = `Destinasi: ${trip.destName}`;
  (document.getElementById('DestName') as HTMLInputElement).value = trip.destName; (document.getElementById('City') as HTMLInputElement).value = trip.city;
  (document.getElementById('Category') as HTMLInputElement).value = trip.category; (document.getElementById('Travel_Style') as HTMLSelectElement).value = trip.style;
  (document.getElementById('Time_Minutes') as HTMLInputElement).value = trip.time.toString(); (document.getElementById('EditTripId') as HTMLInputElement).value = trip.id.toString(); 
  document.getElementById('predictionModal')!.classList.remove('hidden');
  window.runAIPrediction();
};

// ==========================================
// 3. SMART PACKING
// ==========================================
function generatePackingUI() {
  const container = document.getElementById('packingListContainer')!; container.innerHTML = ''; 
  tripHistory.forEach((trip) => {
    let items = [{ name: 'Powerbank & Kabel', weight: 0.5 }, { name: 'Alat Mandi', weight: 0.8 }]; 
    if(trip.style === 'Backpacker') items.push({ name: 'Carrier 40L', weight: 1.2 }, { name: 'Sepatu Trekking', weight: 1.0 }, { name: 'Pakaian Tipis', weight: 2.0 });
    else if(trip.style === 'Luxury') items.push({ name: 'Koper Hardcase', weight: 3.5 }, { name: 'Pakaian Formal', weight: 1.5 }, { name: 'Tas Tangan', weight: 0.8 });
    else items.push({ name: 'Koper Sedang', weight: 2.0 }, { name: 'Baju Santai', weight: 2.5 });

    const listId = `packing_${trip.id}`;
    let checksHTML = items.map((item, i) => {
      const storageKey = `packStatus_${trip.id}_${i}`;
      const isChecked = localStorage.getItem(storageKey) === 'true' ? 'checked' : '';
      return `<label class="flex justify-between items-center p-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-lg cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-600">
          <div class="flex items-center gap-3"><input type="checkbox" ${isChecked} data-weight="${item.weight}" onchange="localStorage.setItem('${storageKey}', this.checked); window.updateWeight('${listId}')" class="pack-checkbox-${listId} w-5 h-5 text-indigo-600 rounded"><span class="text-slate-700 dark:text-slate-200 font-bold text-sm">${item.name}</span></div><span class="text-xs font-black text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">${item.weight} Kg</span>
        </label>`;
    }).join('');

    container.insertAdjacentHTML('beforeend', `
      <div class="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm flex flex-col h-full relative">
        <h4 class="font-black text-indigo-700 dark:text-indigo-400 text-lg mb-1">${trip.destName}</h4>
        <div class="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 mb-4 mt-2">
          <div class="flex justify-between text-xs font-black uppercase mb-2"><span class="text-slate-500 dark:text-slate-400">Estimasi Berat</span><span id="weightText_${listId}" class="text-sky-600 dark:text-sky-400">0.0 / 7.0 Kg</span></div>
          <div class="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2"><div id="weightBar_${listId}" class="bg-sky-500 h-2 rounded-full transition-all" style="width: 0%"></div></div>
        </div>
        <div class="space-y-1 flex-1 overflow-y-auto max-h-40 mb-4">${checksHTML}</div>
        <div class="flex gap-2 mt-auto pt-4 border-t border-slate-100 dark:border-slate-700">
          <button onclick="window.savePacking(${trip.id}, '${listId}')" class="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-xl transition shadow-md">💾 Simpan</button>
          <button onclick="window.resetPacking(${trip.id}, ${items.length}, '${listId}')" class="bg-rose-100 dark:bg-rose-900/30 hover:bg-rose-500 hover:text-white text-rose-600 dark:text-rose-400 font-bold py-3 px-4 rounded-xl transition">🗑️</button>
        </div>
      </div>`);
    setTimeout(() => { // @ts-ignore
      window.updateWeight(listId); 
    }, 100);
  });
}

// @ts-ignore
window.updateWeight = (listId: string) => {
  const checkboxes = document.querySelectorAll(`.pack-checkbox-${listId}`); let totalWeight = 0; 
  checkboxes.forEach((cb: any) => { if(cb.checked) totalWeight += parseFloat(cb.getAttribute('data-weight')); });
  const wText = document.getElementById(`weightText_${listId}`)!; const wBar = document.getElementById(`weightBar_${listId}`)!;
  wText.innerText = `${totalWeight.toFixed(1)} / 7.0 Kg`; wBar.style.width = `${Math.min((totalWeight / 7.0) * 100, 100)}%`;
  if(totalWeight > 7.0) { wText.classList.replace('text-sky-600', 'text-rose-600'); wBar.classList.replace('bg-sky-500', 'bg-rose-500'); } 
  else { wText.classList.replace('text-rose-600', 'text-sky-600'); wBar.classList.replace('bg-rose-500', 'bg-sky-500'); }
  return totalWeight;
};

// @ts-ignore
window.savePacking = async (tripId: number, listId: string) => {
  // @ts-ignore
  const weight = window.updateWeight(listId); const trip = tripHistory.find(t => t.id === tripId);
  if(trip) {
    trip.packing_weight = weight;
    await fetch(`http://localhost:8000/api/v1/trips/${tripId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(trip) });
    fetchTripsFromDB();
  }
};

// @ts-ignore
window.resetPacking = (tripId: number, itemCount: number, listId: string) => {
  if(confirm('Reset semua centang bawaan?')) {
    for(let i=0; i<itemCount; i++) localStorage.removeItem(`packStatus_${tripId}_${i}`);
    const checkboxes = document.querySelectorAll(`.pack-checkbox-${listId}`); checkboxes.forEach((cb: any) => cb.checked = false);
    // @ts-ignore
    window.savePacking(tripId, listId); 
  }
};

// ==========================================
// 4. MESIN AI PREDIKSI HYBRID (PEROMBAKAN HEURISTIK)
// ==========================================
let currentTripData: any = null; 
const cityCoordinates: { [key: string]: { lat: number, long: number } } = { "Jakarta": { lat: -6.2088, long: 106.8456 }, "Semarang": { lat: -6.9666, long: 110.4166 }, "Surabaya": { lat: -7.2504, long: 112.7688 }, "Yogyakarta": { lat: -7.7956, long: 110.3695 } };

// @ts-ignore
window.runAIPrediction = async () => {
  document.getElementById('resultContainer')!.classList.remove('hidden');
  const resultText = document.getElementById('result') as HTMLHeadingElement; 
  resultText.innerText = "⏳ Memproses Logika Cerdas...";

  const timeInput = (document.getElementById('Time_Minutes') as HTMLInputElement).value;
  const timeVal = parseFloat(timeInput) || 0; 
  
  if (timeVal <= 0) {
      resultText.innerText = formatRp(0);
      document.getElementById('descHotel')!.innerText = "-"; document.getElementById('bdHotel')!.innerText = "Rp 0";
      document.getElementById('descFood')!.innerText = "-"; document.getElementById('bdFood')!.innerText = "Rp 0";
      document.getElementById('descTransport')!.innerText = "-"; document.getElementById('bdTransport')!.innerText = "Rp 0";
      if(document.getElementById('descTicket')) { document.getElementById('descTicket')!.innerText = "-"; document.getElementById('bdTicket')!.innerText = "Rp 0"; }
      document.getElementById('aiTipText')!.innerText = "Durasi tidak valid. Masukkan minimal 1 menit perjalanan.";
      currentTripData = null; return; 
  }

  const cityVal = (document.getElementById('City') as HTMLInputElement).value;
  const destName = (document.getElementById('DestName') as HTMLInputElement).value;
  const styleVal = (document.getElementById('Travel_Style') as HTMLSelectElement).value;
  const categoryVal = (document.getElementById('Category') as HTMLInputElement).value;

  const payload = { DestName: destName, Rating: 4.5, Time_Minutes: timeVal, Lat: cityCoordinates[cityVal]?.lat || 0, Long: cityCoordinates[cityVal]?.long || 0, Category_Budaya: categoryVal==="Budaya", Category_Cagar_Alam: categoryVal==="Cagar Alam", Category_Pusat_Perbelanjaan: categoryVal==="Pusat Perbelanjaan", Category_Taman_Hiburan: categoryVal==="Taman Hiburan", Category_Tempat_Ibadah: categoryVal==="Tempat Ibadah", City_Jakarta: cityVal === "Jakarta", City_Semarang: cityVal === "Semarang", City_Surabaya: cityVal === "Surabaya", City_Yogyakarta: cityVal === "Yogyakarta" };

  try {
    const response = await fetch('http://localhost:8000/api/v1/predict', { method: 'POST', headers: 
      { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    
    const data = await response.json();
    
    if (data.status === "success") {
      let basePerDay = data.estimated_budget; 
      let ticketPrice = data.real_ticket_price || 0; 
      
      if (basePerDay < 100000) basePerDay = 100000;
      let aiBase = basePerDay; 

      let days = Math.ceil(timeVal / 1440);
      if (days < 1) days = 1;

      let hotelAlloc = 0, foodAlloc = 0, transportAlloc = 0;
      let hDesc = "", fDesc = "", tDesc = "", ticketDesc = "Tiket Masuk Destinasi (Statis)";
      let mealCount = timeVal <= 240 ? 1 : (timeVal <= 480 ? 2 : days * 3);

      // =====================================
      // LOGIKA UNIT HARIAN (Travel Behavior Heuristics)
      // =====================================
      
      if (timeVal <= 480) {
          hotelAlloc = 0; hDesc = "Tidak Menginap (Kunjungan Harian)";
      } else {
          if (styleVal === 'Backpacker') { 
              hotelAlloc = (100000 + (aiBase * 0.5)) * days; 
              hDesc = `Hostel / Kapsul (${days} Malam)`; 
          }
          else if (styleVal === 'Luxury') { 
              hotelAlloc = (1200000 + (aiBase * 2)) * days; 
              hDesc = `Hotel Bintang 4-5 (${days} Malam)`; 
          }
          else { 
              hotelAlloc = (400000 + (aiBase * 1)) * days; 
              hDesc = `Hotel Bintang 2-3 (${days} Malam)`; 
          }
      }

      if (styleVal === 'Backpacker') { 
          foodAlloc = (25000 + (aiBase * 0.1)) * mealCount; 
          fDesc = `Street Food / Warung (${mealCount}x Makan)`; 
      }
      else if (styleVal === 'Luxury') { 
          foodAlloc = (150000 + (aiBase * 0.5)) * mealCount; 
          fDesc = `Restoran Berkualitas (${mealCount}x Makan)`; 
      }
      else { 
          foodAlloc = (50000 + (aiBase * 0.2)) * mealCount; 
          fDesc = `Restoran Casual (${mealCount}x Makan)`; 
      }

      if (styleVal === 'Backpacker') {
          transportAlloc = 15000; 
          tDesc = "KRL / TransJakarta / Angkot (Pulang-Pergi)";
      } else if (styleVal === 'Luxury') {
          if (timeVal <= 480) { 
              transportAlloc = 200000 + (aiBase * 0.2); 
              tDesc = "Taksi Premium / Bluebird (Pulang-Pergi)";
          } else { 
              transportAlloc = 800000 * days; 
              tDesc = `Sewa Mobil Premium (${days} Hari)`;
          }
      } else { 
          if (timeVal <= 480) { 
              transportAlloc = 80000 + (aiBase * 0.1); 
              tDesc = "Taksi Online / GrabCar (Pulang-Pergi)";
          } else { 
              transportAlloc = 350000 * days; 
              tDesc = `Sewa Mobil Keluarga (${days} Hari)`;
          }
      }

      // =====================================
      // FITUR INTERVENSI USER (CHECKBOX)
      // =====================================
      const incHotel = (document.getElementById('chkHotel') as HTMLInputElement)?.checked ?? true;
      const incFood = (document.getElementById('chkFood') as HTMLInputElement)?.checked ?? true;
      const incTrans = (document.getElementById('chkTransport') as HTMLInputElement)?.checked ?? true;

      if (!incHotel) { hotelAlloc = 0; hDesc = "Dihapus: Memilih tidur di tempat pribadi."; }
      if (!incFood) { foodAlloc = 0; fDesc = "Dihapus: Membawa bekal makanan sendiri."; }
      if (!incTrans) { transportAlloc = 0; tDesc = "Dihapus: Transportasi telah dicover pribadi."; }

      let totalFinal = hotelAlloc + foodAlloc + transportAlloc + ticketPrice;

      resultText.innerText = formatRp(totalFinal); 
      const setRange = (amount: number) => amount === 0 ? "Rp 0" : `${formatRp(amount * 0.8)} - ${formatRp(amount * 1.2)}`;
      
      document.getElementById('descHotel')!.innerText = hDesc; document.getElementById('bdHotel')!.innerText = setRange(hotelAlloc);
      document.getElementById('descFood')!.innerText = fDesc; document.getElementById('bdFood')!.innerText = setRange(foodAlloc);
      document.getElementById('descTransport')!.innerText = tDesc; document.getElementById('bdTransport')!.innerText = setRange(transportAlloc);
      
      if(document.getElementById('descTicket')) {
          document.getElementById('descTicket')!.innerText = ticketDesc;
          document.getElementById('bdTicket')!.innerText = formatRp(ticketPrice); 
      }

// =====================================
      // PERBAIKAN: AI SMART TIP SELALU TERISI
      // =====================================
      let smartTip = ticketPrice === 0 ? `Akses masuk terdeteksi GRATIS. ` : ``;
      
      if (styleVal === "Backpacker") {
          smartTip += "Sistem mendeteksi gaya Backpacker, alokasi transportasi dihitung statis flat (PP).";
      } else if (styleVal === "Luxury") {
          smartTip += "Budget disesuaikan standar VIP (Sewa mobil premium & Hotel Bintang 4-5).";
      } else {
          smartTip += "Gaya Comfort dipilih, alokasi taksi online & penginapan menengah telah disiapkan.";
      }

      // Tambahkan pesan pintar jika user mematikan checkbox (Intervensi)
      if (!incFood) smartTip += " Membawa bekal sendiri adalah ide hebat untuk menekan pengeluaran!";
      if (!incTrans) smartTip += " Jangan lupa siapkan uang kecil/e-Toll untuk parkir kendaraan Anda.";

      document.getElementById('aiTipText')!.innerText = smartTip;
      
      currentTripData = { destName: destName, city: cityVal, category: categoryVal, time: timeVal, style: styleVal, total: totalFinal, hotel: hotelAlloc, transport: transportAlloc, food: foodAlloc, activity: ticketPrice, packing_weight: 0.0 };
    }
  } catch (error) {}
}

document.getElementById('saveTripBtn')?.addEventListener('click', async (e) => {
  if (currentUser === "GUEST") { alert("🌟 Silakan Masuk (Login) terlebih dahulu."); window.openAuth(); return; }
  const btn = e.currentTarget as HTMLButtonElement; const originalText = btn.innerText;
  if(currentTripData) {
    btn.innerText = "⏳ Menyimpan Rencana..."; const editId = (document.getElementById('EditTripId') as HTMLInputElement).value;
    try {
      if(editId) {
        const tripLama = tripHistory.find(t => t.id.toString() === editId); currentTripData.packing_weight = tripLama.packing_weight; 
        await fetch(`http://localhost:8000/api/v1/trips/${editId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(currentTripData) });
      } else {
        await fetch('http://localhost:8000/api/v1/trips', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(currentTripData) });
      }
      await fetchTripsFromDB(); document.getElementById('predictionModal')!.classList.add('hidden'); (document.getElementById('navMyTrips') as HTMLButtonElement).click(); btn.innerText = originalText;
    } catch (error) { alert("Gagal menyimpan ke Database!"); btn.innerText = originalText; }
  } else { alert("Silakan tunggu kalkulasi AI selesai."); }
});

function renderCards(dataArray: any[], containerId: string = 'recContainer') {
  const container = document.getElementById(containerId)!; container.innerHTML = '';
  if (dataArray.length === 0) { container.innerHTML = `<p class="text-rose-500 font-bold col-span-full text-center py-8">Tidak ada wisata yang cocok.</p>`; return; }
  
  dataArray.forEach((item: any) => {
    let priceText = item.price === 0 ? '<span class="text-emerald-500">GRATIS</span>' : formatRp(item.price);
    let distanceBadge = item.distance ? `<div class="absolute top-3 right-3 bg-sky-600 px-3 py-1 rounded-lg text-xs font-black text-white shadow-lg">🚗 ${item.distance} Km</div>` : `<div class="absolute top-3 right-3 bg-white/95 px-2 py-1 rounded-lg text-xs font-black text-indigo-700 shadow-lg">⭐ ${item.rating}</div>`;
    
    const cardHTML = `
      <div class="border border-slate-100 dark:border-slate-700 rounded-3xl hover:shadow-2xl hover:shadow-indigo-500/10 hover:-translate-y-2 transition duration-500 bg-white dark:bg-slate-800 group flex flex-col overflow-hidden relative">
        <div class="h-48 w-full bg-slate-200 dark:bg-slate-700 relative overflow-hidden"><img src="${item.image}" class="object-cover w-full h-full group-hover:scale-110 transition duration-700"><div class="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent"></div><div class="absolute bottom-4 left-4 right-4"><h4 class="font-black text-white text-xl line-clamp-1">${item.name}</h4><p class="text-xs text-slate-300 font-bold uppercase tracking-widest">${item.city}</p></div>${distanceBadge}</div>
        <div class="p-5 flex flex-col justify-between flex-1 bg-white dark:bg-slate-800">
          <div class="flex justify-between items-center mb-4"><span class="text-xs font-bold bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-md text-slate-500 dark:text-slate-300">${item.category}</span><span class="font-black text-indigo-700 dark:text-indigo-400 text-lg">${priceText}</span></div>
          <button data-name="${item.name}" data-city="${item.city}" data-category="${item.category}" class="btn-select-dest w-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 font-black py-3 rounded-xl hover:bg-indigo-600 hover:text-white transition shadow-sm">Plan AI ➔</button>
          <button onclick="window.openMapsPro('${item.name}', '${item.city}')" class="w-full mt-2 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-black py-2 rounded-xl hover:bg-emerald-600 hover:text-white transition shadow-sm text-xs border border-emerald-100 dark:border-emerald-800/50">🗺️ Buka di Google Maps (PRO)</button>
        </div>
      </div>`;
    container.insertAdjacentHTML('beforeend', cardHTML);
  });

  document.querySelectorAll(`#${containerId} .btn-select-dest`).forEach(btn => {
    btn.addEventListener('click', (e) => {
      const t = e.currentTarget as HTMLButtonElement;
      document.getElementById('modalTitle')!.innerText = "Trip Prediction";
      document.getElementById('modalDestName')!.innerText = `Destinasi: ${t.getAttribute('data-name')}`;
      (document.getElementById('DestName') as HTMLInputElement).value = t.getAttribute('data-name')!;
      (document.getElementById('City') as HTMLInputElement).value = t.getAttribute('data-city')!;
      (document.getElementById('Category') as HTMLInputElement).value = t.getAttribute('data-category')!;
      (document.getElementById('EditTripId') as HTMLInputElement).value = ""; 
      (document.getElementById('Time_Minutes') as HTMLInputElement).value = "300"; 
      document.getElementById('predictionModal')!.classList.remove('hidden');
      window.runAIPrediction();
    });
  });
}

// PERBAIKAN: EVENT LISTENER TOMBOL CARI (SISTEM PRIORITAS NAMA)
document.getElementById('btnRecommend')!.addEventListener('click', async () => {
  let city = (document.getElementById('recCity') as HTMLSelectElement).value || ""; 
  let category = (document.getElementById('recCategory') as HTMLSelectElement).value || "";
  let searchName = (document.getElementById('recName') as HTMLInputElement)?.value || "";
  const maxB = parseFloat((document.getElementById('recBudget') as HTMLInputElement)?.value) || 9999999; 
  const minR = parseFloat((document.getElementById('recRating') as HTMLSelectElement)?.value) || 0.0;
  
  // LOGIKA DINAMIS: Jika user mengetik nama, abaikan dan reset dropdown Kota & Kategori!
  if (searchName !== "") {
    city = "";
    category = "";
    (document.getElementById('recCity') as HTMLSelectElement).value = ""; // Reset tampilan dropdown
    (document.getElementById('recCategory') as HTMLSelectElement).value = ""; // Reset tampilan dropdown
  }
  
  if (!city && !category && !searchName) { 
      alert("Pilih Kota & Kategori, ATAU ketikkan nama wisatanya!"); 
      return; 
  }
  
  if (searchName) {
    document.getElementById('recTitle')!.innerHTML = `Hasil Pencarian: <span class="text-indigo-600">"${searchName}"</span>`;
  } else {
    document.getElementById('recTitle')!.innerHTML = `Hasil Pencarian (⭐ ${minR}+): <span class="text-indigo-600">${category} di ${city}</span>`;
  }
  
  try {
    const response = await fetch('http://localhost:8000/api/v1/recommend', { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify({ city: city, category: category, max_budget: maxB, min_rating: minR, search_name: searchName }) 
    });
    const resData = await response.json(); 
    if (resData.status === "success") renderCards(resData.data, 'recContainer');
  } catch (e) {}
});

// TAMBAHAN UX: Jika user memilih Dropdown Kota/Kategori, otomatis kosongkan kolom Nama!
document.getElementById('recCity')?.addEventListener('change', () => { (document.getElementById('recName') as HTMLInputElement).value = ""; });
document.getElementById('recCategory')?.addEventListener('change', () => { (document.getElementById('recName') as HTMLInputElement).value = ""; });

// @ts-ignore
window.quickSearch = async (city: string, category: string, budget: number, rating: number) => {
  (document.getElementById('recCity') as HTMLSelectElement).value = city; 
  (document.getElementById('recCategory') as HTMLSelectElement).value = category;
  const ratingEl = document.getElementById('recRating') as HTMLSelectElement;
  if(ratingEl) ratingEl.value = rating.toString(); 
  
  const bEl = document.getElementById('recBudget') as HTMLInputElement;
  if(bEl) bEl.value = budget === 9999999 ? '' : budget.toString();
  
  const nEl = document.getElementById('recName') as HTMLInputElement;
  if(nEl) nEl.value = ''; // Kosongkan search box saat pakai quick search

  document.getElementById('btnRecommend')!.click();
};

async function loadTrending() {
  document.getElementById('recTitle')!.innerText = "🔥 Trending Minggu Ini";
  try { const response = await fetch('http://localhost:8000/api/v1/trending'); const resData = await response.json(); if (resData.status === "success") renderCards(resData.data, 'recContainer'); } catch (e) {}
}
loadTrending();

document.getElementById('btnFindNearMe')?.addEventListener('click', () => {
  const nearMeStatus = document.getElementById('nearMeStatus')!;
  if (!navigator.geolocation) { alert("Browser Anda tidak mendukung fitur Geolocation."); return; }
  nearMeStatus.innerHTML = `<span class="animate-pulse text-sky-600 font-black text-lg">📍 Sedang mencari koordinat Anda via Satelit...</span>`;
  document.getElementById('nearMeContainer')!.innerHTML = '';

  navigator.geolocation.getCurrentPosition(async (position) => {
    const lat = position.coords.latitude; const lng = position.coords.longitude;
    nearMeStatus.innerHTML = `<span class="text-emerald-600 font-bold">✅ Titik Lokasi: ${lat.toFixed(4)}, ${lng.toFixed(4)}. Memindai wisata sekitar...</span>`;
    try {
      const response = await fetch('http://localhost:8000/api/v1/nearest', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ lat: lat, lng: lng }) });
      const resData = await response.json();
      if (resData.status === "success") { nearMeStatus.innerHTML = `<span class="text-slate-500 font-bold">Ditemukan ${resData.data.length} wisata terdekat dari lokasi Anda.</span>`; renderCards(resData.data, 'nearMeContainer'); } 
    } catch (error) { nearMeStatus.innerHTML = `<span class="text-rose-500">Error koneksi ke server.</span>`; }
  }, () => { nearMeStatus.innerHTML = `<span class="text-rose-500 font-bold">⚠️ Akses lokasi ditolak. Harap izinkan popup lokasi di browser Anda.</span>`; });
});

// ==========================================
// 5. LOGIKA HALAMAN SETTINGS & VIP PRO
// ==========================================

// @ts-ignore
window.printReport = () => {
  if (!isProUser) { alert("🌟 Fitur VIP Terkunci!"); document.getElementById('navSettings')?.click(); } 
  else window.print(); 
};

// @ts-ignore
window.handleUpgradePro = () => {
  if (currentUser === "GUEST") {
    alert("Silakan Masuk atau Daftar terlebih dahulu."); window.openAuth();
  } else {
    isProUser = true; alert(`Terima kasih ${currentUser}! Pembayaran simulasi berhasil. Akun Anda VIP PRO! 🌟`);
    document.getElementById('profileRole')!.innerText = "Premium VIP User";
    const btn = document.getElementById('btnUpgradePro');
    if(btn) { btn.innerText = "✅ Akun PRO Aktif"; btn.classList.replace('bg-amber-400', 'bg-slate-300'); btn.classList.remove('hover:bg-amber-300'); btn.setAttribute('disabled', 'true'); }
    unlockProFeatures();
  }
};

// @ts-ignore
window.openMapsPro = (placeName: string, cityName: string) => {
  if (!isProUser) { alert("🌟 Fitur VIP Terkunci!"); document.getElementById('navSettings')?.click(); } 
  else { const query = encodeURIComponent(`${placeName} ${cityName}`); window.open(`https://maps.google.com/?q=$${query}`, '_blank'); }
};

function unlockProFeatures() {
  const themeSelect = document.getElementById('setTheme') as HTMLSelectElement;
  if (themeSelect) { themeSelect.removeAttribute('disabled'); themeSelect.classList.remove('cursor-not-allowed', 'text-slate-400', 'bg-slate-100'); themeSelect.classList.add('cursor-pointer', 'text-slate-700', 'bg-white'); }
}
function lockProFeatures() {
  const themeSelect = document.getElementById('setTheme') as HTMLSelectElement;
  if (themeSelect) { themeSelect.setAttribute('disabled', 'true'); themeSelect.classList.add('cursor-not-allowed', 'text-slate-400', 'bg-slate-100'); themeSelect.classList.remove('cursor-pointer', 'text-slate-700', 'bg-white'); themeSelect.value = "Light Mode"; document.body.style.filter = "none"; }
}

const currencySelect = document.getElementById('setCurrency') as HTMLSelectElement;
if (currencySelect) currencySelect.value = currentCurrency;

currencySelect?.addEventListener('change', (e) => {
  const selected = (e.target as HTMLSelectElement).value; localStorage.setItem('appCurrency', selected); currentCurrency = selected; 
  updateDashboardAndTrips(); 
  if (!document.getElementById('viewPlanTrip')!.classList.contains('hidden')) document.getElementById('btnRecommend')!.click(); 
});

document.getElementById('setTheme')?.addEventListener('change', (e) => {
  const selectedTheme = (e.target as HTMLSelectElement).value;
  if (selectedTheme.includes("Dark")) { document.documentElement.classList.add('dark'); alert("🌙 True Dark Mode Pro diaktifkan!"); } 
  else { document.documentElement.classList.remove('dark'); }
});

// @ts-ignore
window.factoryReset = async () => {
  if(confirm("AWAS! Anda yakin ingin menghapus SEMUA data?")) {
    const btn = event?.currentTarget as HTMLButtonElement; const originalText = btn.innerText; btn.innerText = "⏳ Menghapus...";
    try {
      for (const trip of tripHistory) { await fetch(`http://localhost:8000/api/v1/trips/${trip.id}`, { method: 'DELETE' }); }
      localStorage.clear(); targetBudget = 0; currentCurrency = 'IDR'; (document.getElementById('targetBudgetInput') as HTMLInputElement).value = ''; currencySelect.value = 'IDR';
      await fetchTripsFromDB(); alert("✅ Seluruh data berhasil di-reset!"); btn.innerText = originalText;
    } catch (error) { btn.innerText = originalText; }
  }
};

switchView('navDashboard');