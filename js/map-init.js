/* ==============================================================
   map-init.js — WebGIS Map Initialization & Logic V2
============================================================== */

let map;
let activeLayers = {}; // Simpan layer GeoJSON yang dimuat berdasarkan ID
let layerCache = {};   // Cache fetched data

document.addEventListener('DOMContentLoaded', () => {
    initMap();
    initBasemaps();
    initControls();
    initLayerManagerEvents();
    loadInitialLayers();
});

function initMap() {
    // Pusat peta Desa Kaibonpetangkuran
    map = L.map('map', {
        zoomControl: false, // Kita pindah posisinya
        preferCanvas: true  // Wajib untuk html2canvas rendering polygon
    }).setView([-7.790, 109.735], 14);

    // Zoom control di kanan bawah (biar tidak tertutup sidebar kiri)
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Default basemap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);
}

function initBasemaps() {
    const basemaps = {
        osm: L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19, attribution: '&copy; OSM'
        }),
        satellite: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            maxZoom: 19, attribution: 'Tiles &copy; Esri'
        }),
        carto: L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
            maxZoom: 19, attribution: '&copy; CartoDB'
        })
    };

    // Listen to radio buttons in sidebar
    const radios = document.querySelectorAll('input[name="basemap"]');
    radios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            // Remove all
            Object.values(basemaps).forEach(layer => map.removeLayer(layer));
            // Add selected
            basemaps[e.target.value].addTo(map);
            // Urutkan ulang layer GeoJSON aktif ke paling atas
            Object.values(activeLayers).forEach(layer => {
                if (layer.bringToFront) layer.bringToFront();
            });
        });
    });
}

function initControls() {
    // Locate Control (GPS)
    L.control.locate({
        position: 'bottomright',
        icon: 'fas fa-crosshairs',
        strings: { title: "Tunjukkan lokasi saya" }
    }).addTo(map);

    // Geocoder plugin initialization removed since we use native fetch for better reliability

    const searchInput = document.getElementById('searchInput');
    const searchResults = document.getElementById('searchResults');
    const clearBtn = document.getElementById('clearSearchBtn');
    let searchMarker = null;

    function performSearch(query) {
        if (query.trim().length > 2) {
            clearBtn.style.display = 'block';
            
            Swal.fire({
                title: 'Mencari...',
                text: 'Sedang mencari lokasi "' + query + '"',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });
            
            const q = query.toLowerCase();
            
            // Search locally first in RT/RW and Dusun
            Promise.all([
                fetch('data/dusun.geojson').then(r => r.json()).catch(() => ({features: []})),
                fetch('data/rt_rw.geojson').then(r => r.json()).catch(() => ({features: []}))
            ]).then(([dusunData, rtrwData]) => {
                let localResults = [];
                
                if (dusunData && dusunData.features) {
                    dusunData.features.forEach(f => {
                        const name = (f.properties.Dusun || f.properties.dusun || '').toLowerCase();
                        if (name.includes(q)) {
                            localResults.push({
                                name: 'Dusun ' + (f.properties.Dusun || f.properties.dusun),
                                type: 'dusun',
                                feature: f
                            });
                        }
                    });
                }
                
                if (rtrwData && rtrwData.features) {
                    rtrwData.features.forEach(f => {
                        const label = (f.properties.Label || '').toLowerCase();
                        if (label.includes(q)) {
                            localResults.push({
                                name: f.properties.Label,
                                type: 'rtrw',
                                feature: f
                            });
                        }
                    });
                }

                if (localResults.length > 0) {
                    showSearchResultsPopup(localResults, query);
                } else {
                    // Fallback to Nominatim API
                    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query + ' Kebumen')}&countrycodes=id&limit=5`;
                    fetch(url)
                        .then(res => res.json())
                        .then(results => {
                            if (results && results.length > 0) {
                                let mappedResults = results.map(r => ({
                                    name: r.display_name,
                                    type: 'nominatim',
                                    lat: parseFloat(r.lat),
                                    lon: parseFloat(r.lon)
                                }));
                                showSearchResultsPopup(mappedResults, query);
                            } else {
                                Swal.fire({
                                    icon: 'error',
                                    title: 'Tidak Ditemukan',
                                    text: 'Lokasi "' + query + '" tidak ditemukan di Desa Kaibonpetangkuran maupun Kebumen.'
                                });
                            }
                        })
                        .catch(err => {
                            console.error('Search error:', err);
                            Swal.fire('Error', 'Terjadi kesalahan sistem (jaringan).', 'error');
                        });
                }
            });
        } else {
            clearBtn.style.display = 'none';
        }
    }

    function showSearchResultsPopup(results, query) {
        let html = '<div class="swal-search-results" style="text-align: left; max-height: 250px; overflow-y: auto;">';
        results.forEach((r, idx) => {
            html += `
            <div class="swal-search-item" data-idx="${idx}" style="padding: 12px; border-bottom: 1px solid #eee; cursor: pointer; border-radius: 5px; font-size: 14px;">
                <i class="fas fa-map-marker-alt" style="color: var(--primary-color); margin-right: 8px;"></i>
                ${r.name}
            </div>`;
        });
        html += '</div>';

        Swal.fire({
            title: `Hasil Pencarian: "${query}"`,
            html: html,
            showConfirmButton: false,
            showCloseButton: true,
            width: '500px',
            didRender: () => {
                document.querySelectorAll('.swal-search-item').forEach(el => {
                    el.addEventListener('click', function() {
                        const idx = this.getAttribute('data-idx');
                        const res = results[idx];
                        
                        if (searchMarker) map.removeLayer(searchMarker);
                        
                        if (res.type === 'nominatim') {
                            const center = [res.lat, res.lon];
                            searchMarker = L.marker(center).addTo(map);
                            map.setView(center, 16);
                        } else {
                            // It's a GeoJSON feature (Dusun or RTRW)
                            const tempLayer = L.geoJSON(res.feature);
                            const bounds = tempLayer.getBounds();
                            map.fitBounds(bounds, { padding: [20, 20], maxZoom: 17 });
                            
                            searchMarker = L.geoJSON(res.feature, {
                                style: { color: '#e74c3c', weight: 4, fillColor: '#e74c3c', fillOpacity: 0.2 }
                            }).addTo(map);
                            
                            searchMarker.bindPopup(`<b>${res.name}</b>`).openPopup();
                        }
                        
                        Swal.close();
                        searchInput.value = res.name.split(',')[0];
                    });
                    
                    el.addEventListener('mouseenter', function() {
                        this.style.backgroundColor = 'var(--bg-color)';
                    });
                    el.addEventListener('mouseleave', function() {
                        this.style.backgroundColor = 'transparent';
                    });
                });
            }
        });
    }

    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.keyCode === 13) {
            e.preventDefault();
            performSearch(e.target.value);
        }
    });

    const searchIcon = document.querySelector('.search-box .fa-search');
    if (searchIcon) {
        searchIcon.style.cursor = 'pointer';
        searchIcon.addEventListener('click', () => {
            performSearch(searchInput.value);
        });
    }
    
    // Allow live clear button visibility
    searchInput.addEventListener('input', (e) => {
        if (e.target.value.length > 0) {
            clearBtn.style.display = 'block';
        } else {
            clearBtn.style.display = 'none';
            searchResults.classList.remove('active');
        }
    });

    clearBtn.addEventListener('click', () => {
        searchInput.value = '';
        searchResults.classList.remove('active');
        clearBtn.style.display = 'none';
        if (searchMarker) map.removeLayer(searchMarker);
    });
}

// ---------------------------------------------------------
// LAYER MANAGER LOGIC
// ---------------------------------------------------------
function initLayerManagerEvents() {
    const checkboxes = document.querySelectorAll('.layer-manager input[type="checkbox"]');
    
    checkboxes.forEach(chk => {
        chk.addEventListener('change', (e) => {
            const isChecked = e.target.checked;
            const layerId = e.target.value;
            const parentId = e.target.getAttribute('data-parent');
            
            // 1. If it has children, toggle them
            const children = document.querySelectorAll(`input[data-parent="${layerId}"]`);
            if (children.length > 0) {
                children.forEach(child => {
                    if (child.checked !== isChecked) {
                        child.checked = isChecked;
                        toggleLayer(child.value, isChecked);
                    }
                });
                
                // Perluas UI secara otomatis jika dicentang
                if (isChecked) {
                    const childContainer = children[0].closest('.child-layers');
                    if (childContainer && !childContainer.classList.contains('expanded')) {
                        childContainer.classList.add('expanded');
                        const labelItem = e.target.closest('.checkbox-item');
                        if (labelItem && labelItem.nextElementSibling && labelItem.nextElementSibling.classList.contains('toggle-child')) {
                            labelItem.nextElementSibling.innerHTML = '<i class="fas fa-chevron-up"></i>';
                        }
                    }
                }
            }

            // 2. If it has a parent, update parent status
            if (parentId) {
                const parent = document.getElementById(`chk_${parentId}`);
                const siblings = document.querySelectorAll(`input[data-parent="${parentId}"]`);
                const allChecked = Array.from(siblings).every(s => s.checked);
                const someChecked = Array.from(siblings).some(s => s.checked);
                
                if (parent) {
                    parent.checked = allChecked;
                    parent.indeterminate = someChecked && !allChecked;
                }
            }
            
            // 3. Toggle actual map layer
            const layerConfig = findLayerConfig(layerId);
            if (layerConfig && layerConfig.type !== 'parent_only') {
                toggleLayer(layerId, isChecked);
            }
            
            // 3. Perbarui Legenda
            updateLegend();
        });
    });
}

function loadInitialLayers() {
    // Cek semua checkbox yang defaultnya on dan load
    const checkboxes = document.querySelectorAll('.layer-manager input[type="checkbox"]');
    checkboxes.forEach(chk => {
        if (chk.checked) {
            const layerId = chk.value;
            const config = findLayerConfig(layerId);
            if (config && config.type !== 'parent_only') {
                toggleLayer(layerId, true);
            }
        }
    });
    updateLegend();
}

function findLayerConfig(id) {
    let found = null;
    Object.values(window.WebGisLayers).forEach(group => {
        group.layers.forEach(layer => {
            if (layer.id === id) found = layer;
            if (layer.children) {
                layer.children.forEach(child => {
                    if (child.id === id) found = child;
                    if (child.children) {
                        child.children.forEach(subchild => {
                            if (subchild.id === id) found = subchild;
                        });
                    }
                });
            }
        });
    });
    return found;
}

function toggleLayer(id, show) {
    const config = findLayerConfig(id);
    if (!config) return;
    
    if (show) {
        if (activeLayers[id]) {
            map.addLayer(activeLayers[id]);
        } else {
            loadGeoJSON(config);
        }
    } else {
        if (activeLayers[id]) {
            map.removeLayer(activeLayers[id]);
        }
        // Bersihkan info panel jika mematikan layer
        if (window.clearInfoPanel) window.clearInfoPanel();
    }
}

function loadGeoJSON(config) {
    const loader = document.getElementById('mapLoader');
    if (loader) loader.classList.remove('hidden');

    fetch(config.url)
        .then(res => res.json())
        .then(data => {
            const layer = L.geoJSON(data, {
                interactive: config.interactive !== false,
                filter: function(feature) {
                    if (config.filterProp && config.filterValue !== undefined) {
                        return feature.properties[config.filterProp] == config.filterValue;
                    }
                    return true;
                },
                style: function(feature) {
                    if (config.type === 'polygon' || config.type === 'line') {
                        let baseStyle = Object.assign({}, config.style);
                        // If colorProp is defined, apply specific color
                        if (config.colorProp && config.colors) {
                            const val = feature.properties[config.colorProp];
                            const colorObj = config.colors[val];
                            if (colorObj) {
                                if (typeof colorObj === 'string') {
                                    baseStyle.fillColor = colorObj;
                                    // For lines/outlines:
                                    if (config.type === 'line') baseStyle.color = colorObj;
                                } else {
                                    baseStyle = Object.assign(baseStyle, colorObj);
                                }
                            }
                        }
                        return baseStyle;
                    }
                },
                pointToLayer: function(feature, latlng) {
                    if (config.getIcon) {
                        return config.getIcon(feature, latlng); // Pass latlng for circle markers
                    }
                    return L.marker(latlng);
                },
                onEachFeature: function(feature, layerObj) {
                    // Replace bindPopup with right-sidebar logic
                    layerObj.on({
                        click: function(e) {
                            // Hitung center untuk latlng yang diteruskan ke info panel
                            let center = e.latlng;
                            if (layerObj.getBounds) {
                                center = layerObj.getBounds().getCenter();
                            }
                            if (window.updateInfoPanel) {
                                window.updateInfoPanel(config.id, feature, center);
                            }
                        },
                        mouseover: function(e) {
                            if (config.type === 'polygon' && config.id !== 'batas_desa' && config.id !== 'batas_penelitian') {
                                const l = e.target;
                                l.setStyle({ fillOpacity: 0.8, weight: 2, color: '#f39c12' });
                                if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
                                    l.bringToFront();
                                }
                            }
                        },
                        mouseout: function(e) {
                            if (config.type === 'polygon' && config.id !== 'batas_desa' && config.id !== 'batas_penelitian') {
                                layer.resetStyle(e.target);
                            }
                        }
                    });
                }
            }).addTo(map);
            
            activeLayers[config.id] = layer;
            if (loader) loader.classList.add('hidden');
        })
        .catch(err => {
            console.error('Error loading geojson:', err);
            if (loader) loader.classList.add('hidden');
        });
}

// ---------------------------------------------------------
// LEGEND GENERATOR (Right Sidebar)
// ---------------------------------------------------------
function updateLegend() {
    const legendArea = document.getElementById('legendArea');
    if (!legendArea) return;
    
    legendArea.innerHTML = '';
    let hasLegend = false;
    
    Object.values(window.WebGisLayers).forEach(group => {
        let groupHasActive = false;
        let groupHtml = `<div class="legend-box"><h4>${group.title}</h4>`;
        
        const checkLayer = (layer) => {
            const chk = document.getElementById(`chk_${layer.id}`);
            if (chk && chk.checked && layer.type !== 'parent_only') {
                groupHasActive = true;
                
                if (layer.colors && layer.colorProp) {
                    // Kategori/Gridcode warna
                    Object.keys(layer.colors).forEach(key => {
                        const colObj = layer.colors[key];
                        const bg = typeof colObj === 'string' ? colObj : colObj.fillColor;
                        const labelText = (layer.legendLabels && layer.legendLabels[key]) ? layer.legendLabels[key] : `${layer.title}: ${key}`;
                        groupHtml += `
                        <div class="legend-item">
                            <div class="legend-color" style="background:${bg};"></div>
                            <span>${labelText}</span>
                        </div>`;
                    });
                } else if (layer.id === 'batas_penelitian' || layer.id === 'batas_desa') {
                     groupHtml += `
                        <div class="legend-item">
                            <div class="legend-line batas-desa"></div>
                            <span>${layer.title}</span>
                        </div>`;
                } else if (layer.id === 'batas_rtrw') {
                     groupHtml += `
                        <div class="legend-item">
                            <div class="legend-line batas-rt"></div>
                            <span>Batas RT/RW</span>
                        </div>`;
                } else if (layer.style && layer.style.fillColor) {
                    // Warna tunggal
                    groupHtml += `
                        <div class="legend-item">
                            <div class="legend-color" style="background:${layer.style.fillColor}; border-color:${layer.style.color}"></div>
                            <span>${layer.title}</span>
                        </div>`;
                } else if (layer.id === 'titik_sampel') {
                    groupHtml += `
                        <div class="legend-item">
                            <div class="legend-color" style="background:#3498db; border-radius:50%; width:16px;"></div>
                            <span>Titik Sampel Air</span>
                        </div>`;
                } else if (layer.id === 'fasilitas') {
                    groupHtml += `
                        <div class="legend-item">
                            <div style="color:var(--text-color);"><i class="fas fa-map-marker-alt"></i></div>
                            <span>Titik Fasilitas (Fasum)</span>
                        </div>`;
                } else {
                     groupHtml += `
                        <div class="legend-item">
                            <div class="legend-color" style="background:#bdc3c7;"></div>
                            <span>${layer.title}</span>
                        </div>`;
                }
            }
        };
        
        group.layers.forEach(layer => {
            checkLayer(layer);
            if (layer.children) {
                layer.children.forEach(child => checkLayer(child));
            }
        });
        
        groupHtml += `</div>`;
        if (groupHasActive) {
            legendArea.innerHTML += groupHtml;
            hasLegend = true;
        }
    });
    
    if (!hasLegend) {
        legendArea.innerHTML = '<p class="empty-legend">Pilih layer di panel kiri untuk memunculkan legenda.</p>';
    }
}
