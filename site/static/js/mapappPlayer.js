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
        Graphics = PIXI.Graphics


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
    
    var rectangle;
    PIXI.loader.add("static/img/map1.jpg").load(setup);

    var mask, maskTexture, maskSprite, fogOfWar;

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

        fogOfWar = new Graphics();
        fogOfWar.lineStyle(0,1);
        fogOfWar.beginFill(0,1);
        fogOfWar.drawRect(0,0,app.screen.width,app.screen.height);

        app.stage.addChild(fogOfWar);

        mask = new Graphics();
        mask.lineStyle(0,1);
        mask.beginFill(0xffffff,1);
        mask.drawRect(0,0,app.screen.width, app.screen.height);

        maskTexture = app.renderer.generateTexture(mask);
        maskSprite = new Sprite.from(maskTexture);

        fogOfWar.mask = maskSprite;
        
        app.ticker.add(delta => gameLoop(delta));
    }

    function gameLoop(delta) {

    }

    // var map = new PIXI.Sprite.fromImage("static/img/map1.jpg")
    // map.x = 0;
    // map.y = -100;
    // app.stage.addChild(map)
    
    $("#display").append(app.view);
    
    function openInNewTab(url) {
        $("<a>").attr("href", url).attr("target", "_blank")[0].click();
    }

    channel.onmessage = function(e) {
        console.log(e.data);
        var initialX = e.data[1];
        var initialY = e.data[2];
        var width = e.data[3];
        var height = e.data[4];
        var reveal = e.data[0];
        mask.lineStyle(0,0);        
        if (reveal) {
            console.log('RAN')
            mask.beginFill(0,1);
        } else if (!reveal) {
            mask.beginFill(0xffffff,1);
        }
        mask.drawRect(initialX, initialY, width, height);
        maskTexture = app.renderer.generateTexture(mask);
        maskSprite = new Sprite.from(maskTexture);
        fogOfWar.mask = maskSprite;
    };
    
});