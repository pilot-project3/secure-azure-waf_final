from flask import Flask, jsonify
from flask_cors import CORS
from kafka import KafkaConsumer, KafkaProducer
import openai
import json
import threading
import time
import psycopg2
from datetime import datetime
from openai import OpenAI  # ✅ 최신 방식
import requests

# Kafka & DB 설정
KAFKA_BROKER = 'kafka:9092'
REQUEST_TOPIC = 'log-events'
RESPONSE_TOPIC = 'ai-responses'

DB_CONFIG = {

}

# OpenAI 설정
client = OpenAI(api_key='')  # 이 라인을 openai.api_key 대신 사용!

app = Flask(__name__)
CORS(app)
# Kafka 설정
consumer = KafkaConsumer(
    REQUEST_TOPIC,
    bootstrap_servers=KAFKA_BROKER,
    value_deserializer=lambda m: json.loads(m.decode('utf-8')),
    group_id='ai-server-group',
    auto_offset_reset='earliest'
)
producer = KafkaProducer(
    bootstrap_servers=KAFKA_BROKER,
    value_serializer=lambda m: json.dumps(m).encode('utf-8')
)

# PostgreSQL 연결
def get_logs_for_user(user_id):
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cursor = conn.cursor()
        query = """
            SELECT log_id, user_id, timestamp, anomaly_score, created_at,
                   message, action, details_matches, attack_type,
                   client_ip, request_uri
            FROM logs
            WHERE user_id = %s
            ORDER BY timestamp DESC
            LIMIT 100;
        """
        cursor.execute(query, (user_id,))
        rows = cursor.fetchall()
        columns = [desc[0] for desc in cursor.description]

        logs = [dict(zip(columns, row)) for row in rows]

        cursor.close()
        conn.close()
        return logs
    except Exception as e:
        print(f"❌ DB 연결 실패: {e}")
        return []
    
# OpenAI로 인사이트 생성
def generate_insight_from_logs(logs):
    if not logs:
        return "해당 유저의 로그가 존재하지 않습니다."

    try:
        def serialize_log(log):
            for k in ["timestamp", "created_at"]:
                if isinstance(log.get(k), datetime):
                    log[k] = log[k].isoformat()
            return log

        content = "\n".join([
            json.dumps(serialize_log(log), ensure_ascii=False, indent=2)
            for log in logs
        ])

        response = client.chat.completions.create(  # ✅ 최신 방식
            model='gpt-4-turbo',
            messages=[
                {"role": "system", "content": "너는 유저의 WAF 로그를 분석해 보안 인사이트를 제공하는 AI야."},
                {"role": "user", "content": f"아래 유저 로그를 분석해줘:\n\n{content}"}
            ]
        )
        print(response)  # 디버깅용
        print(response.choices[0].message.content)

        return response.choices[0].message.content

    except Exception as e:
        return f"OpenAI 에러 발생: {str(e)}"

# Kafka 이벤트 처리
# Kafka 이벤트 처리 함수 수정
def consume_kafka_events():
    for msg in consumer:
        log_event = msg.value
        print(f"📥 Received log event: {log_event}")

        user_id = log_event.get("user_id")
        tx_id = log_event.get("tx_id")

        logs = get_logs_for_user(user_id)
        insight = generate_insight_from_logs(logs)

        # 인사이트 Spring 서버에 저장
        update_user_ai_insight(user_id, insight)

        result = {
            "tx_id": tx_id,
            "user_id": user_id,
            "insight": insight
        }

        producer.send(RESPONSE_TOPIC, result)
        print(f"📤 Published AI insight: {result}")

@app.route("/", methods=["GET"])
def index():
    return jsonify({"message": "AI server is running"}), 200

# 헬스체크
@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "AI server running"}), 200

# AI 분석 함수 이후, 결과를 Spring 서버에 PATCH 요청
def update_user_ai_insight(user_id, insight):
    try:
        spring_base_url = "http://user-service:8080"
        user_info_url = f"{spring_base_url}/api/v1/users/{user_id}"
        user_response = requests.get(user_info_url, timeout=10)
        user_response.raise_for_status()

        user_data = user_response.json().get("user", {})
        login_id = user_data.get("loginId")
        password = user_data.get("password")

        if not login_id or not password:
            print(f"[!] 유저 인증 정보 부족: {user_id}")
            return

        patch_url = f"{spring_base_url}/api/v1/users/update"
        patch_payload = {
            "loginId": login_id,
            "password": password,
            "aiInsight": insight
        }

        patch_response = requests.patch(patch_url, json=patch_payload, timeout=10)
        patch_response.raise_for_status()
        print(f"[✓] AI 인사이트 저장 성공 user_id={user_id}")

    except Exception as e:
        print(f"[✗] AI 인사이트 저장 실패: {e}")


# Kafka consumer 별도 스레드 실행
if __name__ == "__main__":
    threading.Thread(target=consume_kafka_events, daemon=True).start()
    app.run(host="0.0.0.0", port=5001)
