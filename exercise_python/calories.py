def calories_per_set(
    body_weight: float,
    body_factor: float,
    external_load: float,
    rom: float,
    reps: int
) -> float:
    return (
        1.4
        * (body_weight * body_factor + external_load)
        * 9.81
        * rom
        * reps
    ) / (4184 * 0.22)
