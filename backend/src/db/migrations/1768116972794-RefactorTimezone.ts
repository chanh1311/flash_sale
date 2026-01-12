import { MigrationInterface, QueryRunner } from "typeorm";

export class RefactorTimezone1768116972794 implements MigrationInterface {
    name = 'RefactorTimezone1768116972794'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Product
        await queryRunner.query(`ALTER TABLE "product" ALTER COLUMN "createdAt" TYPE TIMESTAMP WITH TIME ZONE USING "createdAt" AT TIME ZONE 'UTC'`);
        await queryRunner.query(`ALTER TABLE "product" ALTER COLUMN "createdAt" SET DEFAULT now()`);

        await queryRunner.query(`ALTER TABLE "product" ALTER COLUMN "updatedAt" TYPE TIMESTAMP WITH TIME ZONE USING "updatedAt" AT TIME ZONE 'UTC'`);
        await queryRunner.query(`ALTER TABLE "product" ALTER COLUMN "updatedAt" SET DEFAULT now()`);

        // Reservation
        // expiresAt is NOT NULL, so we need to handle it carefully
        await queryRunner.query(`ALTER TABLE "reservation" ALTER COLUMN "expiresAt" TYPE TIMESTAMP WITH TIME ZONE USING "expiresAt" AT TIME ZONE 'UTC'`);

        await queryRunner.query(`ALTER TABLE "reservation" ALTER COLUMN "createdAt" TYPE TIMESTAMP WITH TIME ZONE USING "createdAt" AT TIME ZONE 'UTC'`);
        await queryRunner.query(`ALTER TABLE "reservation" ALTER COLUMN "createdAt" SET DEFAULT now()`);

        // Order
        await queryRunner.query(`ALTER TABLE "order" ALTER COLUMN "createdAt" TYPE TIMESTAMP WITH TIME ZONE USING "createdAt" AT TIME ZONE 'UTC'`);
        await queryRunner.query(`ALTER TABLE "order" ALTER COLUMN "createdAt" SET DEFAULT now()`);

        // User
        await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "createdAt" TYPE TIMESTAMP WITH TIME ZONE USING "createdAt" AT TIME ZONE 'UTC'`);
        await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "createdAt" SET DEFAULT now()`);

        // AuditLog
        await queryRunner.query(`ALTER TABLE "audit_log" ALTER COLUMN "createdAt" TYPE TIMESTAMP WITH TIME ZONE USING "createdAt" AT TIME ZONE 'UTC'`);
        await queryRunner.query(`ALTER TABLE "audit_log" ALTER COLUMN "createdAt" SET DEFAULT now()`);

        // Add FK constraint if missing (from original migration)

        await queryRunner.query(`ALTER TABLE "reservation_item" ADD CONSTRAINT "FK_71b91326dda6db395ef13aa334c" FOREIGN KEY ("productId") REFERENCES "product"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "reservation_item" DROP CONSTRAINT "FK_71b91326dda6db395ef13aa334c"`);
        await queryRunner.query(`ALTER TABLE "audit_log" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "audit_log" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "user" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "order" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "order" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "reservation" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "reservation" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "reservation" DROP COLUMN "expiresAt"`);
        await queryRunner.query(`ALTER TABLE "reservation" ADD "expiresAt" TIMESTAMP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "product" DROP COLUMN "updatedAt"`);
        await queryRunner.query(`ALTER TABLE "product" ADD "updatedAt" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "product" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "product" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`);
    }

}
