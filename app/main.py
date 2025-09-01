# app/main.py
import random
import os
import json
from datetime import datetime, timedelta
from typing import List

from fastapi import Depends, FastAPI, HTTPException, status, Form
from fastapi.security import OAuth2PasswordBearer
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from dotenv import load_dotenv

import google.generativeai as genai

from . import models, schemas
from .database import SessionLocal, engine

# --- Configuration ---
models.Base.metadata.create_all(bind=engine)
app = FastAPI()
load_dotenv()

# --- Gemini APIのセットアップ ---
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    gemini_model = genai.GenerativeModel('gemini-1.5-flash-latest')
else:
    gemini_model = None
    print("警告: GEMINI_API_KEYが設定されていません。AI機能は無効になります。")

# --- フロントエンド配信設定 (ここを修正) ---
# 静的ファイル（HTML, CSS, JS）があるディレクトリを指定（appフォルダの一つ上の階層）
STATIC_DIR = os.path.join(os.path.dirname(__file__), "..")

# CSSやJSファイルなどを配信するための設定
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

# ルートパス("/")にアクセスがあったらindex.htmlを返す
@app.get("/")
async def read_index():
    return FileResponse(os.path.join(STATIC_DIR, "index.html"))

# /registerパスにアクセスがあったらregister.htmlを返す
@app.get("/register")
async def read_register():
    return FileResponse(os.path.join(STATIC_DIR, "register.html"))


# --- Gemini Helper Functions ---
# (変更なし)
def validate_black_history(answer: str) -> bool:
    if not gemini_model:
        return True

    prompt = f"""
    あなたは「黒歴史鑑定人」です。以下の単語や文章が、思春期にありがちな、後から思い出すと恥ずかしくなるような「黒歴史」に該当するかどうかを判定してください。
    判定基準は、ポエム、中二病的な単語、自作のキャラクター名、イタい発言などです。一般的な単語や事実（例：「リンゴ」「東京タワー」）は黒歴史ではありません。
    判定結果を「はい」か「いいえ」のどちらか一言だけで答えてください。

    判定対象： "{answer}"
    """
    try:
        response = gemini_model.generate_content(prompt)
        return "はい" in response.text
    except Exception as e:
        print(f"Gemini API Error: {e}")
        return False

# --- Security Settings & Helper Functions ---
# (このセクション以降のコードに変更はありません)
# ... (以前のコードと同じ)
SECRET_KEY = "your-very-secret-key-that-is-long-and-random"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# --- Database Dependency ---
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- Helper Functions ---
def verify_answer(plain_answer, hashed_answer):
    return pwd_context.verify(plain_answer, hashed_answer)

def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# --- API Endpoints ---
@app.post("/users/", response_model=schemas.User)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="このユーザー名は既に使用されています")

    for quiz in user.quizzes:
        if not validate_black_history(quiz.answer):
            raise HTTPException(
                status_code=400, 
                detail=f"鑑定結果：『{quiz.answer}』は黒歴史として認められませんでした。もっと魂を燃やしてください。"
            )

    new_user = models.User(username=user.username)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    for quiz_data in user.quizzes:
        hashed_answer = pwd_context.hash(quiz_data.answer)
        new_quiz = models.Quiz(
            question=quiz_data.question,
            hashed_answer=hashed_answer,
            user_id=new_user.id
        )
        db.add(new_quiz)
    
    db.commit()
    db.refresh(new_user)
    return new_user

@app.get("/quizzes/recommendations")
def get_quiz_recommendations():
    if not gemini_model:
        raise HTTPException(status_code=503, detail="AI機能は現在利用できません。")

    prompt = """
    あなたは「中二病の達人」です。
    ウェブサイトの新規登録で使う「秘密の質問と答え」の面白い例を3つ考えてください。
    テーマは「自分が過去に考えた恥ずかしいキャラクター、ポエム、必殺技」など、いわゆる「黒歴史」です。
    必ずJSON形式で、質問と答えのペアの配列として回答してください。
    """
    try:
        # ▼▼▼ ここから修正 ▼▼▼
        # GeminiにJSON形式での出力を強制する設定
        generation_config = genai.types.GenerationConfig(
            response_mime_type="application/json"
        )
        
        # 設定を使ってAPIを呼び出す
        response = gemini_model.generate_content(
            prompt,
            generation_config=generation_config
        )
        
        # JSONモードなので、そのままテキストをJSONとして読み込める
        recommendations = json.loads(response.text)
        # ▲▲▲ ここまで修正 ▲▲▲
        return recommendations
    except Exception as e:
        # エラーログに詳細を出力すると、デバッグしやすくなる
        print(f"Detailed Gemini API Error in recommendations: {e}")
        raise HTTPException(status_code=500, detail="AIからの提案取得中にエラーが発生しました。")

@app.post("/login/question", response_model=schemas.QuestionResponse)
def get_login_question(request: schemas.LoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.username == request.username).first()
    if not user or not user.quizzes:
        raise HTTPException(status_code=404, detail="ユーザーが見つからないか、クイズが登録されていません")
    
    random_quiz = random.choice(user.quizzes)
    return {"question_id": random_quiz.id, "question": random_quiz.question}

@app.post("/token", response_model=schemas.Token)
def login_for_access_token(
    username: str = Form(...), 
    question_id: int = Form(...), 
    answer: str = Form(...), 
    db: Session = Depends(get_db)
):
    quiz = db.query(models.Quiz).filter(models.Quiz.id == question_id).first()
    
    if not quiz or not hasattr(quiz, 'owner') or quiz.owner.username != username or not verify_answer(answer, quiz.hashed_answer):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="ユーザー名、クイズ、または答えが正しくありません",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/users/me/", response_model=schemas.User)
def read_users_me(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = db.query(models.User).filter(models.User.username == username).first()
    if user is None:
        raise credentials_exception
    return user