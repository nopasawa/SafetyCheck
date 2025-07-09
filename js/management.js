// =================================================================
//           ระบบตรวจ PPE - หน้าจัดการข้อมูล (management.js)
// =================================================================

// **สำคัญมาก:** กรุณานำ URL ของ Web App ที่ได้จากการ Deploy บน Google Apps Script มาใส่ที่นี่
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycby1LFk8hv5chbTndsYnq4e-gum0x5kvNFQzmD8dPn_RKWkbB4cgsFQTUpeypsdD8xE4/exec';

document.addEventListener('DOMContentLoaded', function() {
    // ดึงรายชื่อแผนกมาใส่ใน Dropdown
    populateDepartmentsDropdown();

    // เพิ่ม Event Listener ให้กับฟอร์ม
    document.getElementById('add-employee-form').addEventListener('submit', handleAddEmployee);
    document.getElementById('add-department-form').addEventListener('submit', handleAddDepartment);
});

/**
 * ดึงรายชื่อแผนกมาใส่ใน Dropdown ของฟอร์มเพิ่มพนักงาน
 */
function populateDepartmentsDropdown() {
    const select = document.getElementById('department-select');
    const url = `${SCRIPT_URL}?action=getDepartments`;

    fetch(url)
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                select.innerHTML = '<option value="" disabled selected>-- กรุณาเลือกแผนก --</option>';
                data.departments.forEach(dept => {
                    const option = document.createElement('option');
                    option.value = dept;
                    option.textContent = dept;
                    select.appendChild(option);
                });
            } else {
                select.innerHTML = '<option value="">ไม่สามารถโหลดได้</option>';
            }
        })
        .catch(err => {
            console.error("Error fetching departments:", err);
            select.innerHTML = '<option value="">เกิดข้อผิดพลาด</option>';
        });
}

/**
 * จัดการการส่งข้อมูลฟอร์ม "เพิ่มพนักงาน"
 */
async function handleAddEmployee(e) {
    e.preventDefault();
    const form = e.target;
    const statusDiv = document.getElementById('employee-form-status');
    statusDiv.innerHTML = '<div class="alert alert-info">กำลังบันทึก...</div>';

    const employeeData = {
        employeeId: document.getElementById('employee-id').value,
        fullName: document.getElementById('employee-name').value,
        department: document.getElementById('department-select').value,
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
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        statusDiv.innerHTML = `<div class="alert alert-danger">เกิดข้อผิดพลาด: ${error.message}</div>`;
    }
}

/**
 * จัดการการส่งข้อมูลฟอร์ม "เพิ่มแผนก"
 */
async function handleAddDepartment(e) {
    e.preventDefault();
    const form = e.target;
    const statusDiv = document.getElementById('department-form-status');
    statusDiv.innerHTML = '<div class="alert alert-info">กำลังบันทึก...</div>';

    const departmentData = {
        departmentName: document.getElementById('department-name').value,
    };

    try {
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify({ action: 'addDepartment', data: departmentData })
        });
        const result = await response.json();

        if (result.success) {
            statusDiv.innerHTML = `<div class="alert alert-success">${result.message}</div>`;
            form.reset();
            // โหลดรายชื่อแผนกใหม่เพื่อให้ Dropdown อัปเดต
            populateDepartmentsDropdown();
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        statusDiv.innerHTML = `<div class="alert alert-danger">เกิดข้อผิดพลาด: ${error.message}</div>`;
    }
}
