import { PrismaClient } from '@prisma/client';
import { validationResult } from 'express-validator';

const prisma = new PrismaClient();

// GET /api/products/:id/detection-profiles
export const getDetectionProfiles = async (req, res) => {
  try {
    const profiles = await prisma.detectionProfile.findMany({
      where: { productId: parseInt(req.params.id) },
      orderBy: { version: 'desc' },
    });

    res.json({ profiles });
  } catch (err) {
    console.error('Get detection profiles error:', err);
    res.status(500).json({ error: 'Gagal mengambil data profil deteksi' });
  }
};

// POST /api/products/:id/detection-profiles
export const createDetectionProfile = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }

  try {
    const {
      name,
      detectionType,
      colorMode,
      minArea,
      maxArea,
      minWidth,
      maxWidth,
      minHeight,
      maxHeight,
      minAspectRatio,
      maxAspectRatio,
      minCircularity,
      thresholdMode,
      thresholdValue,
      blurKernel,
      morphologyKernel,
      hsvMin,
      hsvMax,
    } = req.body;

    // Get latest version
    const latestProfile = await prisma.detectionProfile.findFirst({
      where: { productId: parseInt(req.params.id) },
      orderBy: { version: 'desc' },
    });

    const profile = await prisma.detectionProfile.create({
      data: {
        productId: parseInt(req.params.id),
        name,
        detectionType: detectionType || 'contour',
        colorMode: colorMode || 'color',
        minArea: parseFloat(minArea) || 500,
        maxArea: parseFloat(maxArea) || 100000,
        minWidth: parseFloat(minWidth) || 20,
        maxWidth: parseFloat(maxWidth) || 500,
        minHeight: parseFloat(minHeight) || 20,
        maxHeight: parseFloat(maxHeight) || 500,
        minAspectRatio: parseFloat(minAspectRatio) || 0.2,
        maxAspectRatio: parseFloat(maxAspectRatio) || 5,
        minCircularity: parseFloat(minCircularity) || 0,
        thresholdMode: thresholdMode || 'binary',
        thresholdValue: parseInt(thresholdValue) || 128,
        blurKernel: parseInt(blurKernel) || 5,
        morphologyKernel: parseInt(morphologyKernel) || 3,
        hsvMin: hsvMin || null,
        hsvMax: hsvMax || null,
        version: (latestProfile?.version || 0) + 1,
      },
    });

    res.status(201).json({ message: 'Profil deteksi berhasil dibuat', profile });
  } catch (err) {
    console.error('Create detection profile error:', err);
    res.status(500).json({ error: 'Gagal membuat profil deteksi' });
  }
};

// PUT /api/detection-profiles/:id
export const updateDetectionProfile = async (req, res) => {
  try {
    const profile = await prisma.detectionProfile.findUnique({
      where: { id: parseInt(req.params.id) },
    });

    if (!profile) {
      return res.status(404).json({ error: 'Profil deteksi tidak ditemukan' });
    }

    const updated = await prisma.detectionProfile.update({
      where: { id: parseInt(req.params.id) },
      data: {
        name: req.body.name,
        detectionType: req.body.detectionType,
        colorMode: req.body.colorMode,
        minArea: parseFloat(req.body.minArea) || profile.minArea,
        maxArea: parseFloat(req.body.maxArea) || profile.maxArea,
        minWidth: parseFloat(req.body.minWidth) || profile.minWidth,
        maxWidth: parseFloat(req.body.maxWidth) || profile.maxWidth,
        minHeight: parseFloat(req.body.minHeight) || profile.minHeight,
        maxHeight: parseFloat(req.body.maxHeight) || profile.maxHeight,
        minAspectRatio: parseFloat(req.body.minAspectRatio) || profile.minAspectRatio,
        maxAspectRatio: parseFloat(req.body.maxAspectRatio) || profile.maxAspectRatio,
        minCircularity: parseFloat(req.body.minCircularity) || profile.minCircularity,
        thresholdMode: req.body.thresholdMode || profile.thresholdMode,
        thresholdValue: parseInt(req.body.thresholdValue) || profile.thresholdValue,
        blurKernel: parseInt(req.body.blurKernel) || profile.blurKernel,
        morphologyKernel: parseInt(req.body.morphologyKernel) || profile.morphologyKernel,
        hsvMin: req.body.hsvMin || profile.hsvMin,
        hsvMax: req.body.hsvMax || profile.hsvMax,
        version: profile.version + 1,
      },
    });

    res.json({ message: 'Profil deteksi berhasil diperbarui', profile: updated });
  } catch (err) {
    console.error('Update detection profile error:', err);
    res.status(500).json({ error: 'Gagal memperbarui profil deteksi' });
  }
};

// POST /api/detection-profiles/:id/activate
export const activateProfile = async (req, res) => {
  try {
    const profile = await prisma.detectionProfile.findUnique({
      where: { id: parseInt(req.params.id) },
    });

    if (!profile) {
      return res.status(404).json({ error: 'Profil deteksi tidak ditemukan' });
    }

    // Deactivate all other profiles for this product
    await prisma.detectionProfile.updateMany({
      where: { productId: profile.productId },
      data: { isActive: false },
    });

    // Activate this profile
    await prisma.detectionProfile.update({
      where: { id: parseInt(req.params.id) },
      data: { isActive: true },
    });

    res.json({ message: 'Profil deteksi berhasil diaktifkan' });
  } catch (err) {
    console.error('Activate profile error:', err);
    res.status(500).json({ error: 'Gagal mengaktifkan profil deteksi' });
  }
};

// DELETE /api/detection-profiles/:id
export const deleteDetectionProfile = async (req, res) => {
  try {
    const profile = await prisma.detectionProfile.findUnique({
      where: { id: parseInt(req.params.id) },
    });

    if (!profile) {
      return res.status(404).json({ error: 'Profil deteksi tidak ditemukan' });
    }

    await prisma.detectionProfile.delete({
      where: { id: parseInt(req.params.id) },
    });

    res.json({ message: 'Profil deteksi berhasil dihapus' });
  } catch (err) {
    console.error('Delete detection profile error:', err);
    res.status(500).json({ error: 'Gagal menghapus profil deteksi' });
  }
};
