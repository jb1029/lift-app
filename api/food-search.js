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

    // Simplify USDA's response into what the app needs
    const foods = (data.foods || []).map((f) => {
      const nutrients = {};
      (f.foodNutrients || []).forEach((n) => {
        const name = (n.nutrientName || "").toLowerCase();
        if (name.includes("energy") && (n.unitName === "KCAL" || n.unitName === "kcal")) {
          nutrients.kcal = n.value;
        } else if (name === "protein") {
          nutrients.protein = n.value;
        } else if (name.includes("carbohydrate")) {
          nutrients.carbs = n.value;
        } else if (name.includes("total lipid") || name === "fat") {
          nutrients.fat = n.value;
        }
      });
      return {
        name: f.description
          ? f.description.charAt(0) + f.description.slice(1).toLowerCase()
          : "Unknown food",
        kcal: Math.round(nutrients.kcal || 0),
        protein: Math.round(nutrients.protein || 0),
        carbs: Math.round(nutrients.carbs || 0),
        fat: Math.round(nutrients.fat || 0),
        label: "per 100g",
      };
    }).filter((f) => f.kcal > 0);

    return res.status(200).json({ foods });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}