import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const envPath = resolve(projectRoot, ".env.local");
const apiPathPrefix = "/cosplay";
const report = {
  apiReachable: "no",
  validRental: "NOT TESTED",
  validRentalHttp: "NOT TESTED",
  userPut: "UNKNOWN",
  adminPut: "NOT TESTED",
  rentalItemMatch: "UNKNOWN",
  rentalQuantityMatch: "UNKNOWN",
  stockBefore: "NOT READ",
  stockAfter: "NOT READ",
  databaseUnchanged: "UNKNOWN",
  item: null,
  rentalResponseShape: "NOT TESTED",
  safety: "No mutation sent yet.",
  stopReason: null,
};

let apiKey = "";
let userBearer = "";
let adminBearer = "";
let mutationCount = 0;
let allMutationsDryRun = true;
let baselineRentalCount = null;

class NetworkFailure extends Error {
  constructor(type) {
    super(type);
    this.name = "NetworkFailure";
  }
}

class SafetyInvariantFailure extends Error {
  constructor() {
    super("X-Dry-Run invariant failed; mutation was not sent.");
    this.name = "SafetyInvariantFailure";
  }
}

function parseEnvFile(source) {
  const values = new Map();

  for (const line of source.split(/\r?\n/)) {
    const match = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (!match) continue;

    let value = match[2];
    if ((value.startsWith('"') && value.endsWith('"'))
      || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    } else {
      value = value.replace(/\s+#.*$/, "").trim();
    }

    values.set(match[1], value);
  }

  return values;
}

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function getValue(record, names) {
  if (!isRecord(record)) return undefined;
  for (const name of names) {
    if (Object.hasOwn(record, name)) return record[name];
  }
  return undefined;
}

function unwrapData(body) {
  if (isRecord(body) && Object.hasOwn(body, "data")) return body.data;
  return body;
}

function findRecordWithFields(value, predicate, depth = 0) {
  if (depth > 4) return null;
  if (isRecord(value) && predicate(value)) return value;
  if (Array.isArray(value)) {
    for (const entry of value) {
      const found = findRecordWithFields(entry, predicate, depth + 1);
      if (found) return found;
    }
  } else if (isRecord(value)) {
    for (const [key, child] of Object.entries(value)) {
      if (key === "data" || key === "user" || key === "item" || key === "rental" || key === "items" || key === "rentals") {
        const found = findRecordWithFields(child, predicate, depth + 1);
        if (found) return found;
      }
    }
  }
  return null;
}

function getCollection(body, names) {
  const candidates = [body, unwrapData(body)];
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate;
    if (isRecord(candidate)) {
      for (const name of names) {
        if (Array.isArray(candidate[name])) return candidate[name];
      }
    }
  }
  return null;
}

function numeric(value) {
  if (typeof value === "number" && Number.isSafeInteger(value)) return value;
  if (typeof value === "string" && /^\d+$/.test(value.trim())) {
    const converted = Number(value);
    return Number.isSafeInteger(converted) ? converted : null;
  }
  return null;
}

function getApplicationSuccess(body) {
  if (isRecord(body) && typeof body.success === "boolean") return body.success;
  if (isRecord(body) && isRecord(body.data) && typeof body.data.success === "boolean") {
    return body.data.success;
  }
  return null;
}

function sanitizeText(value) {
  if (typeof value !== "string") return "[non-text response]";

  let safe = value;
  for (const secret of [apiKey, userBearer, adminBearer]) {
    if (secret) safe = safe.split(secret).join("[REDACTED]");
  }

  safe = safe
    .replace(/(Authorization\s*[:=]\s*)(?:Bearer\s+)?[^\s,;"']+/gi, "$1[REDACTED]")
    .replace(/Bearer\s+[^\s,;"']+/gi, "Bearer [REDACTED]")
    .replace(/((?:X-API-Key|api[_ -]?key|access[_ -]?token|refresh[_ -]?token|secret|password|cookie)\s*[:=]\s*)[^\s,;"']+/gi, "$1[REDACTED]")
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, "[REDACTED EMAIL]")
    .replace(/\b(user_?id|rental_?id)\s*[:=]\s*[^\s,;"}]+/gi, "$1=[REDACTED]")
    .replace(/\s+/g, " ")
    .trim();

  return safe.length > 220 ? `${safe.slice(0, 220)}...` : safe;
}

function safeResponseDetails(body, rawText) {
  if (Array.isArray(body)) return `Array response (${body.length} record(s)); values omitted.`;
  if (isRecord(body)) {
    const success = getApplicationSuccess(body);
    const message = getValue(body, ["message", "error"])
      ?? getValue(unwrapData(body), ["message", "error"]);
    const fields = [];
    if (typeof success === "boolean") fields.push(`success=${success}`);
    const dryRun = getValue(body, ["dry_run"]) ?? getValue(unwrapData(body), ["dry_run"]);
    if (typeof dryRun === "boolean") fields.push(`dry_run=${dryRun}`);
    if (message !== undefined) fields.push(`message=${sanitizeText(message)}`);
    return fields.length > 0 ? fields.join("; ") : "JSON response received.";
  }
  if (typeof body === "string" && body.trim()) return sanitizeText(body);
  if (rawText) return sanitizeText(rawText);
  return "Empty response body.";
}

function shapeOf(body) {
  const paths = [];
  function visit(value, prefix, depth) {
    if (!isRecord(value) || depth > 2 || paths.length >= 24) return;
    for (const [key, child] of Object.entries(value)) {
      const path = prefix ? `${prefix}.${key}` : key;
      paths.push(path);
      if (isRecord(child)) visit(child, path, depth + 1);
    }
  }
  visit(body, "", 0);
  return paths.length ? paths.join(", ") : Array.isArray(body) ? "array response" : "no object fields";
}

function responseStatus(response) {
  return response ? String(response.status) : "NO HTTP RESPONSE";
}

function printRequest(label, response) {
  console.log(`${label} | HTTP ${responseStatus(response)} | ${response ? safeResponseDetails(response.body, response.rawText) : "no response"}`);
}

async function requestApi({ baseUrl, path, method = "GET", token, body }) {
  const headers = new Headers({
    Accept: "application/json",
    "X-API-Key": apiKey,
  });
  if (token) headers.set("Authorization", `Bearer ${token.replace(/^Bearer\s+/i, "")}`);

  let wireMethod = method;
  const url = new URL(`${baseUrl.replace(/\/+$/, "")}${apiPathPrefix}${path}`);

  if (method === "PUT") {
    wireMethod = "POST";
    headers.set("X-HTTP-Method-Override", "PUT");
    url.searchParams.set("_method", "PUT");
  }

  if (method === "POST" || method === "PUT" || method === "DELETE" || method === "PATCH") {
    headers.set("X-Dry-Run", "true");
    if (headers.get("X-Dry-Run") !== "true") throw new SafetyInvariantFailure();
    mutationCount += 1;
    allMutationsDryRun &&= headers.get("X-Dry-Run") === "true";
  }

  const init = {
    method: wireMethod,
    headers,
    redirect: "manual",
    signal: AbortSignal.timeout(30000),
  };
  if (body !== undefined) {
    headers.set("Content-Type", "application/json");
    init.body = JSON.stringify(body);
  }

  let response;
  try {
    response = await fetch(url, init);
  } catch (error) {
    throw new NetworkFailure(error?.name || "NetworkError");
  }

  const rawText = await response.text().catch(() => "");
  let parsed;
  try {
    parsed = rawText ? JSON.parse(rawText) : null;
  } catch {
    parsed = rawText;
  }

  report.apiReachable = "yes";
  return { status: response.status, body: parsed, rawText };
}

function getUserId(meBody) {
  const userRecord = findRecordWithFields(
    meBody,
    (record) => numeric(getValue(record, ["id", "user_id", "userId"])) !== null,
  );
  return userRecord ? numeric(getValue(userRecord, ["id", "user_id", "userId"])) : null;
}

function getRentalUserId(rental) {
  return numeric(getValue(rental, ["user_id", "userId"]));
}

function getItemId(item) {
  return numeric(getValue(item, ["id", "item_id", "itemId"]));
}

function getItemStock(item) {
  return numeric(getValue(item, ["stock"]));
}

function findItem(body, expectedId = null) {
  return findRecordWithFields(body, (record) => {
    const id = getItemId(record);
    const stock = getItemStock(record);
    return id !== null && stock !== null && (expectedId === null || id === expectedId);
  });
}

function rentalResponseRecord(body) {
  const data = unwrapData(body);
  return findRecordWithFields(data, (record) => {
    const hasItem = getValue(record, ["item_id", "itemId"]) !== undefined
      || (isRecord(record.item) && getValue(record.item, ["id"]) !== undefined);
    return hasItem || getValue(record, ["quantity"]) !== undefined;
  });
}

function responseRentalItemId(record) {
  if (!isRecord(record)) return null;
  const direct = numeric(getValue(record, ["item_id", "itemId"]));
  if (direct !== null) return direct;
  return isRecord(record.item) ? numeric(getValue(record.item, ["id", "item_id", "itemId"])) : null;
}

function responseRentalQuantity(record) {
  return isRecord(record) ? numeric(getValue(record, ["quantity"])) : null;
}

function formatItemPayload(item, nextStock) {
  const price = getValue(item, ["price_per_day", "pricePerDay"]);
  if (typeof price !== "number" || !Number.isFinite(price) || price <= 0) {
    throw new Error("Selected item does not expose a valid price required by the item update contract.");
  }

  const status = nextStock === 0 ? "unavailable" : getValue(item, ["status"]);
  if (status !== "available" && status !== "unavailable") {
    throw new Error("Selected item does not expose a valid status.");
  }

  return {
    name: getValue(item, ["name"]),
    category: getValue(item, ["category"]),
    description: getValue(item, ["description"]) ?? "",
    size: getValue(item, ["size"]) ?? "",
    price_per_day: price,
    stock: nextStock,
    image_url: getValue(item, ["image_url", "imageUrl"]) ?? "",
    status,
  };
}

function is2xx(response) {
  return Boolean(response && response.status >= 200 && response.status < 300);
}

function readHeaderToken(value) {
  return typeof value === "string" ? value.trim() : "";
}

async function runVerification() {
  let rawEnv;
  try {
    rawEnv = await readFile(envPath, "utf8");
  } catch {
    report.stopReason = "Could not read .env.local; no credentials were printed.";
    return;
  }

  const env = parseEnvFile(rawEnv);
  const baseUrl = env.get("API_BASE_URL") ?? "";
  apiKey = readHeaderToken(env.get("COSPLAY_API_KEY") ?? env.get("API_KEY"));
  userBearer = readHeaderToken(env.get("COSPLAY_USER_BEARER_TOKEN"));
  adminBearer = readHeaderToken(env.get("COSPLAY_ADMIN_BEARER_TOKEN"));

  const missing = [];
  if (!baseUrl) missing.push("API_BASE_URL");
  if (!apiKey) missing.push("COSPLAY_API_KEY/API_KEY");
  if (!userBearer) missing.push("COSPLAY_USER_BEARER_TOKEN");
  if (missing.length) {
    report.stopReason = `Missing required environment entries: ${missing.join(", ")}.`;
    return;
  }

  let parsedBase;
  try {
    parsedBase = new URL(baseUrl);
  } catch {
    report.stopReason = "API_BASE_URL is invalid.";
    return;
  }
  if (parsedBase.protocol !== "https:") {
    report.stopReason = "Refused non-HTTPS API_BASE_URL.";
    return;
  }

  const meResponse = await requestApi({ baseUrl, path: "/me", token: userBearer });
  printRequest("GET /cosplay/me", meResponse);
  const itemsResponse = await requestApi({ baseUrl, path: "/items", token: userBearer });
  printRequest("GET /cosplay/items", itemsResponse);
  const rentalsResponse = await requestApi({ baseUrl, path: "/rentals", token: userBearer });
  printRequest("GET /cosplay/rentals", rentalsResponse);

  const meId = is2xx(meResponse) ? getUserId(meResponse.body) : null;
  const rentals = is2xx(rentalsResponse) ? getCollection(rentalsResponse.body, ["rentals", "data"]) : null;
  const matchingRental = rentals?.find((rental) => getRentalUserId(rental) === meId);
  const validUserId = matchingRental ? getRentalUserId(matchingRental) : null;

  if (validUserId === null) {
    report.stopReason = "STOP — VALID RENTAL USER_ID UNRESOLVED";
    report.validRental = "NOT TESTED — VALID RENTAL USER_ID UNRESOLVED";
    report.validRentalHttp = "NOT TESTED";
    report.rentalResponseShape = "NOT TESTED";
    report.safety = "No mutation sent; valid user_id could not be established from an existing rental.";
    return;
  }

  const items = is2xx(itemsResponse) ? getCollection(itemsResponse.body, ["items", "data"]) : null;
  const selectedFromList = items?.find((item) => getItemId(item) !== null
    && getItemStock(item) >= 2
    && getValue(item, ["status"]) === "available");

  if (!selectedFromList) {
    report.stopReason = "No item with available status and stock >= 2 was found.";
    report.validRental = "NOT TESTED — NO QUALIFYING ITEM";
    report.validRentalHttp = "NOT TESTED";
    report.safety = "No mutation sent; no qualifying item was available.";
    return;
  }

  const itemId = getItemId(selectedFromList);
  const itemBeforeResponse = await requestApi({
    baseUrl,
    path: `/items/${itemId}`,
    token: userBearer,
  });
  printRequest(`GET /cosplay/items/${itemId} (before)`, itemBeforeResponse);
  const itemBefore = is2xx(itemBeforeResponse) ? findItem(itemBeforeResponse.body, itemId) : null;
  const stockBefore = getItemStock(itemBefore);

  report.item = {
    itemId,
    stock: stockBefore ?? getItemStock(selectedFromList),
    status: getValue(itemBefore, ["status"]) ?? getValue(selectedFromList, ["status"]),
  };
  report.stockBefore = stockBefore === null ? "UNKNOWN" : String(stockBefore);
  console.log(`Selected item | item_id=${report.item.itemId} | stock=${report.item.stock} | status=${report.item.status}`);

  if (stockBefore === null || report.item.status !== "available" || stockBefore < 2) {
    report.stopReason = "Fresh item GET did not confirm available status and stock >= 2.";
    report.validRental = "NOT TESTED — FRESH ITEM CHECK FAILED";
    report.validRentalHttp = "NOT TESTED";
    report.safety = "No mutation sent; the fresh item read did not meet the dry-run precondition.";
    return;
  }

  baselineRentalCount = rentals.length;
  const start = new Date(Date.now() + 2 * 86400000);
  const end = new Date(Date.now() + 3 * 86400000);
  const dateText = (date) => date.toISOString().slice(0, 10);
  const rentalPayload = {
    user_id: validUserId,
    item_id: itemId,
    start_date: dateText(start),
    end_date: dateText(end),
    quantity: 1,
  };

  const rentalResponse = await requestApi({
    baseUrl,
    path: "/rentals",
    method: "POST",
    token: userBearer,
    body: rentalPayload,
  });
  report.validRentalHttp = String(rentalResponse.status);
  const appSuccess = getApplicationSuccess(rentalResponse.body);
  report.validRental = is2xx(rentalResponse) && appSuccess !== false ? "PASS" : "FAIL";
  report.rentalResponseShape = shapeOf(rentalResponse.body);
  printRequest("POST /cosplay/rentals (X-Dry-Run: true)", rentalResponse);
  console.log(`Rental response shape (keys only) | ${report.rentalResponseShape}`);

  if (is2xx(rentalResponse)) {
    const createdRental = rentalResponseRecord(rentalResponse.body);
    const responseItemId = responseRentalItemId(createdRental);
    const responseQuantity = responseRentalQuantity(createdRental);
    report.rentalItemMatch = responseItemId === null
      ? "UNKNOWN"
      : responseItemId === itemId ? "PASS" : "FAIL";
    report.rentalQuantityMatch = responseQuantity === null
      ? "UNKNOWN"
      : responseQuantity === rentalPayload.quantity ? "PASS" : "FAIL";
  }
  console.log(`Rental response contains matching item_id | ${report.rentalItemMatch}`);
  console.log(`Rental response contains matching quantity | ${report.rentalQuantityMatch}`);

  const putPayload = formatItemPayload(itemBefore, stockBefore - 1);
  const userPutResponse = await requestApi({
    baseUrl,
    path: `/items/${itemId}`,
    method: "PUT",
    token: userBearer,
    body: putPayload,
  });
  printRequest(`PUT /cosplay/items/${itemId} as regular user (X-Dry-Run: true)`, userPutResponse);
  report.userPut = is2xx(userPutResponse)
    ? "AUTHORIZED"
    : [401, 403].includes(userPutResponse.status) ? "FORBIDDEN" : "UNKNOWN";

  if (report.userPut === "FORBIDDEN") {
    if (adminBearer) {
      const adminPutResponse = await requestApi({
        baseUrl,
        path: `/items/${itemId}`,
        method: "PUT",
        token: adminBearer,
        body: putPayload,
      });
      printRequest(`PUT /cosplay/items/${itemId} as admin (X-Dry-Run: true)`, adminPutResponse);
      report.adminPut = is2xx(adminPutResponse)
        ? "AUTHORIZED"
        : [401, 403].includes(adminPutResponse.status) ? "FORBIDDEN" : "UNKNOWN";
    } else {
      report.adminPut = "NOT TESTED — ADMIN TOKEN NOT CONFIGURED";
    }
  }

  const itemAfterResponse = await requestApi({
    baseUrl,
    path: `/items/${itemId}`,
    token: userBearer,
  });
  printRequest(`GET /cosplay/items/${itemId} (after)`, itemAfterResponse);
  const itemAfter = is2xx(itemAfterResponse) ? findItem(itemAfterResponse.body, itemId) : null;
  const stockAfter = getItemStock(itemAfter);
  report.stockAfter = stockAfter === null ? "UNKNOWN" : String(stockAfter);

  const rentalsAfterResponse = await requestApi({ baseUrl, path: "/rentals", token: userBearer });
  printRequest("GET /cosplay/rentals (after)", rentalsAfterResponse);
  const rentalsAfter = is2xx(rentalsAfterResponse)
    ? getCollection(rentalsAfterResponse.body, ["rentals", "data"])
    : null;
  const rentalCountUnchanged = rentalsAfter !== null && baselineRentalCount === rentalsAfter.length;

  report.databaseUnchanged = stockAfter === null || rentalsAfter === null
    ? "UNKNOWN"
    : stockAfter === stockBefore && rentalCountUnchanged ? "PASS" : "FAIL";
  report.safety = allMutationsDryRun
    ? `PASS — ${mutationCount} mutation request(s), each carried X-Dry-Run: true.`
    : "FAIL — a mutation was not protected by X-Dry-Run: true.";
}

function printReport() {
  console.log("\nRuntime verification summary");
  console.log(`API reachable: ${report.apiReachable}`);
  console.log(`Valid rental: ${report.validRental}`);
  console.log(`Valid rental HTTP: ${report.validRentalHttp}`);
  console.log(`User PUT item: ${report.userPut}`);
  console.log(`Admin PUT item: ${report.adminPut}`);
  console.log(`Rental response contains matching item_id: ${report.rentalItemMatch}`);
  console.log(`Rental response contains matching quantity: ${report.rentalQuantityMatch}`);
  console.log(`Stock before: ${report.stockBefore}`);
  console.log(`Stock after: ${report.stockAfter}`);
  console.log(`Dry-run database unchanged: ${report.databaseUnchanged}`);
  console.log(`Dry-run safety: ${report.safety}`);

  const viable = report.validRental === "PASS"
    && report.userPut === "AUTHORIZED"
    && report.rentalItemMatch === "PASS"
    && report.rentalQuantityMatch === "PASS";
  if (report.userPut === "FORBIDDEN") {
    console.log("Runtime viability: BLOCKED BY API AUTHORIZATION");
  } else if (report.rentalItemMatch === "UNKNOWN" || report.rentalQuantityMatch === "UNKNOWN") {
    console.log("Runtime viability: BLOCKED BY AMBIGUOUS RENTAL RESPONSE");
  } else {
    console.log(`Runtime viability: ${viable ? "VIABLE" : "NOT VERIFIED"}`);
  }

  if (report.item) {
    console.log(`Item baseline (only id, stock, status): ${report.item.itemId}, ${report.item.stock}, ${report.item.status}`);
  }
  if (report.stopReason) console.log(`Stopped: ${report.stopReason}`);
}

try {
  await runVerification();
} catch (error) {
  if (error instanceof NetworkFailure) {
    report.stopReason = `Stopped after a network failure before an HTTP response (${error.message}).`;
    report.safety = allMutationsDryRun
      ? `PASS — ${mutationCount} mutation request(s) attempted, all with X-Dry-Run: true.`
      : "FAIL — a mutation was not protected by X-Dry-Run: true.";
  } else if (error instanceof SafetyInvariantFailure) {
    report.stopReason = "STOP — SAFETY INVARIANT DRY-RUN FAILED; no unprotected mutation was sent.";
    report.safety = "FAIL — mutation was blocked before sending.";
  } else {
    report.stopReason = `Local verification error (${error?.name || "Error"}); details withheld.`;
  }
} finally {
  printReport();
}
