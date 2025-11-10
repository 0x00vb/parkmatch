-- CreateTable
CREATE TABLE "Make" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,

    CONSTRAINT "Make_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Model" (
    "id" SERIAL NOT NULL,
    "make_id" INTEGER NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "length_mm" INTEGER,
    "width_mm" INTEGER,
    "height_mm" INTEGER,

    CONSTRAINT "Model_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Make_name_key" ON "Make"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Model_make_id_name_key" ON "Model"("make_id", "name");

-- AddForeignKey
ALTER TABLE "Model" ADD CONSTRAINT "Model_make_id_fkey" FOREIGN KEY ("make_id") REFERENCES "Make"("id") ON DELETE CASCADE ON UPDATE CASCADE;
