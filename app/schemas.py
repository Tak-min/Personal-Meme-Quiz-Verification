# app/schemas.py
from pydantic import BaseModel
from typing import List, Optional

# --- Base Schemas ---
class QuizBase(BaseModel):
    question: str

class UserBase(BaseModel):
    username: str

# --- Quiz Schemas ---
class QuizCreate(QuizBase):
    answer: str

class Quiz(QuizBase):
    id: int

    class Config:
        orm_mode = True

# --- User Schemas ---
class UserCreate(UserBase):
    quizzes: List[QuizCreate]

class User(UserBase):
    id: int
    quizzes: List[Quiz] = []

    class Config:
        orm_mode = True

# --- Token Schemas (New) ---
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

# --- Login Schemas (New) ---
class LoginRequest(BaseModel):
    username: str

class QuestionResponse(BaseModel):
    question_id: int
    question: str