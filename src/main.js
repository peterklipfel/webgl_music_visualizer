var stats;
var gl;

function initGL(canvas) {
    try {
        gl = canvas.getContext("experimental-webgl");
        gl.viewportWidth = canvas.width;
        gl.viewportHeight = canvas.height;
    } catch (e) {
    }
    if (!gl) {
        alert("Could not initialise WebGL, sorry :-(");
    }
}


function getShader(gl, id) {
    var shaderScript = document.getElementById(id);
    if (!shaderScript) {
        return null;
    }

    var str = "";
    var k = shaderScript.firstChild;
    while (k) {
        if (k.nodeType == 3) {
            str += k.textContent;
        }
        k = k.nextSibling;
    }

    var shader;
    if (shaderScript.type == "x-shader/x-fragment") {
        shader = gl.createShader(gl.FRAGMENT_SHADER);
    } else if (shaderScript.type == "x-shader/x-vertex") {
        shader = gl.createShader(gl.VERTEX_SHADER);
    } else {
        return null;
    }

    gl.shaderSource(shader, str);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert(gl.getShaderInfoLog(shader));
        return null;
    }

    return shader;
}


var shaderProgram;

function initShaders() {
    var fragmentShader = getShader(gl, "shader-fs");
    var vertexShader = getShader(gl, "shader-vs");

    shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert("Could not initialise shaders");
    }

    gl.useProgram(shaderProgram);

    shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
    gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

    shaderProgram.textureCoordAttribute = gl.getAttribLocation(shaderProgram, "aTextureCoord");
    gl.enableVertexAttribArray(shaderProgram.textureCoordAttribute);

    shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
    shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
    shaderProgram.samplerUniform = gl.getUniformLocation(shaderProgram, "uSampler");
    shaderProgram.colorUniform = gl.getUniformLocation(shaderProgram, "uColor");

    // --------------------------------------------------------------------------------------------------
    // -------------------------------------Screen Renderer----------------------------------------------
    // --------------------------------------------------------------------------------------------------

    fragmentShader = getShader(gl, "shader-fs-toscreen");
    vertexShader = getShader(gl, "shader-vs-toscreen");
    shaderToScreenProgram = gl.createProgram();
    gl.attachShader(shaderToScreenProgram, vertexShader);
    gl.attachShader(shaderToScreenProgram, fragmentShader);
    gl.linkProgram(shaderToScreenProgram);

    gl.useProgram(shaderToScreenProgram);

    shaderToScreenProgram.vertexPositionAttribute = gl.getAttribLocation(shaderToScreenProgram, "aVertexPosition");
    gl.enableVertexAttribArray(shaderToScreenProgram.vertexPositionAttribute);

    shaderToScreenProgram.textureCoordAttribute = gl.getAttribLocation(shaderToScreenProgram, "aTextureCoord");
    gl.enableVertexAttribArray(shaderToScreenProgram.textureCoordAttribute);

    shaderToScreenProgram.pMatrixUniform = gl.getUniformLocation(shaderToScreenProgram, "uPMatrix");
    shaderToScreenProgram.mvMatrixUniform = gl.getUniformLocation(shaderToScreenProgram, "uMVMatrix");
    shaderToScreenProgram.samplerUniform = gl.getUniformLocation(shaderToScreenProgram, "uSamplerToScreen");
    shaderToScreenProgram.amplitudeUniform = gl.getUniformLocation(shaderToScreenProgram, "uAmplitude");
    shaderToScreenProgram.rSensUniform = gl.getUniformLocation(shaderToScreenProgram, "uRedSensitivity");
    shaderToScreenProgram.gSensUniform = gl.getUniformLocation(shaderToScreenProgram, "uGreenSensitivity");
    shaderToScreenProgram.bSensUniform = gl.getUniformLocation(shaderToScreenProgram, "uBlueSensitivity");
}


function handleLoadedTexture(texture) {
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

    gl.bindTexture(gl.TEXTURE_2D, null);
}


var starTexture;

function initTexture() {
    starTexture = gl.createTexture();
    starTexture.image = new Image();
    starTexture.image.onload = function () {
        handleLoadedTexture(starTexture)
    }

    starTexture.image.src = "assets/star.gif";
}


var rttFramebuffer;
var rttTexture;

function initTextureFrameBuffer() {
    rttFramebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, rttFramebuffer);
    rttFramebuffer.width = window.innerWidth;
    rttFramebuffer.height = window.innerHeight;

    rttTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, rttTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, rttFramebuffer.width, rttFramebuffer.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

    var renderbuffer = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER, renderbuffer);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, rttFramebuffer.width, rttFramebuffer.height);

    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, rttTexture, 0);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, renderbuffer);

    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindRenderbuffer(gl.RENDERBUFFER, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
}

var mvMatrix = mat4.create();
var mvMatrixStack = [];
var pMatrix = mat4.create();

function mvPushMatrix() {
    var copy = mat4.create();
    mat4.set(mvMatrix, copy);
    mvMatrixStack.push(copy);
}

function mvPopMatrix() {
    if (mvMatrixStack.length == 0) {
        throw "Invalid popMatrix!";
    }
    mvMatrix = mvMatrixStack.pop();
}


function setMatrixUniforms() {
    gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
    gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
}


function degToRad(degrees) {
    return degrees * Math.PI / 180;
}


var currentlyPressedKeys = {};

function handleKeyDown(event) {
    currentlyPressedKeys[event.keyCode] = true;
}


function handleKeyUp(event) {
    currentlyPressedKeys[event.keyCode] = false;
}


var zoom = -15;


var tilt = 90;
var spin = 0;
var th = 0;


function handleKeys() {
    if (currentlyPressedKeys[33]) {
        // Page Up
        zoom -= 0.5;
    }
    if (currentlyPressedKeys[34]) {
        // Page Down
        zoom += 0.5;
    }
    if (currentlyPressedKeys[38]) {
        // Up cursor key
        tilt += 2;
    }
    if (currentlyPressedKeys[40]) {
        // Down cursor key
        tilt -= 2;
    }
    if (currentlyPressedKeys[37]) {
        // Left cursor key
        th -= 2;
    }
    if (currentlyPressedKeys[39]) {
        // Right cursor key
        th += 2;
    }
}


var starVertexPositionBuffer;
var starVertexTextureCoordBuffer;

function initBuffers() {
    starVertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, starVertexPositionBuffer);
    vertices = [
        // Front face
        -1.0, -1.0,  1.0,
         1.0, -1.0,  1.0,
         1.0,  1.0,  1.0,
        -1.0,  1.0,  1.0,
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    starVertexPositionBuffer.itemSize = 3;
    starVertexPositionBuffer.numItems = 4;
    starVertexPositionBuffer.numItems = 4;

    starVertexTextureCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, starVertexTextureCoordBuffer);
    var textureCoords = [
        // Front face
        0.0, 0.0,
        1.0, 0.0,
        1.0, 1.0,
        0.0, 1.0,
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoords), gl.STATIC_DRAW);
    starVertexTextureCoordBuffer.itemSize = 2;
    starVertexTextureCoordBuffer.numItems = 4;

    starVertexIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, starVertexIndexBuffer);
    var starVertexIndices = [
        0, 1, 2,      0, 2, 3,    // Front face
    ];
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(starVertexIndices), gl.STATIC_DRAW);
    starVertexIndexBuffer.itemSize = 1;
    starVertexIndexBuffer.numItems = 6;

    //--------------------------------------------------------------------------------------------
    //------------------------------Screen Render Buffers-----------------------------------------
    //--------------------------------------------------------------------------------------------

    screenVertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, screenVertexPositionBuffer);
    vertices = [
        // Front face
        -1.0, -1.0,  0.0,
         1.0, -1.0,  0.0,
        -1.0,  1.0,  0.0,
        -1.0,  1.0,  0.0,
         1.0, -1.0,  0.0,
         1.0,  1.0,  0.0
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    screenVertexPositionBuffer.itemSize = 3;
    screenVertexPositionBuffer.numItems = 6;
    screenVertexPositionBuffer.numItems = 6;

    screenVertexTextureCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, screenVertexTextureCoordBuffer);
    textureCoords = [
        // Front face
        0.0, 0.0,
        1.0, 0.0,
        0.0, 1.0,
        0.0, 1.0,
        1.0, 0.0,
        1.0, 1.0
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoords), gl.STATIC_DRAW);
    screenVertexTextureCoordBuffer.itemSize = 2;
    screenVertexTextureCoordBuffer.numItems = 6;
}


function drawStar() {
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, starTexture);
    gl.uniform1i(shaderProgram.samplerUniform, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, starVertexTextureCoordBuffer);
    gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, starVertexTextureCoordBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, starVertexPositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, starVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

    setMatrixUniforms();
    gl.drawElements(gl.TRIANGLES, starVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
}


function renderBufferToScreen() {
    gl.useProgram(shaderToScreenProgram);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.bindTexture(gl.TEXTURE_2D, rttTexture);
    gl.uniform1i(shaderToScreenProgram.samplerUniform, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, screenVertexTextureCoordBuffer);
    gl.vertexAttribPointer(shaderToScreenProgram.textureCoordAttribute, screenVertexTextureCoordBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, screenVertexPositionBuffer);
    gl.vertexAttribPointer(shaderToScreenProgram.vertexPositionAttribute, screenVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.drawArrays(gl.TRIANGLES, 0, screenVertexPositionBuffer.numItems);
}

function bindSettings() {
    gl.uniform1f(shaderToScreenProgram.rSensUniform ,$('#rSens').val()/100);
    gl.uniform1f(shaderToScreenProgram.gSensUniform ,$('#gSens').val()/100);
    gl.uniform1f(shaderToScreenProgram.bSensUniform ,$('#bSens').val()/100);
}



function Star(velocity, rotationSpeed) {
    this.angle = 0;
    this.vel = velocity;
    this.rotationSpeed = rotationSpeed;
    this.x = 0;
    this.y = 0;
    this.z = 0;

    // Set the colors to a starting value.
    this.randomiseColors();
}

Star.prototype.draw = function (th, tilt, spin) {
    mvPushMatrix();

    // Move to the star's position
    mat4.rotate(mvMatrix, degToRad(this.angle), [0.0, 1.0, 0.0]);
    mat4.translate(mvMatrix, [this.x, this.y, this.z]);

    // Rotate back so that the star is facing the viewer
    mat4.rotate(mvMatrix, degToRad(-this.angle), [0.0, 1.0, 0.0]);
    mat4.rotate(mvMatrix, degToRad(-tilt), [1.0, 0.0, 0.0]);
    mat4.rotate(mvMatrix, degToRad(th), [0.0, 0.0, 1.0]);

    mat4.rotate(mvMatrix, 1.0, [this.r, this.g, this.b]);
    
    // Draw a non-rotating star in the alternate "twinkling" color
    gl.uniform3f(shaderProgram.colorUniform, this.twinkleR, this.twinkleG, this.twinkleB);
    drawStar();

    // All stars spin around the Z axis at the same rate
    mat4.rotate(mvMatrix, degToRad(spin), [0.0, 0.0, 1.0]);

    // Draw the star in its main color
    gl.uniform3f(shaderProgram.colorUniform, this.r, this.g, this.b);
    drawStar()

    mvPopMatrix();
};


var effectiveFPMS = 60 / 1000;
Star.prototype.animate = function (elapsedTime) {
    this.angle += this.rotationSpeed * effectiveFPMS * elapsedTime;
    // this.vel = Math.sin(elapsedTime*effectiveFPMS/1000.0)/this.vel;

    // this.vel -= 0.01 * effectiveFPMS * elapsedTime;

    var v = Math.sin(this.vel/10.0);

    this.x = this.x+Math.sin(this.vel/10.0-this.x/30.0)
    this.y = this.y+v;
    this.z = this.z+v;
    if(this.z > 20.0 || this.z < -20.0){
        this.z = -this.z
    }
    if(this.y > 20.0 || this.y < -20.0){
        this.y = -this.y
    }

};


Star.prototype.randomiseColors = function () {
    // Give the star a random color for normal
    // circumstances...
    this.r = Math.random();
    this.g = Math.random();
    this.b = Math.random();

    // When the star is twinkling, we draw it twice, once
    // in the color below (not spinning) and then once in the
    // main color defined above.
    this.twinkleR = Math.random();
    this.twinkleG = Math.random();
    this.twinkleB = Math.random();
};



var stars = [];

function initWorldObjects() {
    var numStars = 1024;

    stars.push(new Star((3 / numStars) * 5.0, 0));

    for (var i=1; i < numStars; i++) {
        stars.push(new Star((i / numStars) * 5.0, i / numStars));
    }
}


function drawScene() {
    gl.bindFramebuffer(gl.FRAMEBUFFER, rttFramebuffer);

    gl.useProgram(shaderProgram);

    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    mat4.perspective(45, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0, pMatrix);

    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
    gl.enable(gl.BLEND);

    mat4.identity(mvMatrix);
    mat4.translate(mvMatrix, [0.0, 0.0, zoom]);
    mat4.rotate(mvMatrix, degToRad(th), [0.0, 1.0, 0.0]);
    mat4.rotate(mvMatrix, degToRad(tilt), [1.0, 0.0, 0.0]);

    for (var i in stars) {
        stars[i].draw(th, tilt, spin);
        spin += 0.5;
    }

    gl.uniform1i(shaderProgram.samplerUniform, 0);
    setMatrixUniforms();
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

}


var lastTime = 0;

function animate() {
    var timeNow = new Date().getTime();
    var freqByteData = new Uint8Array(analyser.frequencyBinCount);
    var amplitude = 0;
    // Copy the frequency data into our new array
    analyser.getByteFrequencyData(freqByteData);
    // analyser.getByteTimeDomainData(amplitude);
    for (var i = 0; i < freqByteData.length; i++) {
        amplitude = amplitude + freqByteData[i];
    }
    amplitude = (amplitude/freqByteData.length)/((($('#tSens').val()+40)*10))
    console.log(amplitude);
    gl.uniform1f(shaderToScreenProgram.amplitudeUniform ,amplitude)
    if (lastTime != 0) {
        var elapsed = timeNow - lastTime;

        for (var i in stars) {
            stars[i].animate(elapsed);
            stars[i].r = freqByteData[i%256]/1024;
            stars[i].g = freqByteData[i%256+256]/1024;
            stars[i].b = freqByteData[i%256+512]/1024;
            stars[i].twinkleR = freqByteData[i%256]/1024;
            stars[i].twinkleG = freqByteData[i%256+256]/1024;
            stars[i].twinkleB = freqByteData[i%256+512]/1024;
        }
    }
    lastTime = timeNow;

}


function tick() {
    requestAnimFrame(tick);
    handleKeys();
    drawScene();
    renderBufferToScreen();
    bindSettings();
    animate();
    stats.update();
}

var analyser;
var canvas, canvasContext;
var source;
var audioContext;

function startWebAudio() {
    // Get our <audio> element
    var audio = document.getElementById('music');
    // Create a new audio context (that allows us to do all the Web Audio stuff)
    audioContext = new webkitAudioContext();
    // Create a new analyser
    analyser = audioContext.createAnalyser();
    // Create a new audio source from the <audio> element
    source = audioContext.createMediaElementSource(audio);
    // Connect up the output from the audio source to the input of the analyser
    source.connect(analyser);
    // Connect up the audio output of the analyser to the audioContext destination i.e. the speakers (The analyser takes the output of the <audio> element and swallows it. If we want to hear the sound of the <audio> element then we need to re-route the analyser's output to the speakers)
    analyser.connect(audioContext.destination);

    // Get the <audio> element started  
    audio.play();
    var freqByteData = new Uint8Array(analyser.frequencyBinCount);
}

var currentTrackNum = 0;

function getTracks(){
    $.get("http://api.soundcloud.com/tracks?client_id=4c6187aeda01c8ad86e556555621074f", {downloadable: true},
    function(data) {
        var download_url = "";
        var rawTracks = $($(data).context.firstChild).find("track");
        var downloadableTracks = [];
        for (var i = rawTracks.length - 1; i >= 0; i--) {
            if($(rawTracks[i]).find("downloadable").text() == "true"){
                var trackData = {}
                trackData["title"] = $(rawTracks[i]).find("title").text();
                trackData["download"] = $(rawTracks[i]).find("download-url").text();
                downloadableTracks.push(trackData);
            }
        };
        $('#tracks').data("tracks", downloadableTracks);
    });
}
var audio;
function loadSong(url) {
    if (audio) audio.remove();
    if (source) source.disconnect();
    audio = new Audio();
    audio.src = url;
    audio.addEventListener("canplay", function(e) {
        analyser = (analyser || audioContext.createAnalyser());

        source = audioContext.createMediaElementSource(audio);
        source.connect(analyser);
        source.connect(audioContext.destination);
        audio.play();
    }, false);
}

function setTrack(trackNum) {
    var tracks = $("#tracks").data("tracks")
    var currentTrack = tracks[parseInt(trackNum)%tracks.length];
    $("#music").attr("src", currentTrack["download"].toString() + "?client_id=4c6187aeda01c8ad86e556555621074f");
    $("#songTitle").text(currentTrack["title"]);
    setTimeout(function(){startWebAudio(); $('#music').trigger("play");}, 4000)
}

function bindClickEvents(){
    $('#next').click(
        function(e){
            e.preventDefault();
            currentTrackNum = currentTrackNum + 1;
            var tracks = $("#tracks").data("tracks")
            var currentTrack = tracks[parseInt(currentTrackNum)%tracks.length];
            var self = this;
            $("#songTitle").text(currentTrack["title"]);
            var path = currentTrack["download"].toString() + '?client_id=4c6187aeda01c8ad86e556555621074f';
            loadSong(path);
        }
    );
    $('#back').click(
        function(e){
            e.preventDefault();
            currentTrackNum = currentTrackNum - 1;
            var tracks = $("#tracks").data("tracks")
            var currentTrack = tracks[parseInt(currentTrackNum)%tracks.length];
            var self = this;
            $("#songTitle").text(currentTrack["title"]);
            var path = currentTrack["download"].toString() + '?client_id=4c6187aeda01c8ad86e556555621074f';
            loadSong(path);
        }
    );
    $('.suggestion').click(
        function(e){
            e.preventDefault();
            var self = this;
            $("#songTitle").text($(self).data().title);
            var path = $(this).data().dl;
            loadSong(path);
        }
    );
}


function webGLStart() {
    var canvas = document.getElementById("visualizer");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    getTracks();
    setTimeout(function(){setTrack(0);}, 3000);
    bindClickEvents();

    initGL(canvas);
    initTextureFrameBuffer();
    initShaders();
    initBuffers();
    initTexture();
    initWorldObjects();

    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    document.onkeydown = handleKeyDown;
    document.onkeyup = handleKeyUp;
    
    stats = new Stats();
    stats.setMode(1);
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.left = '0px';
    stats.domElement.style.top = '0px';
    document.body.appendChild( stats.domElement );

    tick();
}