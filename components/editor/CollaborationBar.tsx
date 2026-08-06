"use client";

import { useState, useEffect } from "react";
import { Users, Circle } from "lucide-react";

interface Collaborator {
  id: string;
  name: string;
  avatar: string;
  color: string;
  slide: number;
  status: "editing" | "viewing";
}

const DEMO_COLLABORATORS: Collaborator[] = [
  { id: "1", name: "Alex Chen (Product Designer)", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80", color: "#6366f1", slide: 2, status: "editing" },
  { id: "2", name: "Sarah Jenkins (VP Strategy)", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80", color: "#ec4899", slide: 3, status: "viewing" },
  { id: "3", name: "Marcus Vance (Tech Lead)", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80", color: "#10b981", slide: 1, status: "editing" },
];

export function CollaborationBar() {
  const [users] = useState<Collaborator[]>(DEMO_COLLABORATORS);

  return (
    <div className="flex items-center gap-2">
      <div className="flex -space-x-2 overflow-hidden">
        {users.map((u) => (
          <div
            key={u.id}
            className="inline-block h-6 w-6 rounded-full ring-2 ring-[#0b0d12] relative overflow-hidden"
            title={`${u.name} · ${u.status} slide ${u.slide}`}
          >
            <img src={u.avatar} alt={u.name} className="h-full w-full object-cover" />
            <span
              className="absolute bottom-0 right-0 h-2 w-2 rounded-full ring-1 ring-black"
              style={{ backgroundColor: u.color }}
            />
          </div>
        ))}
      </div>
      <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-400">
        <Circle size={6} className="fill-emerald-400" /> 3 Live Collaborators
      </span>
    </div>
  );
}
