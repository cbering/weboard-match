from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession
from ..database import get_db
from ..models import LookupValue
from ..schemas import LookupValueCreate, LookupValueUpdate, LookupValueOut
from ..auth import get_current_user, require_admin

router = APIRouter(prefix="/lookups", tags=["lookups"])


@router.get("/{category}", response_model=list[LookupValueOut])
async def list_by_category(
    category: str,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    result = await db.execute(
        select(LookupValue)
        .where(LookupValue.category == category, LookupValue.is_active == True)
        .order_by(LookupValue.sort_order, LookupValue.value)
    )
    return result.scalars().all()


@router.get("", response_model=list[LookupValueOut])
async def list_all(
    db: AsyncSession = Depends(get_db),
    _=Depends(require_admin),
):
    result = await db.execute(
        select(LookupValue).order_by(LookupValue.category, LookupValue.sort_order, LookupValue.value)
    )
    return result.scalars().all()


@router.post("", response_model=LookupValueOut, status_code=201)
async def create(
    body: LookupValueCreate,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_admin),
):
    lv = LookupValue(**body.model_dump())
    db.add(lv)
    await db.commit()
    await db.refresh(lv)
    return lv


@router.put("/{lv_id}", response_model=LookupValueOut)
async def update(
    lv_id: int,
    body: LookupValueUpdate,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_admin),
):
    lv = await db.get(LookupValue, lv_id)
    if not lv:
        raise HTTPException(404, "Not found")
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(lv, k, v)
    await db.commit()
    await db.refresh(lv)
    return lv


@router.delete("/{lv_id}", status_code=204)
async def remove(
    lv_id: int,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_admin),
):
    lv = await db.get(LookupValue, lv_id)
    if not lv:
        raise HTTPException(404, "Not found")
    await db.delete(lv)
    await db.commit()
