const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
recognition.continuous = true;
recognition.interimResults = false;

const sentenceInput = document.getElementById('sentence');
const feedback = document.getElementById('feedback');
const startBtn = document.getElementById('start');
const stopBtn = document.getElementById('stop');
const playbackBtn = document.getElementById('playback');
const hearCorrectBtn = document.getElementById('hear-correct');
const progressBar = document.getElementById('progressBar');
const noiseWarning = document.getElementById('noise-warning');

let spokenWords = "";
let audioBlob = null; // Store audio blob for playback

// Check if the user entered a sentence before enabling the "Start" button
sentenceInput.addEventListener('input', () => {
    startBtn.disabled = sentenceInput.value.trim() === "";
});

// Start listening for speech
startBtn.addEventListener('click', () => {
    recognition.start();
    startBtn.disabled = true;
    stopBtn.style.display = "inline-block";  // Show stop button
    playbackBtn.disabled = true; // Disable playback during recording
    hearCorrectBtn.disabled = true; // Disable "Hear Correct Pronunciation" button
    progressBar.value = 0; // Reset progress bar
});

recognition.onresult = (event) => {
    spokenWords = event.results[0][0].transcript.trim(); // Capture recognized speech
    let enteredSentence = sentenceInput.value.trim();
    checkPronunciation(enteredSentence, spokenWords);
    stopBtn.style.display = "none"; // Hide stop button after recording
    startBtn.disabled = false; // Re-enable start button
    playbackBtn.disabled = false; // Enable playback button
    hearCorrectBtn.disabled = false; // Enable "Hear Correct Pronunciation" button
    audioBlob = event.results[0][0]; // Store audio for playback
};

stopBtn.addEventListener('click', () => {
    recognition.stop();
});

// Playback functionality with progress bar
playbackBtn.addEventListener('click', () => {
    if (spokenWords) {
        const utterance = new SpeechSynthesisUtterance(spokenWords);
        window.speechSynthesis.speak(utterance);

        const duration = utterance.text.length * 100; // Example estimation of playback duration
        let currentTime = 0;
        const interval = setInterval(() => {
            currentTime += 100; // Simulate time passing
            progressBar.value = (currentTime / duration) * 100;
            if (currentTime >= duration) clearInterval(interval);
        }, 100);
    }
});

// Hear Correct Pronunciation functionality
hearCorrectBtn.addEventListener('click', () => {
    const correctPronunciation = sentenceInput.value.trim();
    const utterance = new SpeechSynthesisUtterance(correctPronunciation);
    window.speechSynthesis.speak(utterance);
});

// Basic noise detection
navigator.mediaDevices.getUserMedia({ audio: true })
    .then(function(stream) {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const microphone = audioContext.createMediaStreamSource(stream);
        const analyser = audioContext.createAnalyser();
        microphone.connect(analyser);
        analyser.fftSize = 256;

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        function checkNoiseLevel() {
            analyser.getByteFrequencyData(dataArray);
            let sum = dataArray.reduce((a, b) => a + b);
            let averageNoise = sum / bufferLength;

            if (averageNoise > 120) { // Threshold for background noise
                noiseWarning.classList.remove('hidden');
            } else {
                noiseWarning.classList.add('hidden');
            }
        }

        setInterval(checkNoiseLevel, 1000); // Check noise level every second
    })
    .catch(function(err) {
        console.error('Error accessing microphone: ', err);
    });

// Function to check pronunciation
function checkPronunciation(expected, actual) {
    let expectedWords = expected.trim().split(' ').map(cleanWord);
    let actualWords = actual.trim().split(' ').map(cleanWord);
    let result = '';

    expectedWords.forEach((word, index) => {
        if (actualWords[index] && word === actualWords[index]) {
            result += `<span style="color: green">${word} </span>`;
        } else {
            result += `<span style="color: red">${word} </span>`;
        }
    });
    
    feedback.innerHTML = result;
}

// Utility to clean words (removes punctuation)
function cleanWord(word) {
    return word.replace(/[.,!?]/g, '').trim().toLowerCase();
}
