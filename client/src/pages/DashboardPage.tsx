import DashboardLayout from "../layouts/DashboardLayout";
import SummaryCard from "../components/dashboard/SummaryCard";

export default function DashboardPage() {
    return (
        <DashboardLayout>
            <section className="space-y-6"> 
                <div>
                    <h1 className="text-3xl font-bold mb-6">Personal Analystics Dashboard</h1>
                    <p className="mt-2 text-sm text-slate-600"> 
                        Track your personal data and view simple insights over time.
                    </p>
                </div>

                <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <SummaryCard title="Total Entries" value="128" />
                    <SummaryCard title="This Week" value="24" />
                    <SummaryCard title="Top Category" value="Study" />
                    <SummaryCard title="Average per Day" value="5.2" />
                </section>

                <section className="grid gap-6 lg:grid-cols-3">
                    <div className="rounded-2xl bg-gray-900 p-6 shadow-sm lg:col-span-2">
                        <h2 className="text-xl font-semibold">Chart Area</h2>
                        <p className="mt-2 text-sm text-slate-500">
                            Analytics chart will go here later.
                        </p>

                        <div className="mt-6 flex h-72 items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-gray-900 text-slate-400">
                            Chart Placeholder
                        </div>
                    </div>

                    <div className="rounded-2xl bg-white p-6 shadow-sm">
                        <h2 className="text-xl font-semibold">Recent Entries</h2>
                        <p className="mt-2 text-sm text-slate-500">
                            This section can later show the users latest tracked data
                        </p>

                        <div className="mt-6 space-y-3">
                            <div className="rounded-xl bg-slate-50 p-4">Study Hours - 2.5</div>
                            <div className="rounded-xl bg-slate-50 p-4">Expense - $18.00</div>
                            <div className="rounded-xl bg-slate-50 p-4">Workout - 45 min</div>
                        </div>
                    </div>
                </section>
            </section>
        </DashboardLayout>
    );
}