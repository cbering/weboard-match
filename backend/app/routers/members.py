from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from ..database import get_db
from ..models import Member, BoardAssignment, Company, User
from ..schemas import MemberCreate, MemberUpdate, MemberOut, MemberWithBoards, CompanyBrief
from ..auth import get_current_user, require_admin

router = APIRouter(prefix="/members", tags=["members"])


def _board_for_member(member: Member) -> list[CompanyBrief]:
    return [
        CompanyBrief(id=a.company.id, name=a.company.name, phase=a.company.phase, status=a.company.status)
        for a in member.board_assignments
        if a.company
    ]


@router.get("", response_model=list[MemberOut])
async def list_members(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    result = await db.execute(select(Member).order_by(Member.name))
    return result.scalars().all()


@router.get("/{member_id}", response_model=MemberWithBoards)
async def get_member(
    member_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "admin" and current_user.member_id != member_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Adgang nægtet")
    result = await db.execute(
        select(Member)
        .where(Member.id == member_id)
        .options(selectinload(Member.board_assignments).selectinload(BoardAssignment.company))
    )
    m = result.scalar_one_or_none()
    if not m:
        raise HTTPException(status_code=404, detail="Medlem ikke fundet")
    out = MemberWithBoards.model_validate(m)
    out.boards = _board_for_member(m)
    return out


@router.post("", response_model=MemberOut, status_code=201)
async def create_member(
    body: MemberCreate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    m = Member(**body.model_dump())
    db.add(m)
    await db.commit()
    await db.refresh(m)
    return m


@router.put("/{member_id}", response_model=MemberOut)
async def update_member(
    member_id: int,
    body: MemberUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "admin" and current_user.member_id != member_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Adgang nægtet")
    result = await db.execute(select(Member).where(Member.id == member_id))
    m = result.scalar_one_or_none()
    if not m:
        raise HTTPException(status_code=404, detail="Medlem ikke fundet")
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(m, k, v)
    await db.commit()
    await db.refresh(m)
    return m


@router.delete("/{member_id}", status_code=204)
async def delete_member(
    member_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    result = await db.execute(select(Member).where(Member.id == member_id))
    m = result.scalar_one_or_none()
    if not m:
        raise HTTPException(status_code=404, detail="Medlem ikke fundet")
    await db.delete(m)
    await db.commit()
