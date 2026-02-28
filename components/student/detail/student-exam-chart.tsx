'use client';

import {
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
    CartesianGrid
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";

interface StudentExamChartProps {
    data: {
        date: string;
        net: number;
        name: string;
    }[];
}

export function StudentExamChart({ data }: StudentExamChartProps) {
    if (!data || data.length < 2) {
        return null;
    }

    // Tarihe göre sırala (eskiden yeniye)
    const sortedData = [...data].sort((a, b) => {
        const dateA = a.date ? new Date(a.date).getTime() : 0;
        const dateB = b.date ? new Date(b.date).getTime() : 0;
        return dateA - dateB;
    });

    // Tarih formatla ve index ekle
    const formattedData = sortedData.map((item, index) => ({
        ...item,
        index,
        // Sınav adını kısalt (max 12 karakter)
        shortName: item.name.length > 12 ? item.name.substring(0, 12) + '…' : item.name,
        fullDate: new Date(item.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
    }));

    // Min ve Max net değerlerini bul (Y ekseni aralığı için)
    const nets = formattedData.map(d => d.net);
    const minNet = Math.floor(Math.min(...nets) - 5);
    const maxNet = Math.ceil(Math.max(...nets) + 5);

    return (
        <Card className="border-slate-200 dark:border-slate-700/50 shadow-sm mb-6">
            <CardHeader className="pb-4">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                        <TrendingUp className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                        <CardTitle className="text-base font-semibold">Net Gelişimi</CardTitle>
                        <CardDescription className="text-xs">
                            Son {formattedData.length} sınavdaki performans değişimi
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="w-full">
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={formattedData} margin={{ top: 5, right: 10, left: -20, bottom: 40 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-700" />
                            <XAxis
                                dataKey="index"
                                tickLine={false}
                                axisLine={false}
                                tick={{ fontSize: 10, fill: '#64748b' }}
                                tickMargin={8}
                                angle={-35}
                                textAnchor="end"
                                interval={0}
                                tickFormatter={(value) => formattedData[value]?.shortName || ''}
                            />
                            <YAxis
                                domain={[minNet < 0 ? 0 : minNet, maxNet]}
                                tickLine={false}
                                axisLine={false}
                                tick={{ fontSize: 12, fill: '#64748b' }}
                                tickCount={5}
                                allowDecimals={true}
                            />
                            <Tooltip
                                content={({ active, payload }) => {
                                    if (active && payload?.length) {
                                        const data = payload[0].payload;
                                        return (
                                            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 rounded-lg shadow-lg text-xs">
                                                <p className="font-semibold text-slate-900 dark:text-white mb-1">{data.name}</p>
                                                <p className="text-slate-500 mb-2">{data.fullDate}</p>
                                                <div className="flex items-center gap-2">
                                                    <span className="w-2 h-2 rounded-full bg-indigo-500" />
                                                    <span className="font-bold text-indigo-600 dark:text-indigo-400">
                                                        {Number(data.net).toFixed(2)} Net
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    }
                                    return null;
                                }}
                            />
                            <Line
                                type="monotone"
                                dataKey="net"
                                stroke="#6366f1"
                                strokeWidth={3}
                                activeDot={{ r: 6, fill: "#6366f1", stroke: "#e0e7ff", strokeWidth: 4 }}
                                dot={{ r: 4, fill: "#6366f1", strokeWidth: 0 }}
                                connectNulls
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
