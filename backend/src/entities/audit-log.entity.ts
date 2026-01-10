import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';

@Entity()
export class AuditLog {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    action: string;

    @Column({ nullable: true })
    resourceType: string; // 'Order', 'Reservation', etc.

    @Column({ nullable: true })
    resourceId: string; // Đối tượng thay đổi

    @Column()
    userId: number;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'userId' })
    user: User;

    @Column('jsonb', { nullable: true })
    payload: any; // Dữ liệu gửi lên hoặc thay đổi

    @Column({ nullable: true })
    note: string;

    @CreateDateColumn()
    createdAt: Date;
}

