// =================================================================
//           ระบบตรวจ PPE - หน้ารายชื่อพนักงาน (employees.js)
// =================================================================

// **สำคัญมาก:** กรุณานำ URL ของ Web App ที่ได้จากการ Deploy บน Google Apps Script มาใส่ที่นี่
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycby1LFk8hv5chbTndsYnq4e-gum0x5kvNFQzmD8dPn_RKWkbB4cgsFQTUpeypsdD8xE4/exec';

let allEmployeesData = [];

document.addEventListener('DOMContentLoaded', function() {
    fetchEmployeeData();

    document.getElementById('searchInput').addEventListener('input', filterAndRenderEmployees);
    document.getElementById('departmentFilter').addEventListener('change', filterAndRenderEmployees);

    const addEmployeeModal = document.getElementById('addEmployeeModal');
    if (addEmployeeModal) {
        // ไม่ต้องดึงข้อมูลแผนกมาใส่ใน Modal แล้ว
        document.getElementById('modal-add-employee-form').addEventListener('submit', handleAddEmployeeInModal);
    }

    // ใช้ Event Listener ของ Bootstrap Modal โดยตรง
    const historyModal = document.getElementById('inspectionHistoryModal');
    historyModal.addEventListener('show.bs.modal', function (event) {
        // event.relatedTarget คือ element ที่ถูกคลิกเพื่อเปิด Modal (ในที่นี้คือ card)
        const card = event.relatedTarget;
        
        // ตรวจสอบให้แน่ใจว่ามีข้อมูลพนักงานอยู่
        if (card && card.dataset.employee) {
            const employeeData = JSON.parse(card.dataset.employee);
            
            const modalTitle = historyModal.querySelector('.modal-title span');
            modalTitle.textContent = employeeData.FullName;

            renderInspectionHistory(employeeData.allInspections);
        }
    });
});

function fetchEmployeeData() {
    const container = document.getElementById('employee-list-container');
    const loadingSpinner = document.getElementById('loading-spinner');
    
    loadingSpinner.style.display = 'block';
    container.innerHTML = '';
    container.appendChild(loadingSpinner);

    const employeesUrl = `${SCRIPT_URL}?action=getAllEmployees`;

    fetch(employeesUrl)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                allEmployeesData = data.employees;
                populateDepartmentFilter(allEmployeesData);
                filterAndRenderEmployees();
            } else {
                throw new Error(data.error || 'Failed to load data');
            }
        })
        .catch(error => {
            console.error('Error fetching data:', error);
            loadingSpinner.innerHTML = `<p class="text-danger text-center">เกิดข้อผิดพลาด: ${error.message}</p>`;
        });
}

function filterAndRenderEmployees() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const selectedDept = document.getElementById('departmentFilter').value;

    const filteredData = allEmployeesData.filter(emp => {
        const nameMatch = emp.FullName.toLowerCase().includes(searchTerm);
        const deptMatch = selectedDept ? emp.Department === selectedDept : true;
        return nameMatch && deptMatch;
    });

    renderEmployeeSummaryList(filteredData);
}

/**
 * สร้างการ์ดสรุปของพนักงาน
 */
function renderEmployeeSummaryList(employees) {
    const container = document.getElementById('employee-list-container');
    const template = document.getElementById('employee-card-template');
    
    container.innerHTML = '';

    if (employees.length === 0) {
        container.innerHTML = '<p class="text-center text-muted mt-4">ไม่พบข้อมูลพนักงาน</p>';
        return;
    }

    employees.forEach(emp => {
        const cardElement = template.content.cloneNode(true);
        const card = cardElement.querySelector('.employee-summary-card');
        
        card.querySelector('.employee-name').textContent = emp.FullName;
        card.querySelector('.employee-department').textContent = `${emp.Department} - ${emp.EmployeeID}`;
        
        const statusBadge = card.querySelector('.latest-status-badge');
        statusBadge.textContent = emp.latestStatus;

        switch (emp.latestStatus) {
            case 'สวมใส่ครบถ้วน': statusBadge.className = 'badge latest-status-badge bg-success'; break;
            case 'สวมใส่บางส่วน': statusBadge.className = 'badge latest-status-badge bg-warning text-dark'; break;
            case 'ไม่สวมใส่': statusBadge.className = 'badge latest-status-badge bg-danger'; break;
            default: statusBadge.className = 'badge latest-status-badge bg-secondary';
        }

        const dateElement = card.querySelector('.last-inspection-date');
        if (emp.latestTimestamp && emp.latestTimestamp !== 'N/A') {
            dateElement.textContent = `วันที่ตรวจล่าสุด: ${new Date(emp.latestTimestamp).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' })}`;
        } else {
            dateElement.textContent = 'วันที่ตรวจล่าสุด: -';
        }

        const countElement = card.querySelector('.inspection-count-display');
        countElement.innerHTML = `จำนวนครั้งที่ตรวจ: <span class="fw-bold">${emp.inspectionCount}</span> ครั้ง`;

        card.dataset.employee = JSON.stringify(emp);
        
        if (emp.inspectionCount === 0) {
            card.removeAttribute('data-bs-toggle');
            card.removeAttribute('data-bs-target');
            card.style.cursor = 'default';
        }

        container.appendChild(cardElement);
    });
}

/**
 * สร้างรายการประวัติการตรวจใน Modal
 */
function renderInspectionHistory(inspections) {
    const accordionContainer = document.getElementById('inspectionAccordion');
    accordionContainer.innerHTML = '';

    if (!inspections || inspections.length === 0) {
        accordionContainer.innerHTML = '<p class="text-center text-muted">ไม่มีประวัติการตรวจ</p>';
        return;
    }

    inspections.forEach((insp, index) => {
        const inspectionDate = new Date(insp.Timestamp).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' });
        const ppeListHtml = Object.values(insp.ppeDetails).map(detail => {
            const icon = detail.status == 1 
                ? '<i class="bi bi-check-circle-fill text-success"></i>' 
                : '<i class="bi bi-x-circle-fill text-danger"></i>';
            return `<li class="list-group-item d-flex justify-content-between"><span>${detail.name}</span> ${icon}</li>`;
        }).join('');
        
        const accordionItem = `
            <div class="accordion-item">
                <h2 class="accordion-header" id="heading-${index}">
                    <button class="accordion-button ${index > 0 ? 'collapsed' : ''}" type="button" data-bs-toggle="collapse" data-bs-target="#collapse-${index}" aria-expanded="${index === 0}" aria-controls="collapse-${index}">
                        <strong>${inspectionDate}</strong>&nbsp;-&nbsp;<span class="fw-normal">${insp.Status}</span>
                    </button>
                </h2>
                <div id="collapse-${index}" class="accordion-collapse collapse ${index === 0 ? 'show' : ''}" aria-labelledby="heading-${index}" data-bs-parent="#inspectionAccordion">
                    <div class="accordion-body">
                        <ul class="list-group">
                            ${ppeListHtml}
                        </ul>
                        ${insp.PhotoURL ? `<div class="mt-3"><strong>รูปภาพหลักฐาน:</strong> <a href="${insp.PhotoURL}" target="_blank">ดูรูปภาพ</a></div>` : ''}
                    </div>
                </div>
            </div>
        `;
        accordionContainer.innerHTML += accordionItem;
    });
}


/**
 * จัดการการส่งข้อมูลจากฟอร์มใน Modal เพิ่มพนักงาน
 */
async function handleAddEmployeeInModal(e) {
    e.preventDefault();
    const form = e.target;
    const statusDiv = document.getElementById('modal-employee-form-status');
    const submitButton = form.closest('.modal-content').querySelector('.modal-footer button[type="submit"]');

    statusDiv.innerHTML = '<div class="alert alert-info">กำลังบันทึก...</div>';
    submitButton.disabled = true;

    const employeeData = {
        fullName: document.getElementById('modal-employee-name').value,
        department: document.getElementById('modal-department-input').value,
    };

    try {
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify({ action: 'addEmployee', data: employeeData })
        });
        const result = await response.json();

        if (result.success) {
            statusDiv.innerHTML = `<div class="alert alert-success">${result.message}</div>`;
            form.reset();
            
            setTimeout(() => {
                const modal = bootstrap.Modal.getInstance(document.getElementById('addEmployeeModal'));
                modal.hide();
                statusDiv.innerHTML = '';
                fetchEmployeeData();
            }, 1500);
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        statusDiv.innerHTML = `<div class="alert alert-danger">เกิดข้อผิดพลาด: ${error.message}</div>`;
    } finally {
        submitButton.disabled = false;
    }
}

function populateDepartmentFilter(employees) {
    const filter = document.getElementById('departmentFilter');
    const departments = [...new Set(employees.map(emp => emp.Department))]; 
    while (filter.options.length > 1) {
        filter.remove(1);
    }
    departments.sort((a, b) => a.localeCompare(b, 'th'));
    departments.forEach(dept => {
        const option = document.createElement('option');
        option.value = dept;
        option.textContent = dept;
        filter.appendChild(option);
    });
}
