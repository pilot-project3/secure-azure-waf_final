# create_db.py
from app import app
from db import db
from models import *

with app.app_context():
    db.drop_all()
    db.create_all()
    print("[✓] 테이블 생성 완료")