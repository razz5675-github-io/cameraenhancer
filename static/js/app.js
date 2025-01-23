document.addEventListener('DOMContentLoaded', async () => {
    const video = document.getElementById('video');
    const canvas = document.getElementById('canvas');
    const context = canvas.getContext('2d');
    const filterSelect = document.getElementById('filter');
    const controls = document.querySelector('.controls');
    const permissionError = document.querySelector('.permission-error');
    const retryPermission = document.getElementById('retryPermission');
    const filterToggle = document.createElement('button');
    filterToggle.textContent = '🔄';
    filterToggle.className = 'filter-toggle circle-btn';
    document.body.appendChild(filterToggle);

    // Configuration from XML, focusing on visual effects
    const config = {
        'aqua_sky': {
            saturation: 2.5,
            vignette: 0.375,
            profileTitle: '🪂AQUA SKY'
        },
        'sunset_nature': {
            saturation: 2.0,
            contrast: 1.5,
            profileTitle: '🔥SUNSET & NATURE'
        },
        'super_night': {
            brightness: 0.8,
            contrast: 1.2,
            profileTitle: '🌃SUPER NIGHT'
        },
        'sky_blue': {
            saturation: 2.5,
            profileTitle: '⛱️SKY BLUE'
        },
        'macro_lens': {
            sharpness: 2.0,
            saturation: 2.0,
            profileTitle: '🔬MACRO LENS'
        },
        'black_style': {
            contrast: 1.375,
            saturation: 0.0,
            profileTitle: '🧤BLACK STYLE'
        },
        'red_apple': {
            hueRotate: '90deg',
            saturation: 1.5,
            profileTitle: '🍎RED APPLE'
        },
        'pixel_color': {
            saturation: 1.625,
            contrast: 1.125,
            profileTitle: '💥PIXEL COLOR'
        },
        'hd_color': {
            saturation: 3.0,
            contrast: 1.25,
            profileTitle: '🌶️HD COLOR'
        },
        'green_park': {
            saturation: 1.625,
            profileTitle: '🌴GREEN PARK'
        },
        'beauty_selfie': {
            saturation: 2.0,
            profileTitle: '🤳BEAUTY SELFIE'
        },
        'selfie': {
            saturation: 1.375,
            profileTitle: '🤳SELFIE'
        },
        'moonlit_night': {
            brightness: 0.375,
            contrast: 1.5,
            profileTitle: '🌙MOONLIT NIGHT'
        },
        'dslr_max': {
            saturation: 2.125,
            profileTitle: '📸DSLR MAX'
        },
        'dslr_max_2': {
            saturation: 2.25,
            profileTitle: '👫DSLR MAX'
        },
        'contrast_default': {
            contrast: 1.0,
            profileTitle: 'DEFAULT CONTRAST'
        },
        'saturation_default': {
            saturation: 1.0,
            profileTitle: 'DEFAULT SATURATION'
        },
    };

    // Function to handle camera permission
    async function startCamera() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } } });
            video.srcObject = stream;
            video.play();
            permissionError.style.display = 'none';
        } catch (error) {
            console.error('Camera access error:', error);
            permissionError.style.display = 'block';
        }
    }

    startCamera();

    // Apply filter in real-time
    function applyFilter() {
        const filter = filterSelect.value;
        if (config[filter]) {
            const filterSettings = config[filter];
            let cssFilter = '';

            if (filterSettings.saturation) cssFilter += `saturate(${filterSettings.saturation}) `;
            if (filterSettings.brightness) cssFilter += `brightness(${filterSettings.brightness}) `;
            if (filterSettings.contrast) cssFilter += `contrast(${filterSettings.contrast}) `;
            if (filterSettings.hueRotate) cssFilter += `hue-rotate(${filterSettings.hueRotate}) `;

            context.filter = cssFilter.trim();
            context.drawImage(video, 0, 0, canvas.width, canvas.height);

            // Vignette effect
            if (filterSettings.vignette) {
                const gradient = context.createRadialGradient(canvas.width / 2, canvas.height / 2, 0, canvas.width / 2, canvas.height / 2, Math.max(canvas.width, canvas.height));
                gradient.addColorStop(0, 'rgba(0,0,0,0)');
                gradient.addColorStop(filterSettings.vignette, 'rgba(0,0,0,0.5)');
                context.globalCompositeOperation = 'multiply';
                context.fillStyle = gradient;
                context.fillRect(0, 0, canvas.width, canvas.height);
                context.globalCompositeOperation = 'source-over';
            }

            // Simplified sharpness effect
            if (filterSettings.sharpness) {
                const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
                const data = imageData.data;
                for (let i = 1; i < canvas.height - 1; i++) {
                    for (let j = 1; j < canvas.width - 1; j++) {
                        let r = 0, g = 0, b = 0;
                        for (let k = -1; k <= 1; k++) {
                            for (let l = -1; l <= 1; l++) {
                                const pixelIndex = ((i + k) * canvas.width + (j + l)) * 4;
                                r += data[pixelIndex] * (k === 0 && l === 0 ? 4 : -1);
                                g += data[pixelIndex + 1] * (k === 0 && l === 0 ? 4 : -1);
                                b += data[pixelIndex + 2] * (k === 0 && l === 0 ? 4 : -1);
                            }
                        }
                        const pixelIndex = (i * canvas.width + j) * 4;
                        data[pixelIndex] = Math.max(0, Math.min(255, r / 8 * filterSettings.sharpness + data[pixelIndex]));
                        data[pixelIndex + 1] = Math.max(0, Math.min(255, g / 8 * filterSettings.sharpness + data[pixelIndex + 1]));
                        data[pixelIndex + 2] = Math.max(0, Math.min(255, b / 8 * filterSettings.sharpness + data[pixelIndex + 2]));
                    }
                }
                context.putImageData(imageData, 0, 0);
            }
        } else {
            context.filter = 'none';
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
        }
    }

    // Real-time filter application
    filterSelect.addEventListener('change', applyFilter);

    // Capture image
    document.getElementById('capture').addEventListener('click', () => {
        const link = document.createElement('a');
        link.download = 'photo.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
    });

    // Save current frame
    document.getElementById('save').addEventListener('click', () => {
        const link = document.createElement('a');
        link.download = 'photo.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
    });

    // Enhance image (basic enhancement)
    document.getElementById('enhance').addEventListener('click', () => {
        context.filter = 'contrast(1.1) brightness(1.05)';
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        // Placeholder for enhancement logic; here we just increase contrast and brightness.
    });

    // Toggle Camera Effect
    document.getElementById('toggleCamera').addEventListener('click', () => {
        if (video.style.filter === 'grayscale(100%)') {
            video.style.filter = 'none';
        } else {
            video.style.filter = 'grayscale(100%)';
        }
    });

    // Toggle Fullscreen
    document.getElementById('toggleFullscreen').addEventListener('click', () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    });

    // Toggle Flash (simulated)
    document.getElementById('toggleFlash').addEventListener('click', () => {
        video.style.filter = video.style.filter === 'brightness(1.5)' ? 'none' : 'brightness(1.5)';
    });

    // Toggle Zoom
    let zoomLevel = 1;
    document.getElementById('toggleZoom').addEventListener('click', () => {
        zoomLevel = zoomLevel === 1 ? 2 : 1;
        video.style.transform = `scale(${zoomLevel})`;
        video.style.transformOrigin = 'center';
    });

    // Toggle Filter Panel
    let filterPanelVisible = true;
    filterToggle.addEventListener('click', () => {
        filterPanelVisible = !filterPanelVisible;
        filterSelect.parentElement.style.display = filterPanelVisible ? 'flex' : 'none';
    });

    // Adjust canvas size when video metadata is loaded
    video.addEventListener('loadedmetadata', () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        applyFilter(); // Apply initial filter when video starts
    });

    // Update canvas in real-time for effects and enhancements
    function updateCanvas() {
        if (!video.paused && !video.ended) {
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            applyFilter();
        }
        requestAnimationFrame(updateCanvas);
    }

    updateCanvas();

    // Populate filter select options
    Object.keys(config).forEach(key => {
        const option = document.createElement('option');
        option.value = key;
        option.textContent = config[key].profileTitle;
        filterSelect.appendChild(option);
    });

    // Ensure filter panel is visible by default on larger screens
    if (window.innerWidth > 600) {
        filterSelect.parentElement.style.display = 'flex';
        filterToggle.style.display = 'none';
    } else {
        filterSelect.parentElement.style.display = 'none';
        filterToggle.style.display = 'block';
    }

    // Handle window resizing to toggle filter panel visibility
    window.addEventListener('resize', () => {
        if (window.innerWidth > 600) {
            filterSelect.parentElement.style.display = 'flex';
            filterToggle.style.display = 'none';
        } else {
            filterSelect.parentElement.style.display = filterPanelVisible ? 'flex' : 'none';
            filterToggle.style.display = 'block';
        }
    });
});
