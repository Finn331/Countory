import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/reports/inventory
export const getInventoryReport = async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      where: {
        organizationId: req.user.organizationId,
        status: 'active',
      },
      include: {
        category: { select: { name: true } },
        warehouseStocks: {
          include: { warehouse: { select: { name: true } } },
        },
      },
      orderBy: { name: 'asc' },
    });

    const report = products.map((p) => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      barcode: p.barcode,
      category: p.category?.name || '-',
      unit: p.unit,
      minimumStock: p.minimumStock,
      maximumStock: p.maximumStock,
      stocks: p.warehouseStocks.map((ws) => ({
        warehouse: ws.warehouse.name,
        quantity: ws.quantity,
      })),
      totalStock: p.warehouseStocks.reduce((sum, ws) => sum + ws.quantity, 0),
    }));

    res.json({ report });
  } catch (err) {
    console.error('Get inventory report error:', err);
    res.status(500).json({ error: 'Gagal mengambil laporan inventaris' });
  }
};

// GET /api/reports/movements
export const getMovementsReport = async (req, res) => {
  try {
    const { startDate, endDate, movementType } = req.query;

    const where = {
      product: { organizationId: req.user.organizationId },
      ...(movementType && { movementType }),
      ...(startDate && endDate && {
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      }),
    };

    const movements = await prisma.inventoryMovement.findMany({
      where,
      include: {
        product: { select: { name: true, sku: true } },
        warehouse: { select: { name: true } },
        user: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ report: movements });
  } catch (err) {
    console.error('Get movements report error:', err);
    res.status(500).json({ error: 'Gagal mengambil laporan pergerakan' });
  }
};

// GET /api/reports/scans
export const getScansReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const where = {
      user: { organizationId: req.user.organizationId },
      ...(startDate && endDate && {
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      }),
    };

    const scans = await prisma.scanSession.findMany({
      where,
      include: {
        product: { select: { name: true, sku: true } },
        warehouse: { select: { name: true } },
        user: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const summary = {
      totalScans: scans.length,
      totalDetected: scans.reduce((sum, s) => sum + s.detectedCount, 0),
      totalConfirmed: scans.reduce((sum, s) => sum + s.confirmedCount, 0),
      avgProcessingTime: scans.length
        ? scans.reduce((sum, s) => sum + s.processingTimeMs, 0) / scans.length
        : 0,
    };

    res.json({ report: scans, summary });
  } catch (err) {
    console.error('Get scans report error:', err);
    res.status(500).json({ error: 'Gagal mengambil laporan scan' });
  }
};

// GET /api/reports/detection-performance
export const getDetectionPerformance = async (req, res) => {
  try {
    const scans = await prisma.scanSession.findMany({
      where: {
        user: { organizationId: req.user.organizationId },
      },
      select: {
        detectedCount: true,
        confirmedCount: true,
        processingTimeMs: true,
        scanMode: true,
        deviceType: true,
        createdAt: true,
      },
    });

    const performance = {
      totalScans: scans.length,
      accuracy: scans.length
        ? scans.reduce((sum, s) => sum + (s.confirmedCount / (s.detectedCount || 1)), 0) / scans.length * 100
        : 0,
      avgProcessingTime: scans.length
        ? scans.reduce((sum, s) => sum + s.processingTimeMs, 0) / scans.length
        : 0,
      byMode: {
        photo: scans.filter((s) => s.scanMode === 'photo').length,
        live: scans.filter((s) => s.scanMode === 'live').length,
      },
    };

    res.json({ performance });
  } catch (err) {
    console.error('Get detection performance error:', err);
    res.status(500).json({ error: 'Gagal mengambil performa deteksi' });
  }
};

// GET /api/reports/export
export const exportReport = async (req, res) => {
  try {
    const { type, format = 'csv' } = req.query;

    let data;
    if (type === 'inventory') {
      const products = await prisma.product.findMany({
        where: { organizationId: req.user.organizationId, status: 'active' },
        include: {
          category: { select: { name: true } },
          warehouseStocks: { include: { warehouse: { select: { name: true } } } },
        },
      });

      data = products.map((p) => ({
        Name: p.name,
        SKU: p.sku,
        Barcode: p.barcode || '',
        Category: p.category?.name || '',
        Unit: p.unit,
        'Min Stock': p.minimumStock,
        'Max Stock': p.maximumStock,
        'Total Stock': p.warehouseStocks.reduce((sum, ws) => sum + ws.quantity, 0),
      }));
    } else if (type === 'movements') {
      const movements = await prisma.inventoryMovement.findMany({
        where: { product: { organizationId: req.user.organizationId } },
        include: {
          product: { select: { name: true, sku: true } },
          warehouse: { select: { name: true } },
          user: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
      });

      data = movements.map((m) => ({
        Date: new Date(m.createdAt).toLocaleDateString('id-ID'),
        Product: m.product.name,
        SKU: m.product.sku,
        Warehouse: m.warehouse.name,
        Type: m.movementType,
        Quantity: m.quantity,
        'Previous Stock': m.previousStock,
        'Current Stock': m.currentStock,
        User: m.user.name,
        Notes: m.notes || '',
      }));
    }

    if (format === 'csv') {
      if (!data || !data.length) {
        return res.status(404).json({ error: 'Tidak ada data untuk diekspor' });
      }

      const headers = Object.keys(data[0]);
      const csv = [
        headers.join(','),
        ...data.map((row) => headers.map((h) => `"${row[h]}"`).join(',')),
      ].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=report-${type}-${Date.now()}.csv`);
      res.send(csv);
    } else {
      res.json({ report: data });
    }
  } catch (err) {
    console.error('Export report error:', err);
    res.status(500).json({ error: 'Gagal mengekspor laporan' });
  }
};
