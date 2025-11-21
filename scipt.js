// --- KONFIGURASI & DATA ---
let activities = [];
let userWeight = 70;
let weeklyTarget = 150;
let todaySchedule = "";

// Kalori per menit (Estimasi METs)
const caloriesMap = {
    'Lari': 10,
    'Bersepeda': 8,
    'Renang': 11,
    'Gym': 6,
    'Push Up': 5,
    'Sepak Bola': 9,
    'Basket': 8,
    'Yoga': 3
};

// --- INISIALISASI CHART ---
const ctx = document.getElementById('workoutChart').getContext('2d');
let workoutChart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'],
        datasets: [{
            label: 'Aktivitas (Menit)',
            data: [0, 0, 0, 0, 0, 0, 0],
            borderColor: '#FF4500',
            backgroundColor: 'rgba(255, 69, 0, 0.2)',
            borderWidth: 3,
            fill: true,
            tension: 0.4
        }]
    },
    options: {
        responsive: true,
        plugins: { legend: { labels: { color: 'white' } } },
        scales: {
            y: { ticks: { color: '#aaa' }, grid: { color: '#333' } },
            x: { ticks: { color: '#aaa' }, grid: { color: '#333' } }
        }
    }
});

// --- 1. SISTEM CUACA (SIMULASI) ---
function mockWeatherSystem() {
    const conditions = [
        { type: 'Cerah', icon: '☀️', rec: 'Bagus untuk Lari atau Sepak Bola outdoor!' },
        { type: 'Berawan', icon: '☁️', rec: 'Cocok untuk Bersepeda santai.' },
        { type: 'Hujan', icon: '🌧️', rec: 'Sebaiknya Gym indoor, Push Up, atau Renang indoor.' }
    ];
    
    // Pilih acak
    const todayWeather = conditions[Math.floor(Math.random() * conditions.length)];
    
    document.getElementById('weather-status').innerText = todayWeather.type;
    document.getElementById('weather-icon').innerText = todayWeather.icon;
    document.getElementById('weather-rec').innerText = todayWeather.rec;
}

// --- 2. RECOVERY SCORE SYSTEM ---
function calculateRecovery() {
    // Logika: Jika kemarin latihan berat (>60 menit), score turun.
    // Jika kemarin istirahat, score 100%.
    // (Ini simulasi sederhana, aslinya butuh data detak jantung dll)
    
    let yesterdayMinutes = 0; 
    // Anggap saja data terakhir di array adalah "kemarin" untuk demo ini
    if(activities.length > 0) {
        // Cek data terakhir
        yesterdayMinutes = activities[activities.length - 1].duration;
    }

    let score = 100;
    if (yesterdayMinutes > 90) score = 60;
    else if (yesterdayMinutes > 60) score = 80;
    else if (yesterdayMinutes > 30) score = 90;

    document.getElementById('recovery-val').innerText = score + "%";
    
    let msg = "Siap Latihan Keras!";
    let color = "#2ecc71"; // Hijau
    
    if(score < 70) { msg = "Perlu Istirahat."; color = "#e74c3c"; } // Merah
    else if(score < 90) { msg = "Latihan Ringan Saja."; color = "#f1c40f"; } // Kuning

    const circle = document.querySelector('.rec-circle');
    circle.style.borderColor = "#333";
    circle.style.borderTopColor = color;
    circle.style.boxShadow = `0 0 10px ${color}`;
    document.getElementById('recovery-msg').innerText = msg;
    document.getElementById('recovery-msg').style.color = color;
}

// --- 3. SCHEDULE SYSTEM ---
function setSchedule() {
    const input = document.getElementById('scheduleInput');
    if(input.value.trim() !== "") {
        todaySchedule = input.value;
        document.getElementById('today-schedule-display').innerText = `🎯 Target Hari Ini: ${todaySchedule}`;
        input.value = "";
        alert("Jadwal disimpan! Semangat!");
    }
}

// --- 4. NOTIFIKASI HARIAN ---
function requestNotifPermission() {
    if (!("Notification" in window)) {
        alert("Browser tidak mendukung notifikasi.");
    } else {
        Notification.requestPermission().then(permission => {
            if (permission === "granted") {
                new Notification("Sportify", { 
                    body: "Notifikasi aktif! Kami akan ingatkan jika Anda belum olahraga.",
                    icon: "https://cdn-icons-png.flaticon.com/512/2964/2964514.png" 
                });
                checkDailyNotification();
            }
        });
    }
}

function checkDailyNotification() {
    // Cek apakah hari ini sudah ada aktivitas
    let today = new Date().toISOString().split('T')[0];
    let hasExercise = activities.some(act => act.date === today);

    if (!hasExercise && Notification.permission === "granted") {
        // Simulasi: Muncul 3 detik setelah load jika belum ada data
        setTimeout(() => {
            new Notification("Sportify Reminder", {
                body: "Halo! Anda belum mencatat olahraga hari ini. Ayo gerak sebentar! 💪",
                icon: "https://cdn-icons-png.flaticon.com/512/2964/2964514.png"
            });
        }, 3000);
    }
}

// --- CORE LOGIC ---
function saveActivity(e) {
    e.preventDefault();
    let type = document.getElementById('type').value;
    let duration = parseInt(document.getElementById('duration').value);
    let date = document.getElementById('date').value;
    
    // Hitung Kalori
    let factor = caloriesMap[type] || 5;
    let burned = Math.round(duration * factor * (userWeight / 70));

    activities.push({ id: Date.now(), type, duration, date, calories: burned });

    document.getElementById('activityForm').reset();
    document.getElementById('date').valueAsDate = new Date(); // Reset date ke hari ini
    
    updateUI();
    switchTab('dashboard');
    checkBadges(burned, duration);
    calculateRecovery(); // Update recovery setelah input
}

function updateUI() {
    // Update Tabel
    let tbody = document.getElementById('history-body');
    tbody.innerHTML = "";
    activities.forEach(act => {
        tbody.innerHTML += `
            <tr>
                <td>${act.date}</td>
                <td>${act.type}</td>
                <td>${act.duration}m</td>
                <td style="color:var(--secondary)">${act.calories} Kcal</td>
            </tr>`;
    });

    // Update Dashboard Stats
    let totalCal = activities.reduce((sum, act) => sum + act.calories, 0);
    let totalMin = activities.reduce((sum, act) => sum + act.duration, 0);
    
    document.getElementById('dash-cal').innerText = totalCal;
    document.getElementById('dash-min').innerText = totalMin;

    // Progress Bar
    let pct = (totalMin / weeklyTarget) * 100;
    document.getElementById('weekly-progress').style.width = Math.min(pct, 100) + "%";
    document.getElementById('target-text').innerText = `${totalMin} / ${weeklyTarget} Menit`;

    // Update Chart (Simulasi tambah data ke hari terakhir)
    let chartData = workoutChart.data.datasets[0].data;
    chartData[6] = totalMin; 
    workoutChart.update();
}

// --- 5. BADGE SYSTEM (5 Badges) ---
function checkBadges(calories, duration) {
    // 1. Newbie (Selalu dapat setelah input pertama)
    if(activities.length >= 1) unlockBadge('badge-newbie');
    
    // 2. Burner (> 500 Kalori)
    if(calories >= 500) unlockBadge('badge-burner');
    
    // 3. Endurance (> 60 Menit)
    if(duration >= 60) unlockBadge('badge-endurance');

    // 4. Streak (Simulasi: > 3 Aktivitas total)
    if(activities.length >= 3) unlockBadge('badge-streak');

    // 5. Night Owl (Latihan Malam > jam 18:00)
    let currentHour = new Date().getHours();
    if(currentHour >= 18) unlockBadge('badge-night');
}

function unlockBadge(id) {
    document.getElementById(id).classList.add('unlocked');
}

// Navigasi Tab
function switchTab(tabId) {
    document.querySelectorAll('.section').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(el => el.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    if(event) event.target.classList.add('active');
}

function updateSettings() {
    userWeight = document.getElementById('weight').value;
    weeklyTarget = document.getElementById('weeklyTarget').value;
    updateUI();
}

// Init on Load
window.onload = function() {
    document.getElementById('date').valueAsDate = new Date();
    mockWeatherSystem();
    calculateRecovery();
    checkDailyNotification(); // Cek notif saat buka web
};
