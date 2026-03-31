import type { Entry } from "../../types/entry";

type AnalyticsSectionProps = {
    entries: Entry[];
}

// This component calculates and displays various analytics based on the provided entries data.
export default function AnalyticsSection({
     entries,
}: AnalyticsSectionProps) {
    const totalEntries = entries.length;

    const totalTimeSpent = entries.reduce((total, entry) => total + entry.value, 0);

    const averageValue = totalEntries > 0 ? totalTimeSpent / totalEntries : 0.0;

    const categoryTotals: Record<string, number> = {};
    const categoryCounts: Record<string, number> = {};

    // Calculate total value and count for each category
    for (const entry of entries) {
        categoryTotals[entry.category] = (categoryTotals[entry.category] || 0) + entry.value;
        categoryCounts[entry.category] = (categoryCounts[entry.category] || 0) + 1;
    }

    let mostFrequentCategory = "N/A";
    let highestCategoryValue = 0;

    // Determine the category with the highest total value
    for(const category in categoryTotals) {
        if(categoryTotals[category] > highestCategoryValue) {
            highestCategoryValue = categoryTotals[category];
            mostFrequentCategory = category;
        }
    }

    // Sort entries by date to find the latest entry
    const sortedEntries = [...entries].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    const latestEntry = sortedEntries[0] ?? null;

    return (
    <div className="space-y-6">
        {/* Analytics Overview Section */}
      <section className="rounded-3xl bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-bold text-slate-900">Analytics</h2>
        <p className="mt-2 text-sm text-slate-600">
          Review derived insights based on your tracked entries.
        </p>
      </section>

      {/* Total Entries Bubble */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-3xl bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Total Entries</p>
          <h3 className="mt-3 text-2xl font-bold text-slate-900">
            {totalEntries}
          </h3>
        </div>

        {/* Total Time Spent Bubble */}
        <div className="rounded-3xl bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Total Time Spent</p>
          <h3 className="mt-3 text-2xl font-bold text-slate-900">
            {totalTimeSpent}
          </h3>
        </div>

        {/* Average Time Spent Bubble */}
        <div className="rounded-3xl bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Average Time Spent</p>
          <h3 className="mt-3 text-2xl font-bold text-slate-900">
            {averageValue}
          </h3>
        </div>

        {/* Most Frequent Category Bubble */}
        <div className="rounded-3xl bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">
            Most Frequent Category
          </p>
          <h3 className="mt-3 text-2xl font-bold text-slate-900">
            {mostFrequentCategory}
          </h3>
        </div>
      </section>

      {/* Category Totals Section */}
      <section className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">
            Category Totals
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Total value accumulated within each category.
          </p>

          <div className="mt-5 space-y-3">
            {Object.keys(categoryTotals).length === 0 ? (
              <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">
                No analytics data yet.
              </div>
            ) : (
              Object.entries(categoryTotals).map(([category, total]) => (
                <div
                  key={category}
                  className="flex items-center justify-between rounded-2xl bg-slate-50 p-4"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {category}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {categoryCounts[category]} entries
                    </p>
                  </div>

                  <span className="text-sm font-medium text-slate-700">
                    {total}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Latest Recorded Entry Section */}
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">
            Latest Recorded Entry
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Most recent item based on entry date.
          </p>

          <div className="mt-5">
            {latestEntry ? (
              <div className="rounded-2xl bg-slate-50 p-5">
                <p className="text-lg font-semibold text-slate-900">
                  {latestEntry.title}
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  {latestEntry.category} • {new Date(latestEntry.date).toLocaleDateString()}
                </p>
                <p className="mt-3 text-sm text-slate-700">
                  Value: {latestEntry.value}
                </p>
                {latestEntry.note && (
                  <p className="mt-2 text-sm text-slate-600">
                    {latestEntry.note}
                  </p>
                )}
              </div>
            ) : (
              <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">
                No entries available yet.
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-3xl bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900">
          Chart Placeholder
        </h3>
        <p className="mt-1 text-sm text-slate-500">
          This section can later display a category bar chart or time-based trend
          chart using the same entries data.
        </p>

        <div className="mt-6 flex h-72 items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 text-slate-400">
          Analytics Chart Placeholder
        </div>
      </section>
    </div>
  );
}