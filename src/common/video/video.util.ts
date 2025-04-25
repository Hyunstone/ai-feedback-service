import { Logger } from '@nestjs/common';
import { exec } from 'child_process';
import * as path from 'path';
import { promisify } from 'util';

const execAsync = promisify(exec);
const logger = new Logger('VideoUtils');

export async function cropRightHalfVideoWithoutAudio(
  file: Express.Multer.File,
): Promise<string> {
  const inputPath = file.path;
  const outputPath = path.join(
    path.dirname(inputPath),
    `parsed-muted_${Date.now()}_${file.originalname}`,
  );

  // crop=오른쪽 반, -an (audio 없음)
  const command = `ffmpeg -y -i "${inputPath}" -vf "crop=iw/2:ih:iw/2:0" -an "${outputPath}"`;

  try {
    await execAsync(command);
    return outputPath;
  } catch (error) {
    logger.error(`Error processing video: ${error.message}`);
    throw new Error('영상 자르기 + 음성 제거 실패');
  }
}

export async function extractAudioFromVideo(
  file: Express.Multer.File,
): Promise<string> {
  const inputPath = file.path;
  const outputPath = path.join(
    path.dirname(inputPath),
    `extracted-audio_${Date.now()}.mp3`,
  );

  // -q:a 0 (audio quality 최고), -map a (audio 스트림만 추출)
  const command = `ffmpeg -y -i "${inputPath}" -q:a 0 -map a "${outputPath}"`;

  try {
    await execAsync(command);
    return outputPath;
  } catch (error) {
    logger.error(`Error extracting audio: ${error.message}`);
    throw new Error('음성 추출 실패');
  }
}

export async function processVideoFile(file: Express.Multer.File) {
  const [croppedVideoPath, audioPath] = await Promise.all([
    cropRightHalfVideoWithoutAudio(file),
    extractAudioFromVideo(file),
  ]);

  return { croppedVideoPath, audioPath };
}
