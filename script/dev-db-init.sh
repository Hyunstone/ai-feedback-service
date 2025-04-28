#!/bin/bash

set -e

echo "🚀 [1/3] Docker 컨테이너 실행 중..."
docker-compose up -d

echo "⏳ [2/4] DB 컨테이너가 준비될 때까지 대기 중..."
for i in {1..10}; do
  if docker exec feed-postgres pg_isready -U postgres > /dev/null 2>&1; then
    echo "✅ DB 컨테이너가 준비되었습니다!"
    break
  fi
  if [ $i -eq 10 ]; then
    echo "❌ DB 컨테이너가 준비되지 않았습니다. 확인 후 다시 시도하세요."
    exit 1
  fi
  sleep 1
done

echo "🧱 [3/3] Prisma 마이그레이션 및 Client 생성..."
if [ ! -f ../prisma/schema.prisma ]; then
  echo "❌ ../prisma/schema.prisma 파일이 존재하지 않습니다."
  exit 1
fi
npx prisma migrate dev --name init --schema=../prisma/schema.prisma || {
  echo "⚠️ 마이그레이션이 이미 적용되었거나 실패했습니다. 확인하세요."
}
npx prisma generate --schema=../prisma/schema.prisma || {
  echo "❌ Prisma Client 생성에 실패했습니다."
  exit 1
}
echo "✅ Prisma 마이그레이션 및 Client 생성 완료"

echo "🎉 개발 환경 초기화 완료!"