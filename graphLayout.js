var tdistBNodes = 50;
var ttreeDeepest = 0;
var tmode = "default";

//参考 : https://www.slideshare.net/slideshow/drawing-tree-algorithms/33708903#17
function tilford_raingold()
{
    var root = document.getElementById("ttreeRoot").value;
    tdistBNodes = document.getElementById("tdistBNodes").valueAsNumber;

    tmode = document.getElementById("tmode").value;

    ttreeDeepest = culcTreeDepth(root, 0);

    tilford_raingold_sub(root, 0, 0);

    drawRect();
}

//xpos ... その木で、postorderで一番最初にでてくる葉のx座標
//なので、x=0となる基準は、木全体の一番左の葉
function tilford_raingold_sub(v, xpos, depth)
{
    //デフォルトの挙動
    objY[v] = depth*(radius*2 + tdistBNodes);

    var childs = currentGraph["graph"][v]["vertices"];
    if (childs.length == 0)
    {
        switch(tmode)
        {
            case "fractal":
                objY[v] = 0;
                break;
        }

        objX[v] = xpos;
        return [xpos, xpos, 0];
    }

    var pos = xpos;

    //vを親とする木における左端
    var l = Number.MAX_VALUE;
    //同様に、右端
    var r = -Number.MAX_VALUE;

    var h = Number.MAX_VALUE;

    for (var u of childs)
    {
        var ret = tilford_raingold_sub(u, pos, depth+1);

        //子要素を左に詰める
        pos = ret[1] + 2*radius + tdistBNodes;
        
        l = Math.min(l, ret[0]);
        r = Math.max(r, ret[1]);
        h = Math.min(h, ret[2]);
    }

    //親の位置は子要素の中央
    objX[v] = (l+r)/2;
    
    switch (tmode)
    {
        //自己相似にする
        case "fractal":
            objY[v] = -2*h-(radius*2 + tdistBNodes);
            break;
    }

    //左端と右端を返す
    return [l, r, -objY[v]];
}

function culcTreeDepth(u, depth)
{
    var cdepth = depth;
    var childs = currentGraph["graph"][u]["vertices"];
    for (var v of childs)
    {
        cdepth = Math.max(cdepth, culcTreeDepth(v, depth+1));
    }
    return cdepth;
}