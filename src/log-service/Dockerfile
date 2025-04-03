# 베이스 이미지: Python 3.11 슬림 버전 사용
FROM python:3.11-slim

# 환경 변수 설정
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# 작업 디렉토리 생성
WORKDIR /app

# requirements 설치
COPY requirements.txt ./
RUN pip install --upgrade pip && pip install -r requirements.txt

# 앱 소스 복사
COPY . .

EXPOSE 5000

# Flask 실행 명령어
CMD ["python", "app.py"]