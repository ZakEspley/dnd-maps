from flask import Flask, render_template, request, url_for, redirect
from flask_uploads import UploadSet, configure_uploads, IMAGES
import os
import base64
import json
import webbrowser

def create_app():
    app = Flask(__name__)
    def run_on_start(*args, **kwargs):
        url = "http://127.0.0.1:5000"
        webbrowser.open_new(url)
    run_on_start()
    return app

app = create_app()
# app = Flask(__name__)
maps = UploadSet('maps', IMAGES)
app.config['UPLOADED_MAPS_DEST'] = os.path.join(os.getcwd(),"static", "img", "maps")
app.config['UPLOADED_SAVE_DEST'] = os.path.join(os.getcwd(),"static", "img", "saves")
configure_uploads(app, maps)

mapinfo = {"mask":[], "width":0, "height":0, "map":'', "name":''}

@app.route("/", methods=['GET', 'POST'])
def index():
    global mapinfo
    if request.method == 'POST' and 'map' in request.files:
        filename = request.files.get('map').filename
        mapString = "data:"+request.files['map'].content_type+";base64,"+base64.b64encode(request.files.get('map').stream.read()).decode('utf-8')
        mapinfo = {"mask":[], "width":0, "height":0, "map":mapString, "name":request.files['map'].filename}
        return redirect(url_for("dungeonMasterMap"))
    return render_template('index.html')

@app.route("/dungeonMasterMap")
def dungeonMasterMap():
    # mapname = request.args.get('mapname')
    global mapinfo
    return render_template('dungeonMasterMap.html', mapinfo=mapinfo)

@app.route("/playerMap")
def playerMap():
    global mapinfo
    return render_template("playerMap.html", mapinfo=mapinfo)

@app.route('/chooseSave', methods=["GET", "POST"])
def chooseSave():
    savelist = []
    for directory in os.listdir(os.path.join(os.getcwd(), 'static', 'img', 'saves')):
        savelist.append(directory)

    return render_template('chooseSave.html', savelist=savelist)

@app.route('/save/<savename>', methods=["POST"])
def save(savename):
    saveData = request.get_data()
    path = os.path.join(app.config["UPLOADED_SAVE_DEST"], savename)
    os.makedirs(path, exist_ok=True)
    with open(os.path.join(path, "saveData.json"), 'w') as f:
        # f.write(base64.b64decode(image[22:]))
        # f.close()
        f.write(saveData.decode("utf-8"))
        f.close()
    
    with open(os.path.join(path, "map.png"), 'wb') as f:
        o = json.loads(saveData.decode("utf-8"))
        m = o["map"]
        f.write(base64.b64decode(m[22:]))
    
    return json.dumps({'success':True}), 200, {'ContentType':'application/json'} 

@app.route("/load", methods=["POST"])
def load():
    global mapinfo
    # print("####################",request.args, request.data)
    # print(request.form)
    name = request.form['savefile']
    maploc = os.path.join(os.getcwd(), 'static', 'img', 'saves', name, "saveData.json")
    with open(maploc, "r") as f:
        mapinfostr = f.read()
        f.close()
    # mapstring = base64.b64encode(mapimage).decode('utf-8')
    mapinfo = json.loads(mapinfostr)
    # return render_template("dungeonMasterMap.html", mapinfo=mapinfo)
    return redirect(url_for("dungeonMasterMap"))
    # return json.dumps({'success':True, 'graphicsData':mapstring}), 200, {'ContentType':'application/json'} 

# @app.before_first_request
# def openBrowser():
#     webbrowser.open_new("http://127.0.0.1/5000")

if __name__ == "__main__":
    # app.run(debug=True)
    app.run()