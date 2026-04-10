import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, LayersControl } from 'react-leaflet';
import L from 'leaflet';
import { useTheme } from '../../context/ThemeContext';
import apiClient from '../../api/client';
import { Search, Maximize } from 'lucide-react';
import './DisasterMap.css';

// Fix Leaflet icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// Markers
const IncidentIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const VolunteerIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Component to recenter map cleanly
function RecenterMap({ lat, lng, zoomLvl = 13 }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lng], zoomLvl, { animate: true, duration: 1.5 });
  }, [lat, lng, zoomLvl, map]);
  return null;
}

function DisasterMap() {
  const { theme } = useTheme();
  
  const [locations, setLocations] = useState([]);
  const [incidentMarkers, setIncidentMarkers] = useState([]);
  const [volunteerMarkers, setVolunteerMarkers] = useState([]);
  
  const [userCenter, setUserCenter] = useState({ lat: 37.7749, lng: -122.4194 });
  const [hasUserLoc, setHasUserLoc] = useState(false);
  const [zoomLvl, setZoomLvl] = useState(4);

  // Search Logic
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  useEffect(() => {
    // 1. Get browser native GPS
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserCenter({ lat: position.coords.latitude, lng: position.coords.longitude });
          setHasUserLoc(true);
          setZoomLvl(13);
        },
        (error) => console.log("Geolocation permission denied or failed.", error)
      );
    }

    // 2. Fetch Map Database Payload
    const fetchMapData = async () => {
      try {
        const [locRes, repRes] = await Promise.all([
          apiClient.get('/maps/locations'),
          apiClient.get('/disaster/reports')
        ]);
        
        let volRes = { data: [] };
        try {
            // Attempt to fetch vols (might fail if not admin)
            volRes = await apiClient.get('/volunteers/');
        } catch(e) {}

        setLocations(locRes.data);

        // 3. Scan incident strings for hidden GPS payloads
        const livePins = [];
        repRes.data.forEach(report => {
            if (report.status !== 'resolved' && report.location) {
                const parts = report.location.split(',');
                if (parts.length === 2) {
                    const lat = parseFloat(parts[0].trim());
                    const lng = parseFloat(parts[1].trim());
                    if (!isNaN(lat) && !isNaN(lng)) livePins.push({ ...report, lat, lng });
                }
            }
        });
        setIncidentMarkers(livePins);

        // 4. Scan volunteer strings
        const liveVols = [];
        volRes.data.forEach(vol => {
            if (vol.location) {
                const parts = vol.location.split(',');
                if (parts.length === 2) {
                    const lat = parseFloat(parts[0].trim());
                    const lng = parseFloat(parts[1].trim());
                    if (!isNaN(lat) && !isNaN(lng)) liveVols.push({ ...vol, lat, lng });
                }
            }
        });
        setVolunteerMarkers(liveVols);

      } catch (err) {
        console.error("Failed to load map arrays:", err);
      }
    };
    
    fetchMapData();
  }, []);

  // Live Search Execution
  const handleSearch = (e) => {
      const q = e.target.value;
      setSearchQuery(q);
      if (q.length < 2) {
          setSearchResults([]);
          return;
      }
      
      const lower = q.toLowerCase();
      const hits = [];
      
      incidentMarkers.forEach(inc => {
          if (inc.title.toLowerCase().includes(lower)) {
              hits.push({ label: `[INCIDENT] ${inc.title}`, lat: inc.lat, lng: inc.lng });
          }
      });
      locations.forEach(loc => {
          if (loc.name.toLowerCase().includes(lower)) {
              hits.push({ label: `[SHELTER] ${loc.name}`, lat: loc.latitude, lng: loc.longitude });
          }
      });
      volunteerMarkers.forEach(vol => {
          if (vol.skills && vol.skills.toLowerCase().includes(lower)) {
              hits.push({ label: `[VOLUNTEER] User ${vol.user_id} - ${vol.skills}`, lat: vol.lat, lng: vol.lng });
          }
      });
      
      setSearchResults(hits);
  };

  const executeJump = (lat, lng) => {
      setUserCenter({ lat, lng });
      setZoomLvl(16);
      setSearchResults([]);
      setSearchQuery('');
  };

  const tileContainerRef = React.useRef(null);
  const toggleFullscreen = () => {
      if (!document.fullscreenElement) {
          tileContainerRef.current?.requestFullscreen().catch(err => console.log(err));
      } else {
          document.exitFullscreen();
      }
  };

  const streetUrl = theme === 'dark' 
    ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
    : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";
    
  return (
    <div className="map-wrapper glass-panel" style={{position:'relative'}}>
      <div className="map-header" style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <div style={{display:'flex', alignItems:'center', gap:'16px'}}>
            <h3>Live Interactive Map</h3>
            <button className="icon-btn" onClick={toggleFullscreen} style={{opacity: 0.7}} title="Enter Fullscreen"><Maximize size={18} /></button>
        </div>
        
        {/* Global Embedded Search */}
        <div style={{position:'relative', width: '300px'}}>
            <div style={{display:'flex', alignItems:'center', background:'var(--bg-primary)', borderRadius:'6px', padding:'4px 12px', border:'1px solid var(--border-color)'}}>
                <Search size={16} color="var(--text-muted)" />
                <input 
                    type="text" 
                    placeholder="Find Incident or Shelter..." 
                    value={searchQuery}
                    onChange={handleSearch}
                    style={{border:'none', background:'transparent', outline:'none', marginLeft:'8px', color:'var(--text-primary)', width:'100%'}} 
                />
            </div>
            {searchResults.length > 0 && (
                <div style={{position:'absolute', top:'100%', left:0, right:0, background:'var(--bg-primary)', border:'1px solid var(--border-color)', zIndex:1000, maxHeight:'200px', overflowY:'auto'}}>
                    {searchResults.map((res, i) => (
                        <div key={i} onClick={() => executeJump(res.lat, res.lng)} style={{padding:'8px', cursor:'pointer', borderBottom:'1px solid var(--border-color)', color:'var(--text-primary)', fontSize:'0.85rem'}}>
                            {res.label}
                        </div>
                    ))}
                </div>
            )}
        </div>
      </div>
      
      <div ref={tileContainerRef} className="map-container-inner" style={{ zIndex: 0, background: 'var(--bg-primary)' }}>
        <MapContainer center={[userCenter.lat, userCenter.lng]} zoom={zoomLvl} style={{ height: '100%', width: '100%' }}>
          
          <LayersControl position="topright">
              <LayersControl.BaseLayer checked name={`Street Map (${theme})`}>
                  <TileLayer url={streetUrl} attribution='&copy; CARTO' />
              </LayersControl.BaseLayer>
              <LayersControl.BaseLayer name="Deep Satellite">
                  <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" attribution='&copy; Esri World Imagery' />
              </LayersControl.BaseLayer>
          </LayersControl>
          
          <RecenterMap lat={userCenter.lat} lng={userCenter.lng} zoomLvl={zoomLvl} />

          {/* Render User Location If Enabled */}
          {hasUserLoc && (
              <Marker position={[userCenter.lat, userCenter.lng]}>
                 <Popup>
                    <strong>Your Current Location</strong><br/>
                    Broadcasting active position.
                 </Popup>
              </Marker>
          )}

          {/* Render Shelters/Headquarters (Standard Blue) */}
          {locations.map((loc) => (
             <Marker key={`loc-${loc.id}`} position={[loc.latitude, loc.longitude]}>
               <Popup>
                 <strong>{loc.name}</strong><br />
                 <em>Registered {loc.type.toUpperCase()}</em>
               </Popup>
             </Marker>
          ))}

          {/* Render Active Urgencies (Critical Red) */}
          {incidentMarkers.map((inc) => (
             <Marker key={`inc-${inc.id}`} position={[inc.lat, inc.lng]} icon={IncidentIcon}>
               <Popup>
                 <strong>CRITICAL: {inc.title}</strong><br />
                 {inc.description}<br/>
                 <small style={{color:'red'}}>{inc.status.toUpperCase()}</small>
               </Popup>
             </Marker>
          ))}
          
          {/* Render Field Volunteers (Tactical Green) */}
          {volunteerMarkers.map((vol) => (
             <Marker key={`vol-${vol.id}`} position={[vol.lat, vol.lng]} icon={VolunteerIcon}>
               <Popup>
                 <strong>Deployment ID: V-{vol.user_id}</strong><br />
                 Skills: {vol.skills}<br/>
                 <small style={{color:'green'}}>{vol.availability ? 'AVAILABLE' : 'FIELD DEPLOYED'}</small>
               </Popup>
             </Marker>
          ))}
          
        </MapContainer>
      </div>
    </div>
  );
}

export default DisasterMap;
