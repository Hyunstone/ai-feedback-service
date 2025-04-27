module.exports = {
  apps: [
    {
      // 애플리케이션 이름 (PM2에서 사용할 이름)
      // PM2 명령어에서 이 이름을 사용하여 애플리케이션을 제어합니다.
      name: 'ai-feedback',

      // 실행할 스크립트 파일 경로
      // Node.js 파일뿐만 아니라, Bash, Python 등 다른 스크립트도 실행 가능합니다.
      script: './dist/src/main.js',

      // 현재 작업 디렉토리 (기본값: 현재 디렉토리)
      // 애플리케이션 실행 기준이 되는 경로를 지정합니다.
      cwd: process.env.PWD,

      // 실행 모드: "fork" 또는 "cluster"
      // fork: 단일 프로세스 실행
      // cluster: 멀티 코어를 활용하여 여러 프로세스 실행
      exec_mode: 'cluster',

      // 실행할 인스턴스 수
      // cluster 모드에서만 유효하며, "max"로 설정하면 모든 CPU 코어를 사용합니다.
      instances: 2,

      // 애플리케이션에 전달할 인수
      // 실행 시 커맨드라인 인수로 전달됩니다.
      args: ['--port', '3000'],

      // 프로덕션 환경에서 사용할 환경 변수 설정
      // "pm2 start ecosystem.config.js --env production"으로 실행 시 적용됩니다.
      env_production: {
        NODE_ENV: 'production', // 프로덕션 환경
        PORT: 3000, // 프로덕션 포트
        DATABASE_URL: process.env.DATABASE_URL,
        AZURE_ENDPOINT_URL: process.env.AZURE_ENDPOINT_URL,
        AZURE_ENDPINT_KEY: process.env.AZURE_ENDPINT_KEY,
        AZURE_OPENAI_DEPLOYMENT: process.env.AZURE_OPENAI_DEPLOYMENT,
        AZURE_OPENAI_API_VERSION: process.env.AZURE_OPENAI_API_VERSION,
        AZURE_CONNECTION_STRING: process.env.AZURE_CONNECTION_STRING,
        AZURE_CONTAINER_NAME: process.env.AZURE_CONTAINER_NAME,
      },

      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss',

      // 로그 파일 경로 설정 (표준 출력과 에러 로그 통합)
      log_file: '/var/logs/nodeshark-combined.log',

      // 표준 출력 로그 파일 경로
      out_file: '/var/logs/nodeshark-out.log',

      // 에러 로그 파일 경로
      error_file: '/var/logs/nodeshark-error.log',

      // 파일 변경 감지 (기본값: false)
      // true로 설정하면 파일 변경 시 애플리케이션을 자동으로 재시작합니다.
      watch: false,

      // 감시에서 제외할 파일/폴더 (watch가 true일 때 유효)
      ignore_watch: ['node_modules', 'logs'],

      // 자동 재시작 여부 (기본값: true)
      // false로 설정하면 애플리케이션이 종료된 상태로 유지됩니다.
      autorestart: true,

      // 재시작 시도 횟수 (기본값: 무제한)
      // 특정 횟수 이상 실패하면 프로세스를 종료합니다.
      max_restarts: 5,

      // 최대 메모리 사용량 (기본값: 제한 없음)
      // 프로세스가 이 메모리 제한을 초과하면 재시작합니다.
      max_memory_restart: '1000M',

      // 개발 중 디버깅을 위한 상세 로그 활성화 (기본값: false)
      // true로 설정하면 애플리케이션 디버그 로그를 더 많이 출력합니다.
      debug: false,

      // 실행 중인 프로세스의 CPU/메모리 사용량을 확인할 주기 (기본값: 10초)
      // PM2 Dashboard와 같은 모니터링 도구에서 사용됩니다.
      min_uptime: '1m', // 최소 실행 시간 (프로세스가 이 시간 이전에 종료되면 비정상으로 간주)
      max_uptime: '24h', // 최대 실행 시간 (이 시간이 지나면 프로세스를 재시작)

      // 사용자 정의 스크립트를 애플리케이션 실행 후 실행
      // post_start_script: './scripts/postStart.sh',
    },
  ],
};
