export default function AdminDashboardPage() {
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
                <div className="flex flex-col space-y-1.5">
                    <h3 className="font-semibold leading-none tracking-tight">Total Students</h3>
                </div>
                <div className="p-0 pt-4">
                    <div className="text-2xl font-bold">1,234</div>
                    <p className="text-xs text-muted-foreground">+20.1% from last month</p>
                </div>
            </div>
            <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
                <div className="flex flex-col space-y-1.5">
                    <h3 className="font-semibold leading-none tracking-tight">Total Teachers</h3>
                </div>
                <div className="p-0 pt-4">
                    <div className="text-2xl font-bold">45</div>
                    <p className="text-xs text-muted-foreground">+2 new this week</p>
                </div>
            </div>
            <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
                <div className="flex flex-col space-y-1.5">
                    <h3 className="font-semibold leading-none tracking-tight">Active Classes</h3>
                </div>
                <div className="p-0 pt-4">
                    <div className="text-2xl font-bold">12</div>
                    <p className="text-xs text-muted-foreground">Currently in session</p>
                </div>
            </div>
        </div>
    );
}
