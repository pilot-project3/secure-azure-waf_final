FROM openjdk:17-jdk-slim

# Terraform version
ENV TERRAFORM_VERSION=1.6.6

# Terraform 설치
RUN apt-get update && apt-get install -y unzip wget curl && \
    wget https://releases.hashicorp.com/terraform/${TERRAFORM_VERSION}/terraform_${TERRAFORM_VERSION}_linux_amd64.zip && \
    unzip terraform_${TERRAFORM_VERSION}_linux_amd64.zip && \
    mv terraform /usr/local/bin/ && \
    rm terraform_${TERRAFORM_VERSION}_linux_amd64.zip && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# JAR 파일명을 ARG로 받아서 설정
ARG JAR_FILE=waf-service-0.0.1-SNAPSHOT.jar

# JAR 복사
COPY build/libs/${JAR_FILE} /app/app.jar

# Terraform 스크립트 복사 (❗️중요)
COPY terraform /app/terraform

# 작업 디렉토리
WORKDIR /app

EXPOSE 8081

ENTRYPOINT ["sh", "-c", "java -jar /app/app.jar"]