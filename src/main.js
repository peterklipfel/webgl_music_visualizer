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
        zoom -= 0.1;
    }
    if (currentlyPressedKeys[34]) {
        // Page Down
        zoom += 0.1;
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
    // gl.drawArrays(gl.TRIANGLE_STRIP, 0, starVertexPositionBuffer.numItems);
    gl.drawElements(gl.TRIANGLES, starVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
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

}


var lastTime = 0;

function animate() {
    var timeNow = new Date().getTime();
    var freqByteData = new Uint8Array(analyser.frequencyBinCount);
    // var amplitude = 0;
    // Copy the frequency data into our new array
    analyser.getByteFrequencyData(freqByteData);
    // for (var i = 0; i < freqByteData.length; i++) {
    //     amplitude = amplitude + freqByteData[i];
    // }
    // amplitude = amplitude/(freqByteData.length*256);
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
    animate();
    stats.update();
}

var analyser, canvas, canvasContext;


function startWebAudio() {
    // Get our <audio> element
    var audio = document.getElementById('music');
    // Create a new audio context (that allows us to do all the Web Audio stuff)
    var audioContext = new webkitAudioContext();
    // Create a new analyser
    analyser = audioContext.createAnalyser();
    // Create a new audio source from the <audio> element
    var source = audioContext.createMediaElementSource(audio);
    // Connect up the output from the audio source to the input of the analyser
    source.connect(analyser);
    // Connect up the audio output of the analyser to the audioContext destination i.e. the speakers (The analyser takes the output of the <audio> element and swallows it. If we want to hear the sound of the <audio> element then we need to re-route the analyser's output to the speakers)
    analyser.connect(audioContext.destination);

    // Get the <audio> element started  
    audio.play();
}

function setTrack() {
     $.get("http://api.soundcloud.com/tracks?client_id=4c6187aeda01c8ad86e556555621074f", {downloadable: true}, 
    function(data) {
        var download_url = "";
        var tracks = $($(data).context.firstChild).find("track");
        // console.log($($(data).context.firstChild).find("track").first().find("downloadable").text())
        for (var i = tracks.length - 1; i >= 0; i--) {
            if($(tracks[i]).find("downloadable").text() == "true"){
                console.log("downloadable? " + $(tracks[i]).find("downloadable").text());
                download_url = $(tracks[i]).find("download-url").text();
                console.log(download_url);
                $("#music").attr("src", download_url+"?client_id=4c6187aeda01c8ad86e556555621074f");
                break;
            }
        };
    });
}


function webGLStart() {
    var canvas = document.getElementById("visualizer");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    setTrack();

    initGL(canvas);
    initShaders();
    initBuffers();
    initTexture();
    initWorldObjects();

    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    document.onkeydown = handleKeyDown;
    document.onkeyup = handleKeyUp;
    
    setTimeout(function(){startWebAudio(); $('#music').trigger("play"); console.log('started');}, 3000);
    
    stats = new Stats();
    stats.setMode(1);
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.left = '0px';
    stats.domElement.style.top = '0px';
    document.body.appendChild( stats.domElement );

    tick();
}