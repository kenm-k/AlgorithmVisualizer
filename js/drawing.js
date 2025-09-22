function init() {
    count = graph["vertices"].length;
    setFrame(0);
    setFig(fpInterval);

    gObjects = new Array();
    let nodes = new Array(count);

    for (let i = 0; i < count; i++)
    {
        nodes[i] =  new Node((defaultRadius*(1 + i*2)) % canvas.width, defaultRadius*(1 + 2*Math.floor((defaultRadius*(1+i*2))/canvas.width)) % canvas.height, i);
        gObjects.push(nodes[i]);
    }

    let dt = new DTree( 0, 0, nodes, graph );
    dt.logger = new Text();
    gObjects.push(dt.logger);

    gObjects.push( dt );

    updateGMan();

    fpoint = 24;
    context.font = fpoint + "px serif";
    context.textAlign = "center";

    draw();
    
    paramUpdate();

    dt.layout();
}

function draw(ratio=fig/fpInterval) {
    context.clearRect(0, 0, canvas.width, canvas.height);
    drawGrid();

    if (gObjects != null)
    {
        updateGObjects(frame);
        for (let i = 0; i < gObjects.length; i++)
        {
            gObjects[i].draw(ratio);
        }
    }
}

function resetGraph()
{
    setFrame(0);
    setFig(fpInterval);
    paramUpdate();
}

function paramUpdate()
{
    updateGObjects();
    graphInterval_ms = document.getElementById("frameInterval_ms").valueAsNumber;
    fpInterval   = document.getElementById("fps").valueAsNumber * (graphInterval_ms / 1000);
    
    let flooredInterval = Math.floor(fpInterval);

    //document.getElementById("fig").value = flooredInterval;
    frame = document.getElementById("frame").valueAsNumber-1;
    fig   = document.getElementById("fig").valueAsNumber;
    document.getElementById("fig").max = flooredInterval;
    document.getElementById("numberOfFig").textContent = flooredInterval;

    draw();
}

function updateGObjects(mframe = frame)
{
    for (let gObject of gObjects)
    {
        gObject.update(mframe);
    }
}

setFig(1);
setFrame(0);