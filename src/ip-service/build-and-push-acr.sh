#!/bin/bash

set -e

ACR_NAME="team03registry"
ACR_LOGIN_SERVER="${ACR_NAME}.azurecr.io"
SERVICE_NAME="ip-service"
IMAGE_TAG="latest"

echo "🧹 기존 빌드 디렉토리 제거"
rm -rf ./build

echo "🔧 Gradle 빌드 시작..."
./gradlew clean build -x test

echo "🔐 Azure ACR 로그인"
az acr login --name $ACR_NAME

echo "🐳 Docker 이미지 빌드 (amd64) 및 ACR 푸시"
docker buildx build \
  --platform linux/amd64 \
  -t $ACR_LOGIN_SERVER/$SERVICE_NAME:$IMAGE_TAG \
  --push .
echo "🐳 Docker 이미지 빌드 (arm64) 및 ACR 푸시"