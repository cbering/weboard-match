from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from ..database import get_db
from ..models import Company, BoardAssignment, Member, User
from ..schemas import (
    CompanyCreate, CompanyUpdate, CompanyOut, MemberBrief,
    DashboardStats, CompanyBrief, MatchResult, MatchScore
)
from ..auth import get_current_user, require_admin
from ..matching import score_member

router = APIRouter(prefix="/companies", tags=["companies"])


async def _company_with_board(db: AsyncSession, company_id: int) -> Company:
    result = await db.execute(
        select(Company)
        .where(Company.id == company_id)
        .options(selectinload(Company.board_assignments).selectinload(BoardAssignment.member))
    )
    c = result.scalar_one_or_none()
    if not c:
        raise HTTPException(status_code=404, detail="Virksomhed ikke fundet")
    return c


def _board_members(c: Company) -> list[MemberBrief]:
    return [
        MemberBrief(id=a.member.id, name=a.member.name, branche=a.member.branche,
                    status=a.member.status, email=a.member.email)
        for a in c.board_assignments if a.member
    ]


@router.get("/dashboard", response_model=DashboardStats)
async def dashboard(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    cos = (await db.execute(select(Company).order_by(Company.created_at.desc()))).scalars().all()
    mems = (await db.execute(select(Member))).scalars().all()
    boards_with_members = await db.execute(
        select(func.count()).select_from(Company).where(
            Company.id.in_(
                select(BoardAssignment.company_id).distinct()
            )
        )
    )
    active_boards = boards_with_members.scalar() or 0
    recent = [CompanyBrief(id=c.id, name=c.name, phase=c.phase, status=c.status) for c in cos if c.status == "ny"][:5]
    return DashboardStats(
        total_companies=len(cos),
        new_companies=sum(1 for c in cos if c.status == "ny"),
        total_members=len(mems),
        active_members=sum(1 for m in mems if m.status == "aktiv"),
        active_boards=active_boards,
        recent_companies=recent,
    )


@router.get("", response_model=list[CompanyOut])
async def list_companies(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Company)
        .options(selectinload(Company.board_assignments).selectinload(BoardAssignment.member))
        .order_by(Company.created_at.desc())
    )
    companies = result.scalars().all()
    out = []
    for c in companies:
        o = CompanyOut.model_validate(c)
        o.board = _board_members(c)
        out.append(o)
    return out


@router.get("/{company_id}", response_model=CompanyOut)
async def get_company(
    company_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    c = await _company_with_board(db, company_id)
    o = CompanyOut.model_validate(c)
    o.board = _board_members(c)
    return o


@router.post("", response_model=CompanyOut, status_code=201)
async def create_company(
    body: CompanyCreate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    c = Company(**body.model_dump())
    db.add(c)
    await db.commit()
    await db.refresh(c)
    o = CompanyOut.model_validate(c)
    o.board = []
    return o


@router.put("/{company_id}", response_model=CompanyOut)
async def update_company(
    company_id: int,
    body: CompanyUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    c = await _company_with_board(db, company_id)
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(c, k, v)
    await db.commit()
    await db.refresh(c)
    c = await _company_with_board(db, company_id)
    o = CompanyOut.model_validate(c)
    o.board = _board_members(c)
    return o


@router.delete("/{company_id}", status_code=204)
async def delete_company(
    company_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    result = await db.execute(select(Company).where(Company.id == company_id))
    c = result.scalar_one_or_none()
    if not c:
        raise HTTPException(status_code=404, detail="Virksomhed ikke fundet")
    await db.delete(c)
    await db.commit()


@router.get("/{company_id}/match", response_model=MatchResult)
async def match_company(
    company_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    c = await _company_with_board(db, company_id)
    board_ids = {a.member_id for a in c.board_assignments}
    result = await db.execute(select(Member).where(Member.status != "inaktiv"))
    members = result.scalars().all()

    from ..matching import score_member, PHASES
    rel_ids = list(dict.fromkeys(
        (PHASES.get(c.phase, [])) + (c.desired or [])
    ))

    scores = []
    for m in members:
        s = score_member(m, c)
        scores.append(MatchScore(
            member=MemberBrief(id=m.id, name=m.name, branche=m.branche, status=m.status, email=m.email),
            score=int(s["score"]),
            pct=s["pct"],
            matched_competencies=s["matched_competencies"],
            industry_match=s["industry_match"],
            on_board=m.id in board_ids,
        ))
    scores.sort(key=lambda x: (x.on_board, -x.pct))

    return MatchResult(
        company_id=c.id,
        company_name=c.name,
        phase=c.phase,
        relevant_competencies=rel_ids,
        scores=scores,
    )
