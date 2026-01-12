// scripts/test-idempotency.ts
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

const BASE_URL = 'http://localhost:3001';
const KEY = uuidv4(); // Sinh 1 key duy nhất cho test này

async function runTest() {
    console.log(`Testing Idempotency using Key: ${KEY}`);

    // 1. Đăng nhập
    let token = '';
    try {
        const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
            email: 'user@example.com',
            password: 'password123'
        });
        token = loginRes.data.accessToken;
    } catch (e) {
        console.error('Login failed.');
        return;
    }

    const payload = {
        items: [{ productId: 1, quantity: 1 }],
        idempotencyKey: KEY // Gửi key lên
    };

    const headers = { Authorization: `Bearer ${token}` };

    console.log('\n--- Request 1 (First time) ---');
    try {
        const res1 = await axios.post(`${BASE_URL}/reservations`, payload, { headers });
        console.log(`Response 1: ID=${res1.data.id}, CreatedAt=${res1.data.createdAt}`);

        console.log('\n--- Request 2 (Retry with SAME key) ---');
        const res2 = await axios.post(`${BASE_URL}/reservations`, payload, { headers });
        console.log(`Response 2: ID=${res2.data.id}, CreatedAt=${res2.data.createdAt}`);

        console.log('\n--- VERIFICATION ---');
        if (res1.data.id === res2.data.id) {
            console.log('SUCCESS: Both responses returned the SAME reservation ID.');
        } else {
            console.error('FAILED: System created DUPLICATE reservations. Idempotency broken.');
        }

    } catch (error: any) {
        console.error('Request Error:', error.response?.data || error.message);
    }
}

runTest();
