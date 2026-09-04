from pydantic import BaseModel, EmailStr, Field


class UserRegister(BaseModel):
    name: str = Field(
        ...,
        min_length=2,
        max_length=100
    )

    email: EmailStr

    password: str = Field(
        ...,
        min_length=6,
        max_length=100
    )

    phone: str = Field(
        default="",
        max_length=20
    )


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserProfileUpdate(BaseModel):
    name: str = Field(
        ...,
        min_length=2,
        max_length=100
    )

    phone: str = Field(
        default="",
        max_length=20
    )


class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    phone: str
    role: str