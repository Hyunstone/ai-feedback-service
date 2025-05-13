#!/bin/bash

set -e
export LC_ALL=C.UTF-8

COMPOSE_FILE="../docker-compose.yml"
if [ ! -f "$COMPOSE_FILE" ]; then
  echo "❌ $COMPOSE_FILE 파일을 찾을 수 없습니다. 경로를 확인하세요."
  exit 1
fi

# 볼륨 삭제 여부 물어보기
read -p "🧹 로컬 DB 데이터(volume)를 삭제하시겠습니까? (Y/N): " confirm
confirm=${confirm:-N}  # 입력이 없으면 N으로 설정

echo "🛑 개발용 컨테이너 종료 중..."
docker-compose -f "$COMPOSE_FILE" down || {
  echo "❌ 컨테이너 종료에 실패했습니다. docker-compose.yml의 서비스 이름을 확인하세요."
  exit 1
}
echo "✅ 컨테이너가 정상적으로 종료되었습니다."

if [[ "$confirm" == "y" || "$confirm" == "Y" ]]; then
  echo "🧨 볼륨을 삭제합니다..."
  docker-compose -f "$COMPOSE_FILE" down -v || {
      echo "❌ 볼륨 삭제에 실패했습니다."
      exit 1
    }
    echo "✅ 볼륨까지 완전히 삭제되었습니다."
else
  echo "ℹ️ 볼륨은 유지하고 컨테이너만 종료합니다..."
  docker-compose -f "$COMPOSE_FILE" down || {
    echo "❌ 컨테이너 종료에 실패했습니다."
    exit 1
  }
  echo "✅ 컨테이너는 종료되었고 볼륨은 유지되었습니다."
fi