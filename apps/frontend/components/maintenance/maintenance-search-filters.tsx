"use client";

import React from "react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Input } from "../ui/input";

interface MaintenanceFiltersOptions {
  buildings: string[];
  categories: string[];
  priorities: string[];
  statuses: string[];
}

interface MaintenanceSearchFiltersProps {
  options: MaintenanceFiltersOptions;
  onFilterChange?: (filters: Record<string, string>) => void;
}

export const MaintenanceSearchFilters: React.FC<MaintenanceSearchFiltersProps> = ({ options, onFilterChange }) => {
  const [filters, setFilters] = React.useState<Record<string, string>>({});

  const updateFilter = (key: string, value: string) => {
    const updated = { ...filters, [key]: value };
    setFilters(updated);
    onFilterChange?.(updated);
  };

  const resetFilters = () => {
    setFilters({});
    onFilterChange?.({});
  };

  return (
    <Card className="p-4">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex flex-col space-y-1">
          <span className="text-xs font-medium text-muted-foreground">חיפוש</span>
          <Input
            placeholder="חיפוש לפי מזהה משימה או תיאור"
            value={filters.search ?? ""}
            onChange={(event) => updateFilter("search", event.target.value)}
            className="w-64"
          />
        </div>

        <div className="flex flex-col space-y-1">
          <span className="text-xs font-medium text-muted-foreground">בניין</span>
          <Select value={filters.building} onValueChange={(value) => updateFilter("building", value)}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="הכל" />
            </SelectTrigger>
            <SelectContent align="end">
              {options.buildings.map((building) => (
                <SelectItem key={building} value={building}>
                  {building}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col space-y-1">
          <span className="text-xs font-medium text-muted-foreground">קטגוריה</span>
          <Select value={filters.category} onValueChange={(value) => updateFilter("category", value)}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="הכל" />
            </SelectTrigger>
            <SelectContent align="end">
              {options.categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col space-y-1">
          <span className="text-xs font-medium text-muted-foreground">עדיפות</span>
          <Select value={filters.priority} onValueChange={(value) => updateFilter("priority", value)}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="הכל" />
            </SelectTrigger>
            <SelectContent align="end">
              {options.priorities.map((priority) => (
                <SelectItem key={priority} value={priority}>
                  {priority}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col space-y-1">
          <span className="text-xs font-medium text-muted-foreground">סטטוס</span>
          <Select value={filters.status} onValueChange={(value) => updateFilter("status", value)}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="הכל" />
            </SelectTrigger>
            <SelectContent align="end">
              {options.statuses.map((status) => (
                <SelectItem key={status} value={status}>
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button variant="outline" onClick={resetFilters} className="ms-auto">
          איפוס סינון
        </Button>
      </div>
    </Card>
  );
};
