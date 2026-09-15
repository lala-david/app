from fastapi import APIRouter, HTTPException, Response, status
from sqlalchemy import select

from ..core.security import CurrentUser, DbSession, create_token, decode_token, hash_password, verify_password
from ..models import User
from ..schemas import LogInIn, RefreshIn, SignUpIn, TokensOut

router = APIRouter(tags=["auth"])


def _tokens(user_id: str) -> TokensOut:
    return TokensOut(access_token=create_token(user_id, "access"), refresh_token=create_token(user_id, "refresh"), user_id=user_id)


@router.post("/auth/signup", response_model=TokensOut, status_code=status.HTTP_201_CREATED)
def sign_up(body: SignUpIn, db: DbSession) -> TokensOut:
    email = body.email.lower()
    if db.scalar(select(User).where(User.email == email)):
        raise HTTPException(status.HTTP_409_CONFLICT, "duplicate_email")
    user = User(email=email, password_hash=hash_password(body.password), consent_version=body.consent_version, notify_consent=body.notify_consent)
    db.add(user)
    db.commit()
    return _tokens(user.id)


@router.post("/auth/login", response_model=TokensOut)
def log_in(body: LogInIn, db: DbSession) -> TokensOut:
    user = db.scalar(select(User).where(User.email == body.email.lower()))
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "wrong_credentials")
    return _tokens(user.id)


@router.post("/auth/refresh", response_model=TokensOut)
def refresh(body: RefreshIn, db: DbSession) -> TokensOut:
    user_id = decode_token(body.refresh_token, "refresh")
    if not db.get(User, user_id):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "user_not_found")
    return _tokens(user_id)


@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
def delete_me(user: CurrentUser, db: DbSession) -> Response:
    db.delete(user)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
