import React from "react"
import { cn } from "../../lib/utils"

const Chart = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("w-full h-full", className)}
    {...props}
  />
))

const ChartContainer = React.forwardRef(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("w-full h-64 p-4", className)}
    {...props}
  >
    {children}
  </div>
))

const ChartTooltip = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-lg border bg-gray-800 px-3 py-1.5 text-sm text-white shadow-md",
      className
    )}
    {...props}
  />
))

const ChartLegend = React.forwardRef(({ className, items, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-wrap gap-4 text-sm", className)}
    {...props}
  >
    {items?.map((item, index) => (
      <div key={index} className="flex items-center gap-2">
        <div 
          className="h-3 w-3 rounded-sm" 
          style={{ backgroundColor: item.color }}
        />
        <span className="text-gray-300">{item.label}</span>
      </div>
    ))}
  </div>
))

export { Chart, ChartContainer, ChartTooltip, ChartLegend }