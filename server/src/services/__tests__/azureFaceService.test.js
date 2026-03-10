import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import axios from 'axios';
import { AzureFaceService } from '../azureFaceService.js';

global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
};

jest.mock('axios');
jest.mock('../../config/index.js', () => ({
  default: {
    azure: {
      faceApiKey: 'test-api-key',
      faceApiEndpoint: 'https://test-endpoint.cognitive.microsoft.com',
    },
  },
}));

describe('AzureFaceService', () => {
  let azureFaceService;

  beforeEach(() => {
    jest.clearAllMocks();
    axios.post = jest.fn();
    azureFaceService = new AzureFaceService();
  });

  describe('validateCredentials', () => {
    it('should throw error if API key is missing', () => {
      azureFaceService.apiKey = null;
      expect(() => azureFaceService.validateCredentials()).toThrow('Azure Face API key is not configured');
    });

    it('should throw error if endpoint is missing', () => {
      azureFaceService.endpoint = null;
      expect(() => azureFaceService.validateCredentials()).toThrow('Azure Face API endpoint is not configured');
    });

    it('should not throw if credentials are valid', () => {
      expect(() => azureFaceService.validateCredentials()).not.toThrow();
    });
  });

  describe('detectFaces', () => {
    it('should detect faces successfully', async () => {
      const mockResponse = {
        data: [
          {
            faceId: 'face-id-1',
            faceAttributes: {
              headPose: { pitch: 0, roll: 0, yaw: 0 },
              blur: { blurLevel: 'low' },
              exposure: { exposureLevel: 'goodExposure' },
            },
            faceLandmarks: {
              eyeLeftTop: { x: 100, y: 50 },
              eyeLeftBottom: { x: 100, y: 60 },
            },
          },
        ],
      };

      axios.post.mockResolvedValue(mockResponse);

      const imageBuffer = Buffer.from('test-image-data');
      const result = await azureFaceService.detectFaces(imageBuffer);

      expect(result.success).toBe(true);
      expect(result.faces).toEqual(mockResponse.data);
      expect(result.faceCount).toBe(1);
      expect(axios.post).toHaveBeenCalled();
    });

    it('should handle 401 unauthorized error', async () => {
      const error = {
        response: {
          status: 401,
          data: { error: { message: 'Invalid API key' } },
        },
      };

      axios.post.mockRejectedValue(error);

      await expect(azureFaceService.detectFaces(Buffer.from('test'))).rejects.toThrow('Invalid Azure API key');
    });

    it('should handle 403 forbidden error', async () => {
      const error = {
        response: {
          status: 403,
          data: { error: { message: 'Access denied' } },
        },
      };

      axios.post.mockRejectedValue(error);

      await expect(azureFaceService.detectFaces(Buffer.from('test'))).rejects.toThrow('Azure API access denied');
    });

    it('should handle 429 rate limit error', async () => {
      const error = {
        response: {
          status: 429,
          data: { error: { message: 'Rate limit exceeded' } },
        },
      };

      axios.post.mockRejectedValue(error);

      await expect(azureFaceService.detectFaces(Buffer.from('test'))).rejects.toThrow('Azure API rate limit exceeded');
    });

    it('should handle network errors', async () => {
      const error = new Error('Network error');
      axios.post.mockRejectedValue(error);

      await expect(azureFaceService.detectFaces(Buffer.from('test'))).rejects.toThrow('Failed to connect to Azure Face API');
    });
  });

  describe('analyzeStressIndicators', () => {
    it('should return no detection for empty face data', () => {
      const result = azureFaceService.analyzeStressIndicators({ faces: [] });

      expect(result.detected).toBe(false);
      expect(result.message).toBe('No face detected in the image');
    });

    it('should analyze stress indicators from face data', () => {
      const faceData = {
        faces: [
          {
            faceAttributes: {
              headPose: { pitch: 15, roll: 5, yaw: 10 },
              blur: { blurLevel: 'medium' },
              exposure: { exposureLevel: 'overExposure' },
            },
            faceLandmarks: {
              eyeLeftTop: { x: 100, y: 50 },
              eyeLeftBottom: { x: 100, y: 60 },
              eyeRightTop: { x: 200, y: 50 },
              eyeRightBottom: { x: 200, y: 60 },
            },
          },
        ],
      };

      const result = azureFaceService.analyzeStressIndicators(faceData);

      expect(result.detected).toBe(true);
      expect(result.stressIndicators).toBeDefined();
    });

    it('should calculate eye aspect ratio', () => {
      const faceData = {
        faces: [
          {
            faceAttributes: {},
            faceLandmarks: {
              eyeLeftTop: { x: 100, y: 50 },
              eyeLeftBottom: { x: 100, y: 60 },
              eyeLeftOuter: { x: 90, y: 55 },
              eyeLeftInner: { x: 110, y: 55 },
              eyeRightTop: { x: 200, y: 50 },
              eyeRightBottom: { x: 200, y: 60 },
              eyeRightOuter: { x: 190, y: 55 },
              eyeRightInner: { x: 210, y: 55 },
            },
          },
        ],
      };

      const result = azureFaceService.analyzeStressIndicators(faceData);

      expect(result.eyeAspectRatio).toBeDefined();
    });
  });
});
