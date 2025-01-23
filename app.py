from flask import Flask, render_template, request, send_file
from PIL import Image
import numpy as np
import cv2
import math
import os
import base64
from io import BytesIO

app = Flask(__name__)

# Ensure the temp directory exists
if not os.path.exists('temp'):
    os.makedirs('temp')

def pixelMapping(img, scale):
    height, width, _ = img.shape
    resizedHeight = height * scale
    resizedWidth = width * scale
    resized = np.zeros((resizedHeight, resizedWidth, 3), np.uint8)

    pixelX = 0
    pixelY = 0
    for x in range(resizedWidth):
        for y in range(resizedHeight):
            if pixelX * scale == x and pixelY * scale == y:
                resized[y, x] = img[pixelY, pixelX]
                pixelY += 1
                black = False
            else:
                if y == 0:
                    black = True
                    break
                resized[y, x] = [0, 0, 0]
        if not black:
            pixelX += 1
        pixelY = 0
    return resized

def bilinearInterpolation(img, step):
    height, width, _ = img.shape
    x1 = 0
    x2 = step
    left = img[0,0]
    lb,lg,lr = left

    right = img[0, x2]
    rb,rg,rr = right

    # Interpolate rows
    for y in range(height):
        if y % step == 0:
            for x in range(1, width):
                if x % step != 0:
                    b = ((x2 - x) / (x2 - x1)) * lb + ((x - x1) / (x2 - x1)) * rb
                    g = ((x2 - x) / (x2 - x1)) * lg + ((x - x1) / (x2 - x1)) * rg
                    r = ((x2 - x) / (x2 - x1)) * lr + ((x - x1) / (x2 - x1)) * rr
                    img[y, x] = [b, g, r]
                else:
                    x1 = x2
                    x2 += step
                    if x2 == width:
                        break
                    left = img[y, x]
                    lb,lg,lr = left
                    right = img[y, x2]
                    rb,rg,rr = right
        x1 = 0
        x2 = step

    left = img[0,0]
    lb,lg,lr = left
    right = img[x2, 0]
    rb,rg,rr = right

    # Interpolate columns
    for x in range(width):
        for y in range(1, height):
            if y % step != 0:
                b = ((x2 - y) / (x2 - x1)) * lb + ((y - x1) / (x2 - x1)) * rb
                g = ((x2 - y) / (x2 - x1)) * lg + ((y - x1) / (x2 - x1)) * rg
                r = ((x2 - y) / (x2 - x1)) * lr + ((y - x1) / (x2 - x1)) * rr
                img[y, x] = [b, g, r]
            else:
                x1 = x2
                x2 += step
                if x2 == height:
                    break
                left = img[y, x]
                lb,lg,lr = left
                right = img[x2, x]
                rb,rg,rr = right
        x1 = 0
        x2 = step

    return img

def nearestNeighbor(img, scale):
    height, width, _ = img.shape
    resizedHeight = height * scale
    resizedWidth = width * scale
    resized = np.zeros((resizedHeight, resizedWidth, 3), np.uint8)

    RatioCol = height / resizedHeight
    RatioRow = width / resizedWidth

    for x in range(resizedWidth):
        for y in range(resizedHeight):
            resized[y, x] = img[math.ceil((y+1) * RatioCol) - 1, math.ceil((x+1) * RatioRow) - 1]
    return resized

def upscale_image(image, scale=2, technique="bilinear"):
    img = np.array(image)
    img = cv2.cvtColor(img, cv2.COLOR_RGB2BGR)  # Convert from RGB to BGR for OpenCV

    if technique == "nearest":
        result = nearestNeighbor(img, scale)
    else:  # Default to bilinear
        mapped = pixelMapping(img, scale)
        result = bilinearInterpolation(mapped, scale)

    # Convert back to RGB for PIL
    result = cv2.cvtColor(result, cv2.COLOR_BGR2RGB)
    return Image.fromarray(result)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/capture', methods=['POST'])
def capture():
    # Decode the base64 image data from the POST request
    data = request.json['image']
    img_data = base64.b64decode(data.split(',')[1])

    # Save original image to temp directory
    original_image = Image.open(BytesIO(img_data))
    temp_file_name = f"temp/temp_{os.urandom(8).hex()}.png"
    original_image.save(temp_file_name)

    # Open the saved image with OpenCV for upscaling
    cv_img = cv2.imread(temp_file_name)
    if cv_img is None:
        return {"error": "Could not read the image file."}, 500

    # Convert to PIL Image and upscale
    pil_img = Image.fromarray(cv2.cvtColor(cv_img, cv2.COLOR_BGR2RGB))
    upscaled_image = upscale_image(pil_img)

    # Save the upscaled image to temp directory
    upscaled_file_name = f"temp/upscaled_{os.urandom(8).hex()}.png"
    upscaled_image.save(upscaled_file_name)

    # Send the upscaled image for download
    return send_file(upscaled_file_name, as_attachment=True, download_name='enhanced_photo.png')

if __name__ == '__main__':
    app.run(debug=True)
