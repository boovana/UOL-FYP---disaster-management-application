

const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");

const wikipediaURL = "https://en.wikipedia.org/wiki/List_of_emergency_telephone_numbers";

(async () => {
  try {
    const { data } = await axios.get(wikipediaURL);
    const $ = cheerio.load(data);
    const tables = $("table.wikitable");

    const results = {};

    tables.each((_, table) => {
      const headers = $(table)
        .find("th")
        .map((_, el) => $(el).text().trim().toLowerCase())
        .get();

      // get column indices for headers of interest
      const colIndex = {
        country: headers.findIndex((h) => h.includes("country")),
        police: headers.findIndex((h) => h.includes("police")),
        ambulance: headers.findIndex((h) => h.includes("ambulance")),
        fire: headers.findIndex((h) => h.includes("fire")),
        notes: headers.findIndex((h) => h.includes("note")),
      };
      // if the tables dont have the country column, skip it 
      if (colIndex.country === -1) return; 

      $(table).find("tr").slice(1) .each((_, row) => {
        const cols = $(row).find("td");
        if (cols.length < 1) return;

        const country = $(cols[colIndex.country]).text().trim();
        if (!country) return;

        // map column texts considering colspan
        const colTexts = {};
        let colIdx = 0;

        cols.each((_, cell) => {
          const $cell = $(cell);
          const text = $cell.text().trim();
          const colspan = parseInt($cell.attr("colspan")) || 1;

          for (let i = 0; i < colspan; i++) {
            colTexts[colIdx] = text;
            colIdx++;
          }
        });

        const policeRaw = colTexts[colIndex.police] || "";
        const ambulanceRaw = colTexts[colIndex.ambulance] || "";
        const fireRaw = colTexts[colIndex.fire] || "";
        const notesRaw = colTexts[colIndex.notes] || "";

        const { extracted: notesExtracted, remainder: notesRemainder } = extractFromNotesWithRemainder(notesRaw);

        const notesHasExplicitNumbers = 
          isValidNumber(notesExtracted.police) ||
          isValidNumber(notesExtracted.ambulance) ||
          isValidNumber(notesExtracted.fire);

        const entry = {};

        if (notesHasExplicitNumbers) {
          // Use notes overrides if explicitly found
          if (isValidNumber(notesExtracted.police)) entry.police = notesExtracted.police;
          if (isValidNumber(notesExtracted.ambulance)) entry.ambulance = notesExtracted.ambulance;
          if (isValidNumber(notesExtracted.fire)) entry.fire = notesExtracted.fire;
        } 
        
        // fallback to raw columns if notes didn't provide numbers
        if (!entry.police && isValidNumber(policeRaw)) entry.police = policeRaw;
        if (!entry.ambulance && isValidNumber(ambulanceRaw)) entry.ambulance = ambulanceRaw;
        if (!entry.fire && isValidNumber(fireRaw)) entry.fire = fireRaw;

        if (notesRemainder.length > 0) {
          entry.notes = notesRemainder;
        }

        // merge the identical numbers across categories
        const nums = [entry.police, entry.ambulance, entry.fire].filter(Boolean);

        if (nums.length >= 2) {
          const counts = nums.reduce((acc, val) => {
            acc[val] = (acc[val] || 0) + 1;
            return acc;
          }, {});
          const [mostCommonNumber] = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];

          if (!entry.police) entry.police = mostCommonNumber;
          if (!entry.ambulance) entry.ambulance = mostCommonNumber;
          if (!entry.fire) entry.fire = mostCommonNumber;
        } 
        else if (nums.length === 1) {
          const singleNumber = nums[0];
          if (!entry.police) entry.police = singleNumber;
          if (!entry.ambulance) entry.ambulance = singleNumber;
          if (!entry.fire) entry.fire = singleNumber;
        }

        results[country] = entry;
      });
    });

    fs.writeFileSync("emergencyContacts.json", JSON.stringify(results, null, 2));
    console.log(`✅ Saved ${Object.keys(results).length} entries to emergencyContacts.json`);
  } catch (error) {
    console.error("❌ Error scraping:", error.message);
  }
})();

// check if the number is valid
function isValidNumber(value) {
  return (
    value &&
    typeof value === "string" &&
    /\d/.test(value) &&
    !value.startsWith("[") &&
    value.length <= 50
  );
}

// extract the emergency contact if its part of the notes column instead
function extractFromNotes(notes) {
  const result = {};
  const regex = /(?:^|;\s*)\b(police|ambulance|fire)\b\s*[-–—:]?\s*([\d\s\-+\/()]+)/gi;

  let match;
  while ((match = regex.exec(notes)) !== null) {
    const type = match[1].toLowerCase();
    const number = match[2].trim();
    if (type && isValidNumber(number)) {
      result[type] = number;
    }
  }

  return result;
}

// keep the remaining contacts from the note sections 
function extractFromNotesWithRemainder(notes) {
  const result = {};
  let remainder = notes;

  const regex = /(?:^|;\s*)\b(police|ambulance|fire)\b\s*[-–—:]?\s*([\d\s\-+\/()]+)/gi;

  let match;
  while ((match = regex.exec(notes)) !== null) {
    const type = match[1].toLowerCase();
    const number = match[2].trim();
    if (type && isValidNumber(number)) {
      result[type] = number;

      // get rid of this matched substring from remainder
      const matchedStr = match[0];
      remainder = remainder.replace(matchedStr, "").trim();

      // rm trailing semicolons and whitespace
      remainder = remainder.replace(/^[;\s]+|[;\s]+$/g, "");
    }
  }

  return { extracted: result, remainder };
}
