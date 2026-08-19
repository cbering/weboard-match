"""Run with: python seed.py  (after docker-compose up -d db)"""
import asyncio
from app.database import AsyncSessionLocal, engine, Base
from app.models import Member, Company, LookupValue
from app.auth import hash_password


def r(overrides: dict) -> dict:
    defaults = {c: 0 for c in [
        "esg","digitalisering","innovation","eksport","strategi","hr",
        "salg","ivaerksaetter","oekonomi","finansiering","jura",
        "aktiv_lytning","empatisk","holistisk","nysgerrig","udfordrer"
    ]}
    defaults.update(overrides)
    return defaults


MEMBERS = [
    {"name": "Lars Eriksen",       "branche": "Finans & investering",        "status": "aktiv", "ratings": r({"oekonomi":3,"finansiering":3,"strategi":2,"jura":2,"aktiv_lytning":3,"holistisk":2})},
    {"name": "Marie Christensen",  "branche": "Marketing & branding",        "status": "aktiv", "ratings": r({"salg":3,"digitalisering":2,"innovation":2,"empatisk":3,"nysgerrig":3})},
    {"name": "Peter Andersen",     "branche": "Tech & digitalisering",       "status": "aktiv", "ratings": r({"digitalisering":3,"innovation":2,"esg":2,"nysgerrig":3,"udfordrer":2})},
    {"name": "Anna Nielsen",       "branche": "HR & organisationsudvikling", "status": "aktiv", "ratings": r({"hr":3,"strategi":2,"jura":1,"aktiv_lytning":3,"empatisk":2,"holistisk":2})},
    {"name": "Thomas Hansen",      "branche": "Iværksætteri & startups",     "status": "aktiv", "ratings": r({"ivaerksaetter":3,"salg":2,"finansiering":2,"udfordrer":3,"nysgerrig":2})},
    {"name": "Sofie Larsen",       "branche": "International handel",        "status": "aktiv", "ratings": r({"eksport":3,"salg":2,"strategi":2,"empatisk":2,"holistisk":2})},
    {"name": "Michael Jensen",     "branche": "ESG & bæredygtighed",         "status": "aktiv", "ratings": r({"esg":3,"strategi":2,"innovation":2,"holistisk":3,"nysgerrig":2})},
    {"name": "Ida Petersen",       "branche": "Jura & compliance",           "status": "aktiv", "ratings": r({"jura":3,"finansiering":2,"strategi":2,"aktiv_lytning":2,"holistisk":2})},
]

COMPANIES = [
    {"name": "Nordic Startup ApS",     "branche": "SaaS / tech",     "contact": "Nikolaj Brandt", "phase": "eksistens", "status": "ny",        "notes": "Tidlig fase SaaS, søger mentorer med startup-erfaring.", "desired": []},
    {"name": "GrowthTech A/S",         "branche": "B2B software",    "contact": "Lotte Munk",     "phase": "takeoff",   "status": "screening", "notes": "B2B software i hurtig vækst, vil ind på det nordiske marked.", "desired": []},
    {"name": "Sustainable Future ApS", "branche": "ESG-rådgivning",  "contact": "Bo Vestergaard", "phase": "modenhed",  "status": "ny",        "notes": "Ønsker at styrke ESG-profilen og udvikle nye services.", "desired": ["esg"]},
]


BRANCHES = [
    "Finans & investering",
    "Marketing & branding",
    "Tech & digitalisering",
    "HR & organisationsudvikling",
    "Iværksætteri & startups",
    "International handel",
    "ESG & bæredygtighed",
    "Jura & compliance",
    "Produktion & supply chain",
    "Sundhed & life science",
    "Ejendom & byggeri",
    "Detailhandel & e-commerce",
    "Medier & kommunikation",
    "Offentlig sektor & NGO",
]


async def main():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as db:
        for m in MEMBERS:
            db.add(Member(**m))
        for c in COMPANIES:
            db.add(Company(**c))
        for i, b in enumerate(BRANCHES):
            db.add(LookupValue(category="branche", value=b, sort_order=i))
        await db.commit()
    print("Seed complete.")


asyncio.run(main())
