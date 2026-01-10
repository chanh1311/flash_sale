import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAuditAndIdempotency1767779942830 implements MigrationInterface {
    name = 'AddAuditAndIdempotency1767779942830'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "audit_log" ("id" SERIAL NOT NULL, "action" character varying NOT NULL, "userId" integer NOT NULL, "resourceId" character varying, "payload" jsonb, "note" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_07fefa57f7f5ab8fc3f52b3ed0b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "reservation" ADD "idempotencyKey" character varying`);
        await queryRunner.query(`ALTER TABLE "reservation" ADD CONSTRAINT "UQ_87cae1f7def6f2dc4cb5807e45c" UNIQUE ("idempotencyKey")`);
        await queryRunner.query(`ALTER TABLE "order" ADD "idempotencyKey" character varying`);
        await queryRunner.query(`ALTER TABLE "order" ADD CONSTRAINT "UQ_dcc1766b047d4b14ea3e113e766" UNIQUE ("idempotencyKey")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "order" DROP CONSTRAINT "UQ_dcc1766b047d4b14ea3e113e766"`);
        await queryRunner.query(`ALTER TABLE "order" DROP COLUMN "idempotencyKey"`);
        await queryRunner.query(`ALTER TABLE "reservation" DROP CONSTRAINT "UQ_87cae1f7def6f2dc4cb5807e45c"`);
        await queryRunner.query(`ALTER TABLE "reservation" DROP COLUMN "idempotencyKey"`);
        await queryRunner.query(`DROP TABLE "audit_log"`);
    }

}
