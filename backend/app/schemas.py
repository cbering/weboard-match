from datetime import datetime
from typing import Optional, Literal
from pydantic import BaseModel, EmailStr


# ── Auth ─────────────────────────────────────────────────────────────
class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    member_id: Optional[int] = None


class UserOut(BaseModel):
    id: int
    email: str
    role: str
    member_id: Optional[int]
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class UserCreate(BaseModel):
    email: str
    password: str
    role: Literal["admin", "member"] = "member"
    member_id: Optional[int] = None


class UserUpdate(BaseModel):
    email: Optional[str] = None
    role: Optional[Literal["admin", "member"]] = None
    member_id: Optional[int] = None
    is_active: Optional[bool] = None


class PasswordChange(BaseModel):
    password: str


# ── Members ──────────────────────────────────────────────────────────
class MemberBase(BaseModel):
    name: str
    branche: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    status: Literal["aktiv", "optaget", "inaktiv"] = "aktiv"
    ratings: dict[str, int] = {}


class MemberCreate(MemberBase):
    pass


class MemberUpdate(MemberBase):
    name: Optional[str] = None


class MemberOut(MemberBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class MemberWithBoards(MemberOut):
    boards: list["CompanyBrief"] = []


# ── Companies ────────────────────────────────────────────────────────
class CompanyBase(BaseModel):
    name: str
    branche: Optional[str] = None
    contact: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    phase: Literal["eksistens", "overlevelse", "succes", "takeoff", "modenhed"] = "eksistens"
    status: Literal["ny", "screening", "matchet", "aktiv", "afvist"] = "ny"
    notes: Optional[str] = None
    desired: list[str] = []


class CompanyCreate(CompanyBase):
    pass


class CompanyUpdate(CompanyBase):
    name: Optional[str] = None


class CompanyOut(CompanyBase):
    id: int
    created_at: datetime
    updated_at: datetime
    board: list["MemberBrief"] = []

    model_config = {"from_attributes": True}


class CompanyBrief(BaseModel):
    id: int
    name: str
    phase: str
    status: str

    model_config = {"from_attributes": True}


class MemberBrief(BaseModel):
    id: int
    name: str
    branche: Optional[str]
    status: str
    email: Optional[str]

    model_config = {"from_attributes": True}


# ── Board ─────────────────────────────────────────────────────────────
class BoardAssignmentCreate(BaseModel):
    notes: Optional[str] = None


class BoardAssignmentOut(BaseModel):
    id: int
    company_id: int
    member_id: int
    added_at: datetime
    notes: Optional[str]
    member: MemberBrief

    model_config = {"from_attributes": True}


# ── Matching ──────────────────────────────────────────────────────────
class MatchScore(BaseModel):
    member: MemberBrief
    score: int
    pct: int
    matched_competencies: list[dict]
    industry_match: bool
    on_board: bool


class MatchResult(BaseModel):
    company_id: int
    company_name: str
    phase: str
    relevant_competencies: list[str]
    scores: list[MatchScore]


# ── Lookups ───────────────────────────────────────────────────────────
class LookupValueBase(BaseModel):
    category: str
    value: str
    sort_order: int = 0
    is_active: bool = True


class LookupValueCreate(LookupValueBase):
    pass


class LookupValueUpdate(BaseModel):
    value: Optional[str] = None
    sort_order: Optional[int] = None
    is_active: Optional[bool] = None


class LookupValueOut(LookupValueBase):
    id: int
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Stats ─────────────────────────────────────────────────────────────
class DashboardStats(BaseModel):
    total_companies: int
    new_companies: int
    total_members: int
    active_members: int
    active_boards: int
    recent_companies: list[CompanyBrief]
