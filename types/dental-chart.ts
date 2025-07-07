export interface ToothMeasurement {
  present: boolean
  mobility: number
  implant: boolean
  furcation: number
  bleeding_on_probing_distal: boolean
  bleeding_on_probing_mid: boolean
  bleeding_on_probing_mesial: boolean
  plaque_on_probing_distal: boolean
  plaque_on_probing_mid: boolean
  plaque_on_probing_mesial: boolean
  gingival_margin_distal: number
  gingival_margin_mid: number
  gingival_margin_mesial: number
  probing_depth_distal: number
  probing_depth_mid: number
  probing_depth_mesial: number
  notes: string
}

export interface ToothData {
  buccal: ToothMeasurement
  palatal: ToothMeasurement
}

export interface PeriodontalChartData {
  [toothNumber: string]: ToothData
}

export interface ChartSummary {
  meanProbingDepth: number
  meanAttachmentLevel: number
  plaquePercentage: number
  bleedingPercentage: number
  totalTeeth: number
  presentTeeth: number
}
