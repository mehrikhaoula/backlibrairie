const XLSX = require("xlsx");

const filePath = "./products.xlsx";

console.log("🔎 Analyse des catégories principales...\n");

const workbook = XLSX.readFile(filePath);
const sheet = workbook.Sheets[workbook.SheetNames[0]];

const products = XLSX.utils.sheet_to_json(sheet);

console.log(`📊 Nombre de produits : ${products.length}\n`);

const categories = new Map();

products.forEach((product) => {
  const fullCategory = String(product.Categorie || "").trim();

  if (!fullCategory) return;

  // Prendre uniquement la première catégorie
  const mainCategory = fullCategory
    .split(",")[0]
    .trim();

  if (!mainCategory) return;

  categories.set(
    mainCategory,
    (categories.get(mainCategory) || 0) + 1
  );
});

console.log("======================================");
console.log("📂 CATÉGORIES PRINCIPALES");
console.log("======================================\n");

let i = 1;

[...categories.entries()]
  .sort((a, b) => b[1] - a[1])
  .forEach(([category, count]) => {
    console.log(`${i}. ${category}`);
    console.log(`   📦 ${count} produits\n`);
    i++;
  });

console.log("======================================");
console.log(`📊 TOTAL CATÉGORIES : ${categories.size}`);
console.log("======================================");