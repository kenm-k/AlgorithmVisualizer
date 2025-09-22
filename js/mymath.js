let MyMath = {
    /**
     * 点A(x0,y0)と点B(x1,y1)を、r:(1-r)に内分する点の座標を返す。
     * @param {number} x0 
     * @param {number} y0 
     * @param {number} x1 
     * @param {number} y1 
     * @param {number} ratio 
     */
    culcInternalDivisionPoint : function(x0,y0,x1,y1,r)
    {
        return [ (1-r)*x0 + r*x1, (1-r)*y0 + r*y1 ];
    },

    //endを含まないことに注意
    sum : function(func, begin, end)
    {
        let sum = 0;

        for (let i = begin; i < end; i++)
        {
            sum += func(i);
        }

        return sum;
    },

    warshall_floyd : function(graph)
    {
        return;
    },

    Vector : class
    {
        x = 0;
        y = 0;

        constructor(x=0, y=0)
        {
            this.x = x;
            this.y = y;
        }
    },

    get : function(arr, func, param)
    {
        let ans = arr[0][param];
        for (let v of arr)
        {
            arr = func(ans, v[param]);
        }
        return ans;
    },

    g2cPos : function (posx, posy)
    {
        return [(posx -  ux)*scale, (posy - uy)*scale];
    },

    c2gPos : function (posx, posy)
    {
        return [posx/scale + ux, posy/scale + uy];
    },

    factorial : function(n)
    {
        let res = 1;
        for (let i = 1; i <= n; i++)
        {
            res *= i;
        }
        return res;
    },

    nCr : function(n, r)
    {
        return this.factorial(n) / this.factorial(n-r) / this.factorial(r);
    }
};