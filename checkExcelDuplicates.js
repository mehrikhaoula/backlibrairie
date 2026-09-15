const XLSX = require("xlsx");

const EXCEL_FILE = "./products.xlsx";

function clean(value) {
  return String(value || "").trim();
}

const workbook = XLSX.readFile(EXCEL_FILE);

const worksheet =
  workbook.Sheets[workbook.SheetNames[0]];

const products =
  XLSX.utils.sheet_to_json(worksheet);

const names = new Map();
const sourceUrls = new Map();

for (const product of products) {

  const name = clean(product.Nom);
  const sourceUrl = clean(product.SourceUrl);

  if (name) {
    if (!names.has(name)) {
      names.set(name, []);
    }

    names.get(name).push(sourceUrl);
  }

  if (sourceUrl) {
    if (!sourceUrls.has(sourceUrl)) {
      sourceUrls.set(sourceUrl, []);
    }

    sourceUrls.get(sourceUrl).push(name);
  }
}

// =====================================
// DUPLICATE NAMES
// =====================================

const duplicateNames =
  [...names.entries()]
    .filter(([name, urls]) => urls.length > 1);

// =====================================
// DUPLICATE SOURCE URL
// =====================================

const duplicateSourceUrls =
  [...sourceUrls.entries()]
    .filter(([url, names]) => names.length > 1);

console.log("\n======================================");
console.log("🔎 ANALYSE EXCEL");
console.log("======================================");

console.log(
  `📦 Total lignes       : ${products.length}`
);

console.log(
  `🔤 Noms uniques       : ${names.size}`
);

console.log(
  `🔗 SourceUrl uniques  : ${sourceUrls.size}`
);

console.log(
  `⚠️ Noms dupliqués     : ${duplicateNames.length}`
);

console.log(
  `⚠️ URLs dupliquées    : ${duplicateSourceUrls.length}`
);

console.log("======================================");

// =====================================
// SHOW DUPLICATE NAMES
// =====================================

if (duplicateNames.length) {

  console.log(
    "\n📋 NOMS DUPLIQUÉS:\n"
  );

  duplicateNames.forEach(
    ([name, urls], index) => {

      console.log(
        `\n${index + 1}. ${name}`
      );

      urls.forEach((url) => {
        console.log(`   🔗 ${url}`);
      });

    }
  );
}

// =====================================
// SHOW DUPLICATE URL
// =====================================

if (duplicateSourceUrls.length) {

  console.log(
    "\n📋 SOURCEURL DUPLIQUÉES:\n"
  );

  duplicateSourceUrls.forEach(
    ([url, names], index) => {

      console.log(
        `\n${index + 1}. ${url}`
      );

      names.forEach((name) => {
        console.log(`   📦 ${name}`);
      });

    }
  );
}