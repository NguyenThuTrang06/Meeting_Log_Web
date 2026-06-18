const fs = require('fs');
const axios = require('axios');

const API_URL = 'https://backend-meeting-logs.onrender.com/api/members';
const CSV_FILE = '../backend-meeting-logs/members.csv';

if (!fs.existsSync(CSV_FILE)) {
    console.error(`Không tìm thấy file ${CSV_FILE}`);
    process.exit(1);
}

const lines = fs.readFileSync(CSV_FILE, 'utf-8').split('\n');

async function syncMembers() {
    console.log("Đang chờ Render Server cập nhật (có thể mất 1-2 phút)...");
    
    // Thử ping server cho đến khi route /members sẵn sàng
    let isReady = false;
    while (!isReady) {
        try {
            await axios.get(API_URL);
            isReady = true;
            console.log("Server đã sẵn sàng! Bắt đầu đồng bộ dữ liệu...");
        } catch (e) {
            await new Promise(r => setTimeout(r, 10000)); // Đợi 10 giây
        }
    }

    let count = 0;
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim();
        if (!line) continue;
        
        let parts = line.split(',');
        let name = parts[0].replace(/"/g, '').trim();
        let team = parts[1] ? parts[1].replace(/"/g, '').trim() : '';

        if (!name) continue;

        try {
            await axios.post(API_URL, { name, team });
            console.log(`Đã đồng bộ lên Web: ${name}`);
            count++;
        } catch (error) {
            console.error(`Lỗi khi đồng bộ ${name}:`, error.message);
        }
    }
    console.log(`Hoàn tất! Đã đưa ${count} nhân viên lên hệ thống Web chính thức.`);
}

syncMembers();
