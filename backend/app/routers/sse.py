"""Server-Sent Events: broadcast board and company changes to all connected clients."""
import asyncio
import json
from fastapi import APIRouter, Depends, Request
from fastapi.responses import StreamingResponse
from ..auth import get_current_user
from ..models import User

router = APIRouter(prefix="/events", tags=["sse"])

_subscribers: list[asyncio.Queue] = []


async def broadcast(event_type: str, data: dict):
    payload = f"event: {event_type}\ndata: {json.dumps(data)}\n\n"
    for q in _subscribers:
        await q.put(payload)


@router.get("")
async def event_stream(
    request: Request,
    _: User = Depends(get_current_user),
):
    queue: asyncio.Queue = asyncio.Queue()
    _subscribers.append(queue)

    async def generator():
        try:
            yield "event: connected\ndata: {}\n\n"
            while True:
                if await request.is_disconnected():
                    break
                try:
                    msg = await asyncio.wait_for(queue.get(), timeout=30)
                    yield msg
                except asyncio.TimeoutError:
                    yield ": keepalive\n\n"
        finally:
            _subscribers.remove(queue)

    return StreamingResponse(generator(), media_type="text/event-stream")
