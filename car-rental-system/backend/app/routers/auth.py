"""Auth router: register, login, me."""
from __future__ import annotations

from fastapi import APIRouter, Depends, status
from fastapi.security import OAuth2PasswordRequestForm

from app.core.responses import ok, created, error_response
from app.core.security import create_access_token, get_current_user_id
from app.models.user import UserRegister, UserOut, AuthResponse
from app.services import user_service

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(payload: UserRegister):
    try:
        user = await user_service.create_user(
            name=payload.name,
            email=payload.email,
            password=payload.password,
            phone=payload.phone,
        )
    except ValueError as e:
        # Duplicate email
        return error_response(str(e), status_code=status.HTTP_409_CONFLICT)

    token = create_access_token(subject=user["id"], extra={"email": user["email"]})
    body = AuthResponse(user=UserOut(**user), token=token)
    return created(data=body.model_dump(), message="Account created successfully")


@router.post("/login")
async def login(form: OAuth2PasswordRequestForm = Depends()):
    """OAuth2 password flow. `username` field is the email."""
    user = await user_service.authenticate(form.username, form.password)
    if not user:
        return error_response("Invalid email or password", status_code=status.HTTP_401_UNAUTHORIZED)
    token = create_access_token(subject=user["id"], extra={"email": user["email"]})
    body = AuthResponse(user=UserOut(**user), token=token)
    return ok(data=body.model_dump(), message="Login successful")


@router.get("/me")
async def me(user_id: str = Depends(get_current_user_id)):
    user = await user_service.get_user_by_id(user_id)
    if not user:
        return error_response("User not found", status_code=status.HTTP_404_NOT_FOUND)
    return ok(data=UserOut(**user).model_dump(), message="Current user fetched")
