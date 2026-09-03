const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
    const reports = await prisma.disasterReport.findMany({ where: { is_sos: true } });
    if (reports.length > 0) {
        console.log("Found report:", reports[0]);
        const user = await prisma.user.findUnique({ where: { id: reports[0].user_id } });
        console.log("Found user:", user);
    } else {
        console.log("No SOS reports found.");
    }
}
main().catch(console.error).finally(() => prisma.$disconnect());
