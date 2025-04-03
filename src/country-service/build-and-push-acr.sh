#!/bin/bash

set -e  # 에러 발생 시 스크립트 중단

ACR_NAME="team03registry"
ACR_LOGIN_SERVER="${ACR_NAME}.azurecr.io"
SERVICE_NAME="country-service"

echo "🔐 Azure ACR 로그인 중..."
az acr login --name "${ACR_NAME}"

echo "🧹 기존 로컬 이미지 제거 중..."
docker rmi "${ACR_LOGIN_SERVER}/${SERVICE_NAME}:latest" || true

### 백엔드 재빌드 후 다시 푸시
echo "🧼 백엔드 빌드 디렉토리 삭제..."
sudo rm -rf ./build

echo "🔧 백엔드 Gradle 빌드 시작..."
./gradlew -p ./ clean build -x test  # 테스트 건너뛰기

echo "🐳 백엔드 Docker 이미지 빌드 & 푸시 (멀티 아키텍처 지원)..."
docker buildx build --platform linux/amd64,linux/arm64 \
  -t "${ACR_LOGIN_SERVER}/${SERVICE_NAME}:latest" . \
  --push
