$(document).ready(function(){

    const channel = new BroadcastChannel("maskBus");

    // PIXI.utils.sayHello();
    let type = "WebGL";
    if (!PIXI.utils.isWebGLSupported()) {
        type = 'canvas'
    }

    let Application = PIXI.Application,
        Container = PIXI.Container,
        loader = PIXI.loader,
        resources = PIXI.loader.resources,
        TextureCache = PIXI.utils.TextureCache,
        Sprite = PIXI.Sprite,
        Graphics = PIXI.Graphics,
        RenderTexture = PIXI.RenderTexture;


    var app = new Application({
        width: 512,
        height: 512,
        antialias: true,
        transparent: false,
        resolution: 1
    });
    
    // app.stage.position.y = app.renderer.height;
    // app.stage.scale.y = -1;
    // var container = document.querySelector(".container").getBoundingClientRect()
    // var stageWidth =  window.innerWidth;
    var stageWidth = $(".container").width()*0.95;
    var stageHeight = 512;
    app.renderer.backgroundColor = 0x38c9ff;
    app.renderer.view.style.display = "block";
    app.renderer.autoResize = true;
    app.renderer.resize(stageWidth, stageHeight);
    
    var rectangle, map, renderTexture;
    var mask, maskTexture, maskSprite, greenSelection;
    loader.add("static/img/map1.jpg").load(setup);

    function setup() {
        var map = new Sprite(resources["static/img/map1.jpg"].texture);
        app.stage.addChild(map);
        if (map.height > map.width) {
            map.rotation = Math.PI/2;
            map.width = window.innerHeight-100;
            map.height = window.innerWidth-100;
            map.x = map.height;
            app.renderer.resize(map.height, map.width);
        } else {
            map.width = window.innerWidth-100;
            map.height = window.innerHeight-100;
            app.renderer.resize(map.width, map.height);  
        }

        map.interactive = true;
        map
            .on('mousedown', revealStart)
            .on('mousemove', makeRectangle)
            .on('mouseup', revealEnd)
            .on('mouseoutside', revealEnd)
            .on('rightdown', hideStart)
            .on('rightup', hideEnd)

        // // document.body.appendChild(image);
        var renderTexture = RenderTexture.create(app.screen.width, app.screen.height);
        var renderTextureSprite = new Sprite(renderTexture);
        
        greenSelection = new Graphics();
        greenSelection.lineStyle(1, 0x47ff1a, 1);
        greenSelection.beginFill(0x47ff1a, 0.3);
        greenSelection.drawRect(0,0, app.screen.width, app.screen.height);
        app.stage.addChild(greenSelection);

        mask = new Graphics();
        mask.lineStyle(0,0,1);
        mask.beginFill(0,1);
        mask.drawRect(0,0,app.screen.width, app.screen.height);
        // mask.beginFill(0xffffff, 1);
        // mask.drawRect(100,100,250,250);
        maskTexture = app.renderer.generateTexture(mask);
        maskSprite = new Sprite.from(maskTexture);
        greenSelection.mask = maskSprite;
        // greenSelection.mask = mask;
        // app.stage.addChild(mask);


        
        openInNewTab('http://127.0.0.1:5000/playerMap')

        app.ticker.add(delta => gameLoop(delta));
    }

    function gameLoop(delta) {


    }

    var initialX, initialY, selection;
    var lDown, rDown, selectorAdded = false;

    function revealStart(e){
        initialX = e.data.global.x;
        initialY = e.data.global.y;
        lDown = true;
    }

    function makeRectangle(e) {
        var width = e.data.global.x - initialX;
        var height = e.data.global.y - initialY;
        if (selection != null) {
            app.stage.removeChild(selection);
        }
        if (lDown) {
            selection = createRectangleSelector(width, height, 0x47ff1a);
        } else if (rDown) {
            selection = createRectangleSelector(width, height, 0xfd0000);
        }

        if (selection != null){
            selection.x = initialX;
            selection.y = initialY;
            app.stage.addChild(selection);
        }
    }

    function revealEnd(e) {
        lDown = false;
        selectorAdded = false;
        var width = e.data.global.x - initialX;
        var height = e.data.global.y - initialY;
        mask.lineStyle(0,0);
        mask.beginFill(0xffffff,1);
        mask.drawRect(initialX, initialY, width, height);
        maskTexture = app.renderer.generateTexture(mask);
        maskSprite = new Sprite.from(maskTexture);
        channel.postMessage([true,initialX,initialY,width,height]);
        greenSelection.mask = maskSprite;
        app.stage.removeChild(selection);
        selection = null;
        initialX = 0;
        initialY = 0;
    }

    function hideStart(e) {
        rDown = true;
        initialX = e.data.global.x;
        initialY = e.data.global.y;
    }

    function hideEnd(e){
        // e.preventDefault();
        rDown = false;
        selectorAdded = false;
        var width = e.data.global.x - initialX;
        var height = e.data.global.y - initialY;
        mask.lineStyle(0,0);
        mask.beginFill(0,1);
        mask.drawRect(initialX, initialY, width, height);
        maskTexture = app.renderer.generateTexture(mask);
        maskSprite = new Sprite.from(maskTexture);
        channel.postMessage([false,initialX,initialY,width,height]);
        greenSelection.mask = maskSprite;
        app.stage.removeChild(selection);
        selection = null;
        initialX = 0;
        initalY = 0;
    }

    document.oncontextmenu = document.body.oncontextmenu = function(event) {event.preventDefault();}
    // var map = new PIXI.Sprite.fromImage("static/img/map1.jpg")
    // map.x = 0;
    // map.y = -100;
    // app.stage.addChild(map)
    
    $("#display").append(app.view);

    function createRectangleSelector(width, height, color) {
        rectangle = new Graphics();
        rectangle.lineStyle(1, color, 1);
        rectangle.beginFill(color, 0.15);
        rectangle.drawRect(0,0,width,height);
        // app.stage.addChild(rectangle);
        return rectangle;
    }

    function openInNewTab(url) {
        $("<a>").attr("href", url).attr("target", "_blank")[0].click();
    }

    


//   canvas.addEventListener('contextmenu', (e) => { e.preventDefault(); });



});