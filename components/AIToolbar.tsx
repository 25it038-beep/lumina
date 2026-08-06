"use client";

import { useDeckStore } from "@/stores/deckStore";
import { generateDesignForTopic } from "@/app/actions/aiDesign";
import { useState } from "react";

export function AIToolbar() {
  const [loading, setLoading] = useState(false);
  const [slideCount, setSlideCount] = useState(10);
  const { deck, setDeck } = useDeckStore();

  const handleGenerateDesign = async () => {
    if (!deck?.topic) return;
    setLoading(true);
    const outline = await generateDesignForTopic(deck.topic, slideCount);
    if (outline) {
      console.log("New design:", outline);
      setLoading(false);
    } else {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 border-b flex items-center gap-4">
      <input 
        type="number" 
        value={slideCount}
        onChange={(e) => setSlideCount(Number(e.target.value))}
        className="w-16 p-2 border rounded"
        min={1}
        max={50}
      />
      <button 
        onClick={handleGenerateDesign}
        disabled={loading}
        className="px-4 py-2 bg-blue-600 text-white rounded"
      >
        {loading ? "Generating..." : "Generate AI Design"}
      </button>
    </div>
  );
}
