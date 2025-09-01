# app/models.py
from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from .database import Base

class User(Base):
    __tablename__ = "users"  # テーブル名

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    
    # UserモデルからQuizモデルを参照できるようにする
    quizzes = relationship("Quiz", back_populates="owner")

class Quiz(Base):
    __tablename__ = "quizzes" # テーブル名

    id = Column(Integer, primary_key=True, index=True)
    question = Column(String, index=True)
    hashed_answer = Column(String)
    user_id = Column(Integer, ForeignKey("users.id"))

    # QuizモデルからUserモデルを参照できるようにする
    owner = relationship("User", back_populates="quizzes")