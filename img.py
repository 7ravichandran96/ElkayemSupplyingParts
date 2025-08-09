import os
import webbrowser
from flask import Flask, jsonify, request

app = Flask(__name__)

# Change to your folder path
FOLDER_PATH = r"E:\LKM projects\Images"

@app.route("/")
def index():
    return """
    <!DOCTYPE html>
    <html>
    <head>
        <title>Rename Images to Uppercase</title>
    </head>
    <body style="font-family: Arial; padding: 20px;">
        <h2>Rename All Image Files to UPPERCASE</h2>
        <button id="renameBtn" style="padding:10px; font-size:16px;">Convert to Uppercase</button>
        <pre id="result" style="margin-top:20px; background:#f0f0f0; padding:10px;"></pre>

        <script>
            document.getElementById("renameBtn").addEventListener("click", async () => {
                let response = await fetch("/rename", { method: "POST" });
                let data = await response.json();
                document.getElementById("result").textContent =
                    "Renamed Files:\\n" + data.renamed.map(r => `${r[0]} → ${r[1]}`).join("\\n");
            });
        </script>
    </body>
    </html>
    """

@app.route("/rename", methods=["POST"])
def rename_files():
    renamed_files = []
    for root, dirs, files in os.walk(FOLDER_PATH):
        for filename in files:
            old_path = os.path.join(root, filename)
            new_filename = filename.upper()
            new_path = os.path.join(root, new_filename)
            if old_path != new_path:
                os.rename(old_path, new_path)
                renamed_files.append((filename, new_filename))
    return jsonify({"status": "success", "renamed": renamed_files})

if __name__ == "__main__":
    # Open browser automatically
    webbrowser.open("http://localhost:5000")
    app.run(port=5000)
