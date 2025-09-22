let GManager_cells = new Array();
let GManager_proxy = new Array();
let GManager_upfunc = new Array();

/* about GObjectManager(GManager)
 * GObjectsManagerはgObjectsに存在するGObjectのパラメータを手動で変更できるようにしたものです。
 * "GManager"というidの要素を取得し、その子として各GObjectのgetParam()で取得したパラメータからhtml要素を生成します。
 * 例えば基底クラスのGObjectは、getParam()の返り値として
 *   {mode: "number", param: "x", default: this.x},
 *   {mode: "number", param: "y", default: this.y}
 * を返します。これは、x, y座標を入力するようなインプットフィールドを作成する指示となっています。
 * ただし、defaultキーで指定した値で、paramで指定したメンバ変数は初期化されます。
 * 更新のたびにdefaultキーで指定した値に初期化されるため、値の保持のためメンバ自身を指定することを推奨します。
 * 具体的な仕様については後述します。
 *
 * 作成されたインプットフィールドともとの値への代入は、Proxyによってその操作が代理されます。
 * gObjects[i]のProxyは、GManager_proxy[i]へ保存されます。gObjectの操作はProxyを介して行ってください。
 * GObject.getProxy()でProxyを取得することもできます。
 * 
 * getParam()で指示できる内容は、いくつかあります。
 * 語尾に" * "がつくものは、設定が必須なものです。
 * =で両辺を繋いでいる場合、左辺の既定値が右辺です。
 * 
 * - 共通
 * mode* : 変更するパラメータの種類を表します。具体的な種類は後述します。
 * 
 * - modeによる設定
 *   "input" : インプットフィールドで入力を受け付けるモードです。
 *     - param* : メンバ変数を指定します。
 *     - type* : inputのタイプを指定します。htmlのinputタグのタイプと対応します。
 *     - default* : 初期値を指定します。 
 * 
 *   "check" : チェックボタンを作成します。
 *     - param* : メンバ変数を指定します。
 *     - checked* : 初期値を設定します。
 *      
 *   "select" : メンバ変数の値をプルダウンで選択するモードです。
 *     - param* : メンバ変数の名前を指定します。
 *     - options : プルダウンの各項のオブジェクトの配列です。オブジェクトのプロパティは以下です。
 *         - text* : プルダウンで表示されるテキスト
 *         - value : プルダウンの値。指定しなければtextと同じ値となる。
 *         - selected : このキーが存在するとき、selected属性が付与されます。
 * 
 *   "button" : paramに干渉せず、関数を実行するボタンを表示するモードです。
 *     - text* : ボタンに表示するテキスト
 *     - function* : ボタンを押すと実行されるfunction。ただし、"$this"という文字列は、"GManager_proxy[${i}]"に置換されます。
 *   
 *   "details" : まとまりを作ります。これを記述した後に必ず"/details"も記述してください。
 *     - text* : まとまりの概要文
 *   
 *   "/details" : まとまりの終了。必ずdetailsまたはif-detailsと併用し、その後に記述してください。detailsが展開されているときのみ、</details>を加えます。
 * 
 *   - 作成途中 
 *     "if-details" : 条件が真のとき、まとまりを作ります。これを記述した後に必ず"/details"も記述してください。
 *       - text* : まとまりの概要文
 *       - if* : 表示するか否か。ただし、変数については自身のメンバ変数のみ指定できます。真偽値を返す関数を送ってください。引数として自身が渡されます。
 *   
 *   - 推奨されないモード
 *     "number" : numberであるメンバ変数のモードです。
 *       - param* : メンバ変数の名前を指定します。
 *       - default* : 初期値を指定します。
 *  
 *     "text" : 文字列であるメンバ変数のモード
 *       - param*: メンバ変数の名前を指定します。
 *       - default*: 初期値を指定します。
 * 
 * - 特殊な仕様
 * bidirectional = true : boolenで、自身の値(param)をインプットフィールドへ更新するか設定します。trueのとき、更新します。
 * 
 * - 入力例
 *  getParam()
 *  {
 *      return [
 *          {mode: "details", text: "position"},
 *          {mode: "number", param: "x", default: this.x},
 *          {mode: "number", param: "y", default: this.y},
 *          {mode: "check", param: "fixed", checked: this.fixed},
 *          {mode: "/details"},
 *      ];
 *  }
 * 
 * 留意点
 * 調べたところ、proxyが呼ばれるのはproxy.メンバのような場合で、proxy.メンバ.そのプロパティのような指定だと呼ばれないっぽいです。
 * なので、そのような記法は避けていただければ...
 * 
 */


/**
* GObjectsManagerを更新する。
*/
function updateGMan()
{
    let gman = document.getElementById("GManager");
    for (let i = 0; i < GManager_cells.length; i++)
    {
        GManager_cells[i].remove();
    }
    GManager_cells = new Array();
    GManager_proxy = new Array();
    GManager_upfunc = new Array();

    let selectedGObjParent = document.getElementById("selectedGObj");

    let i = 0;
    for (let gObject of gObjects)
    {
        let newdetails = document.createElement("details");
        GManager_cells.push(newdetails);
        let selected = i == selectedGObj;
        if (selected)
            selectedGObjParent.appendChild(newdetails);
        else
            gman.appendChild(newdetails);

        let filterText = document.getElementById("filter").value;
        let filterMode = document.getElementById("filterMode").value;
        let doDisplay = true;

        //都合によりフィルターしないかどうか
        let dontFilter = true;

        switch (filterMode)
        {
            case "AND":
                dontFilter = true;
                break;
            
            case "OR":
                dontFilter = false;
                break;
        }

        let fTexts = filterText.split(",");
        let gOName = `${gObject.constructor.name} - GID${i}`;
        if (filterText != "")
            for (let text of fTexts)
            {
                switch (filterMode)
                {
                    case "AND":
                        dontFilter &= gOName.toLowerCase().includes(text.toLowerCase());
                        break;
                    
                    case "OR":
                        dontFilter |= gOName.toLowerCase().includes(text.toLowerCase());
                        break;
                }
            }
        else dontFilter = true;

        if (!dontFilter)
        {
            doDisplay = false;
        }

        let ihtml = `
            <summary> ${gOName} </summary>
        `;

        let param = gObject.getParam();
        let tempParam = new Array();
        let opened = new Array();
        let j = 0;
        for (let p of param)
        {

            let id = `GObj${i}`;
            let target = `GManager_proxy[${i}]`;

            //初期値設定
            p["bidirectional"] ??= true;

            if ("param" in p)
            {
                id = `GObj${i}_${p["param"]}`;
                target = `GManager_proxy[${i}].${p["param"]}`;
            }

            switch(p["mode"])
            {
                case "input":
                    ihtml += `
                        <p> ${p["param"]} : <input id="${id}" type="${p["type"]}" onchange="${target} = this.value; gmpUpdate();" value="${p["default"]}"> </p>
                    `;
                    break;

                case "number":
                    ihtml += `
                        <p> ${p["param"]} : <input id="${id}" type="number" onchange="${target} = this.value; gmpUpdate();" value="${p["default"]}"> </p>
                    `;
                    break;

                case "text":
                    ihtml += `
                        <p> ${p["param"]} : <input id="${id}" type="text" onchange="${target} = this.value; gmpUpdate();" value="${p["default"]}"> </p>
                    `;
                    break;

                case "select":
                    ihtml += `
                        <p> ${p["param"]} : </p>
                        <select id="${id}", onchange="${target} = this.value; gmpUpdate();">
                    `;

                    for (let opt of p["options"])
                    {
                        opt["value"] ??= opt["text"];
                        ihtml += `
                            <option value="${opt["value"]}" ${("selected" in opt) ? "selected" : ""} >${opt["text"]}</option>
                        `;
                    }

                    ihtml += `</select>`;
                    break;

                case "button":
                    p["function"] = p["function"].replace("$this", `GManager_proxy[${i}]`);
                    ihtml += `
                        <button onclick="${p["function"]};"> ${p["text"]} </button>
                    `;
                    break;

                case "details":
                    ihtml += ` <details> <summary> ${p["text"]} </summary> `;
                    opened.push(true);
                    break;

                case "/details":
                    if (opened.length > 0 && opened.pop())
                    {
                        ihtml += ` </details> `;
                    }
                    break;

                case "check":
                    ihtml += `
                        <p> ${p["param"]} : <input id="${id}" onchange="${target} = this.checked; gmpUpdate();" type="checkbox" ${p["checked"] ? "checked" : ""}> </p>
                    `;
                    break;

                case "if-details":
                    let openfunc = p["if"];
                    ihtml += ` <details id="${id}_ifdet_${j}"> <summary> ${p["text"]} </summary> `;

                    const cfunc = openfunc;
                    const cid = `${id}_ifdet_${j}`;
                    const cgobj = gObject;

                    GManager_upfunc.push( ()=>{
                        document.getElementById(cid).style.display = cfunc(cgobj) ? "block" : "none";
                    } );

                    opened.push(true);
                    break;
            }

            if ("param" in p)
            {
                if ("default" in p)
                    gObject[p["param"]] = p["default"];

                if ("checked" in p)
                    gObject[p["param"]] = p["checked"];

                if (p["bidirectional"])
                    tempParam.push(p["param"]);
            }

            j++;
        }

        while (opened.length > 0)
        {
            if (opened.pop())
                ihtml += ` </details> `;
        }

        GManager_proxy.push(gObject.setProxy(i, tempParam));

        if (!doDisplay && !selected)
            newdetails.style.display = "none";
        newdetails.innerHTML = ihtml;
        i++;
    }

    //gman.open = true;

    gmpUpdate();
}

function gmpUpdate()
{
    for (let func of GManager_upfunc) func();
    draw();
}