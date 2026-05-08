from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    DATABASE_URL: str = "postgresql+psycopg://orbidi:orbidi@localhost:5432/orbidi"
    JWT_SECRET: str = "dev-secret-change-me"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRES_MINUTES: int = 60
    GOOGLE_CLIENT_ID: str = ""
    CORS_ORIGINS: str = "http://localhost:3000"
    ATTACHMENTS_DIR: str = "/app/storage/attachments"
    MAX_ATTACHMENT_MB: int = 10

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]


settings = Settings()