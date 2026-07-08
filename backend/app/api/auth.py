from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.domain.models import UserDB, UserRegisterSchema, UserLoginSchema, TokenSchema
from backend.app.infrastructure.db_session import get_db
from backend.app.infrastructure.repositories import UserRepository
from backend.app.security import hash_password, verify_password, create_access_token

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post(
    "/register",
    response_model=TokenSchema,
    summary="Register a new user",
    description="Creates a user account with bcrypt-hashed password and returns a JWT access token.",
)
def register(schema: UserRegisterSchema, db: Session = Depends(get_db)):
    repo = UserRepository(db)

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

    hashed = hash_password(schema.password)
    user_db = UserDB(
        username=schema.username,
        email=schema.email,
        hashed_password=hashed
    )

    saved_user = repo.create(user_db)
    token = create_access_token({"sub": str(saved_user.id), "username": saved_user.username})

    return TokenSchema(
        id=saved_user.id,
        token=token,
        username=saved_user.username
    )

@router.post(
    "/login",
    response_model=TokenSchema,
    summary="Authenticate existing user",
    description="Validates username/password credentials and returns a JWT access token.",
)
def login(schema: UserLoginSchema, db: Session = Depends(get_db)):
    repo = UserRepository(db)
    user = repo.get_by_username(schema.username)

    if not user or not verify_password(schema.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password"
        )

    token = create_access_token({"sub": str(user.id), "username": user.username})
    return TokenSchema(
        id=user.id,
        token=token,
        username=user.username
    )
