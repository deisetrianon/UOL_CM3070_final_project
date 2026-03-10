import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import facialAnalysisRouter from '../facialAnalysis.js';
import azureFaceService from '../../services/azureFaceService.js';

global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
};

jest.mock('../../services/azureFaceService.js');

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use('/api/facial-analysis', facialAnalysisRouter);

describe('Facial Analysis Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/facial-analysis/detect', () => {
    it('should analyze facial image', async () => {
      const base64Image = Buffer.from('test-image-data').toString('base64');
      const mockFaceData = {
        faces: [
          {
            faceAttributes: { headPose: { pitch: 0 } },
            faceLandmarks: {},
          },
        ],
        faceCount: 1,
        timestamp: new Date().toISOString(),
      };

      const mockAnalysis = {
        detected: true,
        indicators: { fatigue: false, stress: false },
      };

      azureFaceService.detectFaces = jest.fn().mockResolvedValue(mockFaceData);
      azureFaceService.analyzeStressIndicators = jest.fn().mockReturnValue(mockAnalysis);

      const response = await request(app)
        .post('/api/facial-analysis/detect')
        .send({ image: base64Image })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.faceCount).toBe(1);
      expect(response.body.analysis).toBeDefined();
    });

    it('should return error for missing image', async () => {
      const response = await request(app)
        .post('/api/facial-analysis/detect')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('VALIDATION_ERROR');
    });

    it('should return error for image too large', async () => {
      const largeImage = 'data:image/jpeg;base64,' + 'a'.repeat(9000000);

      const response = await request(app)
        .post('/api/facial-analysis/detect')
        .send({ image: largeImage })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should handle Azure API errors', async () => {
      const base64Image = Buffer.from('test').toString('base64');
      const error = new Error('Invalid Azure API key');
      azureFaceService.detectFaces = jest.fn().mockRejectedValue(error);

      const response = await request(app)
        .post('/api/facial-analysis/detect')
        .send({ image: base64Image })
        .expect(500);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/facial-analysis/status', () => {
    it('should return status when configured', async () => {
      azureFaceService.validateCredentials = jest.fn();
      azureFaceService.endpoint = 'https://test-endpoint.cognitive.microsoft.com';

      const response = await request(app)
        .get('/api/facial-analysis/status')
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should return error when not configured', async () => {
      azureFaceService.validateCredentials = jest.fn().mockImplementation(() => {
        throw new Error('Azure Face API key is not configured');
      });

      const response = await request(app)
        .get('/api/facial-analysis/status')
        .expect(500);

      expect(response.body.success).toBe(false);
    });
  });
});
