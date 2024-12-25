def analyze_heart_data(heart_rate):
    # Calculate the average heart rate
    avg_heart_rate = sum(heart_rate) / len(heart_rate)
    status = "normal"

    # Determine the status based on the average heart rate
    if avg_heart_rate > 100:
        status = "high"
    elif avg_heart_rate < 60:
        status = "low"

    # Return the analysis result as a dictionary
    return {
        "average_heart_rate": avg_heart_rate,
        "status": status,
        "message": f"The average heart rate is {avg_heart_rate:.2f}, which is considered {status}."
    }
