"use client";

import { DesktopIcon, MoonIcon, SunIcon } from "@phosphor-icons/react";
import { useTheme } from "next-themes";
import { useState } from "react";
import { RightSidebar } from "@/components/right-sidebar";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { SettingsRow, SettingsSection } from "../_components/settings-section";

type ThemeOption = {
	id: "light" | "dark" | "system";
	name: string;
	icon: typeof SunIcon;
	description: string;
};

const themeOptions: ThemeOption[] = [
	{
		id: "light",
		name: "Light",
		icon: SunIcon,
		description: "Light background with dark text",
	},
	{
		id: "dark",
		name: "Dark",
		icon: MoonIcon,
		description: "Dark background with light text",
	},
	{
		id: "system",
		name: "System",
		icon: DesktopIcon,
		description: "Follows your system preference",
	},
];

export default function AppearanceSettingsPage() {
	const { theme, setTheme } = useTheme();
	const [compactLayout, setCompactLayout] = useState(false);
	const [highContrast, setHighContrast] = useState(false);
	const [reduceMotion, setReduceMotion] = useState(false);

	return (
		<div className="h-full lg:grid lg:grid-cols-[1fr_18rem]">
			<div className="flex flex-col">
				<div className="flex-1 overflow-y-auto">
					{/* Theme Selection */}
					<SettingsSection
						description="Choose how Databuddy looks to you"
						title="Theme"
					>
						<div className="grid gap-3 sm:grid-cols-3">
							{themeOptions.map((option) => {
								const Icon = option.icon;
								const isActive = theme === option.id;
								return (
									<button
										className={cn(
											"flex flex-col items-center gap-2 rounded border p-4 text-center transition-colors",
											isActive
												? "border-primary bg-primary/5"
												: "border-border hover:bg-accent"
										)}
										key={option.id}
										onClick={() => setTheme(option.id)}
										type="button"
									>
										<div
											className={cn(
												"flex size-12 items-center justify-center rounded-full",
												isActive ? "bg-primary/10" : "bg-accent"
											)}
										>
											<Icon
												className={cn(
													"size-6",
													isActive ? "text-primary" : "text-muted-foreground"
												)}
												weight="duotone"
											/>
										</div>
										<div>
											<p className="font-medium text-sm">{option.name}</p>
											<p className="text-muted-foreground text-xs">
												{option.description}
											</p>
										</div>
									</button>
								);
							})}
						</div>
					</SettingsSection>

					{/* Display Options */}
					<SettingsSection
						description="Customize how content is displayed"
						title="Display Options"
					>
						<div className="space-y-4">
							<SettingsRow
								description="Use a denser layout with smaller elements"
								label="Compact Layout"
							>
								<Switch
									checked={compactLayout}
									onCheckedChange={setCompactLayout}
								/>
							</SettingsRow>

							<SettingsRow
								description="Increase contrast for better visibility"
								label="High Contrast Mode"
							>
								<Switch
									checked={highContrast}
									onCheckedChange={setHighContrast}
								/>
							</SettingsRow>

							<SettingsRow
								description="Minimize animations and transitions"
								label="Reduce Motion"
							>
								<Switch
									checked={reduceMotion}
									onCheckedChange={setReduceMotion}
								/>
							</SettingsRow>
						</div>
					</SettingsSection>
				</div>
			</div>

			<RightSidebar className="gap-0 p-0">
				<RightSidebar.Section border title="Current Settings">
					<div className="space-y-2.5">
						<div className="flex items-center justify-between">
							<span className="text-muted-foreground text-sm">Theme</span>
							<span className="font-medium text-sm capitalize">{theme}</span>
						</div>
						<div className="flex items-center justify-between">
							<span className="text-muted-foreground text-sm">Compact</span>
							<span className="font-medium text-sm">
								{compactLayout ? "On" : "Off"}
							</span>
						</div>
						<div className="flex items-center justify-between">
							<span className="text-muted-foreground text-sm">
								High contrast
							</span>
							<span className="font-medium text-sm">
								{highContrast ? "On" : "Off"}
							</span>
						</div>
						<div className="flex items-center justify-between">
							<span className="text-muted-foreground text-sm">
								Reduce motion
							</span>
							<span className="font-medium text-sm">
								{reduceMotion ? "On" : "Off"}
							</span>
						</div>
					</div>
				</RightSidebar.Section>

				<RightSidebar.Section border title="Keyboard Shortcuts">
					<div className="space-y-2">
						<div className="flex items-center justify-between">
							<span className="text-muted-foreground text-sm">
								Toggle theme
							</span>
							<kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-xs">
								⌘ D
							</kbd>
						</div>
						<div className="flex items-center justify-between">
							<span className="text-muted-foreground text-sm">Search</span>
							<kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-xs">
								⌘ K
							</kbd>
						</div>
					</div>
				</RightSidebar.Section>

				<RightSidebar.Section>
					<RightSidebar.Tip description="Reduce Motion helps if you're sensitive to animations or want to save battery on mobile devices." />
				</RightSidebar.Section>
			</RightSidebar>
		</div>
	);
}
