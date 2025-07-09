// =================================================================
//             ระบบตรวจ PPE - หน้าฟอร์มบันทึกผล (form.js)
// =================================================================

// **สำคัญมาก:** กรุณานำ URL ของ Web App ที่ได้จากการ Deploy บน Google Apps Script มาใส่ที่นี่
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycby1LFk8hv5chbTndsYnq4e-gum0x5kvNFQzmD8dPn_RKWkbB4cgsFQTUpeypsdD8xE4/exec';

document.addEventListener('DOMContentLoaded', function() {
    // ไม่ต้องโหลดข้อมูลอะไรเพิ่มเติม เพราะทุกอย่างอยู่ใน HTML แล้ว
    document.getElementById('inspection-form').addEventListener('submit', handleFormSubmit);
});

async function handleFormSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const submitButton = document.getElementById('submit-button');
    const submitText = document.getElementById('submit-text');
    const submitSpinner = document.getElementById('submit-spinner');
    const formStatus = document.getElementById('form-status');

    submitButton.disabled = true;
    submitText.textContent = 'กำลังบันทึก...';
    submitSpinner.style.display = 'inline-block';
    formStatus.innerHTML = '';

    try {
        // 1. รวบรวมข้อมูลจากเช็คลิสต์อุปกรณ์ PPE
        const ppeCheckboxes = form.querySelectorAll('#ppe-checklist-container input[type="checkbox"]');
        const ppeStatus = {};
        ppeCheckboxes.forEach(cb => {
            ppeStatus[cb.name] = cb.checked ? 1 : 0;
        });

        // 2. ดึงค่าจาก radio button ที่ถูกเลือก
        const selectedStatusRadio = document.querySelector('input[name="statusRadio"]:checked');
        if (!selectedStatusRadio) {
            throw new Error("กรุณาเลือกสถานะการสวมใส่โดยรวม");
        }
        const selectedStatus = selectedStatusRadio.value;

        // 3. จัดการไฟล์รูปภาพ
        const fileInput = document.getElementById('photo-upload');
        let fileData = null;
        if (fileInput.files.length > 0) {
            const file = fileInput.files[0];
            const base64String = await readFileAsBase64(file);
            fileData = {
                base64: base64String.split(',')[1],
                type: file.type,
                name: file.name
            };
        }

        // 4. รวบรวมข้อมูลจากช่องกรอกทั้งหมด
        const formData = {
            fullName: document.getElementById('fullName').value,
            department: document.getElementById('department').value,
            position: document.getElementById('position').value,
            area: document.getElementById('area').value,
            status: selectedStatus, // สถานะโดยรวมจาก radio
            inspectorName: document.getElementById('inspector-name').value,
            ppeStatus: ppeStatus, // สถานะของอุปกรณ์แต่ละชิ้น
            fileData: fileData
        };

        // 5. ส่งข้อมูลไปยัง Google Apps Script
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify({ action: 'saveInspectionData', data: formData })
        });
        const result = await response.json();

        if (result.success) {
            formStatus.innerHTML = `<div class="alert alert-success">บันทึกข้อมูลสำเร็จ!</div>`;
            form.reset();
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        formStatus.innerHTML = `<div class="alert alert-danger">เกิดข้อผิดพลาด: ${error.message}</div>`;
    } finally {
        submitButton.disabled = false;
        submitText.textContent = 'บันทึกผล';
        submitSpinner.style.display = 'none';
    }
}

function readFileAsBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(file);
    });
}
