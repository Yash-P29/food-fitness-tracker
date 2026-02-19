import pandas as pd

# Load dataset once
_food_df = pd.read_csv("output_data.csv")
_food_df["food_name_lower"] = _food_df["food_name"].str.lower().str.strip()


def search_foods(query: str):
    query = query.lower().strip()
    if not query:
        return []

    results = _food_df[_food_df["food_name_lower"].str.startswith(query)]
    return results["food_name"].head(10).tolist()


def get_food_row(food_name: str):
    name = food_name.lower().strip()
    result = _food_df[_food_df["food_name_lower"] == name]

    if result.empty:
        return None

    return result.iloc[0]


def get_food_details(food_name: str):
    row = get_food_row(food_name)

    if row is None:
        return {"error": "Food not found"}

    return row.drop(labels=["food_name_lower"]).to_dict()

print("FOOD_DF rows:", len(_food_df))
