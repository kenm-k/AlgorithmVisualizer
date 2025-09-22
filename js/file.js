//ファイル読み込みに際する処理
$(function(){

    let reader;

    function onChange(event) {
        reader.readAsText(event.target.files[0]);
    }

    function onLoad(event) {
        graph = JSON.parse(event.target.result);
        console.log(graph);

        numberOfFrame = graph["graphs"].length;
        document.getElementById("numberOfFrame").textContent = numberOfFrame;
        let frameInput = document.getElementById("frame");
        frameInput.min = 1;
        frameInput.max = numberOfFrame;
        frameInput.value = 1;

        init();
    }

    reader = new FileReader();
    reader.onload = onLoad;

    $('input[type="file"]').on('change', onChange);
});

let stream;
let recorder;

function processMediaWhenStop(stream, onStop) {
  const mime = MediaRecorder.isTypeSupported("video/webm; codecs=vp9") ? "video/webm; codecs=vp9" : "video/webm";
  const mediaRecorder = new MediaRecorder(stream, { mimeType: mime })
  // start record
  const chunks = []
  mediaRecorder.addEventListener('dataavailable', e => chunks.push(e.data))

  // call on stop callback
  mediaRecorder.addEventListener('stop', async () => {
    const blob = new Blob(chunks, { type: chunks[0].type })
    await onStop(blob)
  })

  return mediaRecorder
}

function downloadWebm(blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'video.webm';
  a.click();
}

let recording = false;

function startRecord()
{
    recording = true;
    stream = document.querySelector('canvas').captureStream();
    recorder = processMediaWhenStop(stream, downloadWebm);
    recorder.start(); // 録画開始
}

function stopRecord()
{
    recorder?.stop();
    recording = false;
}