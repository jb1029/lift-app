export default async function handler(req, res) {
  const apiKey = process.env.USDA_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "Missing API key" });
  }

  const query = (req.query.q || "").trim();
  if (!query) {
    return res.status(200).json({ foods: [] });
  }

  try {
    const url = `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${apiKey}&query=${encodeURIComponent(
      query
    )}&pageSize=10&dataType=Foundation,SR%20Legacy,Branded`;

    const response = await fetch(url);
    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({ error: "USDA error" });
    }

    const foods = (data.foods || []).map((f) => {
      const n = { kcal: 0, protein: 0, carbs: 0, fat: 0 };
      const micros = {};
      (f.foodNutrients || []).forEach((nut) => {
        const name = (nut.nutrientName || "").toLowerCase();
        const val = nut.value;
        const unit = nut.unitName || "";
        if (name.includes("energy") && (unit === "KCAL" || unit === "kcal")) n.kcal = val;
        else if (name === "protein") n.protein = val;
        else if (name.includes("carbohydrate")) n.carbs = val;
        else if (name.includes("total lipid") || name === "fat") n.fat = val;
        // Micronutrients (per 100g)
        else if (name === "sodium, na") micros.sodium = { v: val, u: unit };
        else if (name === "potassium, k") micros.potassium = { v: val, u: unit };
        else if (name === "calcium, ca") micros.calcium = { v: val, u: unit };
        else if (name === "iron, fe") micros.iron = { v: val, u: unit };
        else if (name === "magnesium, mg") micros.magnesium = { v: val, u: unit };
        else if (name.includes("vitamin c")) micros.vitaminC = { v: val, u: unit };
        else if (name.includes("vitamin d")) micros.vitaminD = { v: val, u: unit };
        else if (name.includes("vitamin a, rae")) micros.vitaminA = { v: val, u: unit };
        else if (name === "fiber, total dietary") micros.fiber = { v: val, u: unit };
      });
      return {
        name: f.description
          ? f.description.charAt(0) + f.description.slice(1).toLowerCase()
          : "Unknown food",
        kcal: Math.round(n.kcal),
        protein: Math.round(n.protein),
        carbs: Math.round(n.carbs),
        fat: Math.round(n.fat),
        micros,
        label: "per 100g",
      };
    }).filter((f) => f.kcal > 0);

    return res.status(200).json({ foods });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}