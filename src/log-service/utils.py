# utils.py
import subprocess
import json
import pandas as pd
from datetime import datetime, timezone, timedelta # Add timedelta
from sqlalchemy import desc
from models import Logs # Your updated Logs model
import dateutil.parser
from db import db
import re # Import regex

# --- Keep your existing functions like get_waf_logs, export_azure_logs_to_excel ---

def extract_anomaly_score(details_matches_str: str) -> int | None:
    """Extracts AnomalyScore from the details_matches_s JSON string."""
    if not details_matches_str:
        return None
    try:
        matches = json.loads(details_matches_str)
        if not isinstance(matches, list):
            return None
        for match in matches:
            if isinstance(match, dict) and match.get("matchVariableName") == "AnomalyScore":
                score_str = match.get("matchVariableValue")
                if score_str and score_str.isdigit():
                    return int(score_str)
    except (json.JSONDecodeError, TypeError, ValueError):
        # Handle cases where the string is not valid JSON or value is not int
        print(f"[!] Warning: Could not parse anomaly score from: {details_matches_str}")
        return None
    return None

def categorize_attack(message: str) -> str | None:
    """Categorizes the attack based on the details_msg_s."""
    if not message:
        return "Unknown" # Or None, depending on preference

    message_lower = message.lower()

    # Prioritize more specific matches first
    if 'sql injection' in message_lower or 'sql comment sequence detected' in message_lower:
        return 'SQL Injection'
    elif 'path traversal' in message_lower:
        return 'Path Traversal'
    elif 'remote command execution' in message_lower or 'shell' in message_lower or 'rce' in message_lower:
         # Include common RCE patterns like webshell, unix command, etc.
        return 'Remote Code Execution'
    elif 'session fixation' in message_lower:
        return 'Session Fixation'
    elif 'php injection' in message_lower:
         return 'PHP Injection' # Could be RCE subtype, but specific category might be useful
    elif 'url encoding abuse' in message_lower:
         return 'URL Encoding Abuse'
    elif 'other bots' in message_lower:
        return 'Bot Traffic' # Specific category for known bots
    elif 'inbound anomaly score exceeded' in message_lower:
        # This is often a summary message when a threshold is hit,
        # the actual attack type might be in another related log entry.
        # We might want to mark it differently or rely on other entries.
        return 'Anomaly Score Exceeded'
    # Add more specific rules as needed based on observed messages
    else:
        # Fallback for messages not fitting specific categories
        return 'Other / Unknown'


def get_last_log_timestamp(user_id: int) -> datetime | None:
    """Fetches the timestamp of the most recent log entry for a user from *our* DB."""
    latest_log = Logs.query.filter_by(user_id=user_id).order_by(desc(Logs.timestamp)).first()
    if latest_log and latest_log.timestamp:
        # Ensure the timestamp is timezone-aware (UTC)
        return latest_log.timestamp.replace(tzinfo=timezone.utc)
    else:
        # Return None or a default far-past date if no logs exist
        # return datetime.now(timezone.utc) - timedelta(days=30) # Example: Fetch last 30 days initially
        return None


def save_logs_to_db(user_id: int, log_data: dict):
    """Saves new logs from Azure Log Analytics API response to the database."""
    try:
        tables = log_data.get("tables")
        if not tables or not isinstance(tables, list):
            print("[!] No 'tables' found in log data.")
            return 0 # Return count of new logs added

        table = tables[0]
        columns = [col["name"] for col in table.get("columns", [])]
        rows = table.get("rows", [])

        if not columns or not rows:
            print("[!] Log data table is empty or malformed.")
            return 0

        # Get the timestamp of the last log saved *for this user*
        last_saved_time = get_last_log_timestamp(user_id)
        print(f"[i] Last saved log time for user {user_id}: {last_saved_time}")

        new_logs_to_add = []
        processed_count = 0
        skipped_count = 0

        required_cols = ["TimeGenerated", "clientIp_s", "requestUri_s", "details_msg_s", "action_s"]
        col_indices = {col: columns.index(col) for col in required_cols if col in columns}

        # Check if all required columns are present
        if len(col_indices) != len(required_cols):
            missing = set(required_cols) - set(col_indices.keys())
            print(f"[✗] Missing required columns in log data: {missing}")
            raise ValueError(f"Missing required columns: {missing}")
        
        # Get index for optional details_matches_s
        details_matches_idx = columns.index("details_matches_s") if "details_matches_s" in columns else -1


        for row in rows:
            processed_count += 1
            try:
                # Extract timestamp and make it timezone-aware (Azure logs are UTC)
                timestamp_str = row[col_indices["TimeGenerated"]]
                log_time = dateutil.parser.isoparse(timestamp_str) # Parses ISO 8601 format like "2025-03-31T09:50:33Z"

                # Compare with the last saved time to avoid duplicates
                if last_saved_time and log_time <= last_saved_time:
                    skipped_count += 1
                    continue # Skip older or same-time logs

                # Extract other fields
                client_ip = row[col_indices["clientIp_s"]]
                request_uri = row[col_indices["requestUri_s"]]
                message = row[col_indices["details_msg_s"]]
                action = row[col_indices["action_s"]]
                details_matches = row[details_matches_idx] if details_matches_idx != -1 else None

                # Derive additional fields
                attack_type = categorize_attack(message)
                anomaly_score = extract_anomaly_score(details_matches)

                # Create Log object
                log_entry = Logs(
                    user_id=user_id,
                    timestamp=log_time,
                    client_ip=client_ip,
                    request_uri=request_uri,
                    message=message,
                    action=action,
                    details_matches=details_matches, # Store raw details
                    attack_type=attack_type,
                    anomaly_score=anomaly_score
                )
                new_logs_to_add.append(log_entry)

            except (IndexError, TypeError, ValueError, dateutil.parser.ParserError) as parse_err:
                print(f"[!] Error processing row: {row}. Error: {parse_err}. Skipping.")
                continue # Skip rows with parsing errors

        if new_logs_to_add:
            db.session.add_all(new_logs_to_add)
            db.session.commit()
            print(f"[✓] User {user_id}: Saved {len(new_logs_to_add)} new logs to DB. (Processed: {processed_count}, Skipped: {skipped_count})")
        else:
            print(f"[ℹ️] User {user_id}: No new logs found to save. (Processed: {processed_count}, Skipped: {skipped_count})")

        return len(new_logs_to_add) # Return count of new logs added

    except (KeyError, IndexError, Exception) as e:
        db.session.rollback()
        print(f"[✗] Critical error during log saving for user {user_id}: {e}")
        # Consider more specific logging or re-raising depending on desired behavior
        return 0 # Indicate failure or no logs added

# Remove or comment out the old get_user_logs function if it's no longer used
# def get_user_logs(user_id: int) -> list:
#    ... (old implementation)


def extract_country_from_details(details_str: str) -> str:
    """details_matches 필드에서 국가코드 추출 ('CountryCode:SocketIP' 값)"""
    if not details_str:
        return "-"
    try:
        details = json.loads(details_str)
        for match in details:
            if isinstance(match, dict) and "matchVariableName" in match:
                if match["matchVariableName"].startswith("CountryCode"):
                    return match.get("matchVariableValue", "-")
    except Exception as e:
        print(f"[!] Failed to parse country from details: {e}")
    return "-"
