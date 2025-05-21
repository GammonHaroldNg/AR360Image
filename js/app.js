// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ 
  antialias: true, 
  alpha: true,
  powerPreference: "high-performance"
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

// Camera controls
let isDragging = false;
let previousMousePosition = { x: 0, y: 0 };
let cameraRotation = { x: 0, y: 0 };
const ROTATION_SPEED = 0.005;

// 360° image sphere
const geometry = new THREE.SphereGeometry(500, 60, 40);
geometry.scale(-1, 1, 1);

const texture = new THREE.TextureLoader().load('assets/Panorama 7D6346.jpg');
const material = new THREE.MeshBasicMaterial({ 
  map: texture,
  transparent: true,
  opacity: 1.0
});

const sphere = new THREE.Mesh(geometry, material);
scene.add(sphere);

// Camera position
camera.position.z = 0.1;

// Camera view variables
let videoSphere = null;
let videoStream = null;
let isCameraActive = false;

// Setup camera view (flat plane)
async function setupCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ 
      video: { 
        facingMode: 'environment',
        width: { ideal: 1280 },
        height: { ideal: 720 }
      } 
    });
    videoStream = stream;
    
    const video = document.createElement('video');
    video.srcObject = stream;
    video.play();
    
    const videoTexture = new THREE.VideoTexture(video);
    const videoMaterial = new THREE.MeshBasicMaterial({ 
      map: videoTexture,
      transparent: true,
      opacity: 0.5
    });
    
    // Create flat plane for camera view
    const videoGeometry = new THREE.PlaneGeometry(1000, 500);
    videoSphere = new THREE.Mesh(videoGeometry, videoMaterial);
    videoSphere.position.z = -500;
    scene.add(videoSphere);
    
    // Set 360 image to 50% opacity
    material.opacity = 0.5;
    document.getElementById('opacity-slider').value = 0.5;
    
    return true;
  } catch(err) {
    console.error("Camera error:", err);
    alert("Camera access is required for AR functionality");
    return false;
  }
}

// Toggle camera function
async function toggleCamera() {
  if (!isCameraActive) {
    const success = await setupCamera();
    if (success) {
      isCameraActive = true;
      document.getElementById('camera-toggle').textContent = "Disable Camera";
    }
  } else {
    // Disable camera
    videoStream.getTracks().forEach(track => track.stop());
    videoStream = null;
    scene.remove(videoSphere);
    videoSphere = null;
    isCameraActive = false;
    document.getElementById('camera-toggle').textContent = "Enable Camera";
    // Reset 360 image to full opacity
    material.opacity = 1.0;
    document.getElementById('opacity-slider').value = 1.0;
  }
}

// Mouse/touch controls
function onMouseDown(event) {
  isDragging = true;
  previousMousePosition = {
    x: event.clientX || event.touches[0].clientX,
    y: event.clientY || event.touches[0].clientY
  };
}

function onMouseMove(event) {
  if (!isDragging) return;
  
  const currentX = event.clientX || event.touches[0].clientX;
  const currentY = event.clientY || event.touches[0].clientY;
  
  const deltaX = currentX - previousMousePosition.x;
  const deltaY = currentY - previousMousePosition.y;
  
  cameraRotation.y += deltaX * ROTATION_SPEED;
  cameraRotation.x += deltaY * ROTATION_SPEED;
  
  // Limit vertical rotation
  cameraRotation.x = Math.max(-Math.PI/2, Math.min(Math.PI/2, cameraRotation.x));
  
  previousMousePosition = { x: currentX, y: currentY };
}

function onMouseUp() {
  isDragging = false;
}

// Reset view function
function resetView() {
  cameraRotation = { x: 0, y: 0 };
}

// Event listeners
renderer.domElement.addEventListener('mousedown', onMouseDown);
renderer.domElement.addEventListener('mousemove', onMouseMove);
renderer.domElement.addEventListener('mouseup', onMouseUp);
renderer.domElement.addEventListener('mouseleave', onMouseUp);

// Touch support
renderer.domElement.addEventListener('touchstart', onMouseDown);
renderer.domElement.addEventListener('touchmove', onMouseMove);
renderer.domElement.addEventListener('touchend', onMouseUp);

// Button controls
document.getElementById('camera-toggle').addEventListener('click', toggleCamera);
document.getElementById('reset-view').addEventListener('click', resetView);

// Opacity control
document.getElementById('opacity-slider').addEventListener('input', function() {
  material.opacity = parseFloat(this.value);
  if (videoSphere) {
    videoSphere.material.opacity = 1 - parseFloat(this.value);
  }
});

// Handle window resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Hide loader when everything is ready
window.addEventListener('load', () => {
  document.getElementById('loader').style.display = 'none';
});

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  
  // Apply rotation
  sphere.rotation.y = cameraRotation.y;
  sphere.rotation.x = cameraRotation.x;
  
  renderer.render(scene, camera);
}
animate();
