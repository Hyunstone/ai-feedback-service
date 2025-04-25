import { exec } from 'child_process';
import * as path from 'path';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function cropRightHalfVideo(
  file: Express.Multer.File,
): Promise<string> {
  const inputPath = file.path;
  const outputPath = path.join(
    path.dirname(inputPath),
    `parsed_${Date.now()}_${file.originalname}`,
  );
  const command = `ffmpeg -y -i "${inputPath}" -vf "crop=iw/2:ih:iw/2:0" "${outputPath}"`;

  try {
    await execAsync(command);
    console.log('Video cropped successfully:', outputPath);
    return outputPath;
  } catch (error) {
    console.error('FFmpeg error:', error);
    throw new Error('영상 자르기 실패');
  }
}
