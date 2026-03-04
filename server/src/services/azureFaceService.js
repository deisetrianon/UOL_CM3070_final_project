import axios from 'axios';
import config from '../config/index.js';

class AzureFaceService {
  constructor() {
    this.apiKey = config.azure.faceApiKey;
    this.endpoint = config.azure.faceApiEndpoint;
    this.detectUrl = `${this.endpoint}/face/v1.0/detect`;
  }

  validateCredentials() {
    if (!this.apiKey) {
      throw new Error('Azure Face API key is not configured');
    }
    if (!this.endpoint) {
      throw new Error('Azure Face API endpoint is not configured');
    }
  }

  async detectFaces(imageBuffer) {
    this.validateCredentials();

    try {
      const params = new URLSearchParams({
        returnFaceId: 'false',
        returnFaceLandmarks: 'true',
        returnFaceAttributes: 'headPose,blur,exposure,occlusion,glasses',
        recognitionModel: 'recognition_04',
        returnRecognitionModel: 'false',
        detectionModel: 'detection_03',
        faceIdTimeToLive: '60'
      });

      const response = await axios.post(
        `${this.detectUrl}?${params.toString()}`,
        imageBuffer,
        {
          headers: {
            'Content-Type': 'application/octet-stream',
            'Ocp-Apim-Subscription-Key': this.apiKey
          },
          timeout: 30000
        }
      );

      return {
        success: true,
        faces: response.data,
        faceCount: response.data.length,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      if (error.response) {
        const status = error.response.status;
        const azureError = error.response.data?.error;

        if (status === 401) {
          throw new Error('Invalid Azure API key');
        }
        if (status === 403) {
          throw new Error('Azure API access denied');
        }
        if (status === 429) {
          throw new Error('Azure API rate limit exceeded');
        }
        
        throw new Error(azureError?.message || `Azure API error: ${status}`);
      }

      throw new Error(`Failed to connect to Azure Face API: ${error.message}`);
    }
  }

  analyzeStressIndicators(faceData) {
    if (!faceData.faces || faceData.faces.length === 0) {
      return {
        detected: false,
        message: 'No face detected in the image'
      };
    }

    const face = faceData.faces[0]; // Analyze primary face
    const attributes = face.faceAttributes || {};
    const landmarks = face.faceLandmarks || {};
    const headPose = attributes.headPose || {};

    let eyeAspectRatio = null;
    if (landmarks.eyeLeftTop && landmarks.eyeLeftBottom && 
        landmarks.eyeLeftInner && landmarks.eyeLeftOuter) {
      const leftEyeHeight = Math.abs(landmarks.eyeLeftTop.y - landmarks.eyeLeftBottom.y);
      const leftEyeWidth = Math.abs(landmarks.eyeLeftOuter.x - landmarks.eyeLeftInner.x);
      eyeAspectRatio = leftEyeHeight / leftEyeWidth;
    }

    const THRESHOLDS = {
      headDropPitch: -7,        // Head tilting down (degrees) - negative = looking down
      headTiltRoll: 15,         // Head tilting sideways (degrees)
      distractionYaw: 20,       // Looking away left/right (degrees)
      eyeAspectRatioLow: 0.28,  // Eyes closing threshold
      eyeAspectRatioVeryLow: 0.22
    };

    const pitch = headPose.pitch || 0;
    const roll = headPose.roll || 0;
    const yaw = headPose.yaw || 0;

    const headPoseAnalysis = {
      pitch,
      roll,
      yaw,
      isHeadDropping: pitch < THRESHOLDS.headDropPitch,
      isHeadTilted: Math.abs(roll) > THRESHOLDS.headTiltRoll,
      isDistracted: Math.abs(yaw) > THRESHOLDS.distractionYaw
    };

    const occlusion = attributes.occlusion || {};
    const eyesOccluded = occlusion.eyeOccluded || false;
    const foreheadOccluded = occlusion.foreheadOccluded || false;

    let fatigueScore = 0;
    const fatigueReasons = [];

    if (pitch < THRESHOLDS.headDropPitch) {
      fatigueScore += 30;
      fatigueReasons.push(`Head dropping (pitch: ${pitch.toFixed(1)}°)`);
    } else if (pitch < 0) {
      fatigueScore += Math.abs(pitch) * 2;
    }

    if (Math.abs(roll) > THRESHOLDS.headTiltRoll) {
      fatigueScore += 20;
      fatigueReasons.push(`Head tilted (roll: ${roll.toFixed(1)}°)`);
    }

    if (eyeAspectRatio !== null) {
      if (eyeAspectRatio < THRESHOLDS.eyeAspectRatioVeryLow) {
        fatigueScore += 40;
        fatigueReasons.push(`Eyes very closed (EAR: ${eyeAspectRatio.toFixed(2)})`);
      } else if (eyeAspectRatio < THRESHOLDS.eyeAspectRatioLow) {
        fatigueScore += 25;
        fatigueReasons.push(`Eyes partially closed (EAR: ${eyeAspectRatio.toFixed(2)})`);
      }
    }

    if (eyesOccluded) {
      fatigueScore += 35;
      fatigueReasons.push('Eyes occluded/covered');
    }

    const fatigueLevel = fatigueScore >= 50 ? 'high' : fatigueScore >= 25 ? 'moderate' : 'low';

    return {
      detected: true,
      faceRectangle: face.faceRectangle,
      headPose: headPoseAnalysis,
      eyeAspectRatio,
      glasses: attributes.glasses || 'noGlasses',
      occlusion: {
        eyeOccluded: eyesOccluded,
        foreheadOccluded: foreheadOccluded,
        mouthOccluded: occlusion.mouthOccluded || false
      },
      imageQuality: {
        blur: attributes.blur?.blurLevel || 'unknown',
        blurValue: attributes.blur?.value || 0,
        exposure: attributes.exposure?.exposureLevel || 'unknown',
        exposureValue: attributes.exposure?.value || 0
      },
      stressIndicators: {
        fatigueScore,
        fatigueLevel,
        fatigueReasons,
        possibleFatigue: fatigueScore >= 25, // Moderate or high fatigue
        possibleDistraction: headPoseAnalysis.isDistracted,
        poorImageQuality: attributes.blur?.blurLevel === 'high' || attributes.exposure?.exposureLevel !== 'goodExposure'
      },
      debug: {
        thresholds: THRESHOLDS,
        rawValues: {
          pitch,
          roll, 
          yaw,
          eyeAspectRatio,
          eyesOccluded
        }
      },
      rawData: face 
    };
  }
}

export default new AzureFaceService();
