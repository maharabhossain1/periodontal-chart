"use client"

import { PeriodontalChart, type PeriodontalChartData } from "./dental-periodontal-chart"

// Example of how to use the component in read-only mode
export const ReadOnlyChartExample = () => {
  const existingPatientData: Partial<PeriodontalChartData> = {
    "11": {
      mobility: 2,
      implant: false,
      furcation: 1,
      bleedingOnProbing: true,
      plaque: true,
      gingivalMargin: [1, 2, 1, 0, 1, 2],
      probingDepth: [4, 5, 4, 3, 4, 5],
    },
    "12": {
      mobility: 1,
      implant: false,
      furcation: 0,
      bleedingOnProbing: false,
      plaque: false,
      gingivalMargin: [0, 1, 0, 0, 0, 1],
      probingDepth: [2, 3, 2, 2, 2, 3],
    },
    "16": {
      mobility: 0,
      implant: true,
      furcation: 0,
      bleedingOnProbing: false,
      plaque: false,
      gingivalMargin: [0, 0, 0, 0, 0, 0],
      probingDepth: [2, 2, 2, 2, 2, 2],
    },
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4">Patient Chart - Read Only View</h2>
      <PeriodontalChart initialValues={existingPatientData} readOnly={true} />
    </div>
  )
}

// Example of how to integrate with a form
export const ChartFormExample = () => {
  const handleDataChange = (data: PeriodontalChartData) => {
    // Update your form state or perform real-time validation
    console.log("Chart data changed:", data)
  }

  const handleSubmit = async (data: PeriodontalChartData) => {
    try {
      // Example API call to save data
      const response = await fetch("/api/periodontal-charts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          patientId: "patient-123",
          chartData: data,
          timestamp: new Date().toISOString(),
        }),
      })

      if (response.ok) {
        console.log("Chart saved successfully")
      }
    } catch (error) {
      console.error("Error saving chart:", error)
    }
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4">New Patient Chart</h2>
      <PeriodontalChart onChange={handleDataChange} onSubmit={handleSubmit} />
    </div>
  )
}
