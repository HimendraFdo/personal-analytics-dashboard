export default function SettingsSection() {
    return (
        <div className="space-y-8">
            <section className="rounded-3xl bg-white p-6">
                <h2 className="text-2xl font-bold text-slate-900">Settings</h2>
                <p className="mt-2 max-w-2xl text-sm text-slate-600">Manage your account preferences and application settings here.</p>
            </section>

            <section className="grid gap-6 lg:grid-cols-2 md:grid-cols-1">
                <div className="rounded-3xl bg-white p-6">
                    <h3 className="text-xl font-semibold text-slate-900">Account Settings</h3>
                    <p className="mt-2 text-sm text-slate-600">Update your personal information, change your password, and manage your account settings.</p>
                </div>

                <div className="rounded-3xl bg-white p-6">
                    <h3 className="text-xl font-semibold text-slate-900">Application Settings</h3>
                    <p className="mt-2 text-sm text-slate-600">Customize your application preferences, notifications, and other settings.</p>
                </div>
            </section>
        </div>
    );
}