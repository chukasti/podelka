from fastapi import FastAPI, Depends, HTTPException
from app import models, schemas, auth, database
from sqlalchemy.orm import Session

app = FastAPI()

models.Base.metadata.create_all(bind=database.engine)

@app.post("/register")
def register(user: schemas.UserCreate, db: Session = Depends(database.get_db)):
    return auth.create_user(user, db)

@app.post("/login")
def login(user: schemas.UserLogin, db: Session = Depends(database.get_db)):
    return auth.authenticate_user(user, db)

@app.get("/tasks")
def read_tasks(db: Session = Depends(database.get_db), user=Depends(auth.get_current_user)):
    return db.query(models.Task).filter(models.Task.owner_id == user.id).all()

@app.post("/tasks")
def create_task(task: schemas.TaskCreate, db: Session = Depends(database.get_db), user=Depends(auth.get_current_user)):
    new_task = models.Task(**task.dict(), owner_id=user.id)
    db.add(new_task)
    db.commit()
    db.refresh(new_task)
    return new_task
