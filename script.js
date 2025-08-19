var graph;

$(function(){

    var reader;

    function onChange(event) {
        reader.readAsText(event.target.files[0]);
    }

    function onLoad(event) {
        graph = JSON.parse(event.target.result);
        console.log(graph);

        numberOfFrame = graph["graphs"].length;
        document.getElementById("numberOfFrame").textContent = numberOfFrame;
        var frameInput = document.getElementById("frame");
        frameInput.min = 1;
        frameInput.max = numberOfFrame;
        frameInput.value = 1;

        graphUpdate();

        init();
    }

    reader = new FileReader();
    reader.onload = onLoad;

    $('input[type="file"]').on('change', onChange);
});

var canvas = document.getElementById("canvas");
var context = canvas.getContext('2d');

var count;
var frame, numberOfFrame;

var ux = 0, uy = 0;
var prex, prey;

var x, y, relX, relY, objX, objY;
var fpoint;
var radius = 25;
var dragging = false;
var draggingId = -1;
var stopFlag = false;
var isPlaying = false;

var currentGraph;

//2倍したら大きさ2倍！
var scale = 1.0;
var scalingPivotX = 0, scalingPivotY = 0;

var arrowHeadWidth = 15, arrowHeadHeight = 10, arrowWidth = 5;

function init() {
    ux = 0;
    uy = 0;
    scale = 1.0;

    count = graph["vertices"].length;
    frame = 0;

    objX = new Array(count);
    objY = new Array(count);

    for (let i = 0; i < count; i++)
    {
        objX[i] = (radius*(1 + i*2)) % canvas.width;
        objY[i] = radius*(1 + 2*Math.floor((radius*(1+i*2))/canvas.width)) % canvas.height;
    }

    fpoint = 24;
    context.font = fpoint + "px serif";
    context.textAlign = "center";

    drawRect();
}

function graphUpdate()
{
    frame = document.getElementById("frame").value - 1;
    currentGraph = graph["graphs"][frame];
}

document.getElementById("frame").addEventListener("change", ()=>{
    graphUpdate();
    drawRect();
}, false);

function onDown(e) {
    var offsetX = canvas.getBoundingClientRect().left;
    var offsetY = canvas.getBoundingClientRect().top;

    x = e.clientX - offsetX;
    y = e.clientY - offsetY;

    draggingId = -1;

    for (let i = 0; i < count; i++)
        if ((x/scale - (objX[i]-ux))**2 + ((y/scale - (objY[i]-uy)))**2 < radius**2) {
            dragging = true;
            draggingId = i;
            relX = objX[i] - x/scale;
            relY = objY[i] - y/scale;
            return;
        }
    
    if (draggingId == -1)
    {
        var offsetX = canvas.getBoundingClientRect().left;
        var offsetY = canvas.getBoundingClientRect().top;
        dragging = true;
        prex = e.clientX - offsetX, prey = e.clientY - offsetY;
        prex /= scale;
        prey /= scale;
    }
}

function onMove(e) {
    var offsetX = canvas.getBoundingClientRect().left;
    var offsetY = canvas.getBoundingClientRect().top;

    x = e.clientX - offsetX;
    y = e.clientY - offsetY;

    x /= scale;
    y /= scale;

    if (dragging) {
        if (draggingId == -1)
        {
            ux -= x - prex;
            uy -= y - prey;

            drawRect();

            prex = x;
            prey = y;
        }
        else
        {
            objX[draggingId] = x + relX;
            objY[draggingId] = y + relY;
            drawRect();
        }
    }
}

function onUp(e) {
    dragging = false;
}

function drawRect() {
    context.font = fpoint*scale + "px serif";
    context.textAlign = "center";

    context.clearRect(0, 0, canvas.width, canvas.height);
    drawEdge();

    var drx, dry;

    for (let i = 0; i < count; i++)
    {
        context.beginPath();

        drx = (objX[i]-ux)*scale;
        dry = (objY[i]-uy)*scale;

        context.moveTo(drx + radius*scale, dry);
        context.arc( drx, dry, radius*scale, 0, 2*Math.PI, true);
        //context.fillStyle = "white";
        context.fillStyle = "#" + currentGraph["graph"][i]["color"].toString(16);
        context.fill();

        drx = (objX[i] - ux)*scale;
        dry = (objY[i] - uy + fpoint/2)*scale;

        context.moveTo( drx, dry );
        context.fillStyle = "black";
        context.fillText(currentGraph["graph"][i]["label"], drx, dry);
    }
}

//Undirected Graph
function drawUDEdge()
{
    frame = document.getElementById("frame").value - 1;
    context.beginPath();
    for (var u of currentGraph["graph"])
    {
        for (var v of u["vertices"])
        {
            context.moveTo( (objX[u["number"]] - ux)*scale , (objY[u["number"]] - uy)*scale );
            context.lineTo( (objX[v] - ux)*scale , (objY[v] - uy)*scale );
        }
    }
    context.stroke();
}

function drawEdge()
{
    context.fillStyle = "black";
    for (var u of currentGraph["graph"])
    {
        for (var v of u["vertices"])
        {
            var dist = Math.sqrt((objX[v]-objX[u["number"]])**2 + (objY[v]-objY[u["number"]])**2);
            var dx = radius * ((objX[v]-objX[u["number"]])/dist);
            var dy = radius * ((objY[v]-objY[u["number"]])/dist);

            context.beginPath();
            context.arrow( (objX[u["number"]] - ux)*scale, (objY[u["number"]] - uy)*scale, (objX[v] - ux - dx)*scale, (objY[v] - uy - dy)*scale, [0, arrowWidth/2*scale, -arrowHeadHeight*scale, arrowWidth/2*scale, -arrowHeadHeight*scale, arrowHeadWidth/2*scale]);
            context.fill();
        }
    }
}

function convert()
{
    graph["drawing_mode"] = "positioned layout";
    graph["position"] = new Array();
    for (let i = 0; i < count; i++)
        graph["position"].push({"number":i, "pos":[objX[i]/canvas.width, objY[i]/canvas.height]});

    const blob = new Blob([JSON.stringify(graph)], { type: 'application/json' });
    const url = (window.URL || window.webkitURL).createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'positioned_graph.json';
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
}

canvas.addEventListener('mousedown', onDown, false);
canvas.addEventListener('mousemove', onMove, false);
canvas.addEventListener('mouseup', onUp, false);

canvas.addEventListener('wheel', (e)=>{

    e.preventDefault();
    var oldScale = scale;
    scale += e.deltaY * -0.001;

    if (scale < 0.01 || scale > 10) scale = oldScale;

    var offsetX = canvas.getBoundingClientRect().left;
    var offsetY = canvas.getBoundingClientRect().top;

    var mx = e.clientX - offsetX;
    var my = e.clientY - offsetY;

    ux += mx*(1/oldScale - 1/scale);
    uy += my*(1/oldScale - 1/scale);

    drawRect();

}, false);

const sleep = (time) => new Promise((resolve) => setTimeout(resolve, time));

async function playAnim()
{
    document.getElementById("animState").textContent = "⏸";
    isPlaying = true;
    frameInput = document.getElementById("frame");
    stopFlag = false;
    for (let i = frameInput.value; !stopFlag && i < numberOfFrame; frameInput.value = ++i)
    {
        graphUpdate();
        drawRect();
        await sleep(1000);
    }
    graphUpdate();
    drawRect();
    isPlaying = false;
    stopFlag = false;
    document.getElementById("animState").textContent = "▶";
}

function resetPos()
{
    ux = uy = 0;
    scale = 1;

    drawRect();
}