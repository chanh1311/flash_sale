import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

/**
 * EventsGateway - Realtime WebSocket Server
 * - reservation: created, expired, released, cancelled
 * - order: created, paid, expired, cancelled
 * - stock: changed
 * Chưa được yêu cầu bảo mật xác thực phần này
 **/
@WebSocketGateway({
    cors: {
        origin: '*',
    },
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private readonly logger = new Logger(EventsGateway.name);

    handleConnection(client: Socket) {
        this.logger.log(`Client connected: ${client.id}`);
    }

    handleDisconnect(client: Socket) {
        this.logger.log(`Client disconnected: ${client.id}`);
    }

    /**
     * Emit khi stock thay đổi
     */
    emitStockUpdate(productId: number, availableStock: number, reservedStock: number, soldStock: number) {
        this.server.emit('stock_updated', {
            productId,
            availableStock,
            reservedStock,
            soldStock,
            timestamp: new Date().toISOString(),
        });
        this.logger.debug(`Emitted stock_updated for Product #${productId}`);
    }

    /**
     * Emit khi reservation được tạo
     */
    emitReservationCreated(reservationId: number, userId: number, items: any[]) {
        this.server.emit('reservation_created', {
            reservationId,
            userId,
            items,
            timestamp: new Date().toISOString(),
        });
        this.logger.debug(`Emitted reservation_created #${reservationId}`);
    }

    /**
     * Emit khi reservation hết hạn (TTL)
     */
    emitReservationExpired(reservationId: number) {
        this.server.emit('reservation_expired', {
            reservationId,
            timestamp: new Date().toISOString(),
        });
        this.logger.debug(`Emitted reservation_expired #${reservationId}`);
    }

    /**
     * Emit khi reservation được release (hủy thủ công hoặc chuyển thành order)
     */
    emitReservationReleased(reservationId: number, reason: string) {
        this.server.emit('reservation_released', {
            reservationId,
            reason,
            timestamp: new Date().toISOString(),
        });
        this.logger.debug(`Emitted reservation_released #${reservationId}`);
    }

    /**
     * Emit khi order được tạo
     */
    emitOrderCreated(orderId: number, userId: number, totalAmount: number) {
        this.server.emit('order_created', {
            orderId,
            userId,
            totalAmount,
            timestamp: new Date().toISOString(),
        });
        this.logger.debug(`Emitted order_created #${orderId}`);
    }

    /**
     * Emit khi order được thanh toán
     */
    emitOrderPaid(orderId: number) {
        this.server.emit('order_paid', {
            orderId,
            timestamp: new Date().toISOString(),
        });
        this.logger.debug(`Emitted order_paid #${orderId}`);
    }

    /**
     * Emit khi order hết hạn thanh toán
     */
    emitOrderExpired(orderId: number) {
        this.server.emit('order_expired', {
            orderId,
            timestamp: new Date().toISOString(),
        });
        this.logger.debug(`Emitted order_expired #${orderId}`);
    }

    /**
     * Emit khi order bị hủy
     */
    emitOrderCancelled(orderId: number) {
        this.server.emit('order_cancelled', {
            orderId,
            timestamp: new Date().toISOString(),
        });
        this.logger.debug(`Emitted order_cancelled #${orderId}`);
    }
}
