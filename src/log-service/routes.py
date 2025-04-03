# routes.py
from kafka import KafkaProducer, KafkaConsumer
import uuid
import json
from flask import Blueprint, jsonify, request, current_app
import requests
from utils import save_logs_to_db, get_last_log_timestamp # 기존 유틸리티 함수
from models import Logs # 기존 모델
from sqlalchemy import desc
from datetime import datetime, timedelta, timezone
import json # JSON 파싱용
from utils import *
import time

bp = Blueprint("main", __name__)

producer = None
consumer = None
ai_insight_cache = {}

def init_kafka(broker, response_topic, request_topic):
    """Initialize Kafka producer and consumer."""
    global producer, consumer
    producer = KafkaProducer(
        bootstrap_servers=broker,
        value_serializer=lambda m: json.dumps(m).encode("utf-8")
    )
    consumer = KafkaConsumer(
        response_topic,
        bootstrap_servers=broker,
        value_deserializer=lambda m: json.loads(m.decode("utf-8")),
        group_id="log-service-group",
        auto_offset_reset="earliest",
        enable_auto_commit=True
    )

    import threading
    threading.Thread(target=consume_ai_insights, daemon=True).start()

def consume_ai_insights():
    for msg in consumer:
        result = msg.value
        tx_id = result.get("tx_id")
        if tx_id:
            ai_insight_cache[tx_id] = result.get("insight")
            print(f"[AI Insight Received] tx_id={tx_id}, insight={result.get('insight')}")

# --- Helper Function to Get Azure Credentials ---
# 이 함수는 기존 get_paginated_logs와 새로운 통계 라우트에서 중복되는
# Spring API 호출 및 자격 증명 검색 로직을 캡슐화합니다.
def _get_azure_credentials(user_id: int, spring_base_url: str):
    """Helper function to fetch API Key and Workspace ID from Spring API."""
    api_key = None
    workspace_id = None
    try:
        # Step 1: accessToken (API Key) 받아오기
        token_url = f"{spring_base_url}/api/v1/users/log-api-key"
        token_response = requests.post(token_url, json={"userId": user_id}, timeout=10)
        token_response.raise_for_status() # 오류 발생 시 예외 발생
        api_key = token_response.json().get("accessToken")
        if not api_key:
            # API 키가 없으면 오류 처리를 위해 None 반환 대신 예외 발생
            raise ValueError("API key not found in response from Spring API")

        # Step 2: 유저의 workspaceID 가져오기
        user_url = f"{spring_base_url}/api/v1/users/{user_id}"
        user_response = requests.get(user_url, timeout=10)
        user_response.raise_for_status()
        workspace_id = user_response.json().get("user", {}).get("workSpaceID")
        if not workspace_id:
             # Workspace ID가 없으면 오류 처리를 위해 None 반환 대신 예외 발생
            raise ValueError("workspaceID not found for user in response from Spring API")

        return api_key, workspace_id

    except requests.exceptions.RequestException as e:
        # Spring API 통신 오류 시 명확한 예외 발생
        print(f"[!] Error communicating with Spring API for user {user_id}: {e}")
        # 호출한 쪽에서 처리할 수 있도록 예외를 다시 발생시키거나 특정 오류 객체 반환 가능
        raise ConnectionError(f"Failed to communicate with user/auth service: {e}") from e
    except (ValueError, KeyError, Exception) as e:
         # 기타 예기치 않은 오류 (JSON 파싱 실패, 키 부재 등 포함)
        print(f"[!] Unexpected error during Spring API communication for user {user_id}: {e}")
        raise RuntimeError(f"An unexpected error occurred while fetching user/auth data: {e}") from e


# --- Helper Function to Execute Azure Log Analytics Query ---
def _execute_azure_query(workspace_id: str, api_key: str, kql_query: str):
    """Helper function to execute a KQL query against Azure Log Analytics."""
    log_api_url = f"https://api.loganalytics.azure.com/v1/workspaces/{workspace_id}/query"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    query_payload = {"query": kql_query}
    # 시간 제한을 늘리는 것이 좋을 수 있습니다 (예: 60초)
    timeout_seconds = 60

    print(f"[i] Executing KQL Query:\n{kql_query}")

    try:
        log_response = requests.post(log_api_url, headers=headers, json=query_payload, timeout=timeout_seconds)
        log_response.raise_for_status() # HTTP 오류 발생 시 예외 처리
        return log_response.json() # 성공 시 JSON 데이터 반환
    except requests.exceptions.Timeout:
        print(f"[!] Azure Log Analytics query timed out after {timeout_seconds} seconds.")
        raise TimeoutError("Azure Log Analytics query timed out")
    except requests.exceptions.RequestException as e:
        # Azure API 통신 오류
        print(f"[!] Error querying Azure Log Analytics: {e}")
        # 응답 내용 로깅 (민감 정보 주의)
        if e.response is not None:
            print(f"[!] Azure API Response Status: {e.response.status_code}")
            try:
                print(f"[!] Azure API Response Body: {e.response.text}")
            except Exception:
                print("[!] Could not read Azure API response body.")
        raise ConnectionError(f"Failed to query Azure Log Analytics: {e}") from e
    except Exception as e:
        # 기타 예기치 않은 오류 (JSON 파싱 실패 등)
        print(f"[!] Unexpected error during Azure query execution: {e}")
        raise RuntimeError(f"An unexpected error occurred during Azure query execution: {e}") from e

# --- Existing Routes ---

@bp.route("/")
def home():
    return jsonify({"message": "Flask + PostgreSQL + ORM - WAF Logs API"})

# # --- 로그 조회 + Azure 수집 + DB 저장 + Kafka 이벤트 발행 + AI 응답 포함 ---
# @bp.route("/api/v1/logs/<int:user_id>", methods=["GET"])
# def get_paginated_logs_async(user_id):
#     spring_base_url = current_app.config.get("SPRING_API_BASE_URL")
#     if not spring_base_url:
#         return jsonify({"error": "SPRING_API_BASE_URL not configured"}), 500

#     try:
#         # 1. Azure에서 새 로그 수집
#         api_key, workspace_id = _get_azure_credentials(user_id, spring_base_url)
#         last_timestamp = get_last_log_timestamp(user_id)

#         kql_base = """AzureDiagnostics | where Category == "FrontDoorWebApplicationFirewallLog" """
#         if last_timestamp:
#             kql_time_filter = f"| where TimeGenerated > datetime({last_timestamp.isoformat()})"
#         else:
#             start_time_iso = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
#             kql_time_filter = f"| where TimeGenerated >= datetime({start_time_iso})"

#         kql_query_logs = kql_base + kql_time_filter + """
#         | project TimeGenerated, clientIP_s, requestUri_s, details_msg_s, action_s, details_matches_s
#         | sort by TimeGenerated desc
#         | take 500
#         """

#         azure_log_data = _execute_azure_query(workspace_id, api_key, kql_query_logs)
#         save_logs_to_db(user_id, azure_log_data)

#     except Exception as e:
#         print(f"[!] Azure fetch/save error: {e}")

#     try:
#         # 2. 로그만 페이징으로 리턴
#         page = request.args.get('page', 1, type=int)
#         per_page = request.args.get('per_page', 30, type=int)
#         pagination = Logs.query.filter_by(user_id=user_id)\
#                                .order_by(desc(Logs.timestamp))\
#                                .paginate(page=page, per_page=per_page, error_out=False)

#         logs_on_page = pagination.items
#         formatted_logs = [log.to_dict() for log in logs_on_page]

#         # 3. Kafka로 AI 분석 요청만 비동기 발행
#         tx_id = str(uuid.uuid4())
#         event_payload = {
#             "tx_id": tx_id,
#             "user_id": user_id
#         }
#         producer.send(current_app.config.get("REQUEST_TOPIC"), event_payload)
#         print(f"[Kafka] 비동기 AI 분석 요청 전송: {event_payload}")

#         return jsonify({
#             "logs": formatted_logs,
#             "insight": None,
#             "message": "로그를 조회했고, AI 인사이트는 백그라운드에서 분석 후 저장됩니다.",
#             "pagination": {
#                 "currentPage": pagination.page,
#                 "perPage": pagination.per_page,
#                 "totalItems": pagination.total,
#                 "totalPages": pagination.pages,
#                 "hasNext": pagination.has_next,
#                 "hasPrev": pagination.has_prev,
#             }
#         })

#     except Exception as e:
#         print(f"[✗] Error in log fetch: {e}")
#         return jsonify({"error": "로그 조회 중 오류 발생"}), 500
@bp.route("/api/v1/logs/<int:user_id>", methods=["GET"])
def get_paginated_logs_async(user_id):
    spring_base_url = current_app.config.get("SPRING_API_BASE_URL")
    if not spring_base_url:
        return jsonify({"error": "SPRING_API_BASE_URL not configured"}), 500

    try:
        # 1. Azure에서 새 로그 수집
        api_key, workspace_id = _get_azure_credentials(user_id, spring_base_url)
        last_timestamp = get_last_log_timestamp(user_id)

        if last_timestamp:
            time_filter = f"TimeGenerated > datetime({last_timestamp.isoformat()})"
        else:
            start_time_iso = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
            time_filter = f"TimeGenerated >= datetime({start_time_iso})"

        kql_query_logs = f"""
        union 
            (AzureDiagnostics
             | where Category == "FrontDoorWebApplicationFirewallLog"
             | where {time_filter}
             | project 
                 TimeGenerated,
                 clientIp_s,
                 requestUri_s,
                 details_msg_s,
                 action_s,
                 details_matches_s,
                 Category),
            (AzureDiagnostics
             | where Category == "FrontDoorAccessLog"
             | where {time_filter}
             | project 
                 TimeGenerated,
                 clientIp_s,
                 requestUri_s,
                 details_msg_s = tostring(httpStatusDetails_s),
                 action_s = tostring(httpMethod_s),
                 details_matches_s = tostring(userAgent_s),
                 Category)
        | sort by TimeGenerated desc
        | take 500
        """

        azure_log_data = _execute_azure_query(workspace_id, api_key, kql_query_logs)
        save_logs_to_db(user_id, azure_log_data)

    except Exception as e:
        print(f"[!] Azure fetch/save error: {e}")

    try:
        # 2. 로그만 페이징으로 리턴
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 30, type=int)
        pagination = Logs.query.filter_by(user_id=user_id)\
                               .order_by(desc(Logs.timestamp))\
                               .paginate(page=page, per_page=per_page, error_out=False)

        logs_on_page = pagination.items
        formatted_logs = [log.to_dict() for log in logs_on_page]

        # 3. Kafka로 AI 분석 요청만 비동기 발행
        tx_id = str(uuid.uuid4())
        event_payload = {
            "tx_id": tx_id,
            "user_id": user_id
        }
        producer.send(current_app.config.get("REQUEST_TOPIC"), event_payload)
        print(f"[Kafka] 비동기 AI 분석 요청 전송: {event_payload}")

        return jsonify({
            "logs": formatted_logs,
            "insight": None,
            "message": "로그를 조회했고, AI 인사이트는 백그라운드에서 분석 후 저장됩니다.",
            "pagination": {
                "currentPage": pagination.page,
                "perPage": pagination.per_page,
                "totalItems": pagination.total,
                "totalPages": pagination.pages,
                "hasNext": pagination.has_next,
                "hasPrev": pagination.has_prev,
            }
        })

    except Exception as e:
        print(f"[✗] Error in log fetch: {e}")
        return jsonify({"error": "로그 조회 중 오류 발생"}), 500


# --- NEW Route: Get Request Count by Country ---
@bp.route("/api/v1/stats/<int:user_id>/country", methods=["GET"])
def get_country_stats(user_id):
    spring_base_url = current_app.config.get("SPRING_API_BASE_URL")
    if not spring_base_url:
        return jsonify({"error": "SPRING_API_BASE_URL not configured"}), 500

    try:
        # 공통 헬퍼 함수 사용
        api_key, workspace_id = _get_azure_credentials(user_id, spring_base_url)

        # 시간 범위 추가 (IP 통계와 동일하게 적용)
        time_filter = "| where TimeGenerated >= ago(7d)" # 지난 7일간의 데이터

        kql_query_country = f"""
        AzureDiagnostics
        | summarize RequestCount = count() by clientCountry_s
        | order by RequestCount desc

        """

        # 공통 헬퍼 함수 사용
        results = _execute_azure_query(workspace_id, api_key, kql_query_country)

        # 결과 파싱 및 형식화
        formatted_results = []
        if results and "tables" in results and results["tables"]:
            table = results["tables"][0]
            columns = [col["name"] for col in table.get("columns", [])]
            rows = table.get("rows", [])
            try:
                country_idx = columns.index("clientCountry_s")
                count_idx = columns.index("RequestCount")
                for row in rows:
                     formatted_results.append({
                        "country": row[country_idx],
                        "count": row[count_idx]
                    })
            except (ValueError, IndexError) as e:
                print(f"[!] Error parsing Country stats results: {e}")
                return jsonify({"error": "Failed to parse query results for Country stats."}), 500

        return jsonify({"country_counts": formatted_results})

    except (ValueError, ConnectionError, RuntimeError, TimeoutError) as e:
         # _get_azure_credentials 또는 _execute_azure_query 에서 발생한 예외 처리
        return jsonify({"error": str(e)}), 503
    except Exception as e: # 혹시 모를 다른 예외
        print(f"[!] Unexpected error in get_country_stats for user {user_id}: {e}")
        return jsonify({"error": "An internal error occurred while fetching Country statistics"}), 500
    

@bp.route("/api/v1/stats/<int:user_id>/traffic", methods=["GET"])
def get_traffic_stats(user_id):
    spring_base_url = current_app.config.get("SPRING_API_BASE_URL")
    if not spring_base_url:
        return jsonify({"error": "SPRING_API_BASE_URL not configured"}), 500

    try:
        api_key, workspace_id = _get_azure_credentials(user_id, spring_base_url)

        kql_query = """
let wafLogs = AzureDiagnostics
    | where Category == "FrontDoorWebApplicationFirewallLog"
    | where TimeGenerated >= ago(30d)
    | extend Blocked = iff(action_s in~ ("Block", "AnomalyScoring"), 1, 0)
    | summarize BlockedRequests = sum(Blocked);

let totalLogs = AzureDiagnostics
    | where Category == "FrontDoorAccessLog"
    | where TimeGenerated >= ago(30d)
    | summarize TotalRequests = count();

wafLogs
| extend TotalRequests = toscalar(totalLogs)
| project 
    TotalRequests,
    BlockedRequests,
    NotBlockedRequests = TotalRequests - BlockedRequests,
    BlockRate = round(100.0 * BlockedRequests / TotalRequests, 2)
        """

        results = _execute_azure_query(workspace_id, api_key, kql_query)

        stats = {}
        if results and "tables" in results and results["tables"]:
            row = results["tables"][0]["rows"][0]
            stats = {
                "total": row[0],
                "blocked": row[1],
                "not_blocked": row[2],
                "block_rate_percent": row[3]
            }

        return jsonify({"traffic_stats": stats})

    except (ValueError, ConnectionError, RuntimeError, TimeoutError) as e:
        return jsonify({"error": str(e)}), 503
    except Exception as e:
        print(f"[!] Unexpected error in get_traffic_stats for user {user_id}: {e}")
        return jsonify({"error": "An internal error occurred while fetching traffic stats"}), 500

@bp.route("/api/v1/stats/<int:user_id>/recent-blocked", methods=["GET"])
def get_recent_blocked_logs(user_id):
    try:
        # 차단된 액션 필터
        blocked_actions = ["Block", "AnomalyScoring"]

        # 최근 차단된 로그 10개 조회
        blocked_logs = Logs.query.filter(
            Logs.user_id == user_id,
            Logs.action.in_(blocked_actions)
        ).order_by(desc(Logs.created_at)).limit(10).all()

        # 프론트 대시보드에 맞는 형태로 가공
        formatted = []
        for log in blocked_logs:
            formatted.append({
                "timestamp": log.timestamp.strftime("%p %I:%M:%S"),  # 오후 10:16:49 형식
                "ip": log.client_ip,
                "country": extract_country_from_details(log.details_matches),
                "rule": log.attack_type or log.message,
                "action": "차단됨"  # 한글로 고정
            })

        return jsonify({"recent_blocked": formatted})

    except Exception as e:
        print(f"[✗] Error fetching recent blocked logs for user {user_id}: {e}")
        return jsonify({"error": "Failed to fetch recent blocked logs"}), 500


# --- NEW Route: Get Request Count by IP Address ---
@bp.route("/api/v1/stats/<int:user_id>/ip", methods=["GET"])
def get_ip_stats(user_id):
    spring_base_url = current_app.config.get("SPRING_API_BASE_URL")
    if not spring_base_url:
        return jsonify({"error": "SPRING_API_BASE_URL not configured"}), 500

    try:
        # 공통 헬퍼 함수 사용
        api_key, workspace_id = _get_azure_credentials(user_id, spring_base_url)

        # 시간 범위를 추가하는 것이 성능 및 비용 면에서 매우 중요합니다.
        # 예: 지난 7일간의 데이터 (KQL timespan 사용 가능: ago(7d))
        # 또는 특정 기간 (startofday(ago(7d)) to endofday(now()))
        time_filter = "| where TimeGenerated >= ago(7d)" # 지난 7일간의 데이터

        kql_query_ip = f"""
        AzureDiagnostics
        | where Category == "FrontDoorWebApplicationFirewallLog"
        {time_filter}
        | summarize RequestCount = count() by IPAddress = clientIp_s // 필드 이름 변경
        | order by RequestCount desc
        | take 100 // 상위 100개 결과만 가져오기 (결과 크기 제한)
        """

        # 공통 헬퍼 함수 사용
        results = _execute_azure_query(workspace_id, api_key, kql_query_ip)

        # 결과 파싱 및 형식화
        formatted_results = []
        if results and "tables" in results and results["tables"]:
            table = results["tables"][0]
            columns = [col["name"] for col in table.get("columns", [])]
            rows = table.get("rows", [])
            try:
                ip_idx = columns.index("IPAddress")
                count_idx = columns.index("RequestCount")
                for row in rows:
                    formatted_results.append({
                        "ip": row[ip_idx],
                        "count": row[count_idx]
                    })
            except (ValueError, IndexError) as e:
                print(f"[!] Error parsing IP stats results: {e}")
                # 열 이름이 예상과 다를 경우 오류 발생 가능
                return jsonify({"error": "Failed to parse query results for IP stats."}), 500

        return jsonify({"ip_counts": formatted_results})

    except (ValueError, ConnectionError, RuntimeError, TimeoutError) as e:
         # _get_azure_credentials 또는 _execute_azure_query 에서 발생한 예외 처리
        return jsonify({"error": str(e)}), 503 # Service Unavailable 또는 적절한 코드
    except Exception as e: # 혹시 모를 다른 예외
        print(f"[!] Unexpected error in get_ip_stats for user {user_id}: {e}")
        return jsonify({"error": "An internal error occurred while fetching IP statistics"}), 500