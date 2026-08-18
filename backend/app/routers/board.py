from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from ..database import get_db
from ..models import BoardAssignment, Company, Member, User
from ..schemas import BoardAssignmentCreate, BoardAssignmentOut, MemberBrief
from ..auth import get_current_user, require_admin

router = APIRouter(prefix="/companies/{company_id}/board", tags=["board"])


@router.get("", response_model=list[BoardAssignmentOut])
async def list_board(
    company_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    result = await db.execute(
        select(BoardAssignment)
        .where(BoardAssignment.company_id == company_id)
        .options(selectinload(BoardAssignment.member))
        .order_by(BoardAssignment.added_at)
    )
    return result.scalars().all()


@router.post("/{member_id}", response_model=BoardAssignmentOut, status_code=201)
async def add_to_board(
    company_id: int,
    member_id: int,
    body: BoardAssignmentCreate = BoardAssignmentCreate(),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    # check company + member exist
    co = (await db.execute(select(Company).where(Company.id == company_id))).scalar_one_or_none()
    if not co:
        raise HTTPException(status_code=404, detail="Virksomhed ikke fundet")
    mbr = (await db.execute(select(Member).where(Member.id == member_id))).scalar_one_or_none()
    if not mbr:
        raise HTTPException(status_code=404, detail="Medlem ikke fundet")

    # idempotent: skip if already assigned
    existing = (await db.execute(
        select(BoardAssignment).where(
            BoardAssignment.company_id == company_id,
            BoardAssignment.member_id == member_id,
        )
    )).scalar_one_or_none()
    if existing:
        result = await db.execute(
            select(BoardAssignment)
            .where(BoardAssignment.id == existing.id)
            .options(selectinload(BoardAssignment.member))
        )
        return result.scalar_one()

    assignment = BoardAssignment(
        company_id=company_id,
        member_id=member_id,
        added_by=current_user.id,
        notes=body.notes,
    )
    db.add(assignment)

    # auto-advance company status
    if co.status in ("ny", "screening"):
        co.status = "matchet"

    await db.commit()
    await db.refresh(assignment)

    result = await db.execute(
        select(BoardAssignment)
        .where(BoardAssignment.id == assignment.id)
        .options(selectinload(BoardAssignment.member))
    )
    return result.scalar_one()


@router.delete("/{member_id}", status_code=204)
async def remove_from_board(
    company_id: int,
    member_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    result = await db.execute(
        select(BoardAssignment).where(
            BoardAssignment.company_id == company_id,
            BoardAssignment.member_id == member_id,
        )
    )
    assignment = result.scalar_one_or_none()
    if not assignment:
        raise HTTPException(status_code=404, detail="Tilknytning ikke fundet")
    await db.delete(assignment)

    # if board is now empty, revert company status to screening
    remaining = (await db.execute(
        select(BoardAssignment).where(BoardAssignment.company_id == company_id)
    )).scalars().all()
    if not remaining:
        co = (await db.execute(select(Company).where(Company.id == company_id))).scalar_one_or_none()
        if co and co.status == "matchet":
            co.status = "screening"

    await db.commit()
