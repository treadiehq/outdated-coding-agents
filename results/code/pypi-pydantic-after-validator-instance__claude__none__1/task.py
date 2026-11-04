from datetime import date

from pydantic import BaseModel, model_validator
from typing_extensions import Self


class DateRange(BaseModel):
    start: date
    end: date

    @model_validator(mode="after")
    def check_end_not_before_start(self) -> Self:
        if self.end < self.start:
            raise ValueError("end must not be before start")
        return self
