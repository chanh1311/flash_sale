import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

export enum OrderStatus {
    PENDING_PAYMENT = 'PENDING_PAYMENT',
    PAID = 'PAID',
    CANCELLED = 'CANCELLED',
    EXPIRED = 'EXPIRED'
}

@Entity()
export class Order {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    reservationId: number; // Link ngược lại reservation

    @Column()
    userId: number;

    @Column('decimal')
    totalAmount: number;

    @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.PENDING_PAYMENT })
    status: OrderStatus;

    @Column({ nullable: true })
    paymentId: string;

    @Column({ unique: true, nullable: true })
    idempotencyKey?: string; // Key để check idempotent khi tạo order

    @CreateDateColumn({ type: 'timestamptz' })
    createdAt: Date;
}