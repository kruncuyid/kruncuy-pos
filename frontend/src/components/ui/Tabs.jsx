import { useState } from "react";

export default function Tabs({ tabs = [], defaultTab, onChange, className = "" }) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.key);

  function handleTabClick(tabKey) {
    setActiveTab(tabKey);
    if (onChange) onChange(tabKey);
  }

  const activeContent = tabs.find((tab) => tab.key === activeTab)?.content;

  return (
    <div className={`${className} min-w-0 max-w-full overflow-x-hidden`}>
      {/* Tab bar */}
      <div className="flex gap-1 overflow-x-auto border-b border-[var(--color-border)] pb-0.5 scrollbar-none">
        {tabs.map((tab) => {
          const isActive = tab.key === activeTab;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => handleTabClick(tab.key)}
              className={`relative flex shrink-0 items-center gap-2 whitespace-nowrap px-3 py-2.5 text-sm font-medium transition-colors sm:px-4 ${
                isActive
                  ? "text-[var(--color-primary)]"
                  : "text-[var(--color-muted)] hover:text-[var(--color-text)]"
              }`}
            >
              {tab.icon ? <span className="shrink-0">{tab.icon}</span> : null}
              {tab.label}
              {tab.badge ? (
                <span className="ml-1 rounded-full bg-[var(--color-surface-2)] px-2 py-0.5 text-xs font-semibold">
                  {tab.badge}
                </span>
              ) : null}
              {isActive ? (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--color-primary)] rounded-full" />
              ) : null}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="mt-4 min-w-0 max-w-full overflow-x-hidden">{activeContent}</div>
    </div>
  );
}
