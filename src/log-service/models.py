from db import db
from datetime import datetime
from urllib.parse import urlparse

class Logs(db.Model):
    __tablename__ = 'logs'

    log_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, nullable=False)

    timestamp = db.Column(db.DateTime, nullable=False, index=True)
    client_ip = db.Column(db.String, nullable=False)
    request_uri = db.Column(db.String, nullable=False)
    message = db.Column(db.String, nullable=False)
    action = db.Column(db.String, nullable=False)
    details_matches = db.Column(db.Text, nullable=True)

    attack_type = db.Column(db.String, nullable=True, index=True)
    anomaly_score = db.Column(db.Integer, nullable=True)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<Logs {self.log_id} - {self.client_ip} - {self.attack_type}>"

    def to_dict(self):
        formatted_timestamp = self.timestamp.strftime('%m.%d. %p %I:%M:%S') if self.timestamp else None

        # 요청 URI에서 도메인 등 제거하고 path + query 만 추출
        parsed = urlparse(self.request_uri)
        simplified_path = parsed.path
        if parsed.query:
            simplified_path += f"?{parsed.query}"

        return {
            "Created": formatted_timestamp,
            "IP": self.client_ip,
            "Path": simplified_path,
            "Rule": self.attack_type or self.message,
            "Action": self.action,
            "Score": self.anomaly_score
        }
