from flask import Flask
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from db import db
from config import Config 
from routes import bp as log_routes,init_kafka  # 이 줄 추가

migrate = Migrate()  #

def create_app():
    app = Flask(__name__)
    CORS(app)
    app.config.from_object(Config)

    db.init_app(app)
    migrate.init_app(app, db)

    init_kafka(
        broker=app.config["KAFKA_BROKER"],
        response_topic=app.config["RESPONSE_TOPIC"],
        request_topic=app.config["REQUEST_TOPIC"]
    )
    app.register_blueprint(log_routes)

    return app

if __name__ == "__main__":
    app = create_app()
    app.run(host="0.0.0.0", port=5000, debug=True)  # 포트 번호 등 필요하면 추가

