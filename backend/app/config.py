from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql+asyncpg://weboard:weboard_dev@localhost/weboard"
    secret_key: str = "dev-secret-change-in-production"
    access_token_expire_minutes: int = 480
    first_admin_email: str = "admin@weboard.dk"
    first_admin_password: str = "changeme123"
    cors_origins: str = ""  # comma-separated; empty = allow all

    @property
    def async_database_url(self) -> str:
        url = self.database_url
        if url.startswith("postgresql://"):
            url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
        return url

    class Config:
        env_file = ".env"


settings = Settings()
