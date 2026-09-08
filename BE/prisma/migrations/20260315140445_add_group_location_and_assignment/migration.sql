-- CreateTable
CREATE TABLE "group_locations" (
    "id" TEXT NOT NULL,
    "group_id" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "accuracy" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'available',
    "battery_level" INTEGER,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "group_locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "group_assignments" (
    "id" TEXT NOT NULL,
    "group_id" TEXT NOT NULL,
    "disaster_report_id" TEXT NOT NULL,
    "assigned_by" TEXT NOT NULL,
    "assigned_by_type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "notes" TEXT,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "group_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "group_locations_group_id_key" ON "group_locations"("group_id");

-- CreateIndex
CREATE INDEX "group_locations_group_id_idx" ON "group_locations"("group_id");

-- CreateIndex
CREATE INDEX "group_assignments_group_id_idx" ON "group_assignments"("group_id");

-- CreateIndex
CREATE INDEX "group_assignments_disaster_report_id_idx" ON "group_assignments"("disaster_report_id");

-- CreateIndex
CREATE INDEX "group_assignments_status_idx" ON "group_assignments"("status");

-- AddForeignKey
ALTER TABLE "group_locations" ADD CONSTRAINT "group_locations_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_assignments" ADD CONSTRAINT "group_assignments_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;
