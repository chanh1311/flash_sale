// scripts/test-oversell.ts
import axios from 'axios';

const BASE_URL = 'http://localhost:3001';
const PRODUCT_ID = 1;
const TOTAL_REQUESTS = 20; // 20 nguoi cung mua
const QTY_PER_REQUEST = 6; // Moi nguoi mua 6 cai
// Tong yeu cau: 120. Kho co: 100. -> Phai co it nhat 4 nguoi bi tu choi.

async function runTest() {
    console.log('Starting Concurrency Test...');

    // 1. Dang nhap de lay Token check
    let token = '';
    try {
        const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
            email: 'user@example.com',
            password: 'password123'
        });
        token = loginRes.data.accessToken;
        console.log('Login successful, got token.');
    } catch (e) {
        console.error('Login failed. Please check if server is running and users are seeded.');
        return;
    }

    // 2. Chuan bi request
    const requests: Promise<any>[] = [];
    for (let i = 0; i < TOTAL_REQUESTS; i++) {
        const payload = {
            items: [{ productId: PRODUCT_ID, quantity: QTY_PER_REQUEST }]
        };

        const req = axios.post(`${BASE_URL}/reservations`, payload, {
            headers: { Authorization: `Bearer ${token}` }
        });
        requests.push(req);
    }

    // 3. Gui request song song
    console.log(`Sending ${TOTAL_REQUESTS} requests concurrently...`);
    const results = await Promise.allSettled(requests);

    // 4. Thong ke ket qua
    let success = 0;
    let failed = 0;

    console.log('\n--- DETAILED RESULTS ---');
    results.forEach((res, idx) => {
        if (res.status === 'fulfilled') {
            success++;
            const data = res.value.data;
            console.log(`Request ${idx + 1}: SUCCESS (Order ID: ${data.id})`);
        } else {
            failed++;
            const message = res.reason.response?.data?.message || res.reason.message;
            console.log(`Request ${idx + 1}: FAILED (${message})`);
        }
    });

    console.log('\n--- SUMMARY ---');
    console.log(`Total Requests: ${TOTAL_REQUESTS}`);
    console.log(`Success: ${success}`);
    console.log(`Failed:  ${failed}`);
    console.log('Test completed. Please check database to verify stock consistency.');
}

runTest();