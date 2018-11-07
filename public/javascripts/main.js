let width = 640    // We will scale the photo width to this
let height = 0     // This will be computed based on the input stream

let streaming = false

let video = null
let canvas = null
let photo = null
let startbutton = null
let constrains = { video: true, audio: false }

/**
 * ユーザーのデバイスによるカメラ表示を開始し、
 * 各ボタンの挙動を設定する
 *
 */
function startup() {
    video = document.getElementById('video')
    canvas = document.getElementById('canvas')
    photo = document.getElementById('photo')
    videoStart()

    video.addEventListener('canplay', function (ev) {
        if (!streaming) {
            witdh = video.videoWidth;
            height = video.videoHeight
            // height = video.videoHeight / (video.videoWidth / width)

            video.setAttribute('width', width)
            video.setAttribute('height', height)
            canvas.setAttribute('width', width)
            canvas.setAttribute('height', height)
            streaming = true
        }
    }, false)
    clearphoto();
}

function dataURItoBlob(dataURI) {
    // convert base64/URLEncoded data component to raw binary data held in a string
    var byteString;
    if (dataURI.split(',')[0].indexOf('base64') >= 0)
        byteString = atob(dataURI.split(',')[1]);
    else
        byteString = unescape(dataURI.split(',')[1]);

    // separate out the mime component
    var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];

    // write the bytes of the string to a typed array
    var ia = new Uint8Array(byteString.length);
    for (var i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }

    return new Blob([ia], { type: mimeString });
}

/**
 * カメラ操作を開始する
 */
function videoStart() {
    streaming = false
    navigator.mediaDevices.getUserMedia(constrains)
        .then(function (stream) {
            video.srcObject = stream
            video.play()
        })
        .catch(function (err) {
            console.log("An error occured! " + err)
        })
}
/**
 * canvasの写真領域を初期化する
 */
function clearphoto() {
    let context = canvas.getContext('2d')
    context.fillStyle = "#AAA"
    context.fillRect(0, 0, canvas.width, canvas.height)
}

/**
 * カメラに表示されている現在の状況を撮影する
 */
function takepicture() {
    let context = canvas.getContext('2d')
    if (width && height) {
        canvas.width = width
        canvas.height = height
        context.drawImage(video, 0, 0, width, height)
        $('#result').text('');
        send()
    } else {
        clearphoto()
    }
}
function send() {
    var dataURL = canvas.toDataURL('image/png');
    var blob = dataURItoBlob(dataURL);
    var multipart = new FormData();
    multipart.append('thumbnail', blob);
    $.ajax('/upload', {
        method: 'POST',
        data: multipart,
        processData: false,
        contentType: false,
    }).then(res => {
        console.log(res[0]);
        var resString = JSON.stringify(res[0]);
        // $('#result').text(resString);
        var faceResult = res[0];
        var emotion = faceResult.faceAttributes.emotion;

        if (emotion.happiness < 0.1 && emotion.neutral < 0.999) {
            console.log("unhappiness");
            playunhappy();
            $('#character').attr('src', 'public/images/aoi/sad/open/e.png'); 
            setTimeout(function(){
                $('#discount-title').text("割引");
                $('#discount').text('-50%');
                var subtotal = $('#subtotal').text();
                subtotal = parseInt(subtotal.replace(/[^0-9]/g, ""));
                subtotal *= 0.5;
                $('#subtotal').text(subtotal);
                var total = Math.floor(subtotal * 1.08);
                $('#subtotal').text(total);
            }, 2900);
        }
        else if (0.8 < emotion.happiness) {
            console.log("happy");
            playhappy();
            $('#character').attr('src', 'images/aoi/happy/open/a.png'); 
        }
        else {
            console.log("neutral");
            playneutral();
            $('#character').attr('src', 'images/aoi/happy/open/a.png'); 
        }
    });
}

function speech(text) {
    var param = {
        text: 'text',
        speaker: 'hikari'
    }
    $.ajax('https://api.voicetext.jp/v1/tts', {
        method: 'POST',
        form: param,
        encoding: 'binary'
    }).then(res => {
        console.log(res);
    });
}

function playunhappy() {
    $("#voice-happy").get(0).pause();
    $("#voice-happy").get(0).currentTime = 0;
    $("#voice-neutral").get(0).pause();
    $("#voice-neutral").get(0).currentTime = 0;
    $("#voice-unhappy").get(0).play();
}
function playhappy() {
    $("#voice-unhappy").get(0).pause();
    $("#voice-unhappy").get(0).currentTime = 0;
    $("#voice-neutral").get(0).pause();
    $("#voice-neutral").get(0).currentTime = 0;
    $("#voice-happy").get(0).play();
}

function playneutral() {
    $("#voice-unhappy").get(0).pause();
    $("#voice-unhappy").get(0).currentTime = 0;
    $("#voice-happy").get(0).pause();
    $("#voice-happy").get(0).currentTime = 0;
    $("#voice-neutral").get(0).play();
}

$('#treasurer').click(function(ev){
    $('.container-treasurer').css('display', 'none');
    $('.container-treasurer-back').css('display', 'none');
    $('.container-camera').css('display', 'none');
    takepicture();
    ev.preventDefault();
});

//$('#total')
