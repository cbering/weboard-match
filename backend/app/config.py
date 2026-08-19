from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql+asyncpg://weboard:weboard_dev@localhost/weboard"
    secret_key: str = "dev-secret-change-in-production"
    access_token_expire_minutes: int = 480
    first_admin_email: str = "admin@weboard.dk"
    first_admin_password: str = "changeme123"

    class Config:
        env_file = ".env"


settings = Settings()
