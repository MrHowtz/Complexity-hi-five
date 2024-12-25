import h5py
import json
import os

# Constants
SAMPLING_RATE = 100  # Hz
time_step = 1 / SAMPLING_RATE

# File paths (GitHub Codespaces compatible)
h5_file_path = os.path.join(os.getcwd(), "data", "input_file.h5")
output_json_path = os.path.join(os.getcwd(), "output", "fhir_observations.json")

# Ensure output directory exists
os.makedirs(os.path.dirname(output_json_path), exist_ok=True)

# Function to process the H5 file and generate FHIR-compliant JSON
def process_h5_to_fhir(h5_file_path, output_json_path):
    # Load the data from the H5 file
    with h5py.File(h5_file_path, "r") as h5_file:
        raw_group = h5_file["98:D3:21:FC:8B:12/raw"]
        ecg_data = raw_group["channel_2"][:].flatten()  # ECG signal
        sequence_numbers = raw_group["nSeq"][:].flatten()  # Sequence numbers

    # Generate timestamps
    timestamps = sequence_numbers * time_step

    # Create FHIR Observation resources
    fhir_observations = [
        {
            "resourceType": "Observation",
            "id": str(int(seq_num)),
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
            "effectiveDateTime": f"2024-12-23T00:00:{timestamps[i]:.2f}Z",
            "valueQuantity": {
                "value": float(ecg_data[i]),
                "unit": "mV",
                "system": "http://unitsofmeasure.org",
                "code": "mV"
            }
        }
        for i, seq_num in enumerate(sequence_numbers)
    ]

    # Save the FHIR observations to a JSON file
    with open(output_json_path, "w") as json_file:
        json.dump(fhir_observations, json_file, indent=4)

    print(f"FHIR observations saved to {output_json_path}")

# Run the processing function
process_h5_to_fhir(h5_file_path, output_json_path)
