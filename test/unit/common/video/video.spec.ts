import * as videoUtils from 'src/common/video/video.util';

describe('vidoe.utils 테스트', () => {
  const mockFile = {
    path: '/tmp/sample.mp4',
    originalname: 'sample.mp4',
  } as Express.Multer.File;

  const mockedOutput = '/tmp/parsed_sample.mp4';

  beforeEach(() => {
    jest
      .spyOn(videoUtils, 'cropRightHalfVideo')
      .mockResolvedValue(mockedOutput);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // TODO: 모킹 처리 줄이기
  it('video 전처리시 오른쪽의 영상만 존재한다', async () => {
    const result = await videoUtils.cropRightHalfVideo(mockFile);
    expect(videoUtils.cropRightHalfVideo).toHaveBeenCalledWith(mockFile);
    expect(result).toBe(mockedOutput);
  });

  it('그리고 결과로 outputPath를 리턴한다', async () => {
    const result = await videoUtils.cropRightHalfVideo(mockFile);
    expect(typeof result).toBe('string');
    expect(result).toContain('parsed_');
  });
});
