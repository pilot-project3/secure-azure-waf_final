FROM openjdk:17-jdk-slim

# JAR 파일명을 ARG로 받아서 설정 (예시)
ARG JAR_FILE=country-service-0.0.1-SNAPSHOT.jar

RUN apt-get update && apt-get install -y unzip

# JAR 복사
COPY build/libs/${JAR_FILE} /app.jar

EXPOSE 8082

ENTRYPOINT ["/bin/sh", "-c", "java -jar /app.jar"]
# ENTRYPOINT ["java", "-jar", "/app.jar"]