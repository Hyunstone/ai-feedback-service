import * as videoUtils from 'src/common/video/video.util';
import * as azureUtils from 'src/common/storage/azure.storage';

describe('영상 업로드 전체 흐름 테스트', () => {
  const mockVideoFile = {
    path: '/tmp/sample.mp4',
    originalname: 'sample.mp4',
  } as Express.Multer.File;

  const mockCroppedPath = '/tmp/cropped_sample.mp4';
  const mockAudioPath = '/tmp/audio_sample.mp3';
  const mockCroppedUrl = 'https://storage/submissions/cropped_sample.mp4';
  const mockAudioUrl = 'https://storage/submissions/audio_sample.mp3';

  beforeEach(() => {
    jest.spyOn(videoUtils, 'processVideoFile').mockResolvedValue({
      croppedVideoPath: mockCroppedPath,
      audioPath: mockAudioPath,
    });

    jest
      .spyOn(azureUtils, 'uploadToAzureBlob')
      .mockResolvedValueOnce(mockCroppedUrl) // 첫 번째 호출: cropped 영상
      .mockResolvedValueOnce(mockAudioUrl); // 두 번째 호출: audio
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('processVideoFile 결과를 받아 두 파일을 Azure에 업로드한다', async () => {
    const { croppedVideoPath, audioPath } =
      await videoUtils.processVideoFile(mockVideoFile);

    const croppedUrl = await azureUtils.uploadToAzureBlob(croppedVideoPath);
    const audioUrl = await azureUtils.uploadToAzureBlob(audioPath);

    expect(videoUtils.processVideoFile).toHaveBeenCalledWith(mockVideoFile);

    expect(azureUtils.uploadToAzureBlob).toHaveBeenCalledTimes(2);
    expect(azureUtils.uploadToAzureBlob).toHaveBeenCalledWith(mockCroppedPath);
    expect(azureUtils.uploadToAzureBlob).toHaveBeenCalledWith(mockAudioPath);
    expect(croppedUrl).toBe(mockCroppedUrl);
    expect(audioUrl).toBe(mockAudioUrl);
  });
});
