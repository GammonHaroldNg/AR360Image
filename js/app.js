// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

// Handle window resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// 360° image sphere
const geometry = new THREE.SphereGeometry(500, 60, 40);
geometry.scale(-1, 1, 1);

// Replace with your 360 image URL
const texture = new THREE.TextureLoader().load('assets/Panorama 7D6346.jpg');
const material = new THREE.MeshBasicMaterial({ 
  map: texture,
  transparent: true,
  opacity: 1.0
});

const sphere = new THREE.Mesh(geometry, material);
scene.add(sphere);

// Camera position
camera.position.set(0, 0, 0.1);

// Video sphere
let videoSphere = null;
let videoStream = null;

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

// Opacity control
const opacitySlider = document.getElementById('opacity-slider');
opacitySlider.addEventListener('input', function() {
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

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}
animate();
