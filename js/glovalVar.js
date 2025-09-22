//canvas
let canvas = document.getElementById("canvas");
//canvasのcontext
let context = canvas.getContext('2d');

//数
let count = 0;
//現在のフレーム数、フレームの数
let frame, numberOfFrame;

//user座標、つまり、カメラの座標
let ux = -canvas.getBoundingClientRect().width/2, uy = -canvas.getBoundingClientRect().height/2;
//前のx, y
let prex, prey;

//グローバルx座標、グローバルy座標、マウスとの差分
let x, y, relX, relY;

//デフォルトの節の半径
let defaultRadius = 25;

//ドラッグ中か否か
let dragging = false;

//ドラッグしているGObjectのインデックス
let draggingId = -1;

let stopFlag = false;
let isPlaying = false;

let graph = null;
let fpInterval = 30;
let fig = fpInterval;
let graphInterval_ms = 1000;

//2倍したら大きさ2倍！
let scale = 1.0;

let resetFlag = true;