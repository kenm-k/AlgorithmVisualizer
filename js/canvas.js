let selectedGObj = -1;
//マウスが押される間
function onMove(e) {
    let offsetX = canvas.getBoundingClientRect().left;
    let offsetY = canvas.getBoundingClientRect().top;

    x = e.clientX - offsetX;
    y = e.clientY - offsetY;

    x /= scale;
    y /= scale;

    if (dragging) {
        if (draggingId == -1)
        {
            ux -= x - prex;
            uy -= y - prey;

            draw();

            prex = x;
            prey = y;
        }
        else
        {
            GManager_proxy[draggingId].x = x + relX;
            GManager_proxy[draggingId].y = y + relY;
            draw();
        }
    }
}

//マウスが押された瞬間
function onDown(e) {
    let offsetX = canvas.getBoundingClientRect().left;
    let offsetY = canvas.getBoundingClientRect().top;

    x = e.clientX - offsetX;
    y = e.clientY - offsetY;

    draggingId = -1;

    //いずれかのGObjectにふれるまで
    if (gObjects != null)
    for (let i = 0; i < gObjects.length; i++)
        if (gObjects[i].isOver(x, y))
        {
            if (!gObjects[i].fixed)
            {
                dragging = true;
                draggingId = i;
                relX = GManager_proxy[i].x - x/scale;
                relY = GManager_proxy[i].y - y/scale;
            }

            if (selectedGObj == i) selectedGObj = -1;
            selectedGObj = i;
            updateGMan();

            return;
        }
    
    //GObjectを動かさなかった
    if (draggingId == -1)
    {
        let offsetX = canvas.getBoundingClientRect().left;
        let offsetY = canvas.getBoundingClientRect().top;
        dragging = true;
        prex = e.clientX - offsetX, prey = e.clientY - offsetY;
        prex /= scale;
        prey /= scale;
    }
}

//マウスが離された瞬間
function onUp(e) {
    dragging = false;
}

//EventListenerに追加
canvas.addEventListener('mousedown', onDown, false);
canvas.addEventListener('mousemove', onMove, false);
canvas.addEventListener('mouseup', onUp, false);

//マウスホイールが回った
canvas.addEventListener('wheel', (e)=>{

    //既存のマウスホイールの機能を防ぐ
    e.preventDefault();

    //変更前のスケールを保持
    let oldScale = scale;
    //ホイールの回転の分拡大・縮小
    scale += e.deltaY * -0.001;

    //拡大率は0.01倍以上10倍以下に留める
    if (scale < 0.01 || scale > 10) scale = oldScale;

    //canvasの左端
    let offsetX = canvas.getBoundingClientRect().left;
    //canvasの右端
    let offsetY = canvas.getBoundingClientRect().top;

    //マウスのx座標
    let mx = e.clientX - offsetX;
    //マウスのy座標
    let my = e.clientY - offsetY;

    //現在のuser座標(グローバル座標)に、差分を適用。これにより、ズレを無くす
    ux += mx*(1/oldScale - 1/scale);
    uy += my*(1/oldScale - 1/scale);

    draw();

}, false);

function resetPos()
{
    ux = uy = 0;
    scale = 1;

    draw();
}

function drawGrid()
{
    const { width, height } = canvas.getBoundingClientRect();
    //エイリアス的な
    let ctx = context;

    //グリッドの間隔
    const step = 32*scale;
    
    //グリッドの左端・上端
    let dx = -(ux*scale)%step;
    let dy = -(uy*scale)%step;

    // 背景グリッド
    ctx.beginPath();
    for (let x = dx; x <= width; x += step) {
      ctx.moveTo(x, 0); ctx.lineTo(x, height);
    }
    for (let y = dy; y <= height; y += step) {
      ctx.moveTo(0, y); ctx.lineTo(width, y);
    }
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(0,0,0,.08)';
    ctx.stroke();
}