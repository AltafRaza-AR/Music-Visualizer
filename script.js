const audioElement = document.getElementById('audio');
const canvas = document.getElementById('visualizer');
const canvasContext = canvas.getContext('2d');
let audioContext;
let analyser;
let microphone;
let source;
let isMicrophoneActive = false;

const startButton = document.getElementById('start-button');
const stopButton = document.getElementById('stop-button');

startButton.addEventListener('click', function() {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioContext.createAnalyser();
    startButton.disabled = true;
    stopButton.disabled = false;

    navigator.mediaDevices.getUserMedia({ audio: true })
        .then(function(stream) {
            microphone = stream;
            source = audioContext.createMediaStreamSource(stream);
            source.connect(analyser);
            analyser.connect(audioContext.destination);
            analyser.fftSize = 256;

            isMicrophoneActive = true;

            draw();
        })
        .catch(function(err) {
            console.log("Error accessing microphone: " + err);
        });
});

stopButton.addEventListener('click', function() {
    if (isMicrophoneActive && microphone) {
        microphone.getTracks().forEach(track => track.stop());
        source.disconnect();
        analyser.disconnect();

        stopButton.disabled = true;
        startButton.disabled = false;
        isMicrophoneActive = false;

        canvasContext.clearRect(0, 0, canvas.width, canvas.height);
    }
});

function draw() {
    if (!isMicrophoneActive) return;

    requestAnimationFrame(draw);
    
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyser.getByteFrequencyData(dataArray);

    canvasContext.fillStyle = 'rgba(51, 51, 51, 0.8)';
    canvasContext.fillRect(0, 0, canvas.width, canvas.height);

    const barWidth = (canvas.width / bufferLength) * 2.5;
    let barHeight;
    let x = 0;

    for (let i = 0; i < bufferLength; i++) {
        barHeight = dataArray[i];

        const r = Math.min(255, barHeight + 100);
        const g = Math.max(50, 150 - (barHeight / 2));
        const b = Math.max(50, 255 - barHeight);

        canvasContext.fillStyle = `rgb(${r}, ${g}, ${b})`;

        const scaleFactor = 1 + (barHeight / 100);
        canvasContext.save();
        canvasContext.translate(x + barWidth / 2, canvas.height - barHeight);
        canvasContext.scale(1, scaleFactor);
        canvasContext.fillRect(-barWidth / 2, 0, barWidth, barHeight);
        canvasContext.restore();

        x += barWidth + 1;
    }
}
