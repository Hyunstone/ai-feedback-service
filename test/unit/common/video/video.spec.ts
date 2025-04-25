import * as videoUtils from 'src/common/video/video.util';

describe('vidoe.utils 테스트', () => {
  const mockFile = {
    path: '/tmp/sample.mp4',
    originalname: 'sample.mp4',
  } as Express.Multer.File;

  const mockVideoPath = '/tmp/parsed-muted_sample.mp4';
  const mockAudioPath = '/tmp/extracted-audio_sample.mp3';

  beforeEach(() => {
    jest
      .spyOn(videoUtils, 'cropRightHalfVideoWithoutAudio')
      .mockResolvedValue(mockVideoPath);

    jest
      .spyOn(videoUtils, 'extractAudioFromVideo')
      .mockResolvedValue(mockAudioPath);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // TODO: 모킹 처리 줄이기
  it('video 파싱시 오른쪽의 영상만 존재한다', async () => {
    const result = await videoUtils.cropRightHalfVideoWithoutAudio(mockFile);
    expect(videoUtils.cropRightHalfVideoWithoutAudio).toHaveBeenCalledWith(
      mockFile,
    );
    expect(result).toBe(mockVideoPath);
  });

  it('그리고 결과로 outputPath를 리턴한다', async () => {
    const result = await videoUtils.cropRightHalfVideoWithoutAudio(mockFile);
    expect(typeof result).toBe('string');
    expect(result).toContain('parsed-muted_');
  });

  it('video 파싱시 음성이 추출된다', async () => {
    const result = await videoUtils.extractAudioFromVideo(mockFile);
    expect(videoUtils.extractAudioFromVideo).toHaveBeenCalledWith(mockFile);
    expect(result).toBe(mockAudioPath);
  });

  it('그리고 결과로 outputPath를 리턴한다', async () => {
    const result = await videoUtils.extractAudioFromVideo(mockFile);
    expect(typeof result).toBe('string');
    expect(result).toContain('extracted-audio_');
  });
});
