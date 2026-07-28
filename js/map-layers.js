/* ==============================================================
   map-layers.js — WebGIS Layer Configuration V2
============================================================== */

/**
 * Konfigurasi hirarki layer dan propertinya.
 * parentLayers mendefinisikan grup layer utama (seperti Peta Administrasi, Kerawanan, dll)
 * Setiap grup memiliki childLayers (layer individu)
 */
const WebGisLayers = {
    // 1. PETA ADMINISTRASI DESA
    administrasi: {
        id: 'group_admin',
        title: '1. Peta Administrasi Desa',
        open: true, // Akordeon terbuka secara default
        layers: [
            {
                id: 'batas_penelitian',
                title: 'Batas Area Penelitian',
                type: 'polygon',
                url: 'data/batas_desa.geojson',
                defaultOn: true,
                interactive: false,
                style: {
                    color: '#e74c3c',
                    weight: 3,
                    dashArray: '15, 5, 5, 5', // garis panjang, titik 4
                    fillColor: 'transparent',
                    fillOpacity: 0
                }
            },
            {
                id: 'batas_desa',
                title: 'Batas Desa',
                type: 'polygon',
                url: 'data/batas_desa.geojson',
                defaultOn: false, // Diganti dengan batas penelitian
                interactive: false,
                style: {
                    color: '#2c3e50',
                    weight: 3,
                    dashArray: '10, 5',
                    fillColor: 'transparent',
                    fillOpacity: 0
                }
            },
            {
                id: 'batas_dusun',
                title: 'Batas Dusun',
                type: 'polygon',
                url: 'data/dusun.geojson',
                defaultOn: true,
                style: {
                    color: '#34495e',
                    weight: 2,
                    dashArray: '5, 5',
                    fillOpacity: 0.1
                },
                colorProp: 'Dusun',
                colors: {
                    'Karangjiad': '#3498db',
                    'Karangtengah': '#e67e22',
                    'Krajan': '#9b59b6',
                    'Selawen': '#1abc9c'
                },
            },
            {
                id: 'batas_rt',
                title: 'Batas RT',
                type: 'polygon',
                url: 'data/rt_rw.geojson',
                defaultOn: false,
                filterProp: 'Tingkat',
                filterValue: 'RT',
                style: {
                    color: '#e67e22',
                    weight: 2,
                    fillOpacity: 0
                }
            },
            {
                id: 'batas_rw',
                title: 'Batas RW',
                type: 'polygon',
                url: 'data/rt_rw.geojson',
                defaultOn: false,
                filterProp: 'Tingkat',
                filterValue: 'RW',
                style: {
                    color: '#8e44ad',
                    weight: 2,
                    fillOpacity: 0
                }
            }
        ]
    },

    // 2. PETA PROFIL DESA
    profil: {
        id: 'group_profil',
        title: '2. Peta Profil Desa',
        open: false,
        layers: [
            {
                id: 'fasilitas',
                title: 'Fasilitas Desa (Fasum)',
                type: 'point',
                url: 'data/fasum.geojson',
                defaultOn: false,
                iconType: 'marker',
                getIcon: function (feature, latlng) {
                    let iconName = 'circle';
                    let color = 'blue';
                    const jenis = feature.properties.Jenis;
                    if (jenis === 'Tempat Ibadah') { iconName = 'mosque'; color = 'green'; }
                    else if (jenis === 'Pendidikan') { iconName = 'graduation-cap'; color = 'orange'; }
                    else if (jenis === 'Pemerintahan') { iconName = 'building'; color = 'red'; }
                    else if (jenis === 'Kesehatan') { iconName = 'plus-square'; color = 'red'; }
                    else if (jenis === 'Olahraga') { iconName = 'futbol'; color = 'purple'; }

                    const divIcon = L.divIcon({
                        className: 'custom-div-icon',
                        html: `<div style="background-color:${color}; width:24px; height:24px; border-radius:50%; display:flex; align-items:center; justify-content:center; color:white; border:2px solid white; box-shadow:0 2px 5px rgba(0,0,0,0.3);"><i class="fas fa-${iconName}" style="font-size:12px;"></i></div>`,
                        iconSize: [24, 24],
                        iconAnchor: [12, 12]
                    });
                    return L.marker(latlng, { icon: divIcon });
                }
            }
        ]
    },

    // 3. PETA KERAWANAN BANJIR
    banjir: {
        id: 'group_banjir',
        title: '3. Peta Kerawanan Banjir',
        open: false,
        layers: [
            {
                id: 'zona_kerawanan',
                title: 'Zona Kerawanan',
                type: 'polygon',
                url: 'data/kerawanan_banjir.geojson',
                defaultOn: false,
                style: { weight: 1, color: '#000' },
                colorProp: 'Kategori',
                colors: {
                    'Aman': { fillColor: '#006000', fillOpacity: 0.85 },
                    'Sedang': { fillColor: '#ffff00', fillOpacity: 0.85 },
                    'Rawan': { fillColor: '#ff2100', fillOpacity: 0.85 }
                },
                legendLabels: {
                    'Aman': 'Aman (Indeks: 4.20 – 4.78)',
                    'Sedang': 'Sedang (Indeks: >4.78 – 5.36)',
                    'Rawan': 'Rawan (Indeks: >5.36 – 5.95)'
                }
            },
            {
                id: 'lahan_terdampak',
                title: 'Lahan Pertanian Terdampak',
                type: 'polygon',
                url: 'data/lahan_terdampak.geojson',
                defaultOn: false,
                style: { color: '#d35400', weight: 2, fillColor: '#e67e22', fillOpacity: 0.85 }
            },
            {
                id: 'parameter_banjir',
                title: 'Parameter Banjir (Induk)',
                type: 'parent_only', // Layer virtual untuk checkbox hierarki
                hasChildren: true,
                defaultOn: false,
                children: [
                    {
                        id: 'elevasi',
                        title: 'Ketinggian (Elevasi)',
                        type: 'polygon',
                        url: 'data/elevasi.geojson',
                        defaultOn: false,
                        style: { weight: 1, color: '#000', fillOpacity: 0.85 },
                        colorProp: 'gridcode',
                        colors: {
                            1: '#ffff00', 2: '#ff0000', 3: '#006000'
                        },
                        legendLabels: {
                            1: 'Sedang (158 - 185 m)', 2: 'Curam (185 - 241 m)', 3: 'Landai (61 - 158 m)'
                        }
                    },
                    {
                        id: 'slope',
                        title: 'Kemiringan Lereng',
                        type: 'polygon',
                        url: 'data/slope.geojson',
                        defaultOn: false,
                        style: { weight: 1, color: '#000', fillOpacity: 0.85 },
                        colorProp: 'gridcode',
                        colors: {
                            5: '#006000', 7: '#ffff00', 9: '#ff0000'
                        },
                        legendLabels: {
                            5: 'Datar (Skor 5)', 7: 'Agak Curam (Skor 7)', 9: 'Curam (Skor 9)'
                        }
                    },
                    {
                        id: 'jenis_tanah',
                        title: 'Jenis Tanah',
                        type: 'polygon',
                        url: 'data/batas_desa.geojson', // Memakai batas desa dengan styling Dystric Fluvisols
                        defaultOn: false,
                        style: { weight: 1, color: '#333', fillColor: '#d68589', fillOpacity: 0.85 }, // Warna Pink Kecoklatan (PDF)
                        colorProp: 'Id',
                        colors: { 1: '#d68589' },
                        legendLabels: { 1: 'Dystric Fluvisols (Skor 5)' }
                    },
                    {
                        id: 'curah_hujan',
                        title: 'Curah Hujan',
                        type: 'polygon',
                        url: 'data/batas_desa.geojson', // Memakai batas desa dengan styling < 1000 mm/hari
                        defaultOn: false,
                        style: { weight: 1, color: '#333', fillColor: '#bee7ff', fillOpacity: 0.85 }, // Biru Muda Pucat (PDF)
                        colorProp: 'Id',
                        colors: { 1: '#bee7ff' },
                        legendLabels: { 1: 'Rendah (Skor 1)' }
                    },
                    {
                        id: 'pasut',
                        title: 'Tinggi Muka Air Laut HHWL',
                        type: 'polygon',
                        url: 'data/batas_desa.geojson', // Batas cadangan untuk layer Pasang Surut
                        defaultOn: false,
                        style: { weight: 1, color: '#333', fillColor: '#0070ff', fillOpacity: 0.85 }, // Biru Pekat (PDF)
                        colorProp: 'Id',
                        colors: { 1: '#0070ff' },
                        legendLabels: { 1: 'Tinggi (Skor 9)' }
                    },
                    {
                        id: 'penggunaan_lahan',
                        title: 'Penggunaan Lahan',
                        type: 'polygon',
                        url: 'data/penggunaan_lahan.geojson',
                        defaultOn: false,
                        style: { weight: 1, color: '#000', fillOpacity: 0.85 },
                        colorProp: 'gridcode',
                        colors: { 7: '#c0392b' },
                        legendLabels: {
                            7: 'Permukiman dan Pertanian (Skor 7)'
                        }
                    },
                    {
                        id: 'garis_pantai',
                        title: 'Buffer Garis Pantai',
                        type: 'parent_only',
                        hasChildren: true,
                        defaultOn: false,
                        children: [
                            {
                                id: 'pantai_250',
                                title: '250 m',
                                type: 'polygon',
                                url: 'data/buffer_pantai.geojson',
                                defaultOn: false,
                                filterProp: 'BUFF_DIST',
                                filterValue: 250,
                                style: { weight: 1, color: '#333', fillColor: '#ffb8ef', fillOpacity: 0.85 }
                            },
                            {
                                id: 'pantai_500',
                                title: '500 m',
                                type: 'polygon',
                                url: 'data/buffer_pantai.geojson',
                                defaultOn: false,
                                filterProp: 'BUFF_DIST',
                                filterValue: 500,
                                style: { weight: 1, color: '#333', fillColor: '#e6dffa', fillOpacity: 0.85 }
                            },
                            {
                                id: 'pantai_750',
                                title: '750 m',
                                type: 'polygon',
                                url: 'data/buffer_pantai.geojson',
                                defaultOn: false,
                                filterProp: 'BUFF_DIST',
                                filterValue: 750,
                                style: { weight: 1, color: '#333', fillColor: '#d9f0d3', fillOpacity: 0.85 }
                            },
                            {
                                id: 'pantai_1000',
                                title: '1000 m',
                                type: 'polygon',
                                url: 'data/buffer_pantai.geojson',
                                defaultOn: false,
                                filterProp: 'BUFF_DIST',
                                filterValue: 1000,
                                style: { weight: 1, color: '#333', fillColor: '#ffffdf', fillOpacity: 0.85 }
                            }
                        ]
                    }
                ]
            }
        ]
    },

    // 4. PETA PENCEMARAN AIR TANAH
    air_tanah: {
        id: 'group_airtanah',
        title: '4. Peta Kualitas Air Tanah',
        open: false,
        layers: [
            {
                id: 'indeks_pencemaran',
                title: 'Indeks Pencemaran (IP)',
                type: 'polygon',
                url: 'data/indeks_pencemaran.geojson',
                defaultOn: false,
                style: { weight: 1, color: '#fff', fillOpacity: 0.6 },
                colorProp: 'Skor',
                colors: {
                    1.0: '#2ecc71',
                    2.0: '#f1c40f'
                },
                legendLabels: {
                    1.0: 'Tingkat Pencemaran Rendah',
                    2.0: 'Tingkat Pencemaran Sedang'
                }
            },
            {
                id: 'parameter_air',
                title: 'Parameter Air (Induk)',
                type: 'parent_only',
                hasChildren: true,
                defaultOn: false,
                children: [
                    {
                        id: 'titik_sampel',
                        title: '60 Titik Sampel Air',
                        type: 'point',
                        url: 'data/titik_sampel_air.geojson',
                        defaultOn: false,
                        getIcon: function (feature, latlng) {
                            return L.circleMarker(latlng, {
                                radius: 6,
                                fillColor: "#3498db",
                                color: "#fff",
                                weight: 2,
                                opacity: 1,
                                fillOpacity: 0.8
                            });
                        }
                    },
                    {
                        id: 'ph_air',
                        title: 'Kadar pH',
                        type: 'polygon',
                        url: 'data/ph_air.geojson',
                        defaultOn: false,
                        style: { weight: 1, fillOpacity: 0.6 },
                        colorProp: 'Skor',
                        colors: {
                            1.0: '#e74c3c', 2.0: '#f1c40f', 3.0: '#2ecc71', 4.0: '#3498db'
                        },
                        legendLabels: {
                            1.0: 'Nilai pH 5,55 - 5,85', 2.0: 'Nilai pH 6 - 6,9', 3.0: 'Nilai pH 7,05 - 7,95', 4.0: 'Nilai pH 8,1 - 8,4'
                        }
                    },
                    {
                        id: 'tds',
                        title: 'TDS (Total Dissolved Solids)',
                        type: 'polygon',
                        url: 'data/tds.geojson',
                        defaultOn: false,
                        style: { weight: 1, fillOpacity: 0.6 },
                        colorProp: 'Skor',
                        colors: {
                            1.0: '#f7fbff', 2.0: '#c6dbef', 3.0: '#6baed6', 4.0: '#2171b5'
                        },
                        legendLabels: {
                            1.0: 'Nilai TDS 75 - 90 ppm', 2.0: 'Nilai TDS 105 - 195 ppm', 3.0: 'Nilai TDS 210 - 285 ppm', 4.0: 'Nilai TDS 300 - 360 ppm'
                        }
                    },
                    {
                        id: 'dhl',
                        title: 'DHL (Daya Hantar Listrik)',
                        type: 'polygon',
                        url: 'data/dhl.geojson',
                        defaultOn: false,
                        style: { weight: 1, fillOpacity: 0.6 },
                        colorProp: 'Skor',
                        colors: {
                            1.0: '#fff5f0', 2.0: '#fcbba1', 3.0: '#fb6a4a', 4.0: '#cb181d'
                        },
                        legendLabels: {
                            1.0: 'Nilai DHL 160 - 200 μS/cm', 2.0: 'Nilai DHL 240 - 360 μS/cm', 3.0: 'Nilai DHL 400 - 600 μS/cm', 4.0: 'Nilai DHL 640 - 720 μS/cm'
                        }
                    }
                ]
            }
        ]
    },

    // 5. KERENTANAN MAT
    mat: {
        id: 'group_mat',
        title: '5. Peta Kerentanan MAT',
        open: false,
        layers: [
            {
                id: 'kerentanan_god',
                title: 'Indeks Kerentanan (GOD)',
                type: 'polygon',
                url: 'data/mat_kerentanan.geojson',
                defaultOn: false,
                style: { weight: 0, fillOpacity: 0.8 },
                colorProp: 'Skor',
                colors: {
                    1: '#9ecae1',
                    2: '#4292c6',
                    3: '#084594'
                },
                legendLabels: {
                    1: '10 - 15 m',
                    2: '16 - 19 m',
                    3: '20 - 22 m'
                }
            },
            {
                id: 'parameter_mat',
                title: 'Parameter Kerentanan (Induk)',
                type: 'parent_only',
                hasChildren: true,
                defaultOn: false,
                children: [
                    {
                        id: 'mat_kedalaman',
                        title: 'Kedalaman MAT',
                        type: 'polygon',
                        url: 'data/mat_kerentanan.geojson',
                        defaultOn: false,
                        style: { weight: 0, fillOpacity: 0.8 },
                        colorProp: 'Skor',
                        colors: {
                            1: '#9ecae1',
                            2: '#4292c6',
                            3: '#084594'
                        },
                        legendLabels: {
                            1: '10 - 15 m',
                            2: '16 - 19 m',
                            3: '20 - 22 m'
                        }
                    },
                    {
                        id: 'mat_litologi',
                        title: 'Litologi',
                        type: 'polygon',
                        url: 'data/mbut_kerentanan.geojson', // Kolom litologi ada di sini
                        defaultOn: false,
                        style: { fillColor: '#e5c494', weight: 0, fillOpacity: 0.8 },
                        colorProp: 'Litologi',
                        colors: {
                            0.4: '#e5c494'
                        },
                        legendLabels: {
                            0.4: 'Endapan aluvium (lempung, lanau, pasir)'
                        }
                    },
                    {
                        id: 'mat_akuifer',
                        title: 'Jenis Akuifer',
                        type: 'polygon',
                        url: 'data/mbut_kerentanan.geojson', // Kolom akuifer
                        defaultOn: false,
                        style: { weight: 0, fillOpacity: 0.8 },
                        colorProp: 'Akuifer',
                        colors: {
                            0.9: '#8da0cb'
                        },
                        legendLabels: {
                            0.9: 'Akuifer bebas'
                        }
                    }
                ]
            }
        ]
    }
};

window.WebGisLayers = WebGisLayers;
