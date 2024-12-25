import os
from flask import Flask, request, jsonify
import pandas as pd
from flask_cors import CORS
from analysis import analyze_heart_data

app = Flask(__name__)
CORS(app)  # Enable Cross-Origin Resource Sharing (CORS)

@app.route('/')
def home():
    # A simple endpoint to check if the server is running
    return "The server is running! Access /api/heart-data to analyze heart data."

@app.route('/api/heart-data', methods=['POST'])
def process_heart_data():
    # Receive JSON data from the request
    data = request.json
    heart_rate = data.get("heart_rate", [])
    if not heart_rate:
        return jsonify({"error": "No heart rate data provided"}), 400

    # Filter out invalid heart rate values
    valid_heart_rate = [rate for rate in heart_rate if 30 <= rate <= 200]

    if not valid_heart_rate:
        return jsonify({"error": "No valid heart rate data found"}), 400

    # Analyze the valid heart rate data
    analysis = analyze_heart_data(valid_heart_rate)
    return jsonify({"analysis": analysis})

@app.route('/upload', methods=['POST'])
def upload_file():
    # Handle file upload
    file = request.files.get('file')
    if not file:
        return jsonify({"error": "No file provided"}), 400
    
    try:
        # Read the file and extract the A2 column (assumed to be the 7th column)
        df = pd.read_csv(file, delimiter="\t", comment="#", header=None)
        heart_rate = df.iloc[:, 6].dropna().tolist()  # 7th column (0-indexed)

        # Filter out invalid heart rate values
        valid_heart_rate = [rate for rate in heart_rate if 30 <= rate <= 200]

        if not valid_heart_rate:
            return jsonify({"error": "No valid heart rate data found"}), 400
        
        # Analyze the valid heart rate data
        analysis = analyze_heart_data(valid_heart_rate)
        return jsonify({"heart_rate": valid_heart_rate, "analysis": analysis})
    except Exception as e:
        return jsonify({"error": f"Error processing file: {str(e)}"}), 500

if __name__ == '__main__':
    app.run(debug=True)
