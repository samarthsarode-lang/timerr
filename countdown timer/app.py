"""
Countdown Timer Web App
=======================
A Flask-powered countdown timer website.
Run locally:  python app.py
Deploy:       push to GitHub → import on vercel.com
"""

from flask import Flask, render_template

app = Flask(__name__)


@app.route("/")
def index():
    """Serve the countdown timer page."""
    return render_template("index.html")


if __name__ == "__main__":
    app.run(debug=True)
