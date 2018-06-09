from flask import Flask
from flask import render_template

app = Flask(__name__)

@app.route("/")
def index():
    return render_template('index.html')

@app.route("/playerMap")
def playerMap():
    return render_template("playerMap.html")

if __name__ == "__main__":
    app.run(debug=True)