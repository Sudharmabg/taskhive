"use client"

import * as React from "react"
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"

const chartData = [
  { team: "Frontend", tasks: 25, completed: 20, pending: 5, fill: "#ffc44d" },
  { team: "Backend", tasks: 18, completed: 15, pending: 3, fill: "#60a5fa" },
  { team: "Design", tasks: 14, completed: 10, pending: 4, fill: "#a78bfa" },
  { team: "QA", tasks: 12, completed: 8, pending: 4, fill: "#f97316" },
  { team: "DevOps", tasks: 8, completed: 6, pending: 2, fill: "#22c55e" },
]

const chartConfig = {
  tasks: {
    label: "Tasks",
  },
  frontend: {
    label: "Frontend",
    color: "#ffc44d",
  },
  backend: {
    label: "Backend", 
    color: "#60a5fa",
  },
  design: {
    label: "Design",
    color: "#a78bfa",
  },
}

export function BarChartTeams() {
  return (
    <Card className="bg-gray-900 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white">Team Performance Overview</CardTitle>
        <p className="text-gray-300 text-sm">Task distribution across development teams</p>
      </CardHeader>
      <CardContent>
        <div className="h-64 w-full rounded-lg p-4">
          <BarChart
            width={400}
            height={250}
            data={chartData}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey="team" 
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#ffffff', fontSize: 12, fontWeight: 'bold' }}
            />
            <Bar 
              dataKey="tasks" 
              fill={(entry) => entry.fill}
              radius={[4, 4, 0, 0]}
            />
            <text x="50%" y="20" textAnchor="middle" fill="#ffffff" fontSize="14" fontWeight="bold">
              Total Tasks by Team
            </text>
          </BarChart>
        </div>
      </CardContent>
    </Card>
  )
}