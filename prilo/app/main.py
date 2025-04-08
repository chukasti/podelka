from fastapi import FastAPI, Depends, HTTPException, Request, status
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
import os

from app import models, schemas, auth, database

app = FastAPI()

# Настройка CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Создание таблиц в БД
models.Base.metadata.create_all(bind=database.engine)

# Статические файлы
app.mount("/static", StaticFiles(directory="frontend"), name="static")

# API Endpoints
@app.post("/api/register")
async def register(user: schemas.UserCreate, db: Session = Depends(database.get_db)):
    try:
        db_user = auth.create_user(user, db)
        return {"message": "User created successfully", "username": db_user.username}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@app.post("/api/login")
async def login(user: schemas.UserLogin, db: Session = Depends(database.get_db)):
    try:
        token = auth.authenticate_user(user, db)
        return {"access_token": token, "token_type": "bearer"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password"
        )

@app.get("/api/tasks")
async def read_tasks(db: Session = Depends(database.get_db), user=Depends(auth.get_current_user)):
    tasks = db.query(models.Task).filter(models.Task.owner_id == user.id).all()
    return tasks

@app.post("/api/tasks")
async def create_task(
    task: schemas.TaskCreate,
    db: Session = Depends(database.get_db),
    user=Depends(auth.get_current_user)
):
    new_task = models.Task(**task.dict(), owner_id=user.id)
    db.add(new_task)
    db.commit()
    db.refresh(new_task)
    return new_task

# Для SPA - все остальные запросы перенаправляем на index.html
@app.get("/{full_path:path}")
async def serve_spa(full_path: str):
    return FileResponse(os.path.join("frontend", "index.html"))