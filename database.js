// database.js (ES Module)

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-database.js";

// 🔷 Configurația Firebase
const firebaseConfig = {
    apiKey: "AIzaSyBHx0H0eeJFYDpp4nHvivdvY3o_81YY_SU",
    authDomain: "emanuelt5.firebaseapp.com",
    databaseURL: "https://emanuelt5-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "emanuelt5",
    storageBucket: "emanuelt5.appspot.com",
    messagingSenderId: "664759200257",
    appId: "1:664759200257:web:58bc6088648112d5852e00",
    measurementId: "G-KCZ5P1FJNL"
};

// 🔷 Inițializează Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const istoricRef = ref(db, "istoric");

const AVATAR_SRC = "assets/images/avatar-01.jpg";
const VBUCKS_ICON_URL = "https://static.wikia.nocookie.net/fortnite/images/e/eb/V-Bucks_-_Icon_-_Fortnite.png";

// 🔷 Calculează scorurile (All-Time sau ultimele X luni)
// IMPORTANT: ca în codul tău inițial, „Ultimele 6 luni” = setMonth(-6)
function calculeazaScoruri(data, luniInUrma = null) {
    const azi = new Date();
    let limitaData = null;

    if (luniInUrma) {
        limitaData = new Date(azi);
        limitaData.setMonth(azi.getMonth() - 6); // identic cu comportamentul anterior
    }

    const scoruri = Object.create(null);

    for (const entry of Object.values(data)) {
        if (!entry || !entry.data || !entry.nume || !entry.tip) continue;

        const parts = String(entry.data).split("-");
        if (parts.length !== 3) continue;

        const [year, month, day] = parts.map(Number);
        const entryDate = new Date(year, (month || 1) - 1, day || 1);

        if (limitaData && entryDate < limitaData) continue;

        const nume = entry.nume;
        const tip = entry.tip;
        const valoare = parseInt(entry.valoare, 10) || 0;

        if (scoruri[nume] == null) scoruri[nume] = 0;
        scoruri[nume] += (tip === "shop") ? valoare : -valoare;
    }

    return Object.entries(scoruri).sort((a, b) => b[1] - a[1]);
}

function medalEmoji(index) {
    if (index === 0) return "🥇";
    if (index === 1) return "🥈";
    if (index === 2) return "🥉";
    return "⭐";
}

// 🔷 Afișează lista ⭐
function afiseazaTop(listaId, sortat) {
    const lista = document.getElementById(listaId);
    if (!lista) return;

    lista.innerHTML = "";
    const frag = document.createDocumentFragment();

    sortat.forEach(([nume, puncte], index) => {
        const li = document.createElement("li");
        li.innerHTML = `
      <span>${String(index + 1).padStart(2, "0")}</span>
      <div class="info">
        <img src="${AVATAR_SRC}" alt="">
        <h6><i class="fa fa-check"></i> ${nume}</h6>
      </div>
      <div class="points">${puncte} ${medalEmoji(index)}</div>
    `;
        frag.appendChild(li);
    });

    lista.appendChild(frag);
}

// 🔷 Afișează lista 💎 V-Bucks
function afiseazaTopVbucks(listaId, sortat) {
    const lista = document.getElementById(listaId);
    if (!lista) return;

    lista.innerHTML = "";
    const frag = document.createDocumentFragment();

    const top10 = sortat.slice(0, 10);
    const totalPuncte = top10.reduce((acc, [, puncte]) => acc + puncte, 0) || 1;
    const totalVbucks = 15000;

    const valoriPermise = [200, 300, 500, 600, 800, 1200, 1500, 2000, 3000];

    top10.forEach(([nume, puncte], index) => {
        const vbucksProportional = Math.round((puncte / totalPuncte) * totalVbucks);

        const vbucksFinal = valoriPermise.reduce((prev, curr) =>
            Math.abs(curr - vbucksProportional) < Math.abs(prev - vbucksProportional) ? curr : prev
        );

        const vbucksImg = `<img src="${VBUCKS_ICON_URL}" alt="V-Bucks" style="width:22px; height:22px; vertical-align:middle; margin-left:6px;">`;

        const li = document.createElement("li");
        li.innerHTML = `
      <span>${String(index + 1).padStart(2, "0")}</span>
      <div class="info">
        <img src="${AVATAR_SRC}" alt="">
        <h6><i class="fa fa-check"></i> ${nume}</h6>
      </div>
      <div class="points">${vbucksFinal} ${vbucksImg}</div>
    `;
        frag.appendChild(li);
    });

    lista.appendChild(frag);
}

// 🔷 Citește din Firebase și populează taburile
onValue(istoricRef, (snapshot) => {
    const data = snapshot.val();
    if (!data) return;

    const allTime = calculeazaScoruri(data);
    const last6Months = calculeazaScoruri(data, 6);

    afiseazaTop("lista-all", allTime);
    afiseazaTop("lista-90", last6Months);
    afiseazaTopVbucks("lista-vbucks", last6Months);
});
