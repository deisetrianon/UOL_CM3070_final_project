import express from 'express';
import azureFaceService from '../services/azureFaceService.js';

const router = express.Router();

/**
 * POST /api/facial-analysis/detect
 * Receives a base64 encoded image and sends it to Azure Face API for analysis
 * 
 * Request body:
 * {
 *   "image": "data:image/jpeg;base64,/9j/4AAQSkZJRg..." // Base64 encoded image
 * }
 */
router.post('/detect', async (req, res) => {
  try {
    const { image } = req.body;

    // Validate input
    if (!image) {
      return res.status(400).json({
        success: false,
        error: 'No image provided',
        message: 'Please provide a base64 encoded image in the "image" field'
      });
    }

    // Extract base64 data (remove data URL prefix if present)
    let base64Data = image;
    if (image.includes(',')) {
      base64Data = image.split(',')[1];
    }

    // Convert base64 to Buffer
    const imageBuffer = Buffer.from(base64Data, 'base64');

    // Validate image size (Azure has limits)
    const imageSizeKB = imageBuffer.length / 1024;
    if (imageSizeKB > 6000) { // 6MB limit
      return res.status(400).json({
        success: false,
        error: 'Image too large',
        message: `Image size (${Math.round(imageSizeKB)}KB) exceeds 6MB limit`
      });
    }

    console.log(`[Facial Analysis] Processing image (${Math.round(imageSizeKB)}KB)...`);

    // Send to Azure Face API
    const faceData = await azureFaceService.detectFaces(imageBuffer);

    console.log(`[Facial Analysis] Detected ${faceData.faceCount} face(s)`);

    // Analyze stress indicators
    const analysis = azureFaceService.analyzeStressIndicators(faceData);

    // Return combined results
    res.json({
      success: true,
      timestamp: faceData.timestamp,
      faceCount: faceData.faceCount,
      analysis,
      raw: faceData.faces // Include raw Azure response for debugging
    });

  } catch (error) {
    console.error('[Facial Analysis] Error:', error.message);
    
    res.status(error.message.includes('not configured') ? 503 : 500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/facial-analysis/status
 * Check if the Azure Face API is properly configured
 */
router.get('/status', (req, res) => {
  try {
    azureFaceService.validateCredentials();
    res.json({
      success: true,
      message: 'Azure Face API is configured',
      endpoint: azureFaceService.endpoint?.replace(/\/+$/, '').split('/').slice(0, 3).join('/') + '/...'
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      error: error.message,
      message: 'Please configure Azure Face API credentials in .env file'
    });
  }
});

export default router;
