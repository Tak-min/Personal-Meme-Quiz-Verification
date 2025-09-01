# app/database.py
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# データベースファイルのURLを指定
SQLALCHEMY_DATABASE_URL = "sqlite:///./black_history.db"

# データベースエンジンを作成
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)

# データベースセッションを作成するためのクラス
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# データベースモデルのベースクラス
Base = declarative_base()