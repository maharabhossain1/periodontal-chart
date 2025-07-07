"use client"

import type React from "react"
import { useState, useCallback, useMemo, memo, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"

// Data structure matching the spreadsheet
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

export interface PeriodontalChartProps {
  initialValues?: Partial<PeriodontalChartData>
  onChange?: (data: PeriodontalChartData) => void
  onSubmit?: (data: PeriodontalChartData) => void
  readOnly?: boolean
}

// Efficient validation rules using Map for O(1) lookup
const VALIDATION_RULES = new Map([
  ["mobility", { min: 0, max: 3, required: true }],
  ["furcation", { min: 0, max: 3, required: true }],
  ["gingival_margin_distal", { min: -10, max: 10, required: true }],
  ["gingival_margin_mid", { min: -10, max: 10, required: true }],
  ["gingival_margin_mesial", { min: -10, max: 10, required: true }],
  ["probing_depth_distal", { min: 0, max: 15, required: true }],
  ["probing_depth_mid", { min: 0, max: 15, required: true }],
  ["probing_depth_mesial", { min: 0, max: 15, required: true }],
])

// Tooth configurations
const TOOTH_GROUPS = {
  upperRight: ["18", "17", "16", "15", "14", "13", "12", "11"],
  upperLeft: ["21", "22", "23", "24", "25", "26", "27", "28"],
  lowerLeft: ["31", "32", "33", "34", "35", "36", "37", "38"],
  lowerRight: ["48", "47", "46", "45", "44", "43", "42", "41"],
} as const

const ALL_TEETH = Object.values(TOOTH_GROUPS).flat()

// Navigation map for keyboard traversal
const createNavigationMap = () => {
  const navMap = new Map<string, { next: string; prev: string; up: string; down: string }>()
  const fields = [
    "mobility",
    "implant",
    "furcation",
    "bleeding_on_probing_distal",
    "bleeding_on_probing_mid",
    "bleeding_on_probing_mesial",
    "plaque_on_probing_distal",
    "plaque_on_probing_mid",
    "plaque_on_probing_mesial",
    "gingival_margin_distal",
    "gingival_margin_mid",
    "gingival_margin_mesial",
    "probing_depth_distal",
    "probing_depth_mid",
    "probing_depth_mesial",
    "notes",
  ]

  ALL_TEETH.forEach((tooth, toothIndex) => {
    ;["buccal", "palatal"].forEach((surface) => {
      fields.forEach((field, fieldIndex) => {
        const currentKey = `${tooth}-${surface}-${field}`
        const nextToothIndex = (toothIndex + 1) % ALL_TEETH.length
        const prevToothIndex = toothIndex === 0 ? ALL_TEETH.length - 1 : toothIndex - 1
        const nextFieldIndex = (fieldIndex + 1) % fields.length
        const prevFieldIndex = fieldIndex === 0 ? fields.length - 1 : fieldIndex - 1

        navMap.set(currentKey, {
          next: `${ALL_TEETH[nextToothIndex]}-${surface}-${field}`,
          prev: `${ALL_TEETH[prevToothIndex]}-${surface}-${field}`,
          up: `${tooth}-${surface}-${fields[prevFieldIndex]}`,
          down: `${tooth}-${surface}-${fields[nextFieldIndex]}`,
        })
      })
    })
  })

  return navMap
}

const NAVIGATION_MAP = createNavigationMap()

// Default measurement data
const createDefaultMeasurement = (): ToothMeasurement => ({
  present: true,
  mobility: 0,
  implant: false,
  furcation: 0,
  bleeding_on_probing_distal: false,
  bleeding_on_probing_mid: false,
  bleeding_on_probing_mesial: false,
  plaque_on_probing_distal: false,
  plaque_on_probing_mid: false,
  plaque_on_probing_mesial: false,
  gingival_margin_distal: 0,
  gingival_margin_mid: 0,
  gingival_margin_mesial: 0,
  probing_depth_distal: 0,
  probing_depth_mid: 0,
  probing_depth_mesial: 0,
  notes: "",
})

// Debounced input hook
const useDebounce = <T,>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(handler)
  }, [value, delay])

  return debouncedValue
}

// Compact optimized input components
const CompactNumberInput = memo<{
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  readOnly?: boolean
  fieldKey: string
  onKeyDown: (key: string, direction: string) => void
}>(({ value, onChange, min = 0, max = 15, readOnly = false, fieldKey, onKeyDown }) => {
  const [localValue, setLocalValue] = useState(value.toString())
  const debouncedValue = useDebounce(localValue, 150)

  useEffect(() => {
    const numValue = Number.parseInt(debouncedValue) || 0
    const clampedValue = Math.max(min, Math.min(max, numValue))
    if (clampedValue !== value) {
      onChange(clampedValue)
    }
  }, [debouncedValue, onChange, min, max, value])

  useEffect(() => {
    setLocalValue(value.toString())
  }, [value])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case "ArrowRight":
        case "Tab":
          if (!e.shiftKey) {
            e.preventDefault()
            onKeyDown(fieldKey, "next")
          }
          break
        case "ArrowLeft":
          if (e.shiftKey || e.key === "ArrowLeft") {
            e.preventDefault()
            onKeyDown(fieldKey, "prev")
          }
          break
        case "ArrowUp":
          e.preventDefault()
          onKeyDown(fieldKey, "up")
          break
        case "ArrowDown":
        case "Enter":
          e.preventDefault()
          onKeyDown(fieldKey, "down")
          break
      }
    },
    [fieldKey, onKeyDown],
  )

  return (
    <Input
      type="number"
      value={localValue}
      onChange={(e) => setLocalValue(e.target.value)}
      onKeyDown={handleKeyDown}
      min={min}
      max={max}
      readOnly={readOnly}
      className="w-8 h-6 text-xs text-center p-0 border focus:ring-1 focus:ring-blue-500"
      data-field-key={fieldKey}
    />
  )
})

const CompactCheckbox = memo<{
  checked: boolean
  onChange: (checked: boolean) => void
  readOnly?: boolean
  fieldKey: string
  onKeyDown: (key: string, direction: string) => void
}>(({ checked, onChange, readOnly = false, fieldKey, onKeyDown }) => {
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case "ArrowRight":
        case "Tab":
          if (!e.shiftKey) {
            e.preventDefault()
            onKeyDown(fieldKey, "next")
          }
          break
        case "ArrowLeft":
          if (e.shiftKey || e.key === "ArrowLeft") {
            e.preventDefault()
            onKeyDown(fieldKey, "prev")
          }
          break
        case "ArrowUp":
          e.preventDefault()
          onKeyDown(fieldKey, "up")
          break
        case "ArrowDown":
        case "Enter":
          e.preventDefault()
          onKeyDown(fieldKey, "down")
          break
        case " ":
          e.preventDefault()
          if (!readOnly) {
            onChange(!checked)
          }
          break
      }
    },
    [fieldKey, onKeyDown, checked, onChange, readOnly],
  )

  return (
    <div className="flex justify-center">
      <Checkbox
        checked={checked}
        onCheckedChange={onChange}
        disabled={readOnly}
        onKeyDown={handleKeyDown}
        className="w-3 h-3 focus:ring-1 focus:ring-blue-500"
        data-field-key={fieldKey}
      />
    </div>
  )
})

const CompactTextInput = memo<{
  value: string
  onChange: (value: string) => void
  readOnly?: boolean
  fieldKey: string
  onKeyDown: (key: string, direction: string) => void
}>(({ value, onChange, readOnly = false, fieldKey, onKeyDown }) => {
  const [localValue, setLocalValue] = useState(value)
  const debouncedValue = useDebounce(localValue, 300)

  useEffect(() => {
    if (debouncedValue !== value) {
      onChange(debouncedValue.slice(0, 100))
    }
  }, [debouncedValue, onChange, value])

  useEffect(() => {
    setLocalValue(value)
  }, [value])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case "Tab":
          if (!e.shiftKey) {
            e.preventDefault()
            onKeyDown(fieldKey, "next")
          } else {
            e.preventDefault()
            onKeyDown(fieldKey, "prev")
          }
          break
      }
    },
    [fieldKey, onKeyDown],
  )

  return (
    <Input
      type="text"
      value={localValue}
      onChange={(e) => setLocalValue(e.target.value)}
      onKeyDown={handleKeyDown}
      readOnly={readOnly}
      maxLength={100}
      className="w-full h-6 text-xs p-1 focus:ring-1 focus:ring-blue-500"
      placeholder="Notes..."
      data-field-key={fieldKey}
    />
  )
})

// Validation function using efficient algorithms
const validateToothData = (data: ToothMeasurement): Set<string> => {
  const errors = new Set<string>()

  for (const [field, rule] of VALIDATION_RULES.entries()) {
    const value = (data as any)[field]
    if (rule.required && (value === undefined || value === null)) {
      errors.add(`${field}_required`)
    }
    if (typeof value === "number" && (value < rule.min || value > rule.max)) {
      errors.add(`${field}_range`)
    }
  }

  return errors
}

// Compact tooth section component
const ToothSection = memo<{
  teeth: readonly string[]
  title: string
  surfaceType: "buccal" | "palatal"
  chartData: PeriodontalChartData
  onUpdate: (tooth: string, surface: "buccal" | "palatal", field: keyof ToothMeasurement, value: any) => void
  onKeyDown: (key: string, direction: string) => void
  readOnly: boolean
  validationErrors: Map<string, Set<string>>
}>(({ teeth, title, surfaceType, chartData, onUpdate, onKeyDown, readOnly, validationErrors }) => {
  const surfaceLabel = surfaceType === "buccal" ? "Buccal" : "Palatal/Lingual"

  return (
    <div className="mb-4">
      <div className="text-sm font-bold text-center mb-2 bg-gray-100 py-1 px-2 rounded">
        {title} - {surfaceLabel}
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-24 text-xs font-bold p-1">Measurement</TableHead>
            {teeth.map((tooth) => (
              <TableHead key={tooth} className="w-12 text-xs font-bold text-center p-1">
                <span className={validationErrors.get(`${tooth}-${surfaceType}`)?.size ? "text-red-600" : ""}>
                  {tooth}
                </span>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {/* Mobility */}
          <TableRow>
            <TableCell className="text-xs font-medium p-1">Mobility</TableCell>
            {teeth.map((tooth) => (
              <TableCell key={tooth} className="p-1 text-center">
                <CompactNumberInput
                  value={chartData[tooth]?.[surfaceType]?.mobility || 0}
                  onChange={(value) => onUpdate(tooth, surfaceType, "mobility", value)}
                  max={3}
                  readOnly={readOnly}
                  fieldKey={`${tooth}-${surfaceType}-mobility`}
                  onKeyDown={onKeyDown}
                />
              </TableCell>
            ))}
          </TableRow>

          {/* Implant */}
          <TableRow>
            <TableCell className="text-xs font-medium p-1">Implant</TableCell>
            {teeth.map((tooth) => (
              <TableCell key={tooth} className="p-1">
                <CompactCheckbox
                  checked={chartData[tooth]?.[surfaceType]?.implant || false}
                  onChange={(checked) => onUpdate(tooth, surfaceType, "implant", checked)}
                  readOnly={readOnly}
                  fieldKey={`${tooth}-${surfaceType}-implant`}
                  onKeyDown={onKeyDown}
                />
              </TableCell>
            ))}
          </TableRow>

          {/* Furcation */}
          <TableRow>
            <TableCell className="text-xs font-medium p-1">Furcation</TableCell>
            {teeth.map((tooth) => (
              <TableCell key={tooth} className="p-1 text-center">
                <CompactNumberInput
                  value={chartData[tooth]?.[surfaceType]?.furcation || 0}
                  onChange={(value) => onUpdate(tooth, surfaceType, "furcation", value)}
                  max={3}
                  readOnly={readOnly}
                  fieldKey={`${tooth}-${surfaceType}-furcation`}
                  onKeyDown={onKeyDown}
                />
              </TableCell>
            ))}
          </TableRow>

          {/* Bleeding on Probing */}
          <TableRow>
            <TableCell className="text-xs font-medium p-1">Bleeding</TableCell>
            {teeth.map((tooth) => (
              <TableCell key={tooth} className="p-1">
                <div className="grid grid-cols-3 gap-0.5">
                  <CompactCheckbox
                    checked={chartData[tooth]?.[surfaceType]?.bleeding_on_probing_distal || false}
                    onChange={(checked) => onUpdate(tooth, surfaceType, "bleeding_on_probing_distal", checked)}
                    readOnly={readOnly}
                    fieldKey={`${tooth}-${surfaceType}-bleeding_on_probing_distal`}
                    onKeyDown={onKeyDown}
                  />
                  <CompactCheckbox
                    checked={chartData[tooth]?.[surfaceType]?.bleeding_on_probing_mid || false}
                    onChange={(checked) => onUpdate(tooth, surfaceType, "bleeding_on_probing_mid", checked)}
                    readOnly={readOnly}
                    fieldKey={`${tooth}-${surfaceType}-bleeding_on_probing_mid`}
                    onKeyDown={onKeyDown}
                  />
                  <CompactCheckbox
                    checked={chartData[tooth]?.[surfaceType]?.bleeding_on_probing_mesial || false}
                    onChange={(checked) => onUpdate(tooth, surfaceType, "bleeding_on_probing_mesial", checked)}
                    readOnly={readOnly}
                    fieldKey={`${tooth}-${surfaceType}-bleeding_on_probing_mesial`}
                    onKeyDown={onKeyDown}
                  />
                </div>
              </TableCell>
            ))}
          </TableRow>

          {/* Plaque */}
          <TableRow>
            <TableCell className="text-xs font-medium p-1">Plaque</TableCell>
            {teeth.map((tooth) => (
              <TableCell key={tooth} className="p-1">
                <div className="grid grid-cols-3 gap-0.5">
                  <CompactCheckbox
                    checked={chartData[tooth]?.[surfaceType]?.plaque_on_probing_distal || false}
                    onChange={(checked) => onUpdate(tooth, surfaceType, "plaque_on_probing_distal", checked)}
                    readOnly={readOnly}
                    fieldKey={`${tooth}-${surfaceType}-plaque_on_probing_distal`}
                    onKeyDown={onKeyDown}
                  />
                  <CompactCheckbox
                    checked={chartData[tooth]?.[surfaceType]?.plaque_on_probing_mid || false}
                    onChange={(checked) => onUpdate(tooth, surfaceType, "plaque_on_probing_mid", checked)}
                    readOnly={readOnly}
                    fieldKey={`${tooth}-${surfaceType}-plaque_on_probing_mid`}
                    onKeyDown={onKeyDown}
                  />
                  <CompactCheckbox
                    checked={chartData[tooth]?.[surfaceType]?.plaque_on_probing_mesial || false}
                    onChange={(checked) => onUpdate(tooth, surfaceType, "plaque_on_probing_mesial", checked)}
                    readOnly={readOnly}
                    fieldKey={`${tooth}-${surfaceType}-plaque_on_probing_mesial`}
                    onKeyDown={onKeyDown}
                  />
                </div>
              </TableCell>
            ))}
          </TableRow>

          {/* Gingival Margin */}
          <TableRow>
            <TableCell className="text-xs font-medium p-1">Gingival Margin</TableCell>
            {teeth.map((tooth) => (
              <TableCell key={tooth} className="p-1">
                <div className="grid grid-cols-3 gap-0.5">
                  <CompactNumberInput
                    value={chartData[tooth]?.[surfaceType]?.gingival_margin_distal || 0}
                    onChange={(value) => onUpdate(tooth, surfaceType, "gingival_margin_distal", value)}
                    min={-10}
                    max={10}
                    readOnly={readOnly}
                    fieldKey={`${tooth}-${surfaceType}-gingival_margin_distal`}
                    onKeyDown={onKeyDown}
                  />
                  <CompactNumberInput
                    value={chartData[tooth]?.[surfaceType]?.gingival_margin_mid || 0}
                    onChange={(value) => onUpdate(tooth, surfaceType, "gingival_margin_mid", value)}
                    min={-10}
                    max={10}
                    readOnly={readOnly}
                    fieldKey={`${tooth}-${surfaceType}-gingival_margin_mid`}
                    onKeyDown={onKeyDown}
                  />
                  <CompactNumberInput
                    value={chartData[tooth]?.[surfaceType]?.gingival_margin_mesial || 0}
                    onChange={(value) => onUpdate(tooth, surfaceType, "gingival_margin_mesial", value)}
                    min={-10}
                    max={10}
                    readOnly={readOnly}
                    fieldKey={`${tooth}-${surfaceType}-gingival_margin_mesial`}
                    onKeyDown={onKeyDown}
                  />
                </div>
              </TableCell>
            ))}
          </TableRow>

          {/* Probing Depth */}
          <TableRow>
            <TableCell className="text-xs font-medium p-1">Probing Depth</TableCell>
            {teeth.map((tooth) => (
              <TableCell key={tooth} className="p-1">
                <div className="grid grid-cols-3 gap-0.5">
                  <CompactNumberInput
                    value={chartData[tooth]?.[surfaceType]?.probing_depth_distal || 0}
                    onChange={(value) => onUpdate(tooth, surfaceType, "probing_depth_distal", value)}
                    max={15}
                    readOnly={readOnly}
                    fieldKey={`${tooth}-${surfaceType}-probing_depth_distal`}
                    onKeyDown={onKeyDown}
                  />
                  <CompactNumberInput
                    value={chartData[tooth]?.[surfaceType]?.probing_depth_mid || 0}
                    onChange={(value) => onUpdate(tooth, surfaceType, "probing_depth_mid", value)}
                    max={15}
                    readOnly={readOnly}
                    fieldKey={`${tooth}-${surfaceType}-probing_depth_mid`}
                    onKeyDown={onKeyDown}
                  />
                  <CompactNumberInput
                    value={chartData[tooth]?.[surfaceType]?.probing_depth_mesial || 0}
                    onChange={(value) => onUpdate(tooth, surfaceType, "probing_depth_mesial", value)}
                    max={15}
                    readOnly={readOnly}
                    fieldKey={`${tooth}-${surfaceType}-probing_depth_mesial`}
                    onKeyDown={onKeyDown}
                  />
                </div>
              </TableCell>
            ))}
          </TableRow>

          {/* Notes */}
          <TableRow>
            <TableCell className="text-xs font-medium p-1">Notes</TableCell>
            {teeth.map((tooth) => (
              <TableCell key={tooth} className="p-1">
                <CompactTextInput
                  value={chartData[tooth]?.[surfaceType]?.notes || ""}
                  onChange={(value) => onUpdate(tooth, surfaceType, "notes", value)}
                  readOnly={readOnly}
                  fieldKey={`${tooth}-${surfaceType}-notes`}
                  onKeyDown={onKeyDown}
                />
              </TableCell>
            ))}
          </TableRow>
        </TableBody>
      </Table>
    </div>
  )
})

// Main optimized component
export const PeriodontalChart: React.FC<PeriodontalChartProps> = ({
  initialValues = {},
  onChange,
  onSubmit,
  readOnly = false,
}) => {
  // Initialize chart data
  const [chartData, setChartData] = useState<PeriodontalChartData>(() => {
    const data: PeriodontalChartData = {}
    ALL_TEETH.forEach((tooth) => {
      data[tooth] = {
        buccal: { ...createDefaultMeasurement(), ...initialValues[tooth]?.buccal },
        palatal: { ...createDefaultMeasurement(), ...initialValues[tooth]?.palatal },
      }
    })
    return data
  })

  // Efficient validation with memoization
  const validationErrors = useMemo(() => {
    const errors = new Map<string, Set<string>>()
    ALL_TEETH.forEach((tooth) => {
      ;(["buccal", "palatal"] as const).forEach((surface) => {
        const data = chartData[tooth]?.[surface]
        if (data) {
          const toothErrors = validateToothData(data)
          if (toothErrors.size > 0) {
            errors.set(`${tooth}-${surface}`, toothErrors)
          }
        }
      })
    })
    return errors
  }, [chartData])

  // Check if all data is valid for submission
  const isDataValid = useMemo(() => {
    return validationErrors.size === 0
  }, [validationErrors])

  // Ultra-fast update with batching
  const handleUpdate = useCallback(
    (tooth: string, surface: "buccal" | "palatal", field: keyof ToothMeasurement, value: any) => {
      setChartData((prev) => {
        const newData = { ...prev }
        if (!newData[tooth]) {
          newData[tooth] = {
            buccal: createDefaultMeasurement(),
            palatal: createDefaultMeasurement(),
          }
        }
        newData[tooth] = {
          ...newData[tooth],
          [surface]: {
            ...newData[tooth][surface],
            [field]: value,
          },
        }
        return newData
      })
    },
    [],
  )

  // Keyboard navigation with efficient focus management
  const handleKeyDown = useCallback((currentKey: string, direction: string) => {
    const navigation = NAVIGATION_MAP.get(currentKey)
    if (!navigation) return

    let targetKey: string
    switch (direction) {
      case "next":
        targetKey = navigation.next
        break
      case "prev":
        targetKey = navigation.prev
        break
      case "up":
        targetKey = navigation.up
        break
      case "down":
        targetKey = navigation.down
        break
      default:
        return
    }

    const targetElement = document.querySelector(`[data-field-key="${targetKey}"]`) as HTMLElement
    if (targetElement) {
      targetElement.focus()
    }
  }, [])

  // Optimized onChange with debouncing
  const debouncedChartData = useDebounce(chartData, 100)
  useEffect(() => {
    onChange?.(debouncedChartData)
  }, [debouncedChartData, onChange])

  // Memoized summary statistics
  const summaryStats = useMemo(() => {
    const stats = {
      depths: [] as number[],
      margins: [] as number[],
      plaqueCount: 0,
      bleedingCount: 0,
      totalSites: 0,
    }

    ALL_TEETH.forEach((tooth) => {
      ;(["buccal", "palatal"] as const).forEach((surface) => {
        const data = chartData[tooth]?.[surface]
        if (data) {
          stats.depths.push(data.probing_depth_distal, data.probing_depth_mid, data.probing_depth_mesial)
          stats.margins.push(data.gingival_margin_distal, data.gingival_margin_mid, data.gingival_margin_mesial)

          if (data.plaque_on_probing_distal || data.plaque_on_probing_mid || data.plaque_on_probing_mesial)
            stats.plaqueCount++
          if (data.bleeding_on_probing_distal || data.bleeding_on_probing_mid || data.bleeding_on_probing_mesial)
            stats.bleedingCount++
          stats.totalSites++
        }
      })
    })

    const meanDepth = stats.depths.length > 0 ? stats.depths.reduce((a, b) => a + b, 0) / stats.depths.length : 0
    const meanMargin = stats.margins.length > 0 ? stats.margins.reduce((a, b) => a + b, 0) / stats.margins.length : 0

    return {
      meanDepth: meanDepth.toFixed(1),
      meanMargin: meanMargin.toFixed(1),
      plaquePercent: stats.totalSites > 0 ? ((stats.plaqueCount / stats.totalSites) * 100).toFixed(0) : "0",
      bleedingPercent: stats.totalSites > 0 ? ((stats.bleedingCount / stats.totalSites) * 100).toFixed(0) : "0",
    }
  }, [chartData])

  // Optimized submit handler
  const handleSubmit = useCallback(() => {
    if (isDataValid) {
      onSubmit?.(chartData)
    }
  }, [chartData, isDataValid, onSubmit])

  return (
    <div className="w-full max-w-7xl mx-auto p-4 space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xl font-bold text-center">
            Periodontal Chart
            {validationErrors.size > 0 && (
              <span className="text-red-600 text-sm ml-2">({validationErrors.size} errors)</span>
            )}
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Upper Teeth - Buccal */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-2">
        <ToothSection
          teeth={TOOTH_GROUPS.upperRight}
          title="Upper Right"
          surfaceType="buccal"
          chartData={chartData}
          onUpdate={handleUpdate}
          onKeyDown={handleKeyDown}
          readOnly={readOnly}
          validationErrors={validationErrors}
        />
        <ToothSection
          teeth={TOOTH_GROUPS.upperLeft}
          title="Upper Left"
          surfaceType="buccal"
          chartData={chartData}
          onUpdate={handleUpdate}
          onKeyDown={handleKeyDown}
          readOnly={readOnly}
          validationErrors={validationErrors}
        />
      </div>

      {/* Upper Teeth - Palatal */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-2">
        <ToothSection
          teeth={TOOTH_GROUPS.upperRight}
          title="Upper Right"
          surfaceType="palatal"
          chartData={chartData}
          onUpdate={handleUpdate}
          onKeyDown={handleKeyDown}
          readOnly={readOnly}
          validationErrors={validationErrors}
        />
        <ToothSection
          teeth={TOOTH_GROUPS.upperLeft}
          title="Upper Left"
          surfaceType="palatal"
          chartData={chartData}
          onUpdate={handleUpdate}
          onKeyDown={handleKeyDown}
          readOnly={readOnly}
          validationErrors={validationErrors}
        />
      </div>

      {/* Summary Statistics */}
      <div className="bg-gray-900 text-white p-3 rounded text-center">
        <div className="grid grid-cols-4 gap-4 text-sm">
          <div>
            Mean Probing Depth: <strong>{summaryStats.meanDepth} mm</strong>
          </div>
          <div>
            Mean Attachment Level: <strong>{summaryStats.meanMargin} mm</strong>
          </div>
          <div>
            Plaque: <strong>{summaryStats.plaquePercent}%</strong>
          </div>
          <div>
            Bleeding: <strong>{summaryStats.bleedingPercent}%</strong>
          </div>
        </div>
      </div>

      {/* Lower Teeth - Lingual */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-2">
        <ToothSection
          teeth={TOOTH_GROUPS.lowerLeft}
          title="Lower Left"
          surfaceType="palatal"
          chartData={chartData}
          onUpdate={handleUpdate}
          onKeyDown={handleKeyDown}
          readOnly={readOnly}
          validationErrors={validationErrors}
        />
        <ToothSection
          teeth={TOOTH_GROUPS.lowerRight}
          title="Lower Right"
          surfaceType="palatal"
          chartData={chartData}
          onUpdate={handleUpdate}
          onKeyDown={handleKeyDown}
          readOnly={readOnly}
          validationErrors={validationErrors}
        />
      </div>

      {/* Lower Teeth - Buccal */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-2">
        <ToothSection
          teeth={TOOTH_GROUPS.lowerLeft}
          title="Lower Left"
          surfaceType="buccal"
          chartData={chartData}
          onUpdate={handleUpdate}
          onKeyDown={handleKeyDown}
          readOnly={readOnly}
          validationErrors={validationErrors}
        />
        <ToothSection
          teeth={TOOTH_GROUPS.lowerRight}
          title="Lower Right"
          surfaceType="buccal"
          chartData={chartData}
          onUpdate={handleUpdate}
          onKeyDown={handleKeyDown}
          readOnly={readOnly}
          validationErrors={validationErrors}
        />
      </div>

      {/* Submit Section */}
      {!readOnly && onSubmit && (
        <div className="text-center pt-4">
          <div className="mb-2 text-sm">
            {isDataValid ? (
              <span className="text-green-600 font-medium">✅ All data validated</span>
            ) : (
              <span className="text-red-600 font-medium">❌ Fix {validationErrors.size} errors first</span>
            )}
          </div>
          <Button onClick={handleSubmit} disabled={!isDataValid} size="lg" className="px-8">
            Submit Periodontal Chart
          </Button>
        </div>
      )}
    </div>
  )
}

export default PeriodontalChart
