// Module-level store for cross-screen navigation intent.
// Cartografia calls setRecord() before switching to Records;
// Records consumes it on mount to open the detail modal.
let _pendingOccurrenceId: string | null = null;

export const nav = {
  setRecord(id: string)      { _pendingOccurrenceId = id; },
  consumeRecord(): string | null {
    const id = _pendingOccurrenceId;
    _pendingOccurrenceId = null;
    return id;
  },
};
