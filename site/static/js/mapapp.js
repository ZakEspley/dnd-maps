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
        Texture = PIXI.Texture,
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
    
    var stageWidth = $(".container").width()*0.95;
    var stageHeight = 512;
    app.renderer.backgroundColor = 0x38c9ff;
    app.renderer.view.style.display = "block";
    app.renderer.autoResize = true;
    app.renderer.resize(stageWidth, stageHeight);
    var shapes = {0:PIXI.Polygon, 1:PIXI.Rectangle, 3:PIXI.Ellipse};
    var rectangle, map, renderTexture;
    var mask, maskTexture, maskSprite, greenSelection, map, originalMap;
    var drawType = -1;
    loader.add("map", mapInfo.map).load(setup);

    function setup() {
        map = new Sprite(resources["map"].texture);
        originalMap = new Sprite(resources["map"].texture);
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
            .on('mousedown', mousedownHandler)
            .on('mousemove', makeSelector)
            .on('mouseup', mouseUpHandler)
            .on('mouseupoutside', mouseUpHandler)
            .on('rightdown', mousedownHandler)
            .on('rightup', mouseUpHandler)
            .on('rightupoutside', mouseUpHandler)
            .on('click', clickHandler)

        // // document.body.appendChild(image);
        var renderTexture = RenderTexture.create(app.screen.width, app.screen.height);
        var renderTextureSprite = new Sprite(renderTexture);

        greenSelection = new Graphics();
        greenSelection.lineStyle(1, 0x47ff1a, 1);
        greenSelection.beginFill(0x47ff1a, 0.3);
        greenSelection.drawRect(0,0, app.screen.width, app.screen.height);
        app.stage.addChild(greenSelection);

        mask = new Graphics();
        mask.width = app.screen.width;
        mask.height = app.screen.height;
        mask.lineStyle(0,0,1);
        mask.beginFill(0,1);
        mask.drawRect(0,0,app.screen.width, app.screen.height);
        maskTexture = app.renderer.generateTexture(mask);
        maskSprite = new Sprite.from(maskTexture);
        greenSelection.mask = maskSprite;

        openInNewTab('http://127.0.0.1:5000/playerMap');
        setTimeout(loadMapInfo, 750);

        app.ticker.add(delta => gameLoop(delta));
    }

    function gameLoop(delta) {


    }

    var initialX, initialY, selection, selectorColor;
    var polyPoints = [];
    var selectorShape, maskColor, timer;
    var lDown, selecting, drawing, brushing = false;
    var endPoint, finalPoint, middlePoint = false;
    var startPoint = true;
    var clicks = 0;

    function mousedownHandler(e){
        initialX = e.data.global.x;
        initialY = e.data.global.y;
        if (e.type == "mousedown") {
            lDown = true;
            selectorColor = 0x47ff1a;
            maskColor = 0xffffff;

        } else if (e.type == "rightdown") {
            lDown = false;
            selectorColor = 0xfd0000;
            maskColor = 0;
        }
        drawType = $("input[name='options']:checked").val();
        if (drawType > 0) {
            selecting = true;
        } else if (drawType < 0) {
            brushing = true;
        } else {
            drawing = true;
            if (startPoint) {
                polyPoints.push(initialX, initialY);
            }
        }
    } 

    function makeSelector(e){
        if (selecting) {
            var deltaX = e.data.global.x - initialX;
            var deltaY = e.data.global.y - initialY;
            if (selection != null) {
                app.stage.removeChild(selection);
            }
            if (drawType == 1) {
                selectorShape = new PIXI.Rectangle(initialX, initialY, deltaX, deltaY);
            } else if (drawType == 3) {
                selectorShape = new PIXI.Ellipse(initialX+deltaX/2, initialY+deltaY/2, deltaX/2, deltaY/2);
            }
            selection = createSelector(selectorShape, selectorColor);

            if (selection != null) {
                app.stage.addChild(selection);
            }
        } else if (drawing) {
            if (selection != null) {
                app.stage.removeChild(selection);
            }
            
            selection = createLine(polyPoints.concat([e.data.global.x, e.data.global.y]), selectorColor);
            
            if (selection != null) {
                app.stage.addChild(selection);
            }
        } else if (brushing) {
            if (selection != null) {
                app.stage.removeChild(selection);
            }
            
            selection = createCircle(e.data.global.x, e.data.global.y, 15, selectorColor);
            
            if (selection != null) {
                app.stage.addChild(selection);
                selectorShape = new PIXI.Circle(e.data.global.x, e.data.global.y, 15);
                mask.lineStyle(0,0);
                mask.beginFill(maskColor);
                mask.drawShape(selectorShape);
                maskTexture = app.renderer.generateTexture(mask);
                maskSprite = new Sprite.from(maskTexture);
                channel.postMessage({mapchange:selectorShape, color:maskColor, x:app.screen.width, y:app.screen.height});
                greenSelection.mask = maskSprite;
            }
        }

    }

    function mouseUpHandler(e) {
        if (selecting) {
            mask.lineStyle(0,0);
            mask.beginFill(maskColor,1);
            mask.drawShape(selectorShape);
            maskTexture = app.renderer.generateTexture(mask);
            maskSprite = new Sprite.from(maskTexture);
            channel.postMessage({mapchange:selectorShape, color:maskColor, x:app.screen.width, y:app.screen.height});
            greenSelection.mask = maskSprite;
            lDown = false;
            app.stage.removeChild(selection);
            selection = null;
            initialX = 0;
            initialY = 0;
            selecting = false;
            drawType = -1;
        } else if (drawing) {
            if (startPoint) {
                // middlePoint = true;
                startPoint = false;
            } else {
                initialX = 0;
                initialY = 0;
                var dX = Math.abs(e.data.global.x - polyPoints[polyPoints.length-2]);
                var dY = Math.abs(e.data.global.y - polyPoints[polyPoints.length-1]);
                if (Math.sqrt(dX^2+dY^2) > 2){
                    drawType = -1;
                    polyPoints.push(e.data.global.x, e.data.global.y);
                    endPoint = false;
                } else {
                    polyPoints.push(e.data.global.x, e.data.global.y)
                    selectorShape = new PIXI.Polygon(polyPoints);
                    mask.lineStyle(0,0);
                    mask.beginFill(maskColor,1);
                    mask.drawShape(selectorShape);
                    maskTexture = app.renderer.generateTexture(mask);
                    maskSprite = new Sprite.from(maskTexture);
                    channel.postMessage({mapchange:selectorShape, color:maskColor, x:app.screen.width, y:app.screen.height});
                    greenSelection.mask = maskSprite;
                    lDown = false;
                    app.stage.removeChild(selection);
                    selection = null;
                    drawing = false;
                    drawType = -1;
                    middlePoint = false;
                    startPoint = true;
                    endPoint = true;
                    clicks = 0;
                    polyPoints = [];
                } 
            }
        } else if (brushing) {
            app.stage.removeChild(selection);
            selection = null;
            brushing = false;
        }     
    }

    function clickHandler(e) {
    }

    document.oncontextmenu = document.body.oncontextmenu = function(event) {event.preventDefault();}
    
    $("#display").append(app.view);

    function createSelector(shapeData, color) {
        var shapeSelector = new Graphics();
        shapeSelector.lineStyle(1, color, 1);
        shapeSelector.beginFill(color, 0.15);
        shapeSelector.drawShape(shapeData);
        return shapeSelector;
    }

    function createLine(points,color) {
        var lineSelector = new Graphics();
        lineSelector.lineStyle(3, color, 1);
        lineSelector.beginFill(color, 0.15);
        lineSelector.moveTo(points[0], points[1]);
        for (let i=2; i<points.length; i=i+2){
            lineSelector.lineTo(points[i], points[i+1]);
        } 
        return lineSelector;
    }

    function createCircle(x, y, r, color){
        var circleSelector = new Graphics();
        circleSelector.lineStyle(1, color, 1);
        circleSelector.beginFill(color, 0.15);
        circleSelector.drawCircle(x, y, r);
        return circleSelector;
    }

    $("#saveButton").click(function(e){
        // var imageMask = app.renderer.plugins.extract.base64(maskTexture);
        // $.post("http://127.0.0.1:5000/save", imageMask);
        var saveText = $("#savetext").val();
        if (saveText == '') {
            alert("You forgot to put in a name for your save file.");
            return
        }
        var mapImage = app.renderer.plugins.extract.base64(originalMap);
        
        saveText = saveText.replace("/", "_").replace(/\s/g, "_").replace(/\W/g, '');
        var shapes = [];
        for (let i=1; i < mask.graphicsData.length;i++){
            shapes.push([mask.graphicsData[i].shape, mask.graphicsData[i].fillColor]);
        }
        $.post("/save/"+saveText, JSON.stringify({"mask":shapes, "width":app.screen.width, "height":app.screen.height, "map":mapImage, "name":saveText}), dataType='json');
    });

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
        for (let i=0;i<mapInfo.mask.length;i++) {
            var shapeinfo = mapInfo.mask[i][0];
            var colorInfo = mapInfo.mask[i][1];
            var shape = new shapes[shapeinfo.type]();
            var scaleFactors = {'x':scaleX, 'y':scaleY, 'width':scaleX, "height":scaleY};
            for (var property in shapeinfo) {
                if (shapeinfo.hasOwnProperty(property)) {
                    if (property == 'x' || property == "y" || property == "width" || property == "height"){
                        shape[property] = shapeinfo[property]*scaleFactors[property];
                    } else {
                        shape[property] == shapeinfo[property];
                    }
                }
            }
            mask.lineStyle(0,0);
            mask.beginFill(colorInfo,1)
            mask.drawShape(shape);
            channel.postMessage({mapchange:shapeinfo, color:colorInfo, x:app.screen.width, y:app.screen.height});
        }
    
        mask.width=app.screen.width;
        mask.height = app.screen.height;
        maskTexture = app.renderer.generateTexture(mask);
        maskSprite = new Sprite.from(maskTexture);
        greenSelection.mask = maskSprite;
    }

    function openInNewTab(url) {
        $("<a>").attr("href", url).attr("target", "_blank")[0].click();
    }

});