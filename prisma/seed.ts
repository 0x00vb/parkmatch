import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding makes and models...')

  // Insert makes
  const makesData = [
    { name: 'Toyota' },
    { name: 'Ford' },
    { name: 'Chevrolet' },
    { name: 'Honda' }
  ]

  for (const make of makesData) {
    await prisma.make.upsert({
      where: { name: make.name },
      update: {},
      create: make,
    })
  }

  // Get make IDs for models
  const toyota = await prisma.make.findUnique({ where: { name: 'Toyota' } })
  const ford = await prisma.make.findUnique({ where: { name: 'Ford' } })
  const chevrolet = await prisma.make.findUnique({ where: { name: 'Chevrolet' } })
  const honda = await prisma.make.findUnique({ where: { name: 'Honda' } })

  // Insert models
  const modelsData = [
    // Honda models
    { make_id: honda!.id, name: 'Civic', length_mm: 4551, width_mm: 1802, height_mm: 1408 },
    { make_id: honda!.id, name: 'Fit', length_mm: 4090, width_mm: 1725, height_mm: 1545 },
    // Toyota models
    { make_id: toyota!.id, name: 'Corolla', length_mm: 4630, width_mm: 1780, height_mm: 1435 },
    // Chevrolet models
    { make_id: chevrolet!.id, name: 'Cruze', length_mm: 4600, width_mm: 1790, height_mm: 1480 },
  ]

  for (const model of modelsData) {
    await prisma.model.upsert({
      where: {
        make_id_name: {
          make_id: model.make_id,
          name: model.name
        }
      },
      update: {},
      create: model,
    })
  }

  console.log('Seeding completed!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
