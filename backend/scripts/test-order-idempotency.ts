// scripts/test-order-idempotency.ts
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

const BASE_URL = 'http://localhost:3001';

async function runTest() {
    console.log('===========================================');
    console.log('   ORDER IDEMPOTENCY TEST');
    console.log('===========================================\n');

    // 1. Đăng nhập
    let token = '';
    try {
        console.log('1. Logging in...');
        const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
            email: 'user@example.com',
            password: 'password123'
        });
        token = loginRes.data.accessToken;
        console.log('Login successful');
    } catch (e) {
        console.error('Login failed. Make sure the server is running and user exists.');
        return;
    }

    const headers = { Authorization: `Bearer ${token}` };

    // 2. Tạo Reservation trước
    const reservationKey = uuidv4();
    let reservation: any;

    try {
        console.log('2. Creating reservation...');
        const resRes = await axios.post(`${BASE_URL}/reservations`, {
            items: [{ productId: 1, quantity: 1 }],
            idempotencyKey: reservationKey
        }, { headers });
        reservation = resRes.data;
        console.log(`Reservation created: ID=${reservation.id}\n`);
    } catch (e: any) {
        console.error('Failed to create reservation:', e.response?.data || e.message);
        return;
    }

    // ========================================
    // TEST 1: createOrder Idempotency
    // ========================================
    console.log('===========================================');
    console.log('   TEST 1: createOrder IDEMPOTENCY');
    console.log('===========================================\n');

    const orderKey = uuidv4();
    const orderPayload = {
        reservationId: reservation.id,
        idempotencyKey: orderKey
    };

    try {
        console.log(`Using idempotencyKey: ${orderKey}\n`);

        console.log('--- Request 1 (First time) ---');
        const order1 = await axios.post(`${BASE_URL}/orders`, orderPayload, { headers });
        console.log(`Response 1: ID=${order1.data.id}, Status=${order1.data.status}, CreatedAt=${order1.data.createdAt}\n`);

        console.log('--- Request 2 (Retry with SAME key) ---');
        const order2 = await axios.post(`${BASE_URL}/orders`, orderPayload, { headers });
        console.log(`Response 2: ID=${order2.data.id}, Status=${order2.data.status}, CreatedAt=${order2.data.createdAt}\n`);

        console.log('--- VERIFICATION ---');
        if (order1.data.id === order2.data.id) {
            console.log('SUCCESS: Both responses returned the SAME Order ID.');
            console.log('=> createOrder is IDEMPOTENT.\n');
        } else {
            console.error('FAILED: System created DUPLICATE orders. Idempotency broken.\n');
            return;
        }

        // ========================================
        // TEST 2: payOrder Idempotency
        // ========================================
        console.log('===========================================');
        console.log('   TEST 2: payOrder IDEMPOTENCY');
        console.log('===========================================\n');

        const paymentKey = uuidv4();
        const payPayload = { paymentIdempotencyKey: paymentKey };
        const orderId = order1.data.id;

        console.log(`Using paymentIdempotencyKey: ${paymentKey}\n`);

        console.log('--- Request 1 (First time) ---');
        const pay1 = await axios.post(`${BASE_URL}/orders/${orderId}/pay`, payPayload, { headers });
        console.log(`Response 1: ID=${pay1.data.id}, Status=${pay1.data.status}, PaymentId=${pay1.data.paymentId}\n`);

        console.log('--- Request 2 (Retry with SAME key) ---');
        const pay2 = await axios.post(`${BASE_URL}/orders/${orderId}/pay`, payPayload, { headers });
        console.log(`Response 2: ID=${pay2.data.id}, Status=${pay2.data.status}, PaymentId=${pay2.data.paymentId}\n`);

        console.log('--- VERIFICATION ---');
        if (pay1.data.id === pay2.data.id && pay1.data.status === 'PAID') {
            console.log('SUCCESS: Both responses returned the SAME Order with PAID status.');
            console.log('=> payOrder is IDEMPOTENT.\n');
        } else {
            console.error('FAILED: Idempotency broken for payOrder.\n');
            return;
        }

        console.log('===========================================');
        console.log('   ALL TESTS PASSED!');
        console.log('===========================================');

    } catch (error: any) {
        console.error('Request Error:', error.response?.data || error.message);
    }
}

runTest();
