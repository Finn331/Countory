import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // 1. Create Organization
  const org = await prisma.organization.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: 'PT Countory Demo',
      address: 'Jl. Sudirman No. 1, Jakarta',
      phone: '021-1234567',
      email: 'info@countory.demo',
      timezone: 'Asia/Jakarta',
    },
  });
  console.log(`✅ Organization: ${org.name}`);

  // 2. Create Users
  const passwordHash = await bcrypt.hash('Password123', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@countory.demo' },
    update: {},
    create: {
      name: 'Admin Countory',
      email: 'admin@countory.demo',
      passwordHash,
      organizationId: org.id,
      role: 'admin',
      status: 'active',
    },
  });
  console.log(`✅ Admin: ${admin.email}`);

  const manager = await prisma.user.upsert({
    where: { email: 'manager@countory.demo' },
    update: {},
    create: {
      name: 'Manager Gudang',
      email: 'manager@countory.demo',
      passwordHash,
      organizationId: org.id,
      role: 'manager',
      status: 'active',
    },
  });
  console.log(`✅ Manager: ${manager.email}`);

  const staff = await prisma.user.upsert({
    where: { email: 'staff@countory.demo' },
    update: {},
    create: {
      name: 'Staff Gudang',
      email: 'staff@countory.demo',
      passwordHash,
      organizationId: org.id,
      role: 'staff',
      status: 'active',
    },
  });
  console.log(`✅ Staff: ${staff.email}`);

  // 3. Create Warehouses
  const wh1 = await prisma.warehouse.upsert({
    where: { id: 1 },
    update: {},
    create: {
      organizationId: org.id,
      name: 'Gudang Pusat Jakarta',
      code: 'GDG-JKT',
      address: 'Jl. Sudirman No. 1, Jakarta Pusat',
      managerId: manager.id,
      status: 'active',
    },
  });
  console.log(`✅ Warehouse: ${wh1.name}`);

  const wh2 = await prisma.warehouse.upsert({
    where: { id: 2 },
    update: {},
    create: {
      organizationId: org.id,
      name: 'Gudang Cabang Surabaya',
      code: 'GDG-SBY',
      address: 'Jl. Pemuda No. 5, Surabaya',
      managerId: manager.id,
      status: 'active',
    },
  });
  console.log(`✅ Warehouse: ${wh2.name}`);

  // 4. Create Categories
  const cat1 = await prisma.category.upsert({
    where: { id: 1 },
    update: {},
    create: {
      organizationId: org.id,
      name: 'Elektronik',
      code: 'ELK',
      description: 'Produk elektronik dan gadget',
      icon: 'cpu',
      status: 'active',
    },
  });
  console.log(`✅ Category: ${cat1.name}`);

  const cat2 = await prisma.category.upsert({
    where: { id: 2 },
    update: {},
    create: {
      organizationId: org.id,
      name: 'Makanan & Minuman',
      code: 'FOOD',
      description: 'Produk konsumsi makanan dan minuman',
      icon: 'utensils',
      status: 'active',
    },
  });
  console.log(`✅ Category: ${cat2.name}`);

  const cat3 = await prisma.category.upsert({
    where: { id: 3 },
    update: {},
    create: {
      organizationId: org.id,
      name: 'ATK (Alat Tulis Kantor)',
      code: 'ATK',
      description: 'Peralatan kantor dan stationery',
      icon: 'pen-tool',
      status: 'active',
    },
  });
  console.log(`✅ Category: ${cat3.name}`);

  // 5. Create Products
  const products = [
    { name: 'Laptop ASUS ROG Strix', sku: 'LP-ASUS-001', barcode: '8901234567890', categoryId: cat1.id, unit: 'unit', min: 2, max: 50 },
    { name: 'Mouse Logitech G Pro', sku: 'MS-LGT-002', barcode: '8901234567891', categoryId: cat1.id, unit: 'unit', min: 5, max: 100 },
    { name: 'Keyboard Mechanical Keychron', sku: 'KB-KCN-003', barcode: '8901234567892', categoryId: cat1.id, unit: 'unit', min: 3, max: 80 },
    { name: 'Monitor Samsung 27 inch', sku: 'MN-SMS-004', barcode: '8901234567893', categoryId: cat1.id, unit: 'unit', min: 2, max: 30 },
    { name: 'Headphone Sony WH-1000XM5', sku: 'HP-SNY-005', barcode: '8901234567894', categoryId: cat1.id, unit: 'unit', min: 5, max: 50 },
    { name: 'Indomie Goreng (Dus)', sku: 'FD-IDM-006', barcode: '8901234567895', categoryId: cat2.id, unit: 'dus', min: 10, max: 200 },
    { name: 'Aqua Botol 600ml (Dus)', sku: 'FD-AQA-007', barcode: '8901234567896', categoryId: cat2.id, unit: 'dus', min: 10, max: 100 },
    { name: 'Kopi Kapal Api Sachet (Pack)', sku: 'FD-KPA-008', barcode: '8901234567897', categoryId: cat2.id, unit: 'pack', min: 20, max: 500 },
    { name: 'Pulpen Standard AE7 (Pack)', sku: 'ATK-PEN-009', barcode: '8901234567898', categoryId: cat3.id, unit: 'pack', min: 5, max: 100 },
    { name: 'Kertas A4 Sinar Dunia (Rim)', sku: 'ATK-KRT-010', barcode: '8901234567899', categoryId: cat3.id, unit: 'rim', min: 10, max: 200 },
    { name: 'Buku Tulis 38 Lembar', sku: 'ATK-BUK-011', barcode: '8901234567900', categoryId: cat3.id, unit: 'pcs', min: 20, max: 300 },
    { name: 'Stapler Joyko HD-50', sku: 'ATK-STP-012', barcode: '8901234567901', categoryId: cat3.id, unit: 'pcs', min: 5, max: 50 },
  ];

  for (const p of products) {
    const product = await prisma.product.upsert({
      where: { id: products.indexOf(p) + 1 },
      update: {},
      create: {
        organizationId: org.id,
        name: p.name,
        sku: p.sku,
        barcode: p.barcode,
        categoryId: p.categoryId,
        unit: p.unit,
        minimumStock: p.min,
        maximumStock: p.max,
        status: 'active',
      },
    });

    // 6. Create Warehouse Stocks
    const stockQty = Math.floor(Math.random() * 50) + 1;
    await prisma.warehouseStock.upsert({
      where: {
        idx_stock_warehouse_product: {
          warehouseId: wh1.id,
          productId: product.id,
        },
      },
      update: {},
      create: {
        warehouseId: wh1.id,
        productId: product.id,
        quantity: stockQty,
      },
    });

    // Some products also in warehouse 2
    if (Math.random() > 0.5) {
      const stockQty2 = Math.floor(Math.random() * 30) + 1;
      await prisma.warehouseStock.upsert({
        where: {
          idx_stock_warehouse_product: {
            warehouseId: wh2.id,
            productId: product.id,
          },
        },
        update: {},
        create: {
          warehouseId: wh2.id,
          productId: product.id,
          quantity: stockQty2,
        },
      });
    }
  }
  console.log(`✅ Created ${products.length} products with warehouse stocks`);

  // 7. Create some inventory movements
  const allProducts = await prisma.product.findMany();
  const movements = [
    { type: 'stock_in', qty: 20, wh: wh1.id },
    { type: 'stock_in', qty: 15, wh: wh1.id },
    { type: 'stock_out', qty: 5, wh: wh1.id },
    { type: 'stock_in', qty: 30, wh: wh2.id },
    { type: 'stock_out', qty: 10, wh: wh2.id },
    { type: 'adjustment', qty: 0, wh: wh1.id },
  ];

  for (let i = 0; i < 10; i++) {
    const p = allProducts[Math.floor(Math.random() * allProducts.length)];
    const m = movements[i % movements.length];

    const ws = await prisma.warehouseStock.findUnique({
      where: {
        idx_stock_warehouse_product: { warehouseId: m.wh, productId: p.id },
      },
    });

    if (ws) {
      const prev = ws.quantity;
      let curr = prev;
      if (m.type === 'stock_in') curr = prev + m.qty;
      else if (m.type === 'stock_out') curr = Math.max(0, prev - m.qty);
      else if (m.type === 'adjustment') curr = Math.floor(Math.random() * 20);

      await prisma.inventoryMovement.create({
        data: {
          productId: p.id,
          warehouseId: m.wh,
          userId: admin.id,
          movementType: m.type,
          quantity: m.qty || Math.abs(curr - prev) || 1,
          previousStock: prev,
          currentStock: curr,
          notes: `Seed data movement #${i + 1}`,
        },
      });

      await prisma.warehouseStock.update({
        where: { idx_stock_warehouse_product: { warehouseId: m.wh, productId: p.id } },
        data: { quantity: curr },
      });
    }
  }
  console.log('✅ Created inventory movements');

  // 8. Create notifications
  await prisma.notification.create({
    data: {
      userId: admin.id,
      title: 'Stok Rendah',
      message: 'Beberapa produk memiliki stok di bawah batas minimum. Silakan lakukan pemesanan ulang.',
      type: 'warning',
      isRead: false,
    },
  });

  await prisma.notification.create({
    data: {
      userId: admin.id,
      title: 'Selamat Datang!',
      message: 'Database Countory telah di-seed dengan data demo. Anda bisa langsung mulai testing.',
      type: 'info',
      isRead: false,
    },
  });

  await prisma.notification.create({
    data: {
      userId: manager.id,
      title: 'Stock Opname Tersedia',
      message: 'Sesi stock opname baru dapat dibuat kapan saja melalui menu Stock Opname.',
      type: 'success',
      isRead: true,
    },
  });
  console.log('✅ Created notifications');

  // 9. Create audit logs
  await prisma.auditLog.create({
    data: {
      userId: admin.id,
      action: 'register',
      resourceType: 'user',
      resourceId: admin.id,
      newData: { email: admin.email, role: 'admin' },
      ipAddress: '127.0.0.1',
      userAgent: 'Mozilla/5.0 Seed Script',
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: admin.id,
      action: 'create',
      resourceType: 'warehouse',
      resourceId: wh1.id,
      newData: { name: wh1.name, code: wh1.code },
      ipAddress: '127.0.0.1',
      userAgent: 'Mozilla/5.0 Seed Script',
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: admin.id,
      action: 'create',
      resourceType: 'product',
      resourceId: 1,
      newData: { name: products[0].name, sku: products[0].sku },
      ipAddress: '127.0.0.1',
      userAgent: 'Mozilla/5.0 Seed Script',
    },
  });
  console.log('✅ Created audit logs');

  console.log('\n🎉 Seed completed successfully!');
  console.log('\n📋 Demo Login Credentials:');
  console.log('   Admin:    admin@countory.demo');
  console.log('   Manager:  manager@countory.demo');
  console.log('   Staff:    staff@countory.demo');
  console.log('   Password: Password123 (for all accounts)');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
