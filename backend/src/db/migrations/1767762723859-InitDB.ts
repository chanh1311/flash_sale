import { MigrationInterface, QueryRunner } from "typeorm";

export class InitDB1767762723859 implements MigrationInterface {
    name = 'InitDB1767762723859'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "product" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "price" numeric(10,2) NOT NULL, "totalStock" integer NOT NULL DEFAULT '0', "availableStock" integer NOT NULL DEFAULT '0', "reservedStock" integer NOT NULL DEFAULT '0', "soldStock" integer NOT NULL DEFAULT '0', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_bebc9158e480b949565b4dc7a82" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "reservation_item" ("id" SERIAL NOT NULL, "productId" integer NOT NULL, "quantity" integer NOT NULL, "reservationId" integer, CONSTRAINT "PK_0080a75ff7fac5703092e675f50" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."reservation_status_enum" AS ENUM('ACTIVE', 'COMPLETED', 'EXPIRED', 'CANCELLED')`);
        await queryRunner.query(`CREATE TABLE "reservation" ("id" SERIAL NOT NULL, "userId" integer NOT NULL, "status" "public"."reservation_status_enum" NOT NULL DEFAULT 'ACTIVE', "expiresAt" TIMESTAMP NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_48b1f9922368359ab88e8bfa525" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."order_status_enum" AS ENUM('PENDING_PAYMENT', 'PAID', 'CANCELLED', 'EXPIRED')`);
        await queryRunner.query(`CREATE TABLE "order" ("id" SERIAL NOT NULL, "reservationId" integer NOT NULL, "userId" integer NOT NULL, "totalAmount" numeric NOT NULL, "status" "public"."order_status_enum" NOT NULL DEFAULT 'PENDING_PAYMENT', "paymentId" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_1031171c13130102495201e3e20" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "reservation_item" ADD CONSTRAINT "FK_95bea5815e6a171885dfaf52dad" FOREIGN KEY ("reservationId") REFERENCES "reservation"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "reservation_item" DROP CONSTRAINT "FK_95bea5815e6a171885dfaf52dad"`);
        await queryRunner.query(`DROP TABLE "order"`);
        await queryRunner.query(`DROP TYPE "public"."order_status_enum"`);
        await queryRunner.query(`DROP TABLE "reservation"`);
        await queryRunner.query(`DROP TYPE "public"."reservation_status_enum"`);
        await queryRunner.query(`DROP TABLE "reservation_item"`);
        await queryRunner.query(`DROP TABLE "product"`);
    }

}
