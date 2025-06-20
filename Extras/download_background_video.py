# Download Background Video Script

import requests

# URL of the video (1080p quality)
VIDEO_URL = "https://video.wixstatic.com/video/11062b_e55321c53b02478b9bafa28958160488/1080p/mp4/file.mp4"
OUTPUT_FILE = "background_video.mp4"

def download_video(url, output_path):
    print(f"Downloading video from {url} ...")
    response = requests.get(url, stream=True)
    response.raise_for_status()
    with open(output_path, "wb") as f:
        for chunk in response.iter_content(chunk_size=8192):
            if chunk:
                f.write(chunk)
    print(f"Download complete: {output_path}")

if __name__ == "__main__":
    download_video(VIDEO_URL, OUTPUT_FILE)
