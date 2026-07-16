// Add Geofence Interactivity logic with Leaflet.js Real Map & Gestures

// Initialise Lucide icons
try {
    lucide.createIcons();
} catch (e) {
    console.warn("Lucide icons failed to load:", e);
}

// Select DOM elements
const slider = document.getElementById('radiusSlider');
const radiusVal = document.getElementById('radiusVal');
const publishBtn = document.getElementById('publishBtn');

// Initialise Leaflet Map
// Barcelona - Pubilla Cases coordinates matching mockup
const initialCenter = [42.1190, 2.7580];
const map = L.map('map', {
    zoomControl: false,       // We bind our own UI zoom buttons
    attributionControl: false // Keeps bottom bar clean
}).setView(initialCenter, 13);

// Load official Google Maps standard road map layer (with English labels and 2x Retina scaling)
L.tileLayer('https://{s}.google.com/vt/lyrs=m&hl=en&x={x}&y={y}&z={z}&scale=2&apistyle=s.t:2|p.v:off', {
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
    maxZoom: 20,
    minZoom: 10,
    tileSize: 256,
    zoomOffset: 0
}).addTo(map);

// Add dynamic Leaflet circle representing the Geofence
let geofenceCircle = L.circle(initialCenter, {
    color: '#7cd118',
    fillColor: '#7cd118',
    fillOpacity: 0.22,
    weight: 2.5,
    radius: parseFloat(slider.value) * 1000 // Convert km to meters
}).addTo(map);

// Custom Leaflet DivIcon for the teardrop pin
const pinIcon = L.divIcon({
    className: 'custom-pin-icon',
    html: `
        <div style="width: 44px; height: 46px; position: relative; user-select: none; pointer-events: none; filter: drop-shadow(0 6px 12px rgba(15, 23, 42, 0.1));">
            <!-- Teardrop Body (rendered on top, z-index: 2) -->
            <div style="width: 44px; height: 44px; background: #ffffff; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); display: flex; align-items: center; justify-content: center; border: 0.5px solid rgba(0, 0, 0, 0.03); position: absolute; top: 0; left: 0; z-index: 2;">
                <div style="width: 32px; height: 32px; background: #7cd118; border-radius: 50%; transform: rotate(45deg); display: flex; align-items: center; justify-content: center; box-shadow: inset 0 2px 4px rgba(255, 255, 255, 0.2);">
                    <svg viewBox="0 0 24 24" fill="none" style="width: 16px; height: 16px;">
                        <path d="M21 3L3 10.5L11.5 13.5L14.5 22L21 3Z" fill="#ffffff" stroke="#ffffff" stroke-width="2" stroke-linejoin="round"/>
                    </svg>
                </div>
            </div>
            <!-- Shadow Ellipse (rendered underneath, z-index: 1) -->
            <div style="width: 12px; height: 4px; background: rgba(15, 23, 42, 0.35); border-radius: 50%; filter: blur(0.5px); position: absolute; bottom: 0; left: 16px; z-index: 1;"></div>
        </div>
    `,
    iconSize: [44, 46],
    iconAnchor: [22, 44]
});

// Create dynamic draggable marker representing the location pin
let geofenceMarker = L.marker(initialCenter, {
    icon: pinIcon,
    draggable: true
}).addTo(map);

// Update circle center when marker is dragged
geofenceMarker.on('drag', () => {
    geofenceCircle.setLatLng(geofenceMarker.getLatLng());
});

// Long Press Gesture Recognition:
let pressTimer;
const LONG_PRESS_DURATION = 500; // ms (standard hold duration)

function handleLongPress(latlng) {
    geofenceMarker.setLatLng(latlng);
    geofenceCircle.setLatLng(latlng);
    map.setView(latlng, map.getZoom());
    map.panBy([0, 150], { animate: true });
}

function startPress(latlng) {
    clearTimeout(pressTimer);
    pressTimer = setTimeout(() => {
        handleLongPress(latlng);
    }, LONG_PRESS_DURATION);
}

function cancelPress() {
    clearTimeout(pressTimer);
}

// Map event bindings for hold gesture detection
map.on('mousedown', (e) => {
    if (e.originalEvent.button === 0) { // Left click
        startPress(e.latlng);
    }
});

map.on('touchstart', (e) => {
    if (e.originalEvent.touches && e.originalEvent.touches.length > 0) {
        const touch = e.originalEvent.touches[0];
        const containerPoint = map.mouseEventToContainerPoint(touch);
        const latlng = map.containerPointToLatLng(containerPoint);
        startPress(latlng);
    }
});

map.on('mouseup', cancelPress);
map.on('mousemove', cancelPress);
map.on('touchend', cancelPress);
map.on('touchmove', cancelPress);
map.on('zoomstart', cancelPress);
map.on('movestart', cancelPress);

// Slider color track and circle radius updating
function updateGeofence(value) {
    const val = parseFloat(value);
    
    // Update numerical representation
    radiusVal.textContent = val.toFixed(2);

    // Update dynamic Leaflet circle radius
    if (geofenceCircle) {
        geofenceCircle.setRadius(val * 1000);
    }

    // Set interactive fill-range gradient styling
    const percent = (val / slider.max) * 100;
    slider.style.background = `linear-gradient(to right, #7cd118 0%, #7cd118 ${percent}%, #e2e8f0 ${percent}%, #e2e8f0 100%)`;
}

// Event Listeners for range slider responsiveness
slider.addEventListener('input', (e) => {
    updateGeofence(e.target.value);
});

// Initialize with default mockup value (1.08km)
updateGeofence(slider.value);

// Map Zooming (using controls panel)
function adjustZoom(amount) {
    if (amount > 0) {
        map.zoomIn();
    } else {
        map.zoomOut();
    }
}

// Layout action control triggers
function toggleLayers() {
    alert("Map Layers configuration: Select Satellites, Terrains, or Default Hybrid views.");
}

function toggleFilter() {
    alert("Filters settings: Toggle nodes, users, and tracking beacons visibility.");
}

function handleBack() {
    alert("Navigate back to Home/Dashboard.");
}

// Publish Geofence CTA handling with loader status
function handlePublish() {
    publishBtn.disabled = true;
    publishBtn.innerHTML = `
        <svg class="spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor" style="width: 18px; height: 18px; margin-right: 8px;">
            <circle cx="12" cy="12" r="10" stroke-width="3" stroke-dasharray="32" stroke-linecap="round"/>
        </svg>
        Publishing...
    `;
    
    // Get final coordinates from the geofence marker pin and radius details
    const center = geofenceMarker.getLatLng();
    const finalRadius = parseFloat(slider.value).toFixed(2);

    setTimeout(() => {
        publishBtn.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" style="width: 18px; height: 18px; margin-right: 8px;">
                <path d="M20 6L9 17l-5-5" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            Geofence Published!
        `;
        
        setTimeout(() => {
            alert(`Geofence successfully published!\n\nCenter: Lat ${center.lat.toFixed(5)}, Lng ${center.lng.toFixed(5)}\nRadius: ${finalRadius} km`);
            // Reset state
            publishBtn.disabled = false;
            publishBtn.textContent = "Publish Geofence";
        }, 1000);
    }, 2000);
}

// Fix Leaflet zero-height initialization issue in responsive containers
window.addEventListener('load', () => {
    setTimeout(() => {
        map.invalidateSize();
        map.setView(initialCenter, 13);
        map.panBy([0, 120], { animate: false });

        // Inject animation class on the Leaflet SVG circle path after render
        const circleEl = geofenceCircle.getElement();
        if (circleEl) {
            circleEl.classList.add('geofence-animated');
        }
    }, 200);
});
