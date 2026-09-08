-- CreateTable
CREATE TABLE "groups" (
    "id" TEXT NOT NULL,
    "group_name" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "creator_type" TEXT NOT NULL,
    "creator_id" TEXT NOT NULL,
    "ngo_id" TEXT,
    "govt_id" TEXT,
    "volunteer_id" TEXT,
    "ttl_type" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "group_resource_allocations" (
    "id" TEXT NOT NULL,
    "group_id" TEXT NOT NULL,
    "inventory_item_id" TEXT NOT NULL,
    "allocated_quantity" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "group_resource_allocations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "groups_username_key" ON "groups"("username");

-- CreateIndex
CREATE UNIQUE INDEX "group_resource_allocations_group_id_inventory_item_id_key" ON "group_resource_allocations"("group_id", "inventory_item_id");

-- AddForeignKey
ALTER TABLE "groups" ADD CONSTRAINT "groups_ngo_id_fkey" FOREIGN KEY ("ngo_id") REFERENCES "ngos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "groups" ADD CONSTRAINT "groups_govt_id_fkey" FOREIGN KEY ("govt_id") REFERENCES "governments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "groups" ADD CONSTRAINT "groups_volunteer_id_fkey" FOREIGN KEY ("volunteer_id") REFERENCES "volunteers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_resource_allocations" ADD CONSTRAINT "group_resource_allocations_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_resource_allocations" ADD CONSTRAINT "group_resource_allocations_inventory_item_id_fkey" FOREIGN KEY ("inventory_item_id") REFERENCES "inventory_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
