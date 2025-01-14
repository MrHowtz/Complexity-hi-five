import bitalino
import json
import time

MAC_ADDRESS = "00:00:00:00:00:00"  # Replace with your Bitalino's MAC
OUTPUT_FILE = "./output/real_time_data.json"
SAMPLING_RATE = 100

device = bitalino.BITalino(MAC_ADDRESS)

try:
    device.start(SAMPLING_RATE, [2])
    print("Acquiring data...")
    data = []
    start_time = time.time()

    while time.time() - start_time < 10:
        frame = device.read(10)
        for f in frame:
            data.append({"time": time.time(), "value": f[2] * 0.003})

    with open(OUTPUT_FILE, "w") as file:
        json.dump(data, file)
    print("Data saved to", OUTPUT_FILE)
finally:
    device.stop()
    device.close()
