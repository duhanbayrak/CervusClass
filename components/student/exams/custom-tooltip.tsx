'use client'

import React from 'react'

export const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-background/95 backdrop-blur-md border border-border shadow-xl rounded-xl p-4 min-w-[200px]">
                <p className="font-semibold mb-3 pb-2 border-b border-border/50 text-foreground">
                    <span className="block text-sm font-normal text-muted-foreground">
                        {payload[0].payload.fullDate}
                    </span>
                    <span className="block">
                        {payload[0].payload.name}
                    </span>
                </p>
                <div className="space-y-2">
                    {payload.map((entry: any, index: number) => (
                        <div key={index} className="flex items-center justify-between gap-4 text-sm">
                            <div className="flex items-center gap-2">
                                <span
                                    className="w-2.5 h-2.5 rounded-full shadow-sm"
                                    style={{ backgroundColor: entry.color }}
                                />
                                <span className="font-medium text-muted-foreground">
                                    {entry.name}:
                                </span>
                            </div>
                            <span className="font-bold font-mono text-foreground">
                                {typeof entry.value === 'number'
                                    ? entry.value.toFixed(2)
                                    : entry.value}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        )
    }
    return null
}
