// DOM Elements
const minutesEl = document.getElementById('minutes');
const secondsEl = document.getElementById('seconds');
const timerLabelEl = document.getElementById('timer-label');
const startBtn = document.getElementById('start-btn');
const pauseBtn = document.getElementById('pause-btn');
const resetBtn = document.getElementById('reset-btn');
const focusTimeInput = document.getElementById('focus-time');
const breakTimeInput = document.getElementById('break-time');
const longBreakTimeInput = document.getElementById('long-break-time');
const sessionsInput = document.getElementById('sessions');
const currentSessionEl = document.getElementById('current-session');
const totalSessionsEl = document.getElementById('total-sessions');

// Audio notifications
const meditationBell = new Audio('bells-2-31725.mp3');
meditationBell.volume = 0.7; // Set volume to 70%

// Timer variables
let timer;
let minutes;
let seconds;
let isRunning = false;
let isPaused = false;
let currentMode = 'focus'; // 'focus', 'break', 'longBreak'
let currentSession = 0;
let totalSessions = 4;

// Initialize the timer
function initTimer() {
    // Update total sessions display
    totalSessions = parseInt(sessionsInput.value);
    totalSessionsEl.textContent = totalSessions;
    currentSessionEl.textContent = currentSession;
    
    // Set initial time based on mode
    resetTimer();
}

// Ensure input values are whole numbers
function ensureWholeNumber(input) {
    // Parse the value as an integer
    const value = parseInt(input.value);
    
    // If the parsed value is different from the input value (e.g., it was a decimal)
    // or if the input is empty, set it to the parsed value or the min value
    if (isNaN(value) || value !== parseFloat(input.value)) {
        input.value = isNaN(value) ? input.min : Math.floor(value);
    }
}

// Reset timer to initial state
function resetTimer() {
    clearInterval(timer);
    isRunning = false;
    isPaused = false;
    currentMode = 'focus';
    currentSession = 0;
    
    // Update UI
    updateTimerDisplay(focusTimeInput.value, 0);
    timerLabelEl.textContent = 'Focus Time';
    currentSessionEl.textContent = currentSession;
    
    // Reset buttons
    startBtn.disabled = false;
    pauseBtn.disabled = true;
    
    // Update body class for styling
    document.body.className = 'focus-mode';
    document.title = 'Pomodoro Timer | Focus Time';
}

// Update timer display
function updateTimerDisplay(mins, secs) {
    minutesEl.textContent = mins.toString().padStart(2, '0');
    secondsEl.textContent = secs.toString().padStart(2, '0');
}

// Start the timer
function startTimer(autoStart = false) {
    if (isRunning && !isPaused) return;
    
    if (!isRunning) {
        // If starting fresh, set the time based on current mode
        if (currentMode === 'focus') {
            minutes = parseInt(focusTimeInput.value);
        } else if (currentMode === 'break') {
            minutes = parseInt(breakTimeInput.value);
        } else {
            minutes = parseInt(longBreakTimeInput.value);
        }
        seconds = 0;
        updateTimerDisplay(minutes, seconds);
        
        // Play the bell for the current mode when manually starting
        // But don't play it again if this is an auto-start after a mode transition
        if (!isPaused && !autoStart) {
            playBellForMode(currentMode);
        }
    }
    
    isRunning = true;
    isPaused = false;
    
    // Update buttons
    startBtn.disabled = true;
    pauseBtn.disabled = false;
    
    // Start the countdown
    timer = setInterval(() => {
        if (seconds === 0) {
            if (minutes === 0) {
                // Timer completed
                clearInterval(timer);
                handleTimerComplete();
                return;
            }
            minutes--;
            seconds = 59;
        } else {
            seconds--;
        }
        
        updateTimerDisplay(minutes, seconds);
        // Update document title with current time
        updateDocumentTitle();
    }, 1000);
}

// Play meditation bell sound
function playMeditationBell() {
    // Reset the audio to the beginning in case it was already played
    meditationBell.currentTime = 0;
    
    // Play the meditation bell
    meditationBell.play().catch(error => {
        console.error("Error playing meditation bell:", error);
        // Fallback to browser notification if audio fails
        if ("Notification" in window && Notification.permission === "granted") {
            new Notification("Timer Complete", {
                body: `Your ${currentMode} time is complete.`,
                icon: "https://aliabdaal.com/favicon.ico"
            });
        }
    });
}

// Play bell sound multiple times based on mode
function playBellForMode(mode) {
    // Reset the audio to the beginning
    meditationBell.currentTime = 0;
    
    let count = 1; // Default for focus mode
    
    if (mode === 'break') {
        count = 2; // Play twice for break mode
    } else if (mode === 'longBreak') {
        count = 3; // Play three times for long break mode
    }
    
    // Play the bell the appropriate number of times
    let played = 0;
    
    function playNext() {
        if (played < count) {
            meditationBell.currentTime = 0;
            meditationBell.play().then(() => {
                played++;
                if (played < count) {
                    // Wait for the bell to finish before playing again
                    setTimeout(playNext, 1500);
                }
            }).catch(error => {
                console.error("Error playing meditation bell:", error);
            });
        }
    }
    
    playNext();
}

// Update document title with current time
function updateDocumentTitle() {
    let mode = 'Focus Time';
    if (currentMode === 'break') mode = 'Break Time';
    if (currentMode === 'longBreak') mode = 'Long Break';
    document.title = `${minutesEl.textContent}:${secondsEl.textContent} | ${mode}`;
}

// Pause the timer
function pauseTimer() {
    if (!isRunning) return;
    
    clearInterval(timer);
    isPaused = true;
    
    // Update buttons
    startBtn.disabled = false;
    pauseBtn.disabled = true;
}

// Handle timer completion
function handleTimerComplete() {
    isRunning = false;
    
    // Update buttons
    startBtn.disabled = false;
    pauseBtn.disabled = true;
    
    // Store the previous mode before switching
    const previousMode = currentMode;
    
    // Switch modes
    if (currentMode === 'focus') {
        currentSession++;
        currentSessionEl.textContent = currentSession;
        
        // Check if it's time for a long break
        if (currentSession % totalSessions === 0) {
            currentMode = 'longBreak';
            timerLabelEl.textContent = 'Long Break';
            minutes = parseInt(longBreakTimeInput.value);
            document.body.className = 'long-break-mode';
            document.title = 'Pomodoro Timer | Long Break';
        } else {
            currentMode = 'break';
            timerLabelEl.textContent = 'Break Time';
            minutes = parseInt(breakTimeInput.value);
            document.body.className = 'break-mode';
            document.title = 'Pomodoro Timer | Break Time';
        }
    } else {
        // After any break, go back to focus mode
        currentMode = 'focus';
        timerLabelEl.textContent = 'Focus Time';
        minutes = parseInt(focusTimeInput.value);
        document.body.className = 'focus-mode';
        document.title = 'Pomodoro Timer | Focus Time';
    }
    
    seconds = 0;
    updateTimerDisplay(minutes, seconds);
    
    // Auto-start the next timer after a short delay
    setTimeout(() => {
        // Play the bell sound for the new mode before starting
        // We only want to play the bell for the new mode, not the completed mode
        playBellForMode(currentMode);
        
        // Start the timer after a delay to allow the bell sounds to play
        setTimeout(() => {
            startTimer(true); // Pass true to indicate this is an auto-start after completion
        }, currentMode === 'longBreak' ? 4500 : (currentMode === 'break' ? 3000 : 1500));
    }, 1000);
}

// Request notification permission
function requestNotificationPermission() {
    if ("Notification" in window) {
        Notification.requestPermission();
    }
}

// Event listeners
startBtn.addEventListener('click', startTimer);
pauseBtn.addEventListener('click', pauseTimer);
resetBtn.addEventListener('click', resetTimer);

// Settings inputs event listeners
[focusTimeInput, breakTimeInput, longBreakTimeInput, sessionsInput].forEach(input => {
    input.addEventListener('change', () => {
        ensureWholeNumber(input);
        initTimer();
    });
    
    input.addEventListener('input', () => {
        ensureWholeNumber(input);
    });
});

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    initTimer();
    // Set initial body class
    document.body.className = 'focus-mode';
    document.title = 'Pomodoro Timer | Focus Time';
    
    // Request notification permission
    requestNotificationPermission();
}); 