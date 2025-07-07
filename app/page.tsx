"use client";

import { useState, useCallback } from "react";
import {
  PeriodontalChart,
  type PeriodontalChartData,
} from "@/components/dental-periodontal-chart";

export default function Home() {
  const [, setChartData] = useState<PeriodontalChartData | null>(null);

  const handleChartChange = useCallback((data: PeriodontalChartData) => {
    setChartData(data);
  }, []);

  const handleSubmit = useCallback((data: PeriodontalChartData) => {
    console.log("Chart submitted:", data);
    alert("Chart submitted successfully!");
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-4">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Main Chart */}
        <PeriodontalChart
          onChange={handleChartChange}
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  );
}
