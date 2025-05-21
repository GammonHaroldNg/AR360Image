// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

// Camera controls
let isDragging = false;
let previousMousePosition = { x: 0, y: 0 };
let cameraRotation = { x: 0, y: 0 };
let zoomLevel = 1;
const ZOOM_SENSITIVITY = 0.1;
const ROTATION_SPEED = 0.005;
let useGyro = false;

// 360° image sphere
const geometry = new THREE.SphereGeometry(500, 60, 40);
geometry.scale(-1, 1, 1);

const texture = new THREE.TextureLoader().load('assets/360-image.jpg');
const material = new THREE.MeshBasicMaterial({ 
  map: texture,
  transparent: true,
  opacity: 1.0
});

const sphere = new THREE.Mesh(geometry, material);
scene.add(sphere);

// Camera position
camera.position.z = 0.1;

// Video sphere (for AR view)
let videoSphere = null;
let videoStream = null;

// Mouse/touch controls
function onMouseDown(event) {
  isDragging = true;
  previousMousePosition = {
    x: event.clientX || event.touches[0].clientX,
    y: event.clientY || event.touches[0].clientY
  };
}

function onMouseMove(event) {
  if (!isDragging || useGyro) return;
  
  const currentX = event.clientX || event.touches[0].clientX;
  const currentY = event.clientY || event.touches[0].clientY;
  
  const deltaX = currentX - previousMousePosition.x;
  const deltaY = currentY - previousMousePosition.y;
  
  cameraRotation.y += deltaX * ROTATION_SPEED;
  cameraRotation.x += deltaY * ROTATION_SPEED;
  
  // Limit vertical rotation to prevent flipping
  cameraRotation.x = Math.max(-Math.PI/2, Math.min(Math.PI/2, cameraRotation.x));
  
  previousMousePosition = { x: currentX, y: currentY };
}

function onMouseUp() {
  isDragging = false;
}

// Zoom controls
function zoom(direction) {
  zoomLevel += direction * ZOOM_SENSITIVITY;
  zoomLevel = Math.max(0.5, Math.min(2, zoomLevel)); // Limit zoom range
  camera.fov = 75 / zoomLevel;
  camera.updateProjectionMatrix();
}

// Gyroscope controls
function setupGyro() {
  if (window.DeviceOrientationEvent) {
    window.addEventListener('deviceorientation', (event) => {
      if (!useGyro) return;
      
      // Use gamma (left/right tilt) for y rotation
      // Use beta (front/back tilt) for x rotation
      if (event.beta !== null && event.gamma !== null) {
        cameraRotation.y = -event.gamma * (Math.PI/180);
        cameraRotation.x = -event.beta * (Math.PI/180) + Math.PI/2;
      }
    });
  } else {
    alert("Gyroscope not supported on this device");
    document.getElementById('gyro-toggle').disabled = true;
  }
}

// Reset view
function resetView() {
  cameraRotation = { x: 0, y: 0 };
  zoomLevel = 1;
  camera.fov = 75;
  camera.updateProjectionMatrix();
  useGyro = false;
  document.getElementById('gyro-toggle').textContent = "Enable Gyro";
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
document.getElementById('zoom-in').addEventListener('click', () => zoom(1));
document.getElementById('zoom-out').addEventListener('click', () => zoom(-1));
document.getElementById('reset-view').addEventListener('click', resetView);
document.getElementById('gyro-toggle').addEventListener('click', () => {
  useGyro = !useGyro;
  this.textContent = useGyro ? "Disable Gyro" : "Enable Gyro";
});

// Camera AR view (existing functionality)
async function setupCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ 
      video: { facingMode: 'environment' } 
    });
    videoStream = stream;
    
    const video = document.createElement('video');
    video.srcObject = stream;
    video.play();
    
    const videoTexture = new THREE.VideoTexture(video);
    const videoMaterial = new THREE.MeshBasicMaterial({ 
      map: videoTexture,
      side: THREE.BackSide
    });
    
    const videoGeometry = new THREE.SphereGeometry(490, 60, 40);
    videoSphere = new THREE.Mesh(videoGeometry, videoMaterial);
    scene.add(videoSphere);
    
  } catch(err) {
    console.error("Camera error:", err);
    alert("Camera access is required for AR functionality");
  }
}

// Opacity control (existing functionality)
document.getElementById('opacity-slider').addEventListener('input', function() {
  material.opacity = parseFloat(this.value);
  
  if (material.opacity < 0.7 && !videoStream) {
    setupCamera();
  } else if (material.opacity >= 0.7 && videoStream) {
    videoStream.getTracks().forEach(track => track.stop());
    videoStream = null;
    if (videoSphere) scene.remove(videoSphere);
    videoSphere = null;
  }
});

// Initialize gyro
setupGyro();

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  
  // Apply rotation
  sphere.rotation.y = cameraRotation.y;
  sphere.rotation.x = cameraRotation.x;
  
  renderer.render(scene, camera);
}
animate();

// Handle window resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
