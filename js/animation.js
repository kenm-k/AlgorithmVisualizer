let startTime = null;
let lastFrameTime = null;
let animationId = null;
let frameCount = 0;
let graphFrameCount = 0;
let frameInterval = 0;
let fps = 0;

//frameは0-origin
function setFrame(f)
{
    frame = f;
    document.getElementById("frame").value = f + 1;
}

function setFig(f)
{
    fig = f;
    document.getElementById("fig").value = f;
}

function playAnim()
{
    document.getElementById("playButton").textContent = "⏸";
    isPlaying = true;
    stopFlag = false;
    startAnim();
}

function startAnim()
{
    frameCount = document.getElementById("fig").valueAsNumber;
    graphFrameCount = document.getElementById("frame").valueAsNumber-1;

    fps = document.getElementById("fps").valueAsNumber;
    frameInterval = document.getElementById("frameInterval_ms").valueAsNumber/fps;
    startTime = null;
    lastFrameTime = null;
    animationId = requestAnimationFrame(animate);
}

function animate(timestamp)
{
    if (!startTime) startTime = timestamp;
    if (!lastFrameTime) lastFrameTime = timestamp;

    //経過秒
    const elapsedTime = (timestamp - startTime) / 1000;

    if (frameCount >= fps)
    {
        graphFrameCount++;
        setFrame(graphFrameCount);
        frameCount = 1;
        setFig(frameCount);
        animationId = requestAnimationFrame(animate);
        return;
    }

    if (graphFrameCount >= numberOfFrame || stopFlag)
    {
        if (graphFrameCount == numberOfFrame)
        {
            setFrame(numberOfFrame-1);
            setFig(fps);
        }
        cancelAnimationFrame(animationId);
        console.log("end animation!");
        document.getElementById("playButton").textContent = "▶";
        isPlaying = false;
        stopFlag = false;
        return;
    }

    if (timestamp - lastFrameTime >= frameInterval)
    {
        draw(frameCount / fps);
        lastFrameTime = timestamp - (timestamp - lastFrameTime) % frameInterval;
        frameCount++;
        setFig(frameCount);
    }
    animationId = requestAnimationFrame(animate);
}

let animateFunction = {
    create:
        (x0, y0, x1, y1, ratio) => { return MyMath.culcInternalDivisionPoint(x0, y0, x1, y1, ratio); },
    "":
        (x0, y0, x1, y1, ratio) => { return [x1, y1]; },
};

//参考 https://easings.net/ja
let easing = {
    "" : (x) => { return x; },
    easeInSine: (x) =>{ return 1 - Math.cos((x * Math.PI) / 2); },
    easeOutSine: (x) =>{ return Math.sin((x * Math.PI) / 2); },
    easeInOutSine: (x) =>{ return -(Math.cos(Math.PI * x) - 1) / 2; },

    easeInCubic: (x) => { return Math.pow(x, 3); },
    easeOutCubic: (x) => { return 1 - Math.pow(1-x, 3); },
    easeInOutCubic: (x) => { return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; },

    easeInQuint: (x) => {return x * x * x * x * x;},
    easeOutQuint: (x) => {return 1 - Math.pow(1 - x, 5);},
    easeInOutQuint: (x) => {return x < 0.5 ? 16 * x * x * x * x * x : 1 - Math.pow(-2 * x + 2, 5) / 2;},

    easeInCirc: (x) => {return 1 - Math.sqrt(1 - Math.pow(x, 2));},
    easeOutCirc: (x) => {return Math.sqrt(1 - Math.pow(x - 1, 2));},
    easeInOutCirc: (x) => {
        return x < 0.5
        ? (1 - Math.sqrt(1 - Math.pow(2 * x, 2))) / 2
        : (Math.sqrt(1 - Math.pow(-2 * x + 2, 2)) + 1) / 2;
    },

    easeInElastic: (x) => {
        const c4 = (2 * Math.PI) / 3;

        return x === 0
        ? 0
        : x === 1
        ? 1
        : -Math.pow(2, 10 * x - 10) * Math.sin((x * 10 - 10.75) * c4);
    },
    easeOutElastic: (x) => {
        const c4 = (2 * Math.PI) / 3;

        return x === 0
        ? 0
        : x === 1
        ? 1
        : Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * c4) + 1;
    },
    easeInOutElastic: (x) => {
        const c5 = (2 * Math.PI) / 4.5;

        return x === 0
        ? 0
        : x === 1
        ? 1
        : x < 0.5
        ? -(Math.pow(2, 20 * x - 10) * Math.sin((20 * x - 11.125) * c5)) / 2
        : (Math.pow(2, -20 * x + 10) * Math.sin((20 * x - 11.125) * c5)) / 2 + 1;
    },

    easeInQuad: (x) => { return x * x; },
    easeOutQuad: (x) => { return 1 - (1 - x) * (1 - x); },
    easeInOutQuad: (x) => { return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2; },

    easeInQuard: (x) => { return x * x * x * x; },
    easeOutQuard: (x) => { return 1 - Math.pow(1 - x, 4); },
    easeInOutQuard: (x) => {return x < 0.5 ? 8 * x * x * x * x : 1 - Math.pow(-2 * x + 2, 4) / 2;},

    easeInExpo: (x) => { return x === 0 ? 0 : Math.pow(2, 10 * x - 10); },
    easeOutExpo: (x) => { return x === 1 ? 1 : 1 - Math.pow(2, -10 * x); },
    easeInOutExpo: (x) => {
        return x === 0
        ? 0
        : x === 1
        ? 1
        : x < 0.5 ? Math.pow(2, 20 * x - 10) / 2
        : (2 - Math.pow(2, -20 * x + 10)) / 2;
    },

    easeInBack: (x) => {
        const c1 = 1.70158;
        const c3 = c1 + 1;

        return c3 * x * x * x - c1 * x * x;
    },
    easeOutBack: (x) => {
        const c1 = 1.70158;
        const c3 = c1 + 1;

        return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
    },
    easeInOutBack: (x) => {
        const c1 = 1.70158;
        const c2 = c1 * 1.525;

        return x < 0.5
        ? (Math.pow(2 * x, 2) * ((c2 + 1) * 2 * x - c2)) / 2
        : (Math.pow(2 * x - 2, 2) * ((c2 + 1) * (x * 2 - 2) + c2) + 2) / 2;
    },

    easeInBounce: (x) => { return 1 - easing["easeOutBounce"](1 - x); },
    easeOutBounce: (x) => {
        const n1 = 7.5625;
        const d1 = 2.75;

        if (x < 1 / d1) {
            return n1 * x * x;
        } else if (x < 2 / d1) {
            return n1 * (x -= 1.5 / d1) * x + 0.75;
        } else if (x < 2.5 / d1) {
            return n1 * (x -= 2.25 / d1) * x + 0.9375;
        } else {
            return n1 * (x -= 2.625 / d1) * x + 0.984375;
        }
    },
    easeInOutBounce: (x) => {
        return x < 0.5
        ? (1 - easing["easeOutBounce"](1 - 2 * x)) / 2
        : (1 + easing["easeOutBounce"](2 * x - 1)) / 2;
    }

};