// --- Globale Variablen und Konstanten ---
const STORAGE_KEY = 'workTimeCalculator_targetMinutes';

// DOM-Elemente
const targetHoursEl = document.getElementById('targetHours');
const targetMinutesEl = document.getElementById('targetMinutes');
const startTimeEl = document.getElementById('startTime');
const breakMinutesEl = document.getElementById('breakMinutes');
const endTimeEl = document.getElementById('endTime');
const progressBarEl = document.getElementById('progressBar');
const progressTextEl = document.getElementById('progressText');
const statusMessageEl = document.getElementById('statusMessage');

// --- App-Initialisierung ---
document.addEventListener('DOMContentLoaded', () => {
    loadSettings();
    
    // Event Listeners für alle Eingaben
    const inputs = [targetHoursEl, targetMinutesEl, startTimeEl, breakMinutesEl];
    inputs.forEach(el => {
        el.addEventListener('input', calculateTime);
    });

    // Speichern der Soll-Zeit bei Änderung
    targetHoursEl.addEventListener('change', saveSettings);
    targetMinutesEl.addEventListener('change', saveSettings);

    // Regelmäßige Aktualisierung alle 10 Sekunden
    setInterval(calculateTime, 10000);
    
    // Service Worker für PWA-Funktionalität registrieren
    registerServiceWorker(); // <-- Jetzt wieder aktiviert
});

// --- Einstellungs-Management ---

/**
 * Lädt die gespeicherte Soll-Arbeitszeit aus dem localStorage.
 * Standard: 8 Stunden 12 Minuten (492 Minuten).
 */
function loadSettings() {
    const defaultTotalMinutes = (8 * 60) + 12; // 492 Minuten
    const savedMinutes = localStorage.getItem(STORAGE_KEY);
    
    const totalMinutes = savedMinutes ? parseInt(savedMinutes, 10) : defaultTotalMinutes;
    
    targetHoursEl.value = Math.floor(totalMinutes / 60);
    targetMinutesEl.value = totalMinutes % 60;
}

/**
 * Speichert die aktuelle Soll-Arbeitszeit im localStorage.
 */
function saveSettings() {
    const hours = parseInt(targetHoursEl.value) || 0;
    const minutes = parseInt(targetMinutesEl.value) || 0;
    const totalMinutes = (hours * 60) + minutes;
    
    localStorage.setItem(STORAGE_KEY, totalMinutes.toString());
}

// --- Kernlogik ---

/**
 * Formatiert Minuten in einen "X Std. Y Min." String.
 * @param {number} totalMinutes - Die Gesamtminuten.
 * @returns {string} Formatierter String.
 */
function formatMinutes(totalMinutes) {
    if (totalMinutes < 0) totalMinutes = 0;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = Math.round(totalMinutes % 60);
    return `${hours} Std. ${minutes} Min.`;
}

/**
 * Formatiert ein Date-Objekt in einen "HH:MM" String.
 * @param {Date} date - Das Datumsobjekt.
 * @returns {string} Formatierter String.
 */
function formatTime(date) {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
}

/**
 * Die Hauptfunktion. Berechnet Endzeit, Fortschritt und Status.
 */
function calculateTime() {
    // 1. Eingaben holen
    const targetHours = parseInt(targetHoursEl.value) || 0;
    const targetMinutes = parseInt(targetMinutesEl.value) || 0;
    const targetWorkMinutes = (targetHours * 60) + targetMinutes;
    
    const startTimeValue = startTimeEl.value;
    const breakMinutes = parseInt(breakMinutesEl.value) || 0;

    // Abbruch, wenn keine Startzeit oder keine Soll-Zeit gesetzt ist
    if (!startTimeValue || targetWorkMinutes === 0) {
        statusMessageEl.textContent = "Bitte Start- und Soll-Zeit eingeben.";
        endTimeEl.textContent = "--:--";
        progressBarEl.style.width = '0%';
        progressTextEl.textContent = '0%';
        return;
    }

    // 2. Zeit-Objekte erstellen
    const now = new Date();
    const [startHours, startMinutes] = startTimeValue.split(':').map(Number);
    
    // Start-Datum auf heute setzen
    const startTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), startHours, startMinutes);

    // 3. Endzeit berechnen
    // Endzeit = Startzeit + Soll-Arbeitszeit + Pause
    const endTime = new Date(startTime.getTime() + (targetWorkMinutes * 60000) + (breakMinutes * 60000));
    
    // 4. Fortschritt berechnen
    // Gesamtzeit seit Arbeitsbeginn (in ms)
    const totalDurationMs = now.getTime() - startTime.getTime();
    // Effektive Arbeitszeit = Gesamtzeit - Pause
    const effectiveWorkMinutes = (totalDurationMs / 60000) - breakMinutes;
    
    let progressPercentage = 0;
    if (targetWorkMinutes > 0) {
        progressPercentage = (effectiveWorkMinutes / targetWorkMinutes) * 100;
    }

    // 5. Status-Meldung (Restzeit / Überzeit)
    const remainingMinutes = targetWorkMinutes - effectiveWorkMinutes;

    if (remainingMinutes <= 0) {
        // Überzeit
        const overtimeMinutes = Math.abs(remainingMinutes);
        statusMessageEl.textContent = `Du hast ${formatMinutes(overtimeMinutes)} Überzeit generiert.`;
        progressBarEl.style.width = '100%';
        progressBarEl.classList.remove('bg-indigo-600');
        progressBarEl.classList.add('bg-green-500'); // Grün für "fertig"
        progressTextEl.textContent = '100%';
    } else {
        // Restzeit
        statusMessageEl.textContent = `Noch ${formatMinutes(remainingMinutes)} zu arbeiten.`;
        progressBarEl.style.width = `${Math.max(0, Math.min(100, progressPercentage)).toFixed(2)}%`;
        progressBarEl.classList.add('bg-indigo-600');
        progressBarEl.classList.remove('bg-green-500');
        progressTextEl.textContent = `${Math.max(0, Math.min(100, progressPercentage)).toFixed(0)}%`;
    }

    // 6. UI aktualisieren
    endTimeEl.textContent = formatTime(endTime);
}

// --- PWA Service Worker Registrierung ---

/**
 * Registriert den Service Worker (sw.js).
 */
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js')
            .then((registration) => {
                console.log('Service Worker erfolgreich registriert mit Scope:', registration.scope);
            })
            .catch((error) => {
                console.error('Service Worker Registrierung fehlgeschlagen:', error);
            });
    } else {
         console.log('Service Worker nicht unterstützt.');
    }
}

