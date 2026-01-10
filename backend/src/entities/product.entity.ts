import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class Product {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column('decimal', { precision: 10, scale: 2 }) // Xử lý tiền tệ
    price: number;

    @Column({ default: 0 })
    totalStock: number; // Tổng kho ban đầu

    @Column({ default: 0 })
    availableStock: number; // Tồn có thể bán 

    @Column({ default: 0 })
    reservedStock: number; // Đang bị giữ bởi khách 

    @Column({ default: 0 })
    soldStock: number; // Đã thanh toán thành công

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}