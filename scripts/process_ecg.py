import os
import h5py
import json
import numpy as np
from datetime import timedelta

def find_h5_file(data_dir="data"):
    """Find the first .h5 file in the specified directory."""
    for file_name in os.listdir(data_dir):
        if file_name.endswith(".h5"):
            return os.path.join(data_dir, file_name)
    raise FileNotFoundError("No .h5 file found in the data directory")

# Paths
h5_file_path = find_h5_file()  
output_json_path = os.path.join("output", "fhir_observations.json")

def seconds_to_hms(seconds):
    """Convert seconds to HH:MM:SS format."""
    return str(timedelta(seconds=seconds))

def process_h5_to_fhir_exact(h5_file_path, output_json_path):
    """Process an HDF5 file and create a JSON file with observations that match the .txt file results."""
    with h5py.File(h5_file_path, "r") as h5_file:
        # Access the raw ECG data
        raw_group = h5_file["98:D3:21:FC:8B:12/raw"]  # Modify path if necessary
        ecg_data = raw_group["channel_2"][:].flatten()  # Extract ECG data

    # Generate timestamps based on the index of each sample (mimicking the .txt file behavior)
    sampling_rate = 100  # 100 Hz as per the .txt file header
    time_step = 1 / sampling_rate
    timestamps = np.arange(len(ecg_data)) * time_step

    # Create FHIR-compliant Observation resources
    fhir_observations = [
        {
            "resourceType": "Observation",
            "id": str(i),
            "status": "final",
            "category": [
                {
                    "coding": [
                        {
                            "system": "http://hl7.org/fhir/observation-category",
                            "code": "vital-signs"
                        }
                    ]
                }
            ],
            "code": {
                "coding": [
                    {
                        "system": "http://loinc.org",
                        "code": "85354-9",
                        "display": "ECG"
                    }
                ]
            },
            "subject": {"reference": "Patient/1"},
            "effectiveDateTime": f"2024-12-23T00:{seconds_to_hms(timestamps[i])}",
            "valueQuantity": {
                "value": float(ecg_data[i]),
                "unit": "mV",
                "system": "http://unitsofmeasure.org",
                "code": "mV"
            }
        }
        for i in range(len(ecg_data))
    ]

    # Save the observations as a JSON file
    os.makedirs(os.path.dirname(output_json_path), exist_ok=True)
    with open(output_json_path, "w") as json_file:
        json.dump(fhir_observations, json_file, indent=4)

    print(f"FHIR observations saved to {output_json_path}")

# Run the processing function
process_h5_to_fhir_exact(h5_file_path, output_json_path)
