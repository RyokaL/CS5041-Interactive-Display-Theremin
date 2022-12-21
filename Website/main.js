class Track {
    constructor(notes, instrument, instrObj) {
        this.notes = notes;
        this.instrument = instrument;
        this.instrObj = instrObj
    }
}

class Button {
    constructor(xPos, yPos, size, action, index) {
        this.posX = xPos;
        this.posY = yPos;
        this.size = size;
        this.action = action;
        this.index = index;
    }
}

class Note {
    constructor(freq, time, shiftTo, volume) {
        this.freq = freq;
        this.time = time;
        this.shiftTo = shiftTo;
        this.volume = volume;
    }
}

var instr=null;
var AudioContextFunc = window.AudioContext || window.webkitAudioContext;
var audioContext = new AudioContextFunc();
var player=new WebAudioFontPlayer();
let envelope;

//Load new instrument when selected
function changeInstrument(list){
    var n = document.getElementById('instr').selectedIndex;
    var info = player.loader.instrumentInfo(n);
	player.loader.startLoad(audioContext, info.url, info.variable);
	player.loader.waitLoad(function () {
        console.log("loaded", info.variable)
		instr=window[info.variable];
        audioContext.resume();
	});
}

let tracks = [];
let notes = [];
let timer;

let buttons = [];
let trackButtons = [];

let serial;
let port = 'COM5';

let freq = 0;
let preFreq = 127;

let volume = 0.5;
let preVolume = 0.5;

let recording = false;

var tempoSlider;
let preTempo = 250;

function beginRecord() {
    //Add a new track and begin recording
    notes = [];
    notes.push(new Note(-1, 0, 0, -1));
    recording = true;
    timer = millis();
    console.log("recording!");
}

function stopRecord() {
    player.cancelQueue(audioContext);
    //End recording and save track
    if(recording) {
        notes.push(new Note(preFreq, Math.round(((millis() - timer) / 1000) * 1000) / 1000, freq));
        recording = false;
        trackButtons.push(new Button(50 + (Math.floor(tracks.length / 8) * 525), 200 + ((tracks.length % 8) * 85), 25, function(){return deleteTrack(this)}, trackButtons.length))
        tracks.push(new Track(notes, document.getElementById('instr').selectedIndex, instr));
    }
}

function deleteTrack(b) {
    //Remove a track
    //TODO: Ask if sure to remove track
    if(tracks.length > 0) {
        tracks.splice(b.index, 1);
    }
    if(trackButtons.length > 0) {
        var removed = trackButtons.pop();
    }

    trackButtons.forEach(function(x){
        if(x.index > removed.index) {
            x.index = x.index - 1;
        }
    });
}

function saveSong() {
    //Export as midi, hopefully
    //TODO: Take email address to email file to
}

function drawVisualisation() {
    //Possibly draw some kind of visualisation?
}

function drawTracklist() {
    //Draw track infos
    push();
        for(var i in tracks) {
            var curr = tracks[i];
            fill(0);
            rect(50 + (Math.floor(i / 8) * 525), 200 + ((i % 8) * 85), 500, 75);
            fill(128, 0, 0);
            rect(60 + (Math.floor(i / 8) * 525), 210 + ((i % 8) * 85), 480, 55);
            fill(255);
            rect(50 + (Math.floor(i / 8) * 525), 200 + ((i % 8) * 85), 25, 25);
            text(document.getElementById('instr')[curr.instrument].value, 65 + (Math.floor(i / 8) * 525), 240 + ((i % 8) * 85));
        }
    pop();
}

function playSong() {
    //Play all tracks together? Think this is possible
    //If not, play selected track

    var trackNotes;
    var endOfAll = false;
    var pass = false;
    var shifts = []
    var i = 1;

    while(!endOfAll) {
        pass = false;
        for(var j = 0; j < tracks.length; j++) {
            currTrack = tracks[j];
            trackNotes = currTrack.notes;
            if(i > trackNotes.length - 1) {
                continue;
            }
            else {
                let shifts = [];
                if(i == trackNotes.length - 1) {
                    shifts = [];
                }
                else {
                    //shifts = [{pitch: trackNotes[i + 1].freq, when: audioContext.currentTime + trackNotes[i].time}];
                }
                if(trackNotes[i].freq == 127) {
                    pass = true;
                    continue;
                }
                player.queueWaveTable(audioContext, audioContext.destination, currTrack.instrObj, audioContext.currentTime + trackNotes[i - 1].time, trackNotes[i].freq, (trackNotes[i].time - trackNotes[i - 1].time), trackNotes[i].volume, shifts)
                pass = true;
            }
        }
        // if(i < 0) {
        //     continue;
        // }
        //shifts.push({pitch: Number(firstNote - trackNotes[i].shiftTo), when: Number(audioContext.currentTime + trackNotes[i].time)});
        //console.log(trackNotes[i].time)
        //console.log(trackNotes[i + 1].time)
        if(!pass) {
            endOfAll = true;
        }
        i++;
    }
    //player.queueWaveTable(audioContext, audioContext.destination, tracks[0].instrObj, audioContext.currentTime, firstNote, trackNotes[trackNotes.length - 1].time, 0.5, shifts);
}

let cnv;

function setup() {
    serial = new p5.SerialPort();
    serial.on('data', serialEvent);
    serial.open(port);

    cnv = createCanvas(1900, 900);

    tempoSlider = createSlider(100, 2000, 250, 1);
    tempoSlider.position(50, 150)

    createButtons();
}

function serialEvent() {
    inp = String(serial.readLine());

    if(inp.charAt(0) == 'f') {
        freq = Number(inp.substr(1, inp.length - 1));
    }
    else if(inp.charAt(0) == 'v') {
        volume = Number(inp.substr(1, inp.length - 1));
    }
    //freq = Number(serial.read());
    //freq = map(freq, 0, 255, 24, 96);

    if(freq == 127) {
        freq = preFreq;
    }
    
    if(Math.abs(preFreq - freq) < 2) {
        freq = preFreq;
    }
}

function createButtons() {
    buttons.push(new Button(50, 50, 50, beginRecord));
    buttons.push(new Button(100, 50, 50, playSong))
    buttons.push(new Button(150, 50, 50, stopRecord))
}

function drawControls() {
    push();
        fill(0);
        stroke(128)
        rect(50, 50, 50, 50, 5);

        rect(100, 50, 50, 50, 5);

        rect(150, 50, 50, 50, 5);

        fill(255, 0, 0);
        stroke(255);
        ellipse(75, 75, 25, 25);

        triangle(115, 60, 115, 90, 140, 75);

        rect(165, 65, 20, 20);
    pop();
}

function mousePressed() {
    for(var i in buttons) {
        var button = buttons[i];
        if(mouseX > button.posX && mouseX < (button.posX + button.size) && mouseY > button.posY && mouseY < (button.posY + button.size)) {
            button.action();
        } 
    }

    for(var i in trackButtons) {
        var button = trackButtons[i];
        if(mouseX > button.posX && mouseX < (button.posX + button.size) && mouseY > button.posY && mouseY < (button.posY + button.size)) {
            button.action();
        } 
    }
}

function draw() {
    /*convert to long rainbow RGB*/
    // From: https://www.particleincell.com/2014/colormap/
    var r, g, b;
    var m = map(freq, 0, 127, 0, 1);
    var a=(1-m)/0.2;
    var X=Math.floor(a);
    var Y=Math.floor(255*(a-X));
    switch(X)
    {
        case 0: r=255;g=Y;b=0;break;
        case 1: r=255-Y;g=255;b=0;break;
        case 2: r=0;g=255;b=Y;break;
        case 3: r=0;g=255-Y;b=255;break;
        case 4: r=Y;g=0;b=255;break;
        case 5: r=255;g=0;b=255;break;
    }

    background(r, g, b);
    fill(255);
    push();
        textSize(32);
        text("Frequency of Note: " + freq, width/2 - 200, 50);
    pop();

    text("Tempo: " + tempoSlider.value(), 45, 160);

    if(preTempo != tempoSlider.value()) {
        serial.write("t" + tempoSlider.value() + "\n");
        preTempo = tempoSlider.value();
        console.log("t" + tempoSlider.value() + "\n")
    }

    drawControls();
    drawTracklist();

    if(recording == true && instr != null && (preFreq != freq || preVolume != volume)) {
        player.cancelQueue(audioContext);
        notes.push(new Note(preFreq, Math.round(((millis() - timer) / 1000) * 1000) / 1000, freq, preVolume));
        player.queueWaveTable(audioContext, audioContext.destination, instr, 0, freq, 100, volume);
        preFreq = freq;
        preVolume = volume;
    }
}

