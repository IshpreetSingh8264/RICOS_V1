-- CreateTable
CREATE TABLE "responder_locations" (
    "id" TEXT NOT NULL,
    "responder_id" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "accuracy" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'available',
    "battery_level" INTEGER,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "responder_locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "disaster_reports" (
    "id" TEXT NOT NULL,
    "responder_id" TEXT NOT NULL,
    "pincode" TEXT,
    "city" TEXT,
    "village" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "severity" TEXT NOT NULL,
    "water_level" TEXT,
    "affected_population" INTEGER,
    "stuck_people_found" BOOLEAN NOT NULL DEFAULT false,
    "resources_needed" TEXT,
    "notes" TEXT,
    "images" TEXT,
    "polygon" JSONB,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "approved_by" TEXT,
    "approved_at" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "disaster_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pincode_polygons" (
    "id" TEXT NOT NULL,
    "pincode" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "district" TEXT,
    "polygon" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pincode_polygons_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "responder_locations_responder_id_timestamp_idx" ON "responder_locations"("responder_id", "timestamp");

-- CreateIndex
CREATE INDEX "disaster_reports_pincode_idx" ON "disaster_reports"("pincode");

-- CreateIndex
CREATE INDEX "disaster_reports_status_idx" ON "disaster_reports"("status");

-- CreateIndex
CREATE INDEX "disaster_reports_severity_idx" ON "disaster_reports"("severity");

-- CreateIndex
CREATE UNIQUE INDEX "pincode_polygons_pincode_key" ON "pincode_polygons"("pincode");

-- CreateIndex
CREATE INDEX "pincode_polygons_pincode_idx" ON "pincode_polygons"("pincode");
