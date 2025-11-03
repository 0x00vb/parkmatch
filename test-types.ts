import { prisma } from "./lib/prisma"; const test = { firstName: "test", lastName: "test", phone: "1234567890" }; const result = prisma.user.update({ where: { id: "test" }, data: test });
