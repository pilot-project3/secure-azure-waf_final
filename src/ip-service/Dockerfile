FROM openjdk:17-jdk-slim

# JAR 파일명을 ARG로 받아서 설정 (예시)
ARG JAR_FILE=ip-service-0.0.1-SNAPSHOT.jar

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl apt-transport-https lsb-release gnupg

# Import Microsoft signing key and add Azure CLI repository
RUN curl -sL https://packages.microsoft.com/keys/microsoft.asc | gpg --dearmor > microsoft.gpg && \
    install -o root -g root -m 644 microsoft.gpg /usr/share/keyrings/microsoft.gpg

# RUN sh -c 'echo "deb [arch=amd64 signed-by=/usr/share/keyrings/microsoft.gpg] https://packages.microsoft.com/repos/azure-cli/ $(lsb_release -cs) main" > /etc/apt/sources.list.d/azure-cli.list'
RUN sh -c 'echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/microsoft.gpg] https://packages.microsoft.com/repos/azure-cli/ $(lsb_release -cs) main" > /etc/apt/sources.list.d/azure-cli.list'


# Install Azure CLI
RUN apt-get update && apt-get install -y azure-cli && rm -rf /var/lib/apt/lists/*

# Configure Azure CLI for automatic extension installation and add front-door extension
RUN az config set extension.use_dynamic_install=yes_without_prompt && \
    az extension add --name front-door

# ✅ 여기에 apt-get update 추가
RUN apt-get update && apt-get install -y python3-pip && pip3 install --upgrade pip setuptools wheel
# JAR 복사
COPY build/libs/${JAR_FILE} /app.jar

EXPOSE 8084

ENTRYPOINT ["/bin/sh", "-c", "java -jar /app.jar"]
# ENTRYPOINT ["java", "-jar", "/app.jar"]