// Validates the client-pushed demo state before it is persisted to disk.
// The state must be an object containing the core arrays the app expects;
// anything else is rejected with HTTP 400 so a bad client (or an accidental
// empty POST) cannot wipe db.json.
function validateStateBody(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { ok: false, error: 'State payload must be a JSON object.' };
  }
  if (!Array.isArray(body.users)) {
    return { ok: false, error: '"users" must be an array.' };
  }
  if (body.users.length === 0) {
    return { ok: false, error: 'Refusing to persist: "users" array is empty.' };
  }
  return { ok: true };
}

module.exports = { validateStateBody };
