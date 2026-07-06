from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.domain.models import UserDB, UserRegisterSchema, UserLoginSchema, TokenSchema
from backend.app.infrastructure.db_session import get_db
from backend.app.infrastructure.repositories import UserRepository

router = APIRouter(prefix="/auth", tags=["Authentication"])

def simple_hash(password: str) -> str:
    # A simple, robust, zero-dependency hashing for local sandbox convenience
    import hashlib
    return hashlib.sha256(password.encode()).hexdigest()

@router.post("/register", response_model=TokenSchema)
def register(schema: UserRegisterSchema, db: Session = Depends(get_db)):
    repo = UserRepository(db)
    
    # Check if user exists
    if repo.get_by_username(schema.username):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken"
        )
    if repo.get_by_email(schema.email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # Create new user
    hashed = simple_hash(schema.password)
    user_db = UserDB(
        username=schema.username,
        email=schema.email,
        hashed_password=hashed
    )
    
    saved_user = repo.create(user_db)
    
    # Return mock JWT token for local usage
    return TokenSchema(
        id=saved_user.id,
        token=f"local_jwt_token_{saved_user.id}",
        username=saved_user.username
    )

@router.post("/login", response_model=TokenSchema)
def login(schema: UserLoginSchema, db: Session = Depends(get_db)):
    repo = UserRepository(db)
    user = repo.get_by_username(schema.username)
    
    if not user or user.hashed_password != simple_hash(schema.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password"
        )
        
    return TokenSchema(
        id=user.id,
        token=f"local_jwt_token_{user.id}",
        username=user.username
    )
