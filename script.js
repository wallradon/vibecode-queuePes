// script.js

// โหลดข้อมูลเก่าจาก localStorage ถ้าไม่มีให้เริ่มเป็น Array ว่าง
let queueData = JSON.parse(localStorage.getItem('queueDB')) || [];

// 1. ฟังก์ชันสร้าง ID 16 หลัก (ตัวเลข + ตัวอักษร)
function generateID() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 16; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// 2. ฟังก์ชันเพิ่มคิว
function addQueue() {
  const name = document.getElementById('custName').value;
  const model = document.getElementById('modelCount').value;

  if (name === '' || model === '') {
    alert("กรุณากรอกข้อมูลให้ครบ");
    return;
  }

  const newQueue = {
    id: generateID(),
    name: name,
    model: model,
    orderDate: new Date().toLocaleDateString('th-TH'), // วันที่สั่ง
    status: 'waiting', // waiting, working, finished
    finishedDate: null // เอาไว้เก็บวันที่ทำเสร็จ เพื่อคำนวณประกัน 3 วัน
  };

  queueData.push(newQueue);
  saveAndRender();

  // เคลียร์ช่องกรอก
  document.getElementById('custName').value = '';
  document.getElementById('modelCount').value = '';
}

// 3. ฟังก์ชันบันทึกและแสดงผลใหม่
function saveAndRender() {
  localStorage.setItem('queueDB', JSON.stringify(queueData));
  renderTable();
}

// 4. แสดงตาราง (Render)
function renderTable() {
  const tbody = document.getElementById('queueTableBody');
  tbody.innerHTML = '';

  queueData.forEach((item, index) => {
    // เช็คสถานะเพื่อแสดงผลภาษาไทย
    let statusText = '';
    let statusClass = '';
    let extraInfo = '';

    if (item.status === 'waiting') {
      statusText = 'รอคิว';
      statusClass = 'status-waiting';
    } else if (item.status === 'working') {
      statusText = 'กำลังทำ';
      statusClass = 'status-working';
    } else if (item.status === 'finished') {
      // คำนวณประกัน 3 วัน
      const isWarranty = checkWarranty(item.finishedDate);
      if (isWarranty) {
        statusText = 'เสร็จแล้ว (อยู่ในประกัน)';
        statusClass = 'status-warranty';
        extraInfo = '(ประกันเหลือ ' + getRemainingDays(item.finishedDate) + ' วัน)';
      } else {
        statusText = 'หมดประกันแล้ว';
        statusClass = 'status-waiting'; // ใช้สีธรรมดา
      }
    }

    const row = `
            <tr>
                <td><small>${item.id}</small></td>
                <td>${item.name}</td>
                <td>${item.orderDate}</td>
                <td class="${statusClass}">
                    ${statusText} <br> <small>${extraInfo}</small>
                </td>
                <td>
                    <select onchange="changeStatus(${index}, this.value)">
                        <option value="waiting" ${item.status === 'waiting' ? 'selected' : ''}>รอคิว</option>
                        <option value="working" ${item.status === 'working' ? 'selected' : ''}>กำลังทำ</option>
                        <option value="finished" ${item.status === 'finished' ? 'selected' : ''}>เสร็จสิ้น</option>
                    </select>
                    <button class="btn-delete" onclick="deleteQueue(${index})">ลบ</button>
                </td>
            </tr>
        `;
    tbody.innerHTML += row;
  });
}

// 5. เปลี่ยนสถานะ
function changeStatus(index, newStatus) {
  queueData[index].status = newStatus;

  if (newStatus === 'finished') {
    // ถ้าเสร็จแล้ว ให้บันทึกวันที่เสร็จ ณ ตอนนั้น เพื่อเริ่มนับประกัน
    queueData[index].finishedDate = new Date().toISOString();
  } else {
    queueData[index].finishedDate = null; // ถ้าเปลี่ยนกลับเป็นทำอยู่ ก็ยกเลิกวันเสร็จ
  }
  saveAndRender();
}

// 6. ลบคิว
function deleteQueue(index) {
  if (confirm('ต้องการลบคิวนี้ใช่ไหม?')) {
    queueData.splice(index, 1);
    saveAndRender();
  }
}

// 7. ฟังก์ชันเช็คประกัน (Logic สำคัญ)
function checkWarranty(finishedDateStr) {
  if (!finishedDateStr) return false;

  const finishedDate = new Date(finishedDateStr);
  const currentDate = new Date();

  // หาผลต่างเวลา (มิลลิวินาที) -> แปลงเป็นวัน
  const diffTime = Math.abs(currentDate - finishedDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays <= 3; // ถ้าไม่เกิน 3 วัน คือจริง (True)
}

function getRemainingDays(finishedDateStr) {
  const finishedDate = new Date(finishedDateStr);
  const currentDate = new Date();
  const diffTime = Math.abs(currentDate - finishedDate);
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return 3 - diffDays;
}

// 8. ลูกค้าค้นหา
function checkStatus() {
  const searchId = document.getElementById('searchId').value.trim();
  const resultBox = document.getElementById('resultBox');

  const foundItem = queueData.find(item => item.id === searchId);

  if (foundItem) {
    resultBox.style.display = 'block';
    document.getElementById('resName').innerText = foundItem.name;
    document.getElementById('resModel').innerText = foundItem.model;

    let statusText = '';
    if (foundItem.status === 'waiting') statusText = '⏳ รอคิว';
    else if (foundItem.status === 'working') statusText = '🛠️ กำลังทำ';
    else if (foundItem.status === 'finished') {
      const isWarranty = checkWarranty(foundItem.finishedDate);
      if (isWarranty) {
        statusText = '✅ เสร็จแล้ว';
        document.getElementById('warrantyText').innerText = '🛡️ สินค้าอยู่ในระยะประกัน 3 วัน';
      } else {
        statusText = '✅ เสร็จแล้ว (หมดประกัน)';
        document.getElementById('warrantyText').innerText = '';
      }
    }

    document.getElementById('resStatus').innerText = statusText;
  } else {
    alert("ไม่พบ ID นี้ในระบบ");
    resultBox.style.display = 'none';
  }
}

// สั่งให้วาดตารางตอนโหลดหน้าเว็บ
renderTable();