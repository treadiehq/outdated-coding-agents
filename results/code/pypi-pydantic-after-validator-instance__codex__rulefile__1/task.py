from datetime import date

from pydantic import BaseModel, model_validator


class DateRange(BaseModel):
    start: date
    end: date

    @model_validator(mode="after")
    def validate_date_order(self) -> "DateRange":
        if self.end < self.start:
            raise ValueError("end must be on or after start")
        return self
