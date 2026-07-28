/* ==============================================================
   ui-interactions.js — WebGIS UI Logic V2
============================================================== */

document.addEventListener('DOMContentLoaded', () => {
    initAccordions();
    buildLayerManagerUI();
    initDownloadMap();
});

function initAccordions() {
    const accordions = document.querySelectorAll('.accordion-header');
    accordions.forEach(acc => {
        acc.addEventListener('click', function() {
            const item = this.parentElement;
            
            // Toggle active class
            if (item.classList.contains('active')) {
                item.classList.remove('active');
            } else {
                // If you want only one open at a time, uncomment below:
                // document.querySelectorAll('.accordion-item').forEach(i => i.classList.remove('active'));
                item.classList.add('active');
            }
        });
    });
}

function buildLayerManagerUI() {
    const container = document.getElementById('layerManager');
    if (!container || !window.WebGisLayers) return;
    
    container.innerHTML = '';
    
    Object.values(window.WebGisLayers).forEach(group => {
        // Group Container
        const groupDiv = document.createElement('div');
        groupDiv.className = 'layer-group';
        
        // Group Title
        const titleDiv = document.createElement('div');
        titleDiv.className = 'group-title';
        titleDiv.textContent = group.title;
        groupDiv.appendChild(titleDiv);
        
        // Render Layers
        group.layers.forEach(layer => {
            const layerUI = createLayerCheckboxUI(layer);
            groupDiv.appendChild(layerUI);
        });
        
        container.appendChild(groupDiv);
    });
}

function createLayerCheckboxUI(layer) {
    const wrapper = document.createElement('div');
    
    // Baris Induk
    const parentRow = document.createElement('div');
    parentRow.className = 'parent-layer';
    
    const label = document.createElement('label');
    label.className = 'checkbox-item';
    label.innerHTML = `
        <input type="checkbox" id="chk_${layer.id}" value="${layer.id}" ${layer.defaultOn ? 'checked' : ''}>
        <span class="checkmark"></span>
        ${layer.title}
    `;
    parentRow.appendChild(label);
    
    // If it has children, add a toggle arrow
    let childContainer = null;
    if (layer.hasChildren && layer.children) {
        const toggleIcon = document.createElement('span');
        toggleIcon.className = 'toggle-child';
        toggleIcon.innerHTML = '<i class="fas fa-chevron-down"></i>';
        parentRow.appendChild(toggleIcon);
        
        childContainer = document.createElement('div');
        childContainer.className = 'child-layers';
        
        layer.children.forEach(child => {
            const childRow = document.createElement('div');
            childRow.className = 'parent-layer';
            childRow.style.paddingLeft = '0'; // Sejajarkan dengan induk
            
            const childLabel = document.createElement('label');
            childLabel.className = 'checkbox-item child-layer';
            childLabel.innerHTML = `
                <input type="checkbox" id="chk_${child.id}" data-parent="${layer.id}" value="${child.id}" ${child.defaultOn ? 'checked' : ''}>
                <span class="checkmark"></span>
                ${child.title}
            `;
            childRow.appendChild(childLabel);
            
            if (child.hasChildren && child.children) {
                const subToggleIcon = document.createElement('span');
                subToggleIcon.className = 'toggle-child';
                subToggleIcon.innerHTML = '<i class="fas fa-chevron-down"></i>';
                childRow.appendChild(subToggleIcon);
                
                const subChildContainer = document.createElement('div');
                subChildContainer.className = 'child-layers';
                
                child.children.forEach(subchild => {
                    const subChildLabel = document.createElement('label');
                    subChildLabel.className = 'checkbox-item child-layer';
                    subChildLabel.innerHTML = `
                        <input type="checkbox" id="chk_${subchild.id}" data-parent="${child.id}" value="${subchild.id}" ${subchild.defaultOn ? 'checked' : ''}>
                        <span class="checkmark"></span>
                        ${subchild.title}
                    `;
                    subChildContainer.appendChild(subChildLabel);
                });
                
                subToggleIcon.addEventListener('click', (e) => {
                    e.preventDefault();
                    subChildContainer.classList.toggle('expanded');
                    if (subChildContainer.classList.contains('expanded')) {
                        subToggleIcon.innerHTML = '<i class="fas fa-chevron-up"></i>';
                    } else {
                        subToggleIcon.innerHTML = '<i class="fas fa-chevron-down"></i>';
                    }
                });
                
                childContainer.appendChild(childRow);
                childContainer.appendChild(subChildContainer);
            } else {
                childContainer.appendChild(childRow);
            }
        });
        
        // Logika pengaturan ikon panah
        toggleIcon.addEventListener('click', (e) => {
            e.preventDefault();
            childContainer.classList.toggle('expanded');
            if (childContainer.classList.contains('expanded')) {
                toggleIcon.innerHTML = '<i class="fas fa-chevron-up"></i>';
            } else {
                toggleIcon.innerHTML = '<i class="fas fa-chevron-down"></i>';
            }
        });
    }
    
    wrapper.appendChild(parentRow);
    if (childContainer) {
        wrapper.appendChild(childContainer);
    }
    
    return wrapper;
}

// ---------------------------------------------------------
// PEMBARUAN PANEL INFO (Bilah Sisi Kanan)
// ---------------------------------------------------------
window.updateInfoPanel = function(layerId, feature, latlng) {
    const panel = document.getElementById('featureInfoPanel');
    const defaultMsg = document.getElementById('defaultInfoMessage');
    
    if (!panel || !defaultMsg) return;
    
    const props = feature.properties;
    if (!props) return;
    
    // Sembunyikan pesan default, tampilkan panel
    defaultMsg.classList.add('hidden');
    panel.classList.remove('hidden');
    
    let html = '';
    
    // Create GMap Link based on coordinates
    let gmapLink = '';
    if (latlng) {
        gmapLink = `https://www.google.com/maps/search/?api=1&query=${latlng.lat},${latlng.lng}`;
    } else if (props.Lat && props.Lon) {
        gmapLink = `https://www.google.com/maps/search/?api=1&query=${props.Lat},${props.Lon}`;
    }
    
    // Build Cards based on layer type / properties
    // ==========================================
    
    // CARD 1: INFORMASI LOKASI (General for all)
    let title = props.Nama || props.Dusun || `Objek ${layerId}`;
    if (layerId === 'fasilitas' && props.Jenis) {
        title = `${props.Nama} (${props.Jenis})`;
    } else if (layerId === 'batas_rt' || layerId === 'batas_rw') {
        title = props.Label || `Batas Administrasi`;
    } else if (layerId === 'titik_sampel') {
        title = `Titik Sampel #${props.No}`;
    }
    
    html += `
    <div class="info-card">
        <div class="info-card-header"><i class="fas fa-map-marker-alt"></i> Informasi Lokasi</div>
        <div class="info-item">
            <div class="info-label">Nama / Identitas</div>
            <div class="info-value">${title}</div>
        </div>
    `;
    
    if (props.Dusun && layerId !== 'batas_dusun') {
        html += `
        <div class="info-item">
            <div class="info-label">Dusun</div>
            <div class="info-value">${props.Dusun}</div>
        </div>`;
    }
    
    if (latlng) {
        html += `
        <div class="info-item">
            <div class="info-label">Koordinat</div>
            <div class="info-value">${latlng.lat.toFixed(6)}, ${latlng.lng.toFixed(6)}</div>
        </div>`;
    }
    html += `</div>`;
    
    // CARD 2: KONDISI / PARAMETER SPESIFIK
    let hasDetails = false;
    let detailsHtml = `
    <div class="info-card">
        <div class="info-card-header"><i class="fas fa-clipboard-list"></i> Detail Data</div>
    `;
    
    // For Kerawanan Banjir
    if (props.Kategori) {
        hasDetails = true;
        let badgeClass = props.Kategori.toLowerCase().replace(' ', '-');
        detailsHtml += `
        <div class="info-item">
            <div class="info-label">Status / Kategori</div>
            <div class="info-value"><span class="status-badge ${badgeClass}">${props.Kategori}</span></div>
        </div>`;
    }
    
    // For IP (Indeks Pencemaran)
    if (props.Indeks && layerId === 'indeks_pencemaran') {
        hasDetails = true;
        let badgeClass = props.Indeks.toLowerCase().replace(' ', '-');
        detailsHtml += `
        <div class="info-item">
            <div class="info-label">Indeks Pencemaran</div>
            <div class="info-value"><span class="status-badge ${badgeClass}">${props.Indeks}</span></div>
        </div>`;
    }
    
    // For Titik Sampel Air
    if (props.Ph || props.TDS || props.DHL) {
        hasDetails = true;
        if (props.Ph) detailsHtml += `<div class="info-item"><div class="info-label">pH Air</div><div class="info-value">${props.Ph}</div></div>`;
        if (props.TDS) detailsHtml += `<div class="info-item"><div class="info-label">TDS (ppm)</div><div class="info-value">${props.TDS}</div></div>`;
        if (props.DHL) detailsHtml += `<div class="info-item"><div class="info-label">DHL (µS/cm)</div><div class="info-value">${props.DHL}</div></div>`;
        if (props['MAT (mdpl)']) detailsHtml += `<div class="info-item"><div class="info-label">MAT (mdpl)</div><div class="info-value">${props['MAT (mdpl)']}</div></div>`;
        if (props.IP) detailsHtml += `<div class="info-item"><div class="info-label">Skor IP</div><div class="info-value">${props.IP}</div></div>`;
    }
    
    // Custom UI formatting for Buffer Pantai
    if (layerId.startsWith('pantai_') && props.BUFF_DIST !== undefined) {
        hasDetails = true;
        let buf = props.BUFF_DIST;
        let textDist = '';
        if (buf == 250) textDist = '< 250 m (Sangat Rawan)';
        else if (buf == 500) textDist = '250 - 500 m (Rawan)';
        else if (buf == 750) textDist = '500 - 750 m (Sedang)';
        else if (buf == 1000) textDist = '750 - 1000 m (Rendah)';
        else textDist = '> 1000 m (Sangat Rendah)';
        
        detailsHtml += `
        <div class="info-item">
            <div class="info-label">Jarak dari Pantai</div>
            <div class="info-value">${textDist}</div>
        </div>`;
    }

    // Generic gridcode/skor (if no specific handler)
    if (!hasDetails && (props.gridcode !== undefined || props.Skor !== undefined || props.Indeks !== undefined)) {
        hasDetails = true;
        let val = props.gridcode !== undefined ? props.gridcode : props.Skor;
        if (val === undefined) val = props.Indeks;
        detailsHtml += `
        <div class="info-item">
            <div class="info-label">Nilai / Skor / Indeks</div>
            <div class="info-value">${val}</div>
        </div>`;
    }
    
    detailsHtml += `</div>`;
    
    if (hasDetails) {
        html += detailsHtml;
    }
    
    // ==========================================
    // CARD 3: ANALISIS SPASIAL
    // ==========================================
    const analysisData = {
        'zona_kerawanan': 'Peta kerawanan banjir diperoleh melalui proses overlay berbobot terhadap tujuh parameter, yaitu curah hujan, HHWL, kemiringan lereng, elevasi, jenis tanah, penggunaan lahan, dan buffer garis pantai. Berdasarkan hasil analisis, parameter yang memberikan kontribusi paling dominan di Desa Kaibonpetangkuran adalah HHWL, kemiringan lereng, dan kedekatan terhadap garis pantai.',
        'curah_hujan': 'Curah hujan merupakan parameter yang menggambarkan besarnya masukan air ke permukaan. Berdasarkan hasil klasifikasi, wilayah Desa Kaibonpetangkuran termasuk dalam kelas curah hujan rendah. Kondisi ini menunjukkan bahwa intensitas curah hujan bukan faktor dominan, melainkan karakteristik fisik wilayah seperti pasang laut dan penggunaan lahan.',
        'pasut': 'Highest High Water Level (HHWL) merupakan elevasi muka air laut tertinggi yang dicapai pada saat pasang maksimum. Wilayah penelitian memperoleh skor tertinggi karena berada pada kawasan pesisir yang dipengaruhi secara langsung oleh pasang laut, meningkatkan potensi terjadinya banjir rob.',
        'slope': 'Kemiringan lereng memengaruhi kecepatan aliran permukaan. Sebagian besar wilayah penelitian didominasi oleh lereng datar hingga landai sehingga air hujan cenderung tertahan lebih lama dan berpotensi membentuk genangan.',
        'elevasi': 'Elevasi menunjukkan tinggi suatu wilayah terhadap permukaan laut. Elevasi di wilayah penelitian memberikan kontribusi yang relatif rendah terhadap kerawanan banjir, namun lokasi dengan elevasi lebih rendah tetap memiliki kecenderungan lebih mudah mengalami genangan.',
        'jenis_tanah': 'Dystric Fluvisols merupakan tanah aluvial yang terbentuk dari endapan material sungai pada dataran banjir. Tanah ini memiliki kemampuan infiltrasi sedang. Pada saat curah hujan terus-menerus atau muka air tanah meningkat, kapasitas infiltrasi dapat menurun.',
        'penggunaan_lahan': 'Penggunaan lahan memengaruhi kemampuan suatu wilayah dalam menyerap dan mengalirkan air hujan. Wilayah penelitian didominasi oleh kawasan permukiman dan lahan pertanian yang memiliki kapasitas resapan lebih rendah dibandingkan kawasan berhutan, menyebabkan peningkatan limpasan permukaan.',
        'pantai_250': 'Buffer garis pantai digunakan untuk menggambarkan tingkat kedekatan suatu wilayah terhadap garis pantai. Semakin dekat suatu wilayah terhadap garis pantai, semakin besar kontribusinya terhadap peningkatan kerawanan banjir akibat dinamika pasang laut. Jarak < 250m sangat rawan.',
        'pantai_500': 'Buffer garis pantai digunakan untuk menggambarkan tingkat kedekatan suatu wilayah terhadap garis pantai. Semakin dekat suatu wilayah terhadap garis pantai, semakin besar kontribusinya terhadap peningkatan kerawanan banjir akibat dinamika pasang laut. Jarak 250-500m tergolong rawan.',
        'pantai_750': 'Buffer garis pantai digunakan untuk menggambarkan tingkat kedekatan suatu wilayah terhadap garis pantai. Semakin dekat suatu wilayah terhadap garis pantai, semakin besar kontribusinya terhadap peningkatan kerawanan banjir akibat dinamika pasang laut. Jarak 500-750m tergolong sedang.',
        'pantai_1000': 'Buffer garis pantai digunakan untuk menggambarkan tingkat kedekatan suatu wilayah terhadap garis pantai. Semakin dekat suatu wilayah terhadap garis pantai, semakin besar kontribusinya terhadap peningkatan kerawanan banjir akibat dinamika pasang laut. Jarak > 750m tergolong rendah/sangat rendah.',
        
        'ph_air': 'pH adalah ukuran kekuatan asam atau basa dalam air yang mencerminkan konsentrasi ion hidrogen (H+) dan sangat menentukan kelayakan serta reaktivitas kimia air tanah. Pada Desa Kaibonpetangkuran, nilai pH bervariasi dari 5,5 hingga 8,4. Variasi ini mencerminkan respons hidrokimia ganda: nilai minimum (5,5) dipicu oleh masukan limbah organik dari aktivitas peternakan, sementara nilai maksimum (8,4) dipengaruhi oleh pelarutan CaCO3 dari fragmen cangkang marin pada satuan beting gisik, diperkuat oleh peningkatan konsentrasi ion terlarut.',
        'tds': 'Berdasarkan Peta Persebaran TDS, nilai Total Dissolved Solids di Desa Kaibonpetangkuran menunjukkan kualitas air tanah warga yang secara umum tergolong sangat layak untuk kebutuhan domestik (Permenkes No. 2 Tahun 2023). Anomali nilai TDS tinggi yang terkonsentrasi di beberapa titik pada Karangtengah Barat dan Krajan sebelah timur dipengaruhi oleh infiltrasi sisa pupuk anorganik dari lahan pertanian sekitar. Rendahnya nilai TDS di zona selatan juga menegaskan bahwa akuifer pasiran di lokasi studi belum terindikasi mengalami penyusupan salinitas atau intrusi air laut.',
        'dhl': 'Pengukuran Daya Hantar Listrik (DHL) di Desa Kaibonpetangkuran menunjukkan hubungan linier yang sangat kuat dengan Total Dissolved Solids (TDS). Seluruh area termasuk air tanah tawar yang sangat layak untuk keperluan sanitasi domestik. Tingginya nilai DHL di bagian tengah hingga timur laut berasal dari pelepasan ion-ion terlarut (NO3-, K+, SO42-) akibat infiltrasi sisa pupuk anorganik. Sebaliknya, zona selatan yang paling dekat ke pantai memiliki DHL dan TDS relatif lebih rendah, mendukung kesimpulan belum adanya tanda intrusi air laut.',
        'indeks_pencemaran': 'Penentuan status mutu air tanah menggunakan metode Indeks Pencemaran (IP) berdasarkan Kepmen LH No. 115 Tahun 2003 mengklasifikasikan wilayah studi ke dalam dua tingkat kualitas, yaitu Cemar Ringan dan Cemar Sedang. Luasan zona Cemar Sedang yang mendominasi kawasan pemukiman utara dan tengah dipicu secara dominan oleh parameter pH yang bernilai ekstrem akibat dampak interaksi dekomposisi organik limbah peternakan dan pelarutan mineral karbonat lokal. Zona Cemar Ringan di area selatan menegaskan efektivitas proses pembilasan alami (flushing effect).',
        'mat_kedalaman': 'Rekonstruksi Peta Muka Air Tanah (MAT) merekam pola aliran air tanah yang bersifat menyebar (divergent flow pattern), bersumber dari tinggian piezometrik di bagian tengah area penelitian (local recharge zone). Konfigurasi kedudukan muka air tanah yang cembung di area tengah ini mengindikasikan keberadaan zona resapan lokal, di mana air tanah mengalir memancar (radiating).',
        'kerentanan_god': 'Evaluasi kerentanan air tanah metode GOD mengklasifikasikan Desa Kaibonpetangkuran ke dalam Tingkat Kerentanan Sedang dan Rendah. Dominasi area berisiko tercemar sedang dikontrol oleh keberadaan akuifer bebas (unconfined aquifer) pada bentuk lahan aluvium dan beting gisik yang tersusun atas endapan pasiran lepas berkristalinitas dan permeabilitas tinggi. Kedalaman MAT yang dangkal meningkatkan aksesibilitas pencemar.'
    };
    
    if (analysisData[layerId]) {
        html += `
        <div class="info-card">
            <div class="info-card-header" style="color: var(--accent-primary);"><i class="fas fa-book-open"></i> Analisis Spasial</div>
            <p style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.6; text-align: justify; margin: 0;">
                ${analysisData[layerId]}
            </p>
        </div>`;
    }

    // Add GMap Button
    if (gmapLink) {
        html += `<a href="${gmapLink}" target="_blank" class="btn-gmaps"><i class="fas fa-location-arrow"></i> Buka di Google Maps</a>`;
    }
    
    panel.innerHTML = html;
};

// Clear Info Panel
window.clearInfoPanel = function() {
    const panel = document.getElementById('featureInfoPanel');
    const defaultMsg = document.getElementById('defaultInfoMessage');
    if (panel && defaultMsg) {
        panel.innerHTML = '';
        panel.classList.add('hidden');
        defaultMsg.classList.remove('hidden');
    }
};

// ---------------------------------------------------------
// DOWNLOAD MAP (HTML2Canvas)
// ---------------------------------------------------------
function initDownloadMap() {
    const btn = document.getElementById('downloadMapBtn');
    if (!btn) return;
    
    btn.addEventListener('click', () => {
        const mapEl = document.getElementById('map');
        if (!mapEl) return;
        
        // Show loader
        const loader = document.getElementById('mapLoader');
        if (loader) loader.classList.remove('hidden');
        
        // Use html2canvas
        setTimeout(() => {
            html2canvas(mapEl, {
                useCORS: true, // Allow external tiles
                allowTaint: true,
                ignoreElements: (el) => {
                    // Ignore Leaflet controls like zoom buttons
                    return el.classList.contains('leaflet-control-container');
                }
            }).then(canvas => {
                const link = document.createElement('a');
                link.download = 'Peta_Kaibonpetangkuran.png';
                link.href = canvas.toDataURL('image/png');
                link.click();
                
                if (loader) loader.classList.add('hidden');
            }).catch(err => {
                console.error("Error generating map image:", err);
                alert("Gagal mengunduh peta. Pastikan semua layer telah termuat.");
                if (loader) loader.classList.add('hidden');
            });
        }, 500); // Wait for rendering
    });
}
