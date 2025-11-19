// database.js

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
const istoricRef = ref(db, 'istoric');

// 🔷 Calculează scorurile
function calculeazaScoruri(data, zile = null) {
    const azi = new Date();
    const scoruri = {};

    let limitaData = null;
    if (zile) {
        limitaData = new Date();
        limitaData.setMonth(azi.getMonth() - 3); // 3 luni în urmă
    }

    Object.values(data).forEach(entry => {
        const [year, month, day] = entry.data.split('-');
        const entryDate = new Date(year, month - 1, day);

        if (limitaData && entryDate < limitaData) {
            return; // ignoră dacă e mai vechi de 3 luni
        }

        const nume = entry.nume;
        const tip = entry.tip;
        const valoare = parseInt(entry.valoare) || 0;

        if (!scoruri[nume]) scoruri[nume] = 0;
        scoruri[nume] += tip === 'shop' ? valoare : -valoare;
    });

    return Object.entries(scoruri).sort((a, b) => b[1] - a[1]);
}

// 🔷 Afișează lista cu stele ⭐
function afiseazaTop(listaId, sortat) {
    const lista = document.getElementById(listaId);
    lista.innerHTML = '';

    sortat.forEach(([nume, puncte], index) => {
        let emoji = "⭐";
        if (index === 0) emoji = "🥇";
        else if (index === 1) emoji = "🥈";
        else if (index === 2) emoji = "🥉";

        const li = document.createElement("li");
        li.innerHTML = `
            <span>${String(index + 1).padStart(2, '0')}</span>
            <div class="info">
                <img src="assets/images/avatar-01.jpg" alt="">
                <h6><i class="fa fa-check"></i> ${nume}</h6>
            </div>
            <div class="points">${puncte} ${emoji}</div>
        `;
        lista.appendChild(li);
    });
}

// 🔷 Afișează lista cu V-Bucks 💎
function afiseazaTopVbucks(listaId, sortat) {
    const lista = document.getElementById(listaId);
    lista.innerHTML = '';

    const top10 = sortat.slice(0, 10);
    const totalPuncte = top10.reduce((acc, [_, puncte]) => acc + puncte, 0) || 1;
    const totalVbucks = 15000;

    // valorile permise
    const valoriPermise = [200, 300, 500, 600, 800, 1200, 1500, 2000, 3000];

    top10.forEach(([nume, puncte], index) => {
        // calculează vbucks proporțional
        const vbucksProportional = Math.round((puncte / totalPuncte) * totalVbucks);

        // găsește cea mai apropiată valoare permisă
        const vbucksFinal = valoriPermise.reduce((prev, curr) => {
            return Math.abs(curr - vbucksProportional) < Math.abs(prev - vbucksProportional) ? curr : prev;
        });

        const vbucksImg = `<img src="https://static.wikia.nocookie.net/fortnite/images/e/eb/V-Bucks_-_Icon_-_Fortnite.png" alt="V-Bucks" style="width:22px; height:22px; vertical-align:middle; margin-left:6px;">`;

        let emoji = "⭐";
        if (index === 0) emoji = "🥇";
        else if (index === 1) emoji = "🥈";
        else if (index === 2) emoji = "🥉";

        const li = document.createElement("li");
        li.innerHTML = `
            <span>${String(index + 1).padStart(2, '0')}</span>
            <div class="info">
                <img src="assets/images/avatar-01.jpg" alt="">
                <h6><i class="fa fa-check"></i> ${nume}</h6>
            </div>
            <div class="points">${vbucksFinal} ${vbucksImg}</div>
        `;
        lista.appendChild(li);
    });
}

// 🔷 Citește din Firebase și populează taburile
onValue(istoricRef, (snapshot) => {
    const data = snapshot.val();
    if (!data) return;

    afiseazaTop('lista-all', calculeazaScoruri(data));            // All-Time ⭐
    afiseazaTop('lista-90', calculeazaScoruri(data, 90));        // Ultimele 3 luni ⭐
    afiseazaTopVbucks('lista-vbucks', calculeazaScoruri(data, 90)); // V-Bucks 💎
});
