const $ = (selector) => document.querySelector(selector);
let dictionary = [];
let customEntries = [];

const normalize = (value) => value.toLowerCase().trim().replace(/[^\p{L}\p{N}\s-]/gu, "");
const allEntries = () => [...dictionary, ...customEntries];

async function loadDictionary() {
  try {
    const response = await fetch("dictionary.json");
    if (!response.ok) throw new Error("Could not load dictionary.json");
    dictionary = await response.json();
  } catch (error) {
    console.error(error);
    dictionary = [];
    addMessage("I couldn't load dictionary.json. Make sure the file is in the same folder and run this site through a local web server.", "bot");
  }
  $("#entry-count").textContent = allEntries().length;
  renderDictionary();
}

function addMessage(message, who) {
  const article = document.createElement("article");
  article.className = "message " + who;
  const speaker = document.createElement("span");
  speaker.className = "speaker";
  speaker.textContent = who === "user" ? "YOU" : "DICTIONARY AI";
  const paragraph = document.createElement("p");
  paragraph.textContent = message;
  article.append(speaker, paragraph);
  $("#chat-log").append(article);
  $("#chat-log").scrollTop = $("#chat-log").scrollHeight;
}

function findEntry(word) {
  const target = normalize(word);
  return allEntries().find(entry => normalize(entry.word) === target);
}

function extractTerm(question, patterns) {
  for (const pattern of patterns) {
    const match = question.match(pattern);
    if (match) return match[1].trim().replace(/[?.!,]+$/, "");
  }
  return "";
}

function answerQuestion(rawQuestion) {
  const q = rawQuestion.trim();
  const lower = q.toLowerCase();
  let term = extractTerm(lower, [
    /^(?:what is|what are|define|meaning of|definition of)\s+(.+?)[?.!]*$/,
    /^(?:tell me about|explain)\s+(.+?)[?.!]*$/
  ]);
  if (term) {
    const entry = findEntry(term);
    return entry ? entry.word + ": " + entry.definition : "I don't have an entry for “" + term + "”. Try another word or add it in the knowledge-base section.";
  }

  term = extractTerm(lower, [/^(?:synonyms? for|words like)\s+(.+?)[?.!]*$/]);
  if (term) {
    const entry = findEntry(term);
    return entry ? "Synonyms for " + entry.word + ": " + (entry.synonyms?.join(", ") || "No synonyms are stored yet.") : "I don't have an entry for “" + term + "”.";
  }

  term = extractTerm(lower, [/^(?:related words for|related to)\s+(.+?)[?.!]*$/]);
  if (term) {
    const entry = findEntry(term);
    return entry ? "Words related to " + entry.word + ": " + (entry.related?.join(", ") || "No related terms are stored yet.") : "I don't have an entry for “" + term + "”.";
  }

  const compare = lower.match(/^(?:compare|difference between)\s+(.+?)\s+(?:and|vs\.?|versus)\s+(.+?)[?.!]*$/);
  if (compare) {
    const a = findEntry(compare[1]), b = findEntry(compare[2]);
    if (!a || !b) return "I can compare two stored entries. I couldn't find both words in the dictionary.";
    return a.word + ": " + a.definition + "\n\n" + b.word + ": " + b.definition + "\n\nThey are different dictionary concepts. Related terms: " + [...new Set([...(a.related || []), ...(b.related || [])])].join(", ") + ".";
  }

  if (/^(?:list|show) (?:all )?(?:words|entries)/.test(lower)) {
    return "Stored words: " + allEntries().map(entry => entry.word).join(", ") + ".";
  }

  const exact = findEntry(q.replace(/[?.!]+$/, ""));
  if (exact) return exact.word + ": " + exact.definition + (exact.synonyms?.length ? " Synonyms: " + exact.synonyms.join(", ") + "." : "");

  const tokens = normalize(q).split(/\s+/).filter(Boolean);
  const matches = allEntries().filter(entry => tokens.some(token => normalize(entry.word).includes(token) || normalize(entry.definition).includes(token))).slice(0, 5);
  if (matches.length) return "I found these possible matches in the stored dictionary: " + matches.map(entry => entry.word + " — " + entry.definition).join(" ");
  return "I can answer from my stored dictionary only. Try “define [word]”, “synonyms for [word]”, “related to [word]”, or “compare [word] and [word]”.";
}

$("#chat-form").addEventListener("submit", event => {
  event.preventDefault();
  const input = $("#question");
  const question = input.value.trim();
  if (!question) return;
  addMessage(question, "user");
  const answer = answerQuestion(question);
  addMessage(answer, "bot");
  $("#binary-output").textContent = encodeBinary(answer);
  input.value = "";
});
document.querySelectorAll("[data-prompt]").forEach(button => {
  button.addEventListener("click", () => {
    $("#question").value = button.dataset.prompt;
    $("#chat-form").requestSubmit();
  });
});

function encodeBinary(text) {
  return Array.from(new TextEncoder().encode(text), byte => byte.toString(2).padStart(8, "0")).join(" ");
}
function decodeBinary(binary) {
  const parts = binary.trim().split(/[\s,]+/).filter(Boolean);
  if (!parts.length || parts.some(part => !/^[01]{8}$/.test(part))) {
    throw new Error("Enter complete 8-bit bytes, separated by spaces. Example: 01001000 01101001");
  }
  return new TextDecoder("utf-8", { fatal: true }).decode(new Uint8Array(parts.map(part => parseInt(part, 2))));
}
$("#encode-btn").addEventListener("click", () => {
  $("#binary-output").textContent = encodeBinary($("#binary-input").value);
});
$("#decode-btn").addEventListener("click", () => {
  try { $("#binary-output").textContent = decodeBinary($("#binary-input").value); }
  catch (error) { $("#binary-output").textContent = error.message; }
});

function renderDictionary(filter = "") {
  const list = $("#dictionary-list");
  const query = normalize(filter);
  const entries = allEntries().filter(entry => !query || normalize(entry.word + " " + entry.definition + " " + (entry.synonyms || []).join(" ")).includes(query));
  list.replaceChildren();
  entries.forEach(entry => {
    const card = document.createElement("article");
    card.className = "entry";
    const heading = document.createElement("h3");
    heading.textContent = entry.word;
    const definition = document.createElement("p");
    definition.textContent = entry.definition;
    const small = document.createElement("small");
    small.textContent = "Synonyms: " + ((entry.synonyms || []).join(", ") || "none listed");
    card.append(heading, definition, small);
    list.append(card);
  });
  $("#search-count").textContent = entries.length + " shown";
  $("#entry-count").textContent = allEntries().length;
}
$("#dictionary-search").addEventListener("input", event => renderDictionary(event.target.value));

$("#add-form").addEventListener("submit", event => {
  event.preventDefault();
  const word = $("#new-word").value.trim();
  const definition = $("#new-definition").value.trim();
  const synonyms = $("#new-synonyms").value.split(",").map(value => value.trim()).filter(Boolean);
  if (!word || !definition) return;
  if (findEntry(word)) {
    $("#add-status").textContent = "That word is already in the dictionary.";
    return;
  }
  customEntries.push({word, definition, synonyms, related: []});
  try { localStorage.setItem("dictionary-ai-custom", JSON.stringify(customEntries)); } catch {}
  $("#add-form").reset();
  $("#add-status").textContent = "Added “" + word + "” to this browser's local dictionary.";
  renderDictionary($("#dictionary-search").value);
});

try {
  const saved = JSON.parse(localStorage.getItem("dictionary-ai-custom") || "[]");
  if (Array.isArray(saved)) customEntries = saved.filter(item => item && typeof item.word === "string" && typeof item.definition === "string");
} catch { customEntries = []; }

loadDictionary();