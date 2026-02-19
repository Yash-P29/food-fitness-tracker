def calories_strength(body_weight, body_factor, external_load, rom, reps):
    return (
        (body_weight * body_factor + external_load)
        * 9.81 * rom * reps
    ) / (4184 * 0.22)
