# Python 기반 이미지 사용
FROM python:3.10-slim

# 환경 변수 설정 (출력 버퍼링 제거)
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# 작업 디렉토리 생성
WORKDIR /app

# 필요한 파일 복사
COPY requirements.txt .
RUN pip install --upgrade pip
RUN pip install -r requirements.txt

# 앱 파일 복사
COPY . .

# 포트 오픈
EXPOSE 5001

# 앱 실행
CMD ["python", "app.py"]
