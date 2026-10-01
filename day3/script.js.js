let notes = [
  { id: 1, text: "Buy milk and bread", category: "personal" },
  { id: 2, text: "Finish the Day 3 assignment", category: "study" },
  { id: 3, text: "Email the project report to Grace", category: "work" },
  { id: 4, text: "Revise JavaScript arrays", category: "study" },
  { id: 5, text: "Call mum", category: "personal" },
];

// 1. searchNotes(word)
function searchNotes(word) {
  const searchTerm = word.toLowerCase();
  return notes.filter(note => note.text.toLowerCase().includes(searchTerm));
}

// 2. longestNote()
function longestNote() {
  if (notes.length === 0) return null;
  
  let longest = notes[0];
  for (let i = 1; i < notes.length; i++) {
    if (notes[i].text.length > longest.text.length) {
      longest = notes[i];
    }
  }
  return longest;
}

// 3. countByCategory()
function countByCategory() {
  const counts = {};
  for (let note of notes) {
    counts[note.category] = (counts[note.category] || 0) + 1;
  }
  return counts;
}

// 4. getSummary()
function getSummary() {
  const counts = countByCategory();
  const categoriesText = Object.entries(counts)
    .map(([cat, count]) => `${count} ${cat}`)
    .join(", ");
  
  const noteWord = notes.length === 1 ? "note" : "notes";
  return `${notes.length} ${noteWord}: ${categoriesText}.`;
}

// 5. isDuplicate(text)
function isDuplicate(text) {
  const normalizedText = text.trim().toLowerCase();
  return notes.some(note => note.text.trim().toLowerCase() === normalizedText);
}

// 6. addNote(text, category)
function addNote(text, category) {
  const validCategories = ["personal", "work", "study"];
  
  if (typeof text !== "string" || text.length < 1 || text.length > 200) {
    console.log("Failed: Note text must be between 1 and 200 characters.");
    return false;
  }
  
  if (!validCategories.includes(category)) {
    console.log(`Failed: Invalid category '${category}'. Must be personal, work, or study.`);
    return false;
  }
  
  if (isDuplicate(text)) {
    console.log("Failed: Note is a duplicate.");
    return false;
  }
  
  const newId = notes.length > 0 ? notes[notes.length - 1].id + 1 : 1;
  notes.push({ id: newId, text: text.trim(), category: category });
  console.log("Success: Note added.");
  return true;
}

// --- TEST CASES ---

// Test searchNotes
console.log(searchNotes("study")); 
// Expected: [{ id: 2, text: "Finish the Day 3 assignment", category: "study" }, { id: 4, text: "Revise JavaScript arrays", category: "study" }]

console.log(searchNotes("nonexistent")); 
// Expected: []

// Test longestNote
console.log(longestNote()); 
// Expected: { id: 3, text: "Email the project report to Grace", category: "work" }

// Test countByCategory
console.log(countByCategory()); 
// Expected: { personal: 2, study: 2, work: 1 }

// Test getSummary
console.log(getSummary()); 
// Expected: "5 notes: personal 2, study 2, work 1." (order depends on insertion/keys)

// Test isDuplicate
console.log(isDuplicate("buy milk and bread")); 
// Expected: true

console.log(isDuplicate("Build a new website")); 
// Expected: false

// Test addNote
console.log(addNote("   Buy milk and bread   ", "personal")); 
// Expected: "Failed: Note is a duplicate." -> false

console.log(addNote("Prepare presentation slides", "work")); 
// Expected: "Success: Note added." -> true