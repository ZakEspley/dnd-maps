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
    var shapes = {0:PIXI.Polygon, 1:PIXI.Rectangle, 3:PIXI.Ellipse, 2:PIXI.Circle};
    var stageWidth = $(".container").width()*0.95;
    var stageHeight = 512;
    app.renderer.backgroundColor = 0x38c9ff;
    app.renderer.view.style.display = "block";
    app.renderer.autoResize = true;
    app.renderer.resize(stageWidth, stageHeight);
    
    var greenSelection;
    // PIXI.loader.add("map","../static/img/maps/" + mapname).load(setup);
    var mask, maskTexture, maskSprite, fogOfWar;
    loader.add("map",mapInfo.map).load(setup);
    
    function setup() {
        var map = new Sprite(resources["map"].texture);
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

        // loadMapInfo();
        
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
        // console.log(e.data.mapchange);
        if (e.data.mapchange != undefined) {
            var shapeData = e.data.mapchange;
            var color = e.data.color;
            color = ~color;
            mask.lineStyle(0,0);
            mask.beginFill(color, 1);
            // var initialX = e.data.mapchange[1];
            // var initialY = e.data.mapchange[2];
            // var width = e.data.mapchange[3];
            // var height = e.data.mapchange[4];
            // var reveal = e.data.mapchange[0];
            var scaleX = app.screen.width/e.data.x;
            var scaleY = app.screen.height/e.data.y;
            var scaleFactors = {'x':scaleX, 'y':scaleY, 'width':scaleX, "height":scaleY};

            if (shapeData.type == -100){
                var scaledPoints = [];
                for (let i=0; i<shapeData.points.length; i=i+2) {
                    scaledPoints.push(shapeData.points[i]*scaleX);
                    scaledPoints.push(shapeData.points[i+1]*scaleY);
                }
                var shape = new PIXI.Polygon(scaledPoints);
            } else {
                var shape = new shapes[shapeData.type]();
                for (var property in shapeData) {
                    if (shapeData.hasOwnProperty(property)) {
                        if (property == 'x' || property == "y" || property == "width" || property == "height"){
                            shape[property] = shapeData[property]*scaleFactors[property];
                        } else if (property == "points") {
                            var scaledPoints = [];
                            for (let i=0; i<shapeData.points.length; i=i+2) {
                                scaledPoints.push(shapeData.points[i]*scaleX);
                                scaledPoints.push(shapeData.points[i+1]*scaleY);
                            }
                            shape[property] = scaledPoints;
                        } else {
                            shape[property] = shapeData[property];
                        }
                    }
                }
            }
            // shape.radius = 15;
            mask.drawShape(shape);
            maskTexture = app.renderer.generateTexture(mask);
            maskSprite = new Sprite.from(maskTexture);
            fogOfWar.mask = maskSprite;
        }
    };

    function loadMapInfo(){
        if (mapInfo.width != 0){
            var scaleX = app.screen.width/mapInfo.width;
        } else {
            var scaleX = 1;
        }
        if (mapInfo.height != 0) {
            var scaleY = app.screen.height/mapInfo.height;
        } else {
            var scaleY = 1;
        }

        for (let i=1;i<mapInfo.mask.length;i++) {
            var shapeinfo = mapInfo.mask[i];
            if (shapeinfo['type'] == 1) {
                let x = shapeinfo.x*scaleX;
                let y = shapeinfo.y*scaleY;
                let width = shapeinfo.width*scaleX;
                let height = shapeinfo.height*scaleY;
                var shape = new PIXI.Rectangle(x,y,width,height);
                mask.lineStyle(0,0);
                mask.beginFill(0xffffff,1)
                mask.drawShape(shape);
                channel.postMessage({"mapchange":[true,x,y,width,height,app.screen.width,app.screen.height]});
            }
        }
    
        mask.width=app.screen.width;
        mask.height = app.screen.height;
        maskTexture = app.renderer.generateTexture(mask);
        maskSprite = new Sprite.from(maskTexture);
        fogOfWar.mask = maskSprite;
    }
    
});