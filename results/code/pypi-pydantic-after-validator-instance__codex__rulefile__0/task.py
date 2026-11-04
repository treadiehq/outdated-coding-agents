from datetime import date

from pydantic import BaseModel, model_validator


class DateRange(BaseModel):
    start: date
    end: date

    @model_validator(mode="after")
    def validate_date_range(self) -> "DateRange":
        if self.end < self.start:
            raise ValueError("end must not be before start")
        return self
