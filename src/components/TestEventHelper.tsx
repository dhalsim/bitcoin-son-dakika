import { useState } from "react";
import { Link } from "react-router";

// Some known event IDs for testing (these are real Nostr events)
const TEST_EVENTS = [
  {
    id: "note1j8c0zr9pj0zr9pj0zr9pj0zr9pj0zr9pj0zr9pj0zr9pj0zr9pj0zr9p",
    description: "Example note with reactions",
    kind: 1,
  },
  {
    id: "note1j8c0zr9pj0zr9pj0zr9pj0zr9pj0zr9pj0zr9pj0zr9pj0zr9pj0zr9q",
    description: "Another test note",
    kind: 1,
  },
  {
    id: "note1j8c0zr9pj0zr9pj0zr9pj0zr9pj0zr9pj0zr9pj0zr9pj0zr9pj0zr9r",
    description: "Article with comments",
    kind: 30023,
  },
];

export function TestEventHelper() {
  const [customEventId, setCustomEventId] = useState("");

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
      <h3 className="font-medium mb-3">Test Event IDs</h3>

      <div className="space-y-2 mb-4">
        {TEST_EVENTS.map((event) => (
          <div
            key={event.id}
            className="flex items-center justify-between p-2 bg-white rounded border"
          >
            <div>
              <span className="text-sm font-mono">{event.id}</span>
              <span className="text-xs text-gray-500 ml-2">
                ({event.description})
              </span>
            </div>
            <Link
              to={`/test/${event.id}`}
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              Test →
            </Link>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium">Custom Event ID:</label>
        <div className="flex space-x-2">
          <input
            type="text"
            value={customEventId}
            onChange={(e) => setCustomEventId(e.target.value)}
            placeholder="Enter event ID..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
          />
          <Link
            to={`/test/${customEventId}`}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              customEventId
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            Test
          </Link>
        </div>
      </div>

      <div className="mt-4 text-xs text-gray-600">
        <p>
          <strong>Note:</strong> These are example event IDs. You can:
        </p>
        <ul className="list-disc list-inside mt-1 space-y-1">
          <li>Use real event IDs from Nostr relays</li>
          <li>
            Test with different event kinds (1 for notes, 30023 for articles)
          </li>
          <li>
            Check the EventStatistics component behavior with various reactions
          </li>
        </ul>
      </div>
    </div>
  );
}
