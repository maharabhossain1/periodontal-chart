export const validateChartData = (data: any): boolean => {
  // Add validation logic here
  return true
}

export const calculateAttachmentLevel = (gingivalMargin: number, probingDepth: number): number => {
  return gingivalMargin + probingDepth
}

export const exportToCSV = (data: any): string => {
  // Convert chart data to CSV format
  const headers = [
    "Tooth",
    "Surface",
    "Mobility",
    "Implant",
    "Furcation",
    "Bleeding_Distal",
    "Bleeding_Mid",
    "Bleeding_Mesial",
    "Plaque_Distal",
    "Plaque_Mid",
    "Plaque_Mesial",
    "GM_Distal",
    "GM_Mid",
    "GM_Mesial",
    "PD_Distal",
    "PD_Mid",
    "PD_Mesial",
    "Notes",
  ]

  const rows = []
  for (const [tooth, toothData] of Object.entries(data)) {
    for (const [surface, surfaceData] of Object.entries(toothData as any)) {
      const row = [
        tooth,
        surface,
        (surfaceData as any).mobility,
        (surfaceData as any).implant,
        (surfaceData as any).furcation,
        (surfaceData as any).bleeding_on_probing_distal,
        (surfaceData as any).bleeding_on_probing_mid,
        (surfaceData as any).bleeding_on_probing_mesial,
        (surfaceData as any).plaque_on_probing_distal,
        (surfaceData as any).plaque_on_probing_mid,
        (surfaceData as any).plaque_on_probing_mesial,
        (surfaceData as any).gingival_margin_distal,
        (surfaceData as any).gingival_margin_mid,
        (surfaceData as any).gingival_margin_mesial,
        (surfaceData as any).probing_depth_distal,
        (surfaceData as any).probing_depth_mid,
        (surfaceData as any).probing_depth_mesial,
        (surfaceData as any).notes,
      ]
      rows.push(row.join(","))
    }
  }

  return [headers.join(","), ...rows].join("\n")
}
