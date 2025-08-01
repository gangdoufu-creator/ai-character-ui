export default function DebugPanel({ positivePrompt, negativePrompt, seed, batchSize, filename }) {
  return (
    <div className="fixed bottom-4 right-4 bg-black bg-opacity-80 text-white p-4 rounded-xl max-w-sm text-xs z-50">
      <div><strong>📦 Batch:</strong> {batchSize}</div>
      <div><strong>🎲 Seed:</strong> {seed}</div>
      <div><strong>📝 File:</strong> {filename}</div>
      <div className="mt-2"><strong>➡️ Positive:</strong><br />{positivePrompt}</div>
      <div className="mt-2"><strong>⬅️ Negative:</strong><br />{negativePrompt}</div>
    </div>
  );
}