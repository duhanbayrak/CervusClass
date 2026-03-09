import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { BarChart3 } from 'lucide-react'

export interface ScoreRow {
    subject: string
    dogru: number | string
    yanlis: number | string
    bos: number | string
    net: number | string
}

interface ExamScoresTableProps {
    readonly scores: ScoreRow[]
}

export function ExamScoresTable({ scores }: ExamScoresTableProps) {
    return (
        <div className="border rounded-xl overflow-hidden bg-card">
            <div className="p-6 border-b bg-muted/50">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Ders Bazında Sonuçlar
                </h2>
            </div>
            <Table>
                <TableHeader>
                    <TableRow className="bg-muted/30">
                        <TableHead className="w-[40%] font-semibold">Ders Adı</TableHead>
                        <TableHead className="text-center font-semibold">Doğru</TableHead>
                        <TableHead className="text-center font-semibold">Yanlış</TableHead>
                        <TableHead className="text-center font-semibold">Boş</TableHead>
                        <TableHead className="text-center font-bold text-primary bg-primary/5">Net</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {scores.length > 0 ? (
                        scores.map((scoreData) => (
                            <TableRow key={scoreData.subject} className="hover:bg-muted/50">
                                <TableCell className="font-medium">
                                    <div className="flex items-center gap-3">
                                        <div className="h-3 w-3 rounded-full bg-primary/50" />
                                        <span className="text-base">{scoreData.subject}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-center">
                                    <span className="font-semibold text-green-600 text-base">{scoreData.dogru}</span>
                                </TableCell>
                                <TableCell className="text-center">
                                    <span className="font-semibold text-red-500 text-base">{scoreData.yanlis}</span>
                                </TableCell>
                                <TableCell className="text-center">
                                    <span className="font-medium text-muted-foreground text-base">{scoreData.bos}</span>
                                </TableCell>
                                <TableCell className="text-center bg-primary/5">
                                    <span className="font-bold text-primary text-lg">{scoreData.net}</span>
                                </TableCell>
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                                Detaylı skor bilgisi bulunamadı
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    )
}
