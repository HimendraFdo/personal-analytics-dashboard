import { useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import SummaryCard from "../components/dashboard/SummaryCard";

export default function DashboardPage() {
  const [activeItem, setActiveItem] = useState("Dashboard");

  function renderActiveSection() {
    if (activeItem === "Dashboard") {
      return (
        <div className="space-y-8">
          <section className="rounded-3xl bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Overview</p>
                <h2 className="mt-2 text-3xl font-bold text-slate-900">
                  Welcome back, Himendra
                </h2>
                <p className="mt-2 max-w-2xl text-sm text-slate-600">
                  Here is a snapshot of your recent activity, key trends, and the
                  metrics you are tracking across your personal dashboard.
                </p>
                <p className="mt-3 text-sm text-slate-500">
                  Active section:{" "}
                  <span className="font-semibold text-slate-900">{activeItem}</span>
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Period
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    This Month
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Entries
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">128</p>
                </div>

                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Focus
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">Study</p>
                </div>

                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Goal
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    On Track
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryCard title="Total Entries" value="128" />
            <SummaryCard title="This Week" value="24" />
            <SummaryCard title="Top Category" value="Study" />
            <SummaryCard title="Average per Day" value="5.2" />
          </section>

          <section className="grid gap-6 xl:grid-cols-12">
            <div className="rounded-3xl bg-white p-6 shadow-sm xl:col-span-8">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-slate-900">
                    Activity Trend
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    A larger chart area for your main analytics view.
                  </p>
                </div>

                <div className="rounded-xl bg-slate-100 px-3 py-2 text-sm text-slate-600">
                  Monthly
                </div>
              </div>

              <div className="mt-6 flex h-80 items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 text-slate-400">
                Main Chart Placeholder
              </div>
            </div>

            <div className="space-y-6 xl:col-span-4">
              <div className="rounded-3xl bg-white p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-900">Insights</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Quick highlights based on recent trends.
                </p>

                <div className="mt-5 space-y-3">
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-sm font-medium text-slate-900">
                      Your study entries increased by 12% this week.
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-sm font-medium text-slate-900">
                      Weekend spending remains higher than weekday spending.
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-sm font-medium text-slate-900">
                      You are closest to reaching your weekly consistency goal.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl bg-white p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-900">Progress</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Keep this area for goals or performance summaries.
                </p>

                <div className="mt-5 space-y-4">
                  <div>
                    <div className="mb-2 flex justify-between text-sm">
                      <span className="text-slate-600">Weekly Goal</span>
                      <span className="font-medium text-slate-900">72%</span>
                    </div>
                    <div className="h-3 rounded-full bg-slate-200">
                      <div className="h-3 w-3/4 rounded-full bg-slate-900" />
                    </div>
                  </div>

                  <div>
                    <div className="mb-2 flex justify-between text-sm">
                      <span className="text-slate-600">Monthly Goal</span>
                      <span className="font-medium text-slate-900">48%</span>
                    </div>
                    <div className="h-3 rounded-full bg-slate-200">
                      <div className="h-3 w-1/2 rounded-full bg-slate-700" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-3xl bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900">Recent Entries</h3>
              <p className="mt-1 text-sm text-slate-500">
                Your latest tracked items will appear here.
              </p>

              <div className="mt-5 space-y-3">
                <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-4">
                  <span className="text-sm font-medium text-slate-900">Study Hours</span>
                  <span className="text-sm text-slate-600">2.5 hrs</span>
                </div>

                <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-4">
                  <span className="text-sm font-medium text-slate-900">Expense</span>
                  <span className="text-sm text-slate-600">$18.00</span>
                </div>

                <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-4">
                  <span className="text-sm font-medium text-slate-900">Workout</span>
                  <span className="text-sm text-slate-600">45 min</span>
                </div>

                <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-4">
                  <span className="text-sm font-medium text-slate-900">Reading</span>
                  <span className="text-sm text-slate-600">30 min</span>
                </div>
              </div>
            </div>

            <div className="rounded-3xl bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900">
                Category Breakdown
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                A smaller secondary visualization can live here.
              </p>

              <div className="mt-6 flex h-64 items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 text-slate-400">
                Secondary Chart Placeholder
              </div>
            </div>
          </section>
        </div>
      );
    }

    if (activeItem === "Entries") {
      return (
        <div className="space-y-6">
          <section className="rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-900">Entries</h2>
            <p className="mt-2 text-sm text-slate-600">
              This section will let users add, edit, and review their tracked data.
            </p>
          </section>

          <section className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-3xl bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900">Add New Entry</h3>
              <div className="mt-6 flex h-64 items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 text-slate-400">
                Entry Form Placeholder
              </div>
            </div>

            <div className="rounded-3xl bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900">Entry History</h3>
              <div className="mt-6 space-y-3">
                <div className="rounded-2xl bg-slate-50 p-4">Study Hours — 2.5 hrs</div>
                <div className="rounded-2xl bg-slate-50 p-4">Expense — $18.00</div>
                <div className="rounded-2xl bg-slate-50 p-4">Workout — 45 min</div>
              </div>
            </div>
          </section>
        </div>
      );
    }

    if (activeItem === "Analytics") {
      return (
        <div className="space-y-6">
          <section className="rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-900">Analytics</h2>
            <p className="mt-2 text-sm text-slate-600">
              This area focuses on patterns, trends, and comparisons across tracked data.
            </p>
          </section>

          <section className="grid gap-6 xl:grid-cols-2">
            <div className="rounded-3xl bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900">Trend Analysis</h3>
              <div className="mt-6 flex h-72 items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 text-slate-400">
                Trend Chart Placeholder
              </div>
            </div>

            <div className="rounded-3xl bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900">Category Comparison</h3>
              <div className="mt-6 flex h-72 items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 text-slate-400">
                Comparison Chart Placeholder
              </div>
            </div>
          </section>
        </div>
      );
    }

    if (activeItem === "Reports") {
      return (
        <div className="space-y-6">
          <section className="rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-900">Reports</h2>
            <p className="mt-2 text-sm text-slate-600">
              This section can later generate summaries for weekly or monthly review.
            </p>
          </section>

          <section className="grid gap-6 lg:grid-cols-3">
            <div className="rounded-3xl bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900">Weekly Report</h3>
              <p className="mt-3 text-sm text-slate-500">
                Placeholder for weekly summary output.
              </p>
            </div>

            <div className="rounded-3xl bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900">Monthly Report</h3>
              <p className="mt-3 text-sm text-slate-500">
                Placeholder for monthly summary output.
              </p>
            </div>

            <div className="rounded-3xl bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900">Export</h3>
              <p className="mt-3 text-sm text-slate-500">
                Placeholder for PDF or CSV export tools.
              </p>
            </div>
          </section>
        </div>
      );
    }

    if (activeItem === "Goals") {
      return (
        <div className="space-y-6">
          <section className="rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-900">Goals</h2>
            <p className="mt-2 text-sm text-slate-600">
              Track progress toward your personal targets and habits here.
            </p>
          </section>

          <section className="rounded-3xl bg-white p-6 shadow-sm">
            <div className="mt-2 space-y-4">
              <div className="rounded-2xl bg-slate-50 p-4">Study Goal — 72% complete</div>
              <div className="rounded-2xl bg-slate-50 p-4">Workout Goal — 54% complete</div>
              <div className="rounded-2xl bg-slate-50 p-4">Savings Goal — 61% complete</div>
            </div>
          </section>
        </div>
      );
    }

    if (activeItem === "Settings") {
      return (
        <div className="space-y-6">
          <section className="rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-900">Settings</h2>
            <p className="mt-2 text-sm text-slate-600">
              Future account, preferences, categories, and dashboard customization settings.
            </p>
          </section>

          <section className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-3xl bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900">Profile</h3>
            </div>

            <div className="rounded-3xl bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900">Preferences</h3>
            </div>
          </section>
        </div>
      );
    }

    if (activeItem === "Help") {
      return (
        <div className="space-y-6">
          <section className="rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-900">Help</h2>
            <p className="mt-2 text-sm text-slate-600">
              Guidance, FAQs, and onboarding information can go here later.
            </p>
          </section>

          <section className="rounded-3xl bg-white p-6 shadow-sm">
            <div className="space-y-3">
              <div className="rounded-2xl bg-slate-50 p-4">How to add an entry</div>
              <div className="rounded-2xl bg-slate-50 p-4">How to read analytics</div>
              <div className="rounded-2xl bg-slate-50 p-4">How to set goals</div>
            </div>
          </section>
        </div>
      );
    }

    return (
      <div className="rounded-3xl bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-bold text-slate-900">{activeItem}</h2>
        <p className="mt-2 text-sm text-slate-600">
          This section does not have content yet.
        </p>
      </div>
    );
  }

  return (
    <DashboardLayout activeItem={activeItem} onSelectItem={setActiveItem}>
      {renderActiveSection()}
    </DashboardLayout>
  );
}
  
