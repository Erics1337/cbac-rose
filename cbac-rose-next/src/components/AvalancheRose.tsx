'use client';

import { useState, useEffect, useMemo } from 'react';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css'; // Import default slider styles

// Define the structure of the data expected from the API
interface AvalanchePoint {
    id: string;
    // Add other relevant fields from your API response that you might want to display
    estimated_avalanche_date: string | null;
    size: string | null;
    aspect: string | null;
    elevation: number | null;
    trigger: string;
    type: string;
    zone: string;
    interface: string;
    subject: string | null;
    url: string | null;
    left: number;
    top: number;
    opacity: number; // Add opacity field
}

// --- Filter Options (from filterData.php) ---
const ZONES = ["Northwest", "Southeast"];
const SIZES = ["D1", "D1.5", "D2", "D2.5", "D3", "D3.5", "D4", "D4.5", "D5"];
const TYPES = ["Loose", "Wet Loose", "Soft Slab", "Hard Slab", "Wet Slab", "Other"];
const INTERFACES = ["Within storm snow", "New/Old interface", "Old Snow", "Ground", "Unknown"];
const TRIGGERS = ["Natural", "Human Triggered", "Explosive", "Other", "Unknown"];
const MODIFIERS = ["Unintentional", "Controlled", "Remote", "Sympathetic", "Unknown"];
const COLOR_CATEGORIES = [
    { value: 'type', label: 'Avalanche Type' },
    { value: 'interface', label: 'Failure Interface' },
    { value: 'trigger', label: 'Trigger' },
    { value: 'zone', label: 'Forecast Zone' },
];
// ---

// Helper to format filter values for API/CSS classes - Removed as not currently used
/*
const formatFilterValue = (value: string) => {
    return value.toLowerCase().replace(/\s+/g, '-').replace(/\//g, '-').replace(/\./g, '-');
};
*/

// --- Styling Mappings ---
const sizeToClass: { [key: string]: string } = {
    'D1': 'w-2 h-2',
    'D1.5': 'w-2.5 h-2.5',
    'D2': 'w-3 h-3',
    'D2.5': 'w-3.5 h-3.5',
    'D3': 'w-4 h-4',
    'D3.5': 'w-4.5 h-4.5',
    'D4': 'w-5 h-5',
    'D4.5': 'w-5.5 h-5.5',
    'D5': 'w-6 h-6',
    'default': 'w-3 h-3' // Default size
};

// Default color if no category selected or item not found
const DEFAULT_COLOR_CLASS = 'bg-gray-400';

// Define Tailwind color classes for different categories
// Each category should have a 'default' for items not explicitly listed
const categoryColors: { [category: string]: { [item: string]: string } } = {
    type: {
        'Loose': 'bg-blue-500',
        'Wet Loose': 'bg-blue-700',
        'Soft Slab': 'bg-green-500',
        'Hard Slab': 'bg-green-700',
        'Wet Slab': 'bg-yellow-500',
        'Other': 'bg-gray-500',
        'default': DEFAULT_COLOR_CLASS // Use default for unknown types within this category
    },
    interface: {
        'Within storm snow': 'bg-purple-500',
        'New/Old interface': 'bg-purple-700',
        'Old Snow': 'bg-pink-500',
        'Ground': 'bg-pink-700',
        'Unknown': 'bg-gray-500',
        'default': DEFAULT_COLOR_CLASS // Use default for unknown interfaces
    },
    trigger: {
        'Natural': 'bg-red-500',
        'Human Triggered': 'bg-red-700',
        'Explosive': 'bg-orange-500',
        'Other': 'bg-orange-700',
        'Unknown': 'bg-gray-500',
        'default': DEFAULT_COLOR_CLASS // Use default for unknown triggers
    },
    zone: {
        'Northwest': 'bg-teal-500',
        'Southeast': 'bg-indigo-500',
        'default': DEFAULT_COLOR_CLASS // Use default for unknown zones
    }
    // No top-level default needed here anymore
};

// Helper to get the correct Tailwind class for color
const getColorClass = (category: string | null, item: string | null): string => {
    if (!category || !item) {
        return DEFAULT_COLOR_CLASS;
    }
    const categoryMap = categoryColors[category];
    if (!categoryMap) {
        return DEFAULT_COLOR_CLASS; // Category itself not found
    }
    // Return specific item color, or the category's default, or the overall default
    return categoryMap[item] || categoryMap['default'] || DEFAULT_COLOR_CLASS;
};

// Helper to get the correct Tailwind class for size
const getSizeClass = (size: string | null): string => {
    if (!size) return sizeToClass.default;
    return sizeToClass[size] || sizeToClass.default;
};
// ---

// --- Date Helpers ---
function dateToYYYYMMDD(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function getSeasonBounds(year: number): { seasonStart: Date, seasonEnd: Date } {
    const seasonStart = new Date(year, 8, 1); // Sep 1st
    const seasonEnd = new Date(year + 1, 7, 31); // Aug 31st
    return { seasonStart, seasonEnd };
}
// ---

export default function AvalancheRose() {
    const [data, setData] = useState<AvalanchePoint[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    
    // --- Filter States ---
    const [selectedYear, setSelectedYear] = useState<string>(() => {
        const currentMonth = new Date().getMonth() + 1;
        const currentYear = new Date().getFullYear();
        return (currentMonth >= 9 ? currentYear : currentYear - 1).toString();
    });
    // Date Range State
    const [selectedStartDate, setSelectedStartDate] = useState<Date | null>(null);
    const [selectedEndDate, setSelectedEndDate] = useState<Date | null>(null);
    
    const [selectedZone, setSelectedZone] = useState<string>("");
    const [selectedType, setSelectedType] = useState<string>("");
    const [selectedInterface, setSelectedInterface] = useState<string>("");
    const [selectedTrigger, setSelectedTrigger] = useState<string>("");
    const [selectedModifier, setSelectedModifier] = useState<string>("");
    const [selectedSize, setSelectedSize] = useState<string>("");
    const [colorByCategory, setColorByCategory] = useState<string | null>(null); // State for Color By

    // --- Tooltip State ---
    const [activeTooltip, setActiveTooltip] = useState<AvalanchePoint | null>(null);
    const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | null>(null);
    // ---

    // --- Derived/Memoized Values ---
    const currentSeasonYear = useMemo(() => parseInt(selectedYear, 10), [selectedYear]);
    const { seasonStart, seasonEnd } = useMemo(() => getSeasonBounds(currentSeasonYear), [currentSeasonYear]);

    const yearOptions = useMemo(() => {
        const options = [];
        const currentMonth = new Date().getMonth() + 1;
        const currentFullYear = new Date().getFullYear();
        const startYear = currentMonth >= 9 ? currentFullYear : currentFullYear - 1;
        for (let yyyy = startYear; yyyy >= startYear - 10; yyyy--) { // Go back 10 years
            options.push(
                <option key={yyyy} value={yyyy.toString()}>
                    {yyyy}-{yyyy + 1}
                </option>
            );
        }
        return options;
    }, []);
    const legendItems = useMemo(() => {
        if (!colorByCategory) return null;

        let items: string[] = [];
        switch (colorByCategory) {
            case 'type': items = TYPES; break;
            case 'interface': items = INTERFACES; break;
            case 'trigger': items = TRIGGERS; break;
            case 'zone': items = ZONES; break;
            default: return null;
        }

        return items.map(item => ({
            label: item,
            colorClass: getColorClass(colorByCategory, item)
        }));
    }, [colorByCategory]);

    // Initialize date range state when season changes
    useEffect(() => {
        const { seasonStart: currentSeasonStart, seasonEnd: currentSeasonEnd } = getSeasonBounds(parseInt(selectedYear, 10));
        const today = new Date();
        const isCurrentSelectedSeason = currentSeasonStart.getFullYear() === (today.getMonth() >= 8 ? today.getFullYear() : today.getFullYear() - 1);

        let initialStartDate: Date;
        let initialEndDate: Date;

        // Default to last 14 days if current season, otherwise full season
        if (isCurrentSelectedSeason) {
            initialEndDate = today > currentSeasonEnd ? currentSeasonEnd : today;
            initialStartDate = new Date(initialEndDate); // Clone end date
            initialStartDate.setDate(initialStartDate.getDate() - 14);
            if (initialStartDate < currentSeasonStart) {
                initialStartDate = currentSeasonStart; // Don't go before season start
            }
        } else {
            initialStartDate = currentSeasonStart;
            initialEndDate = currentSeasonEnd;
        }

        setSelectedStartDate(initialStartDate);
        setSelectedEndDate(initialEndDate);

    }, [selectedYear]); // Re-run when year changes

    // --- Data Fetching Effect ---
    useEffect(() => {
        // Only fetch if dates are set
        if (!selectedStartDate || !selectedEndDate) return;

        async function fetchData() {
            setLoading(true);
            setError(null);
            
            const params = new URLSearchParams();
            // Use selected dates instead of year
            params.append('startDate', dateToYYYYMMDD(selectedStartDate!));
            params.append('endDate', dateToYYYYMMDD(selectedEndDate!));

            // Append other filters
            if (selectedZone) params.append('zone', selectedZone);
            if (selectedType) params.append('typeFilter', selectedType);
            if (selectedInterface) params.append('interface', selectedInterface);
            if (selectedTrigger) params.append('triggerFilter', selectedTrigger);
            if (selectedModifier) params.append('modifier', selectedModifier);
            if (selectedSize) params.append('size', selectedSize);

            try {
                const apiUrl = `/api/avalanches?${params.toString()}`;
                console.log("Fetching:", apiUrl); 
                const response = await fetch(apiUrl);
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
                }
                const result: AvalanchePoint[] = await response.json();
                setData(result);
            } catch (e) {
                console.error("Failed to fetch avalanche data:", e);
                setError(e instanceof Error ? e.message : 'An unknown error occurred');
            } finally {
                setLoading(false);
            }
        }

        fetchData();
        // Re-fetch when dates or any filter changes
    }, [selectedStartDate, selectedEndDate, selectedZone, selectedType, selectedInterface, selectedTrigger, selectedModifier, selectedSize]); 
    // ---

    // --- Slider Handler ---
    const handleSliderChange = (value: number | number[]) => {
        if (Array.isArray(value) && value.length === 2) {
            setSelectedStartDate(new Date(value[0]));
            setSelectedEndDate(new Date(value[1]));
        }
    };

    const handlePointClick = (point: AvalanchePoint, event: React.MouseEvent) => {
        setActiveTooltip(point);
        // Position tooltip near the click coordinates
        setTooltipPosition({ x: event.clientX, y: event.clientY }); 
    };

    const handleCloseTooltip = () => {
        setActiveTooltip(null);
        setTooltipPosition(null);
    };

    // Effect to handle clicking outside the tooltip to close it
    useEffect(() => {
        if (!activeTooltip) return;

        const handleClickOutside = (event: MouseEvent) => {
            // Check if the click is outside the tooltip element
            // We'll add a data attribute `data-tooltip-id` to the tooltip
            const tooltipElement = document.querySelector(`[data-tooltip-id="${activeTooltip.id}"]`);
            if (tooltipElement && !tooltipElement.contains(event.target as Node)) {
                // Also check if the click was on one of the trigger points
                // Add `data-trigger-id` to the points
                 const triggerElement = document.querySelector(`[data-trigger-id="${activeTooltip.id}"]`);
                 if (!triggerElement || !triggerElement.contains(event.target as Node)) {
                    handleCloseTooltip();
                 } 
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [activeTooltip]); // Re-run when activeTooltip changes
    // ---

    // Slider marks (optional, for visual cues)
    const sliderMarks = useMemo(() => {
        const marks: { [key: number]: string } = {};
        const startMonth = seasonStart.getMonth(); // 8 for Sep
        const endMonth = seasonEnd.getMonth(); // 7 for Aug

        for (let year = seasonStart.getFullYear(); year <= seasonEnd.getFullYear(); year++) {
            // Iterate through months relevant to the season
            for (let month = (year === seasonStart.getFullYear() ? startMonth : 0); month <= (year === seasonEnd.getFullYear() ? endMonth : 11) ; month++) {
                const date = new Date(year, month, 1);
                if (date >= seasonStart && date <= seasonEnd) {
                    marks[date.getTime()] = date.toLocaleDateString('en-US', { month: 'short' });
                }
            }
        }
        // Add specific start/end marks
        marks[seasonStart.getTime()] = seasonStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        marks[seasonEnd.getTime()] = seasonEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        return marks;
    }, [seasonStart, seasonEnd]);

    return (
        <div className="w-full max-w-6xl mx-auto">
            {/* Filters Section */} 
            <div className="mb-6">
                {/* Filter Dropdowns Row */} 
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4 items-end mb-4">
                    {/* Season Select */} 
                    <div>
                        <label htmlFor="year-select" className="block text-sm font-medium mb-1">Season</label>
                        <select id="year-select" value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600">
                            {yearOptions}
                        </select>
                    </div>
                    {/* Other Filters (Zone, Type, Interface, Trigger, Modifier, Size, Color By) */} 
                    <div>
                        <label htmlFor="zone-filter" className="block text-sm font-medium mb-1">Zone</label>
                        <select id="zone-filter" value={selectedZone} onChange={(e) => setSelectedZone(e.target.value)} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600">
                            <option value="">All Zones</option>
                            {ZONES.map(zone => <option key={zone} value={zone}>{zone}</option>)}
                        </select>
                    </div>
                     <div>
                        <label htmlFor="type-filter" className="block text-sm font-medium mb-1">Type</label>
                        <select id="type-filter" value={selectedType} onChange={(e) => setSelectedType(e.target.value)} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600">
                            <option value="">All Types</option>
                            {TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                        </select>
                    </div>
                     <div>
                        <label htmlFor="interface-filter" className="block text-sm font-medium mb-1">Interface</label>
                        <select id="interface-filter" value={selectedInterface} onChange={(e) => setSelectedInterface(e.target.value)} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600">
                            <option value="">All Interfaces</option>
                            {INTERFACES.map(iface => <option key={iface} value={iface}>{iface}</option>)}
                        </select>
                    </div>
                     <div>
                        <label htmlFor="trigger-filter" className="block text-sm font-medium mb-1">Trigger</label>
                        <select id="trigger-filter" value={selectedTrigger} onChange={(e) => setSelectedTrigger(e.target.value)} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600">
                            <option value="">All Triggers</option>
                            {TRIGGERS.map(trigger => <option key={trigger} value={trigger}>{trigger}</option>)}
                        </select>
                    </div>
                     <div>
                        <label htmlFor="modifier-filter" className="block text-sm font-medium mb-1">Modifier</label>
                        <select id="modifier-filter" value={selectedModifier} onChange={(e) => setSelectedModifier(e.target.value)} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600">
                            <option value="">All Modifiers</option>
                            {MODIFIERS.map(mod => <option key={mod} value={mod}>{mod}</option>)}
                        </select>
                    </div>
                     <div>
                        <label htmlFor="size-filter" className="block text-sm font-medium mb-1">Size</label>
                        <select id="size-filter" value={selectedSize} onChange={(e) => setSelectedSize(e.target.value)} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600">
                            <option value="">All Sizes</option>
                            {SIZES.map(size => <option key={size} value={size}>{size}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="color-by-filter" className="block text-sm font-medium mb-1">Color By</label>
                        <select id="color-by-filter" value={colorByCategory ?? ''} onChange={(e) => setColorByCategory(e.target.value || null)} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600">
                            <option value="">Default Color</option>
                            {COLOR_CATEGORIES.map(cat => <option key={cat.value} value={cat.value}>{cat.label}</option>)}
                        </select>
                    </div>
                </div>
                
                {/* Date Range Slider Row */} 
                {selectedStartDate && selectedEndDate && (
                    <div className="mb-6 px-2">
                        <label className="block text-sm font-medium mb-2 text-center">
                            Date Range: {selectedStartDate.toLocaleDateString()} - {selectedEndDate.toLocaleDateString()}
                        </label>
                        <Slider
                            range
                            min={seasonStart.getTime()} // Use timestamps for min/max/value
                            max={seasonEnd.getTime()}
                            value={[selectedStartDate.getTime(), selectedEndDate.getTime()]}
                            onChange={handleSliderChange} // Use basic onChange for immediate feedback
                            // onAfterChange={handleSliderChange} // Or use onAfterChange to fetch only when drag finishes
                            marks={sliderMarks}
                            step={null} // Allow any value (effectively day by day)
                            // step={24 * 60 * 60 * 1000} // Or step by day
                            className="mx-2"
                        />
                    </div>
                )}
            </div>

            {/* Visualization and Legend Row */} 
            <div className="flex flex-col md:flex-row gap-6 items-start">
                {/* Visualization Area */} 
                <div className="relative w-[600px] h-[600px] mx-auto border border-gray-300 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-900 flex-shrink-0">
                    {/* Rose Background Image - Adjust path as needed */} 
                    <img
                        src="/img/rose-background.png" // Placeholder path - MAKE SURE THIS IMAGE EXISTS in public/img
                        alt="Avalanche Rose Background"
                        className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                    />

                    {/* Center Point for Reference */} 
                    <div className="absolute left-1/2 top-1/2 w-1 h-1 bg-red-500 rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>

                    {loading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-50 dark:bg-black dark:bg-opacity-50">
                            <p>Loading...</p>
                        </div>
                    )}
                    {error && (
                        <div className="absolute inset-0 flex items-center justify-center bg-red-100 dark:bg-red-900">
                            <p className="text-red-700 dark:text-red-300">Error: {error}</p>
                        </div>
                    )}

                    {/* Data Points */} 
                    {!loading && !error && (
                        <div className="absolute inset-0">
                            {data.map((point) => {
                                const pointSizeClass = getSizeClass(point.size);
                                const pointColorClass = getColorClass(colorByCategory, point[colorByCategory as keyof AvalanchePoint] as string | null);
                                
                                return (
                                    <div
                                        key={point.id}
                                        data-trigger-id={point.id} 
                                        className={`absolute ${pointSizeClass} ${pointColorClass} rounded-full border border-white dark:border-gray-900 cursor-pointer hover:scale-150 transition-transform hover:opacity-100`}
                                        style={{
                                            left: `calc(50% + ${point.left}px)`,
                                            top: `calc(50% + ${point.top}px)`,
                                            transform: 'translate(-50%, -50%)',
                                            opacity: point.opacity, // Apply opacity from data
                                        }}
                                        onClick={(e) => handlePointClick(point, e)}
                                    >
                                        {/* Small dot */} 
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Legend Area */} 
                <div className="flex-grow mt-6 md:mt-0">
                    {/* Color Legend */} 
                    {legendItems && (
                         <div className="mb-4 p-4 border rounded dark:border-gray-600">
                            <h3 className="font-semibold mb-2">Color Legend ({COLOR_CATEGORIES.find(c => c.value === colorByCategory)?.label})</h3>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                                {legendItems.map(item => (
                                    <div key={item.label} className="flex items-center text-sm">
                                        <span className={`inline-block w-3 h-3 ${item.colorClass} rounded-full mr-2`}></span>
                                        <span>{item.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Size Legend */} 
                    <div className="p-4 border rounded dark:border-gray-600">
                         <h3 className="font-semibold mb-2">Size Legend</h3>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                            {SIZES.map(size => (
                                <div key={size} className="flex items-center text-sm">
                                     <span className={`inline-block ${getSizeClass(size)} bg-gray-400 rounded-full mr-2 border border-gray-500`}></span>
                                     <span>{size}</span>
                                 </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Tooltip Component */} 
            {activeTooltip && tooltipPosition && (
                <div
                    data-tooltip-id={activeTooltip.id} // Add identifier for outside click handling
                    className="absolute z-10 w-64 p-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg text-sm text-gray-900 dark:text-gray-100"
                    style={{
                        // Position near cursor, adjust offset as needed
                        left: `${tooltipPosition.x + 15}px`, 
                        top: `${tooltipPosition.y + 15}px`,
                        // Ensure tooltip stays within viewport (basic example)
                        maxWidth: 'calc(100vw - 30px)', 
                        maxHeight: 'calc(100vh - 30px)',
                    }}
                >
                    <button 
                        onClick={handleCloseTooltip}
                        className="absolute top-1 right-1 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
                        aria-label="Close tooltip"
                    >
                        &times; {/* Simple close icon */} 
                    </button>
                    <p><strong>Date:</strong> {activeTooltip.estimated_avalanche_date || 'N/A'}</p>
                    <p><strong>Zone:</strong> {activeTooltip.zone || 'N/A'}</p>
                    <p><strong>Size:</strong> {activeTooltip.size || 'N/A'}</p>
                    <p><strong>Elevation:</strong> {activeTooltip.elevation ?? 'N/A'}</p>
                    <p><strong>Aspect:</strong> {activeTooltip.aspect || 'N/A'}</p>
                    <p><strong>Type:</strong> {activeTooltip.type || 'N/A'}</p>
                    <p><strong>Trigger:</strong> {activeTooltip.trigger || 'N/A'}</p>
                    {/* <p><strong>Modifier:</strong> {activeTooltip.modifier || 'N/A'}</p> */}
                    <p><strong>Interface:</strong> {activeTooltip.interface || 'N/A'}</p>
                    {activeTooltip.subject && <p className="mt-2 italic">{activeTooltip.subject}</p>}
                    {activeTooltip.url && (
                        <a 
                            href={activeTooltip.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="block mt-2 text-blue-600 dark:text-blue-400 hover:underline"
                        >
                            View Observation &rarr;
                        </a>
                    )}
                </div>
            )}
        </div>
    );
} 