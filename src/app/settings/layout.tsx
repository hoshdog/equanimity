// src/app/settings/layout.tsx
import { SettingsSidebar } from './settings-sidebar';

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex-1 p-4 md:p-8 pt-6">
        <h2 className="text-3xl font-bold tracking-tight mb-6">Settings</h2>
        <div className="flex flex-col md:flex-row space-y-8 md:space-x-12 md:space-y-0">
            <aside className="-mx-4 md:w-1/5">
                <SettingsSidebar />
            </aside>
            <div className="flex-1 lg:max-w-4xl">{children}</div>
        </div>
    </div>
  );
}
