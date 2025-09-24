//canvas上のすべてのGObjectの配列
let gObjects = null;

class GObject
{
    x = 0;
    y = 0;
    color = "#000000";
    GObjID = -1;

    fixed = false;

    constructor(x = 0, y = 0)
    {
        this.x = x;
        this.y = y;
    }

    isOver(x, y)
    {
        return false;
    }

    update(frame) { return; }

    draw(ratio) { return; }

    getParam()
    {
        return [
            {mode: "details", text: "position"},
            {mode: "number", param: "x", default: this.x},
            {mode: "number", param: "y", default: this.y},
            {mode: "check", param: "fixed", checked: this.fixed},
            {mode: "/details"},
        ];
    }

    /**
     * 自分のメンバ変数への変更を、inputと同期させる。GManagerのための機能。
     * @param {number} gobjID gObjects配列での自分のインデックス
     * @param {string} params 同期させるメンバ変数。ただし、getParam()で指定していること。
     * @returns 
     */
    setProxy(gobjID, params)
    {
        this.GObjID = gobjID;
        const fixedGObjID = gobjID;
        const fixedParams = params;
        return new Proxy(this, {
                set(target, prop, value)
                {
                    target[prop] = value;
                    if (fixedParams.includes(prop))
                    {
                        let ele = document.getElementById(`GObj${fixedGObjID}_${prop}`);
                        if (ele != undefined)
                        {
                            if ("value" in ele)
                                ele.value = value; // inputに反映
                            if ("checked" in ele)
                                ele.checked = value;
                        }
                    }
                    return true;
                }
            });
    }

    /**
     * 自分のProxyを返す。ただし、setProxy()が実行されていること。
     * @returns 自分のProxy。
     */
    getProxy()
    {
        return GManager_proxy[this.GObjID];
    }
}

class Node extends GObject
{
    id = -1;
    radius = defaultRadius;

    dx = 0;
    dy = 0;

    constructor(ax, ay, aid)
    {
        super(ax, ay);
        this.id = aid;
    }

    isOver(ax, ay)
    {
        return ((ax/scale - (this.x-ux))**2 + ((ay/scale - (this.y-uy)))**2 < this.radius**2);
    }

    drawNode(currentGraph, pgraph)
    {
        let id = this.id;
        context.beginPath();
        let thisNode = currentGraph["graph"][id];

        thisNode["color"] ??= 0xFFFFFF;
        thisNode["label"] ??= id + pgraph["base"];

        let fpoint = Math.floor(this.radius/25*24);

        let drx = (this.x-ux)*scale;
        let dry = (this.y-uy)*scale;

        context.arc( drx, dry, this.radius*scale, 0, 2*Math.PI, true);
        context.fillStyle = "#" + thisNode["color"].toString(16).padStart(6, '0');
        context.fill();

        drx = (this.x - ux)*scale;
        dry = (this.y - uy + fpoint/2)*scale;

        context.moveTo( drx, dry );
        context.fillStyle = "black";
        context.font = fpoint*scale + "px serif";
        context.textAlign = "center";
        context.fillText(thisNode["label"], drx, dry);
    }

    getParam()
    {
        return super.getParam().concat(
            [
                {mode: "number", param: "radius", default: this.radius}
            ]
        );
    }
}

class Text extends GObject
{
    color = '#000000';
    point = 24;
    align = "center";
    font = "serif";
    text = "";

    constructor(text, x, y)
    {
        super(x, y);
        this.text = text;
    }

    //マウスの座標をグローバル座標で受け取る
    isOver(px, py)
    {
        let size = context.measureText(this.text);
        let sizex = size.width/scale;
        let asizey = size.fontBoundingBoxAscent/scale;
        let dsizey = size.fontBoundingBoxDescent/scale;

        [px, py] = MyMath.c2gPos(px, py);

        let res = ( this.x - sizex/2 < px && px < this.x + sizex/2 ) && ( this.y - asizey < py && py < this.y + dsizey );

        return res;
    }

    draw(ratio)
    {
        context.fillStyle = this.color;
        context.textAlign = this.align;
        context.font = this.point*scale + "px " + this.font;
        context.fillText(this.text, (this.x - ux)*scale, (this.y - uy)*scale);
    }

    getParam()
    {
        return super.getParam().concat(
            [
                {mode: "input",  type: "text", param: "text", default: this.text},
                {mode: "input",  type: "color", param: "color", default: this.color},
                {mode: "input",  type: "number", param: "point", default: this.point},
                {mode: "input",  type: "text", param: "align", default: this.align},
                {mode: "input",  type: "text", param: "font", default: this.font}
            ]
        );
    }
}

class Graph extends GObject
{
    nodse = null;
    graphs = null;
    currentGraph = null;
    layoutFunction = "fruchterman_raingold";
    distNodes = 50;
    fit = true;

    randomize = true;

    visualizeRange = false;

    rangeX = 1000;
    rangeY = 1000;

    interval = 1;

    iteration = 100;

    constant = 0.3;

    logger = null;

    /**
     * constructor
     * @param {number} x グラフのx座標
     * @param {number} y グラフのy座標
     * @param {Node[]} nodes Nodeクラスの配列
     * @param {JSON} graphs 出力されたjson
     */
    constructor(x, y, nodes, graphs)
    {
        super(x, y);
        this.nodes = nodes;
        this.graphs = graphs;
    }

    update(mframe)
    {
        this.currentGraph = this.graphs["graphs"][mframe];
        this.logger.getProxy().text = ("log" in this.currentGraph) ? this.currentGraph["log"] : "";
    }

    draw(ratio)
    {
        for (let node of this.nodes)
        {
            node.drawNode(this.currentGraph, this.graphs);
        }

        if (this.visualizeRange)
        {
            const W = this.rangeX;
            const L = this.rangeY;

            let pos;

            context.strokeStyle = "rgb(0, 0, 0)";
            context.lineWidth = 5;

            context.beginPath();
            pos = MyMath.g2cPos(this.x - W/2, this.y - L/2);
            context.moveTo(pos[0], pos[1]);
            pos = MyMath.g2cPos(this.x + W/2, this.y - L/2);
            context.lineTo(pos[0], pos[1]);
            pos = MyMath.g2cPos(this.x + W/2, this.y + L/2);
            context.lineTo(pos[0], pos[1]);
            pos = MyMath.g2cPos(this.x - W/2, this.y + L/2);
            context.lineTo(pos[0], pos[1]);
            pos = MyMath.g2cPos(this.x - W/2, this.y - L/2);
            context.lineTo(pos[0], pos[1]);
            context.stroke();
        }
    }

    getParam()
    {
        return super.getParam().concat(
            [
                {mode: "details", "text": "レイアウト"},
                    {mode:"select", options:[
                        {
                            text : "ランダム配置",
                            value: "random",
                        },
                        {
                            text : "Fruchterman-Reingoldのアルゴリズム",
                            value: "fruchterman_raingold",
                        }
                    ], param: "layoutFunction", id: "layoutFunction", default:this.layoutFunction},

                    {mode:"if-details", text: "Fruchterman-Reingoldのアルゴリズム", if: (g)=>{ return g.layoutFunction == "fruchterman_raingold"; }},
                        {mode:"number", param:"iteration", default:this.iteration},
                        {mode:"number", param:"constant", default:this.constant},
                        {mode:"number", param:"interval", default:this.interval},
                        {mode:"check", param:"fit", checked:this.fit},
                        {mode:"check", param:"randomize", checked: this.randomize},
                    {mode:"/details"},

                    {mode: "if-details", text: "範囲", if: (g)=>{ return g.layoutFunction == "fruchterman_raingold" || g.layoutFunction == "random"; }},
                        {mode:"number", param:"rangeX", default:this.rangeX},
                        {mode:"number", param:"rangeY", default:this.rangeY},
                        {mode:"check", param:"visualizeRange", default:this.visualizeRange},
                    {mode: "/details"},

                    {
                        mode:"button", text:"レイアウト", function: "$this.layout(); draw();", id: "layoutButton"
                    },
                    {mode:"number", param:"distNodes", default:this.distNodes},
                {mode: "/details"},
            ]
        );
    }

    layout()
    {
        layoutFunctions[this.layoutFunction](this);
    }
}

class DGraph extends Graph
{
    arrowHeadWidth = 15;
    arrowHeadHeight = 10;
    arrowWidth = 5;

    constructor(x, y, nodes, graphs)
    {
        super(x, y, nodes, graphs);
    }

    draw(ratio)
    {
        context.fillStyle = "black";
        let base = this.graphs["base"];
        for (let u of this.currentGraph["graph"])
        {
            for (let v of u["edges"])
            {
                let un = u["number"] - base;
                let vn = v["number"] - base;

                let dist = Math.sqrt((this.nodes[vn].x-this.nodes[un].x)**2 + (this.nodes[vn].y-this.nodes[un].y)**2);
                let dx = this.nodes[vn].radius * ((this.nodes[vn].x-this.nodes[un].x)/dist);
                let dy = this.nodes[vn].radius * ((this.nodes[vn].y-this.nodes[un].y)/dist);

                context.beginPath();

                v["animation"] ??= "";
                v["easing"] ??= "";
                v["color"] ??= 0;

                let ip = animateFunction[v["animation"]](this.nodes[un].x - ux + this.x, this.nodes[un].y - uy + this.y, this.nodes[vn].x - dx - ux + this.x, this.nodes[vn].y - dy - uy + this.y, easing[v["easing"]](ratio));

                context.arrow( (this.nodes[un].x - ux)*scale, (this.nodes[un].y - uy)*scale,
                    //終点のX座標
                    ip[0]*scale,
                    //終点のY座標
                    ip[1]*scale,
                    //矢印
                    [0, this.arrowWidth/2*scale, -this.arrowHeadHeight*scale, this.arrowWidth/2*scale, -this.arrowHeadHeight*scale, this.arrowHeadWidth/2*scale]);
                context.fillStyle = "#" + v["color"].toString(16).padStart(6, '0');
                context.fill();
            }
        }

        super.draw();
    }

    getParam()
    {
        return super.getParam().concat(
            [
                {mode: "details", text: "arrow"},
                    {mode: "number", param: "arrowHeadWidth", default: 15},
                    {mode: "number", param: "arrowHeadHeight", default: 10},
                    {mode: "number", param: "arrowWidth", default: 5},
                {mode: "/details"}
            ]
        );
    }
}

class DTree extends DGraph
{
    root = 0;

    constructor(x, y, nodes, graphs)
    {
        super(x, y, nodes, graphs);
        this.root = graphs["base"];
    }

    getParam()
    {
        let ret = super.getParam();

        let rlf = ret[searchObj(ret, "layoutFunction")];

        rlf["options"]?.push(
            {
                text : "Tilford-Raingold's Algorithm(根付き木)",
                value: "tilford_raingold",
            }
        );

        ret.splice( searchObj(ret, "layoutButton"), 0, {mode: "number", param:"root", default: this.root} );

        return ret;
    }
}

class UDGraph extends Graph
{
    lineWidth = 5;

    constructor(x, y, nodes, graphs)
    {
        super(x, y, nodes, graphs);
    }

    draw(ratio)
    {
        context.beginPath();
        for (let u of this.currentGraph["graph"])
        {
            for (let v of u["edges"])
            {
                v["animation"] ??= "";
                v["easing"] ??= "";
                v["color"] ??= 0;

                let un = u["number"] - this.graphs["base"];
                let vn = v["number"] - this.graphs["base"];

                let ip = animateFunction[v["animation"]]((this.nodes[un].x - ux), (this.nodes[un].y - uy), (this.nodes[vn].x - ux), (this.nodes[vn].y - uy), ratio );

                context.lineWidth = this.lineWidth*scale;
                context.strokeStyle = "#" + v["color"].toString(16).padStart(6, '0');

                context.moveTo( (this.nodes[un].x - ux)*scale , (this.nodes[un].y - uy)*scale );
                context.lineTo( ip[0]*scale , ip[1]*scale );
            }
        }
        context.stroke();

        super.draw();
    }

    getParam()
    {
        return super.getParam().concat(
            [
                {mode:"number", param:"lineWidth", default:this.lineWidth}
            ]
        );
    }
}

class Tree extends UDGraph
{
    root = 0;

    constructor(x, y, nodes, graphs)
    {
        super(x, y, nodes, graphs);
        this.root = graphs["base"];
    }

    getParam()
    {
        let ret = super.getParam().concat(
            [
                {mode: "number", param:"root", default: this.root}
            ]
        );

        ret[searchObj(ret, "layoutFunction")]["options"]?.push(
            {
                text : "Tilford-Raingold's Algorithm(根付き木)",
                value: "tilford_raingold",
            }
        );

        return ret;
    }
}

function searchObj(objs, id)
{
    for (let i = 0; i < objs.length; i++)
    {
        if (objs[i]["id"] == id) return i;
    }
    return -1;
}