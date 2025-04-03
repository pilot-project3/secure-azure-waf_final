source venv-log-service/bin/activate

# Docker 이미지 빌드
docker build -t ai-server .

# Docker 컨테이너 실행
docker run -d -p 5001:5001 --name ai-server ai-server