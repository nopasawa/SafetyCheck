
// =================================================================
//                 ระบบตรวจ PPE - แดชบอร์ด (dashboard.js)
// =================================================================

// **สำคัญมาก:** กรุณานำ URL ของ Web App ที่ได้จากการ Deploy บน Google Apps Script มาใส่ที่นี่
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycby1LFk8hv5chbTndsYnq4e-gum0x5kvNFQzmD8dPn_RKWkbB4cgsFQTUpeypsdD8xE4/exec';

// ตัวแปรสำหรับเก็บข้อมูลการตรวจทั้งหมดที่ดึงมา
let allInspectionsData = [];

document.addEventListener('DOMContentLoaded', function() {
    fetchDashboardStats();
    fetchPpeItems(); // ดึงรายการอุปกรณ์ PPE มาแสดง
    
    // เพิ่ม Event Listener สำหรับ Modal แสดงประวัติทั้งหมด
    const allInspectionsModal = document.getElementById('allInspectionsModal');
    if (allInspectionsModal) {
        allInspectionsModal.addEventListener('show.bs.modal', function() {
            fetchAndDisplayAllInspections();
        });
    }

    // เพิ่ม Event Listener สำหรับการคลิกในตารางประวัติ
    const tableBody = document.getElementById('all-inspections-table-body');
    if(tableBody) {
        tableBody.addEventListener('click', function(event) {
            const row = event.target.closest('tr');
            if (row && row.dataset.index) {
                const index = parseInt(row.dataset.index, 10);
                const inspectionData = allInspectionsData[index];
                
                if (inspectionData) {
                    populateInspectionDetailModal(inspectionData);
                    const detailModal = new bootstrap.Modal(document.getElementById('inspectionDetailModal'));
                    detailModal.show();
                }
            }
        });
    }
});

function fetchDashboardStats() {
    const statsUrl = `${SCRIPT_URL}?action=getDashboardStats`;
    fetch(statsUrl)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                updateDashboardUI(data.stats);
            } else {
                console.error('Failed to load dashboard stats:', data.error);
                document.getElementById('percent-complete').textContent = 'Error';
                document.getElementById('percent-partial').textContent = 'Error';
                document.getElementById('percent-none').textContent = 'Error';
                document.getElementById('total-employees').textContent = 'Error';
            }
        })
        .catch(error => console.error('Error fetching stats data:', error));
}

function updateDashboardUI(stats) {
    document.getElementById('percent-complete').textContent = `${stats.completePercentage}%`;
    document.getElementById('percent-partial').textContent = `${stats.partialPercentage}%`;
    document.getElementById('percent-none').textContent = `${stats.nonePercentage}%`;
    document.getElementById('total-employees').textContent = stats.totalEmployees;
}

/**
 * ดึงข้อมูลอุปกรณ์ PPE จาก Google Sheets (ถ้ามี)
 */
function fetchPpeItems() {
    const container = document.getElementById('ppe-items-container');
    const url = `${SCRIPT_URL}?action=getPpeItems`;

    fetch(url)
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                renderPpeItems(data.ppeItems);
            } else {
                container.innerHTML = '<p class="text-danger col-12">ไม่สามารถโหลดรายการอุปกรณ์ได้</p>';
            }
        })
        .catch(err => {
            console.error('Error fetching PPE items:', err);
            container.innerHTML = '<p class="text-danger col-12">เกิดข้อผิดพลาดในการเชื่อมต่อ</p>';
        });
}

/**
 * สร้าง Card ของอุปกรณ์ PPE
 */
function renderPpeItems(items) {
    const container = document.getElementById('ppe-items-container');
    container.innerHTML = '';
    if (items.length === 0) {
        container.innerHTML = '<p class="text-muted col-12">ยังไม่มีข้อมูลอุปกรณ์ PPE ในระบบ</p>';
        return;
    }

    items.forEach(item => {
        const col = document.createElement('div');
        col.className = 'col-4 col-lg-2 col-md-3 mb-3';
        
        const imageUrl = item.ImageURL || 'https://placehold.co/100x80/e1e1e1/666?text=No+Image';

        const cardHtml = `
            <div class="card p-2 h-100 d-flex flex-column justify-content-center align-items-center">
                <img src="${imageUrl}" class="ppe-card-image" alt="${item.Name}" onerror="this.onerror=null;this.src='https://placehold.co/100x80/e1e1e1/666?text=Error';">
                <small class="mt-2 text-center">${item.Name}</small>
            </div>
        `;
        col.innerHTML = cardHtml;
        container.appendChild(col);
    });
}


/**
 * ดึงข้อมูลการตรวจทั้งหมดมาแสดงในตารางของ Modal
 */
function fetchAndDisplayAllInspections() {
    const tableBody = document.getElementById('all-inspections-table-body');
    tableBody.innerHTML = '<tr><td colspan="7" class="text-center">กำลังโหลดข้อมูล...</td></tr>';

    const url = `${SCRIPT_URL}?action=getAllInspections`;
    fetch(url)
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                allInspectionsData = data.inspections; // เก็บข้อมูลไว้ในตัวแปร
                renderAllInspectionsTable(allInspectionsData);
            } else {
                tableBody.innerHTML = '<tr><td colspan="7" class="text-center text-danger">ไม่สามารถโหลดข้อมูลได้</td></tr>';
            }
        })
        .catch(err => {
            console.error('Error fetching all inspections:', err);
            tableBody.innerHTML = '<tr><td colspan="7" class="text-center text-danger">เกิดข้อผิดพลาดในการเชื่อมต่อ</td></tr>';
        });
}

/**
 * สร้างแถวของตารางจากข้อมูลที่ได้รับ และเพิ่ม data-index
 */
function renderAllInspectionsTable(inspections) {
    const tableBody = document.getElementById('all-inspections-table-body');
    tableBody.innerHTML = '';

    if (inspections.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">ยังไม่มีข้อมูลการตรวจ</td></tr>';
        return;
    }

    inspections.forEach((insp, index) => {
        const row = document.createElement('tr');
        row.style.cursor = 'pointer';
        row.dataset.index = index; // เพิ่ม index เพื่อใช้ระบุข้อมูล

        const inspectionDate = new Date(insp.Timestamp).toLocaleString('th-TH', {
            year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });

        row.innerHTML = `
            <td>${inspectionDate}</td>
            <td>${insp.FullName || ''}</td>
            <td>${insp.Department || ''}</td>
            <td>${insp.Position || ''}</td>
            <td>${insp.Area || ''}</td>
            <td>${insp.Status || ''}</td>
            <td>${insp.InspectorName || ''}</td>
        `;
        tableBody.appendChild(row);
    });
}

/**
 * สร้างเนื้อหาสำหรับ Modal แสดงรายละเอียด
 */
function populateInspectionDetailModal(insp) {
    const modalBody = document.getElementById('inspectionDetailModalBody');
    const inspectionDate = new Date(insp.Timestamp).toLocaleString('th-TH', { dateStyle: 'long', timeStyle: 'short' });
    
    let ppeListHtml = '<p>ไม่มีข้อมูลการตรวจอุปกรณ์</p>';
    if (insp.ppeDetails && Object.keys(insp.ppeDetails).length > 0) {
        ppeListHtml = Object.entries(insp.ppeDetails).map(([name, status]) => {
             const icon = status == 1 
                ? '<i class="bi bi-check-circle-fill text-success"></i>' 
                : '<i class="bi bi-x-circle-fill text-danger"></i>';
            return name ? `<li class="list-group-item d-flex justify-content-between"><span>${name}</span> ${icon}</li>` : '';
        }).join('');
    }

    modalBody.innerHTML = `
        <div class="row">
            <div class="col-md-6">
                <h5>ข้อมูลผู้รับการตรวจ</h5>
                <p class="mb-1"><strong>ชื่อ-สกุล:</strong> ${insp.FullName || '-'}</p>
                <p class="mb-1"><strong>แผนก:</strong> ${insp.Department || '-'}</p>
                <p class="mb-1"><strong>ตำแหน่ง:</strong> ${insp.Position || '-'}</p>
                <p><strong>พื้นที่:</strong> ${insp.Area || '-'}</p>
            </div>
            <div class="col-md-6">
                <h5>ผลการตรวจ</h5>
                <p class="mb-1"><strong>วันที่/เวลา:</strong> ${inspectionDate}</p>
                <p class="mb-1"><strong>สถานะโดยรวม:</strong> ${insp.Status || '-'}</p>
                <p><strong>ผู้ตรวจ:</strong> ${insp.InspectorName || '-'}</p>
            </div>
        </div>
        <hr>
        <h5>รายละเอียดอุปกรณ์ PPE</h5>
        <ul class="list-group list-group-flush">
            ${ppeListHtml}
        </ul>
        ${insp.PhotoURL ? `<div class="mt-3"><strong>รูปภาพหลักฐาน:</strong> <a href="${insp.PhotoURL}" target="_blank">ดูรูปภาพ</a></div>` : ''}
    `;
}
