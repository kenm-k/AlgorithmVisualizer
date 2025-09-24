const sleep = (time) => new Promise((resolve) => setTimeout(resolve, time));

let layoutFunctions = {
    //参考 : https://www.slideshare.net/slideshow/drawing-tree-algorithms/33708903#17
    tilford_raingold :
    /**
     * 根付き木を配置
     * @param {DTree} dtree 根付き木
     */
    function(dtree)
    {
        currentGraph = dtree.currentGraph;
        root = dtree.root - dtree.graphs["base"];
        tdistBNodes = Number(dtree.distNodes);
        let base = dtree.graphs["base"];

        let nodes = new Array();

        for (let node of dtree.nodes)
        {
            nodes.push(node.getProxy());
        }

        deepest = culcTreeDepth(root, 0);

        tilford_raingold_sub(root, 0, 0);

        //xpos ... その木で、postorderで一番最初にでてくる葉のx座標
        //なので、x=0となる基準は、木全体の一番左の葉
        function tilford_raingold_sub(v, xpos, depth)
        {
            //節の高さ方向の間隔はheight(=deepest - depth)を変数とした関数の導関数
            //下の右辺がその関数、一次関数なら一定

            //高さの関数は、差分方程式の解を用いる、以下は一例
            //差分方程式 Δy/Δx = sqrt x の解の近似
            //-0.2078862249はζ(-1/2)の近似
            //let culc = (2/3)*Math.pow(h, 3/2) - (1/2)*Math.pow(h, 1/2) + (-0.2078862249) + (1/24)*Math.pow(h, -1/2) - (1/1920)*Math.pow(h, -5/2);

            let h = (deepest - depth) + 1; //最下節を1に、そっちの方が都合がいい
            
            //Δy/Δx = f(x)の解
            let culc = MyMath.sum( (x)=>{ return 1/2 * ( Math.sqrt(x) + x ); }, 0, h );

            nodes[v].y = -culc * (nodes[v].radius*2 + tdistBNodes);

            let childs = currentGraph["graph"][v]["edges"];
            if (childs.length == 0)
            {
                nodes[v].x = xpos;
                return [xpos, xpos, 0];
            }

            let pos = xpos;

            //vを親とする木における左端
            let l = Number.MAX_VALUE;
            //同様に、右端
            let r = -Number.MAX_VALUE;

            for (let u of childs)
            {
                let un = u["number"] - base;

                let ret = tilford_raingold_sub(un, pos, depth+1);

                //子要素を左に詰める
                pos = ret[1] + 2*nodes[un].radius + tdistBNodes;
                
                l = Math.min(l, ret[0]);
                r = Math.max(r, ret[1]);
            }

            //親の位置は子要素の中央
            nodes[v].x = (l+r)/2;

            //左端と右端を返す
            return [l, r];
        }

        //currentGraphが木であるとき、その深さを再帰により計算する。
        //節の数に応じた計算量を要す。
        //閉路がる場合、無限ループする。
        function culcTreeDepth(u, depth)
        {
            let cdepth = depth;
            console.log(u);
            let childs = currentGraph["graph"][u]["edges"];
            for (let v of childs)
            {
                let vn = v["number"] - base;
                cdepth = Math.max(cdepth, culcTreeDepth(vn, depth+1));
            }
            return cdepth;
        }
    },

    //https://mfumi.hatenadiary.org/entry/20140213/1392287682
    //https://web.archive.org/web/20131201004028/http://citeseerx.ist.psu.edu/viewdoc/download?doi=10.1.1.13.8444&rep=rep1&type=pdf
    fruchterman_raingold:
    async function(graph)
    {
        const iteration = graph.iteration;

        let nodes = new Array();
        for (let node of graph.nodes)
            nodes.push(node.getProxy());

        const W = graph.rangeX;
        const L = graph.rangeY;

        if (graph.randomize)
            this.random(graph);

        const c = graph.constant;
        const k = c*Math.sqrt(W*L / nodes.length);
        
        let t = W/10;
        const t0 = t;

        let dt;

        //離散一様分布
        //dt = (n) => {return t0/(iteration+1);};

        const p = 0.5;
        //二項分布
        dt = (n) => {return t0*MyMath.nCr(iteration+1, n)*Math.pow(p, n)*Math.pow(1-p, iteration+1-n)};

        function f_a(pd,pk)
        {
            return pd*pd / pk;
        }

        function f_r(pd,pk)
        {
            return pk*pk / pd;
        }

        for (let i = 0; i < iteration; i++)
        {
            for (let v = 0; v < nodes.length; v++)
            {
                nodes[v].dx = 0;
                nodes[v].dy = 0;
                for (let u = 0; u < nodes.length; u++)
                {
                    if (v != u)
                    {
                        let dx = nodes[v].x - nodes[u].x;
                        let dy = nodes[v].y - nodes[u].y;
                        let delta = Math.sqrt(dx*dx+dy*dy);
                        if (delta != 0)
                        {
                            let d = f_r(delta, k)/delta;
                            nodes[v].dx += dx*d;
                            nodes[v].dy += dy*d;
                        }
                    }
                }
            }

            for (let v = 0; v < nodes.length; v++)
            {
                let childs = graph.currentGraph["graph"][v]["edges"];
                for (let u of childs)
                {
                    let un = u["number"] - graph.graphs["base"];

                    let dx = nodes[v].x - nodes[un].x;
                    let dy = nodes[v].y - nodes[un].y;
                    let delta = Math.sqrt(dx*dx+dy*dy);
                    if (delta != 0)
                    {
                        let d = f_a(delta, k)/delta;
                        let ddx = dx*d;
                        let ddy = dy*d;
                        nodes[v].dx += -ddx;
                        nodes[v].dy += -ddy;
                        nodes[un].dx += +ddx;
                        nodes[un].dy += +ddy;
                    }
                }
            }

            for (let v = 0; v < nodes.length; v++)
            {
                let dx = nodes[v].dx;
                let dy = nodes[v].dy;
                let disp = Math.sqrt(dx*dx+dy*dy);
                if (disp != 0)
                {
                    let d = Math.min(disp, t)/disp;
                    let x = nodes[v].x + dx*d;
                    let y = nodes[v].y + dy*d;

                    let resx;
                    let resy;

                    //四角に収める
                    if (graph.fit)
                    {
                        x = Math.min(W/2, Math.max(-W/2, x));
                        y = Math.min(L/2, Math.max(-L/2, y));
                    }

                    resx = x;
                    resy = y;

                    if (!nodes[v].fixed)
                    {
                        nodes[v].x = resx;
                        nodes[v].y = resy;
                    }
                }
            }

            t -= dt(i);

            draw();

            if (graph.interval != 0)
                await sleep(graph.interval);
        }

        draw();
    },

    random:
    function(graph)
    {
        let graphP = graph.getProxy();

        let nodes = new Array();
        for (let node of graph.nodes)
            nodes.push(node.getProxy());

        for (let node of nodes)
        {
            if (!node.fixed)
            {
                node.x = (Math.random()-0.5)*graphP.rangeX;
                node.y = (Math.random()-0.5)*graphP.rangeY;
            }
        }
    }
}