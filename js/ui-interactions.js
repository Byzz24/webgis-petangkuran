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
// DOWNLOAD MAP — PDF berdasarkan Checklist + Screenshot fallback
// ---------------------------------------------------------

// Mapping layer ID → file PDF di folder "Hasil Download/"
const LAYER_TO_PDF = {
    'batas_penelitian': 'Peta Batas Dusun.pdf',
    'batas_desa': 'Peta Batas Dusun.pdf',
    'batas_dusun': 'Peta Batas Dusun.pdf',
    'batas_rt': 'Peta Batas RT RW.pdf',
    'batas_rw': 'Peta Batas RT RW.pdf',
    'zona_kerawanan': 'Peta Kerawanan Banjir Terhadap Lahan Pertanian.pdf',
    'lahan_terdampak': 'Peta Kerawanan Banjir Terhadap Lahan Pertanian.pdf',
    'elevasi': 'Peta Ketinggian.pdf',
    'slope': 'Peta Kemiringan.pdf',
    'jenis_tanah': 'Peta Jenis Tanah.pdf',
    'curah_hujan': 'Peta Curah Hujan.pdf',
    'pasut': 'Peta Tinggi Muka Air Laut HHWL.pdf',
    'penggunaan_lahan': 'Peta Penggunaan Lahan.pdf',
    'pantai_250': 'Peta Buffer Pantai Terhadap Desa.pdf',
    'pantai_500': 'Peta Buffer Pantai Terhadap Desa.pdf',
    'pantai_750': 'Peta Buffer Pantai Terhadap Desa.pdf',
    'pantai_1000': 'Peta Buffer Pantai Terhadap Desa.pdf',
    'ph_air': 'PH.pdf',
    'tds': 'TDS.pdf',
    'dhl': 'DHL.pdf',
    'indeks_pencemaran': 'IP.pdf',
    'mat_kedalaman': 'FLOWNETS.pdf',
    'kerentanan_god': 'FLOWNETS.pdf',
};

// Layer yang hanya bisa di-screenshot (tidak ada PDF)
const SCREENSHOT_ONLY = ['fasilitas', 'titik_sampel', 'mat_litologi', 'mat_akuifer'];

// Daftar semua PDF untuk fitur "Download Semua Peta"
const ALL_PDFS = [
    'Peta Batas Dusun.pdf',
    'Peta Batas RT RW.pdf',
    'Peta Buffer Pantai Terhadap Desa.pdf',
    'Peta Curah Hujan.pdf',
    'Peta Jenis Tanah.pdf',
    'Peta Kemiringan.pdf',
    'Peta Kerawanan Banjir Terhadap Lahan Pertanian.pdf',
    'Peta Ketinggian.pdf',
    'Peta Penggunaan Lahan.pdf',
    'Peta Tinggi Muka Air Laut HHWL.pdf',
    'DHL.pdf',
    'FLOWNETS.pdf',
    'IP.pdf',
    'PH.pdf',
    'TDS.pdf'
];

function initDownloadMap() {
    const btn = document.getElementById('downloadMapBtn');
    const btnAll = document.getElementById('downloadAllBtn');
    
    // ========== TOMBOL "UNDUH PETA" (berdasarkan checklist) ==========
    if (btn) {
        btn.addEventListener('click', () => {
            // Ambil semua checkbox yang tercentang di layer manager
            const checkboxes = document.querySelectorAll('.layer-manager input[type="checkbox"]:checked');
            const checkedIds = Array.from(checkboxes).map(c => c.value);
            
            if (checkedIds.length === 0) {
                Swal.fire({
                    icon: 'warning',
                    title: 'Tidak Ada Layer Dipilih',
                    text: 'Silakan centang layer pada panel kiri terlebih dahulu sebelum mengunduh peta.',
                    confirmButtonColor: '#00b09b'
                });
                return;
            }
            
            // Kumpulkan PDF unik dan cek apakah hanya screenshot-only
            const pdfFiles = new Set();
            let hasScreenshotOnly = false;
            let hasPdfLayer = false;
            
            checkedIds.forEach(id => {
                if (LAYER_TO_PDF[id]) {
                    pdfFiles.add(LAYER_TO_PDF[id]);
                    hasPdfLayer = true;
                } else if (SCREENSHOT_ONLY.includes(id)) {
                    hasScreenshotOnly = true;
                }
                // Layer parent_only (parameter_banjir, garis_pantai, dll) di-skip otomatis
            });
            
            // CASE 1: Hanya layer screenshot-only yg tercentang → screenshot peta
            if (!hasPdfLayer && hasScreenshotOnly) {
                Swal.fire({
                    title: 'Unduh Screenshot Peta',
                    text: 'Layer yang dipilih tidak tersedia dalam format PDF. Peta akan diunduh sebagai gambar (screenshot).',
                    icon: 'info',
                    showCancelButton: true,
                    confirmButtonText: '<i class="fas fa-camera"></i> Ambil Screenshot',
                    cancelButtonText: 'Batal',
                    confirmButtonColor: '#00b09b',
                }).then(result => {
                    if (result.isConfirmed) {
                        doScreenshot();
                    }
                });
                return;
            }
            
            // CASE 2: Ada layer PDF → download PDF yg sesuai
            if (pdfFiles.size > 0) {
                const pdfList = Array.from(pdfFiles);
                
                let listHtml = pdfList.map(f => 
                    `<li style="text-align:left; margin: 6px 0; font-size: 0.92rem;">
                        <i class="fas fa-file-pdf" style="color:#e74c3c; margin-right:8px;"></i>${f}
                    </li>`
                ).join('');
                
                Swal.fire({
                    title: '<i class="fas fa-download" style="color:#00b09b; margin-right:8px;"></i> Unduh Peta',
                    html: `
                        <p style="margin-bottom:12px; color:#666;">Peta berikut akan diunduh berdasarkan layer yang Anda pilih:</p>
                        <ul style="list-style:none; padding:0; margin:0;">${listHtml}</ul>
                    `,
                    showCancelButton: true,
                    confirmButtonText: `<i class="fas fa-download"></i> Unduh ${pdfList.length} File`,
                    cancelButtonText: 'Batal',
                    confirmButtonColor: '#00b09b',
                }).then(result => {
                    if (result.isConfirmed) {
                        downloadPdfs(pdfList);
                    }
                });
            }
        });
    }
    
    // ========== LINK "DOWNLOAD SEMUA PETA?" ==========
    if (btnAll) {
        btnAll.addEventListener('click', (e) => {
            e.preventDefault();
            
            let listHtml = ALL_PDFS.map(f => 
                `<li style="text-align:left; margin: 4px 0; font-size: 0.85rem;">
                    <i class="fas fa-file-pdf" style="color:#e74c3c; margin-right:6px;"></i>${f}
                </li>`
            ).join('');
            
            Swal.fire({
                title: '<i class="fas fa-layer-group" style="color:#00b09b; margin-right:8px;"></i> Unduh Semua Peta',
                html: `
                    <p style="margin-bottom:12px; color:#666;">Seluruh <strong>${ALL_PDFS.length} peta</strong> dalam format PDF akan diunduh:</p>
                    <ul style="list-style:none; padding:0; margin:0; max-height:220px; overflow-y:auto; border:1px solid #eee; border-radius:8px; padding:8px;">${listHtml}</ul>
                `,
                showCancelButton: true,
                confirmButtonText: `<i class="fas fa-download"></i> Unduh Semua (${ALL_PDFS.length} file)`,
                cancelButtonText: 'Batal',
                confirmButtonColor: '#00b09b',
            }).then(result => {
                if (result.isConfirmed) {
                    downloadPdfs(ALL_PDFS);
                }
            });
        });
    }
}

/**
 * Download satu atau lebih file PDF secara berurutan.
 * Menggunakan delay antar download agar browser tidak memblokir.
 */
function downloadPdfs(pdfList) {
    pdfList.forEach((pdf, index) => {
        setTimeout(() => {
            const link = document.createElement('a');
            link.href = 'Hasil Download/' + encodeURIComponent(pdf);
            link.download = pdf;
            link.style.display = 'none';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }, index * 600); // 600ms delay antar file
    });
    
    Swal.fire({
        icon: 'success',
        title: 'Mengunduh...',
        html: `<strong>${pdfList.length}</strong> file peta sedang diunduh.<br><small style="color:#999;">Periksa folder unduhan browser Anda.</small>`,
        timer: 3500,
        showConfirmButton: false,
        timerProgressBar: true
    });
}

/**
 * Fallback: Screenshot peta menggunakan html2canvas
 * Digunakan untuk layer yang tidak memiliki file PDF.
 */
function doScreenshot() {
    const mapEl = document.getElementById('map');
    if (!mapEl) return;
    
    const loader = document.getElementById('mapLoader');
    if (loader) loader.classList.remove('hidden');
    
    setTimeout(() => {
        html2canvas(mapEl, {
            useCORS: true,
            allowTaint: true,
            ignoreElements: (el) => {
                return el.classList.contains('leaflet-control-container');
            }
        }).then(canvas => {
            const link = document.createElement('a');
            link.download = 'Peta_Kaibonpetangkuran.png';
            link.href = canvas.toDataURL('image/png');
            link.click();
            
            if (loader) loader.classList.add('hidden');
            
            Swal.fire({
                icon: 'success',
                title: 'Screenshot Berhasil',
                text: 'Gambar peta telah diunduh.',
                timer: 2500,
                showConfirmButton: false
            });
        }).catch(err => {
            console.error("Error generating map image:", err);
            Swal.fire('Gagal', 'Gagal mengunduh screenshot peta. Pastikan semua layer telah termuat.', 'error');
            if (loader) loader.classList.add('hidden');
        });
    }, 500);
}

