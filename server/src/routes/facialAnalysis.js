/**
 * Facial analysis routes.
 * Handles facial analysis requests using Azure Face API.
 * 
 * @module routes/facialAnalysis
 */

import express from 'express';
import azureFaceService from '../services/azureFaceService.js';
import { asyncHandler, sendSuccess, sendError, sendValidationError } from '../utils/response.js';
import { HTTP_STATUS } from '../constants/index.js';

const router = express.Router();

const MAX_IMAGE_SIZE_KB = 6000;

router.post('/detect', asyncHandler(async (req, res) => {
  const { image } = req.body;

  if (!image) {
    return sendValidationError(res, 'No image provided. Please provide a base64 encoded image in the "image" field');
  }

  let base64Data = image;
  if (image.includes(',')) {
    base64Data = image.split(',')[1];
  }

  const imageBuffer = Buffer.from(base64Data, 'base64');
  const imageSizeKB = imageBuffer.length / 1024;
  
  if (imageSizeKB > MAX_IMAGE_SIZE_KB) {
    return sendValidationError(res, `Image size (${Math.round(imageSizeKB)}KB) exceeds ${MAX_IMAGE_SIZE_KB / 1000}MB limit`);
  }

  console.log(`[Facial Analysis] Processing image (${Math.round(imageSizeKB)}KB)...`);

  try {
    const faceData = await azureFaceService.detectFaces(imageBuffer);
    console.log(`[Facial Analysis] Detected ${faceData.faceCount} face(s)`);
    const analysis = azureFaceService.analyzeStressIndicators(faceData);

    sendSuccess(res, {
      timestamp: faceData.timestamp,
      faceCount: faceData.faceCount,
      analysis,
      raw: faceData.faces
    });
  } catch (error) {
    console.error('[Facial Analysis] Error:', error.message);
    const statusCode = error.message.includes('not configured') ? HTTP_STATUS.INTERNAL_SERVER_ERROR : HTTP_STATUS.INTERNAL_SERVER_ERROR;
    sendError(res, error.message, statusCode);
  }
}));

router.get('/status', (req, res) => {
  try {
    azureFaceService.validateCredentials();
    sendSuccess(res, {
      message: 'Azure Face API is configured',
      endpoint: azureFaceService.endpoint?.replace(/\/+$/, '').split('/').slice(0, 3).join('/') + '/...'
    });
  } catch (error) {
    sendError(res, error.message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
});

export default router;
