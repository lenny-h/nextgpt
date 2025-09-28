"use client";

import { Button } from "@workspace/ui/components/button";
import { Calendar } from "@workspace/ui/components/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover";

import { cn } from "@workspace/ui/lib/utils";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useEffect, useState } from "react";

interface DatePickerProps {
  date?: Date;
  onSelect: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function DatePicker({
  date,
  onSelect,
  placeholder = "Pick a date",
  disabled = false,
}: DatePickerProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(date);

  // Update the component when the parent date changes
  useEffect(() => {
    setSelectedDate(date);
  }, [date]);

  // Handle date selection
  const handleDateSelect = (day: Date | undefined) => {
    if (!day) {
      setSelectedDate(undefined);
      onSelect(undefined);
      return;
    }

    // If there was previously a selected date with time, preserve the time
    if (selectedDate) {
      const newDate = new Date(day);
      newDate.setHours(
        selectedDate.getHours(),
        selectedDate.getMinutes(),
        0,
        0
      );
      setSelectedDate(newDate);
      onSelect(newDate);
    } else {
      setSelectedDate(day);
      onSelect(day);
    }
  };

  function handleTimeChange(type: "hour" | "minute", value: string) {
    const currentDate = selectedDate || new Date();
    const newDate = new Date(currentDate);

    if (type === "hour") {
      const hour = parseInt(value, 10);
      newDate.setHours(hour);
    } else if (type === "minute") {
      newDate.setMinutes(parseInt(value, 10));
    }

    setSelectedDate(newDate);
    onSelect(newDate);
  }

  const getDisplayValue = () => {
    if (!selectedDate) return placeholder;
    return format(selectedDate, "MM/dd/yyyy HH:mm");
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-[280px] justify-start text-left font-normal",
            !selectedDate && "text-muted-foreground"
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {getDisplayValue()}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="sm:flex">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleDateSelect}
            initialFocus
            disabled={(day) => {
              const today = new Date();
              const thirtyDaysFromNow = new Date(today);
              thirtyDaysFromNow.setDate(today.getDate() + 29);
              return day < today || day > thirtyDaysFromNow;
            }}
          />
          {selectedDate && (
            <div className="flex flex-col sm:flex-row sm:h-[300px] divide-y sm:divide-y-0 sm:divide-x">
              <div className="w-64 sm:w-auto overflow-x-scroll scrollbar-hidden">
                <div className="flex sm:flex-col p-2">
                  {Array.from({ length: 24 }, (_, i) => i)
                    .reverse()
                    .map((hour) => (
                      <Button
                        key={hour}
                        size="icon"
                        variant={
                          selectedDate && selectedDate.getHours() === hour
                            ? "default"
                            : "ghost"
                        }
                        className="sm:w-full shrink-0 aspect-square"
                        onClick={() =>
                          handleTimeChange("hour", hour.toString())
                        }
                      >
                        {hour}
                      </Button>
                    ))}
                </div>
              </div>
              <div className="w-64 sm:w-auto overflow-x-scroll scrollbar-hidden">
                <div className="flex sm:flex-col p-2">
                  {Array.from({ length: 12 }, (_, i) => i * 5).map((minute) => (
                    <Button
                      key={minute}
                      size="icon"
                      variant={
                        selectedDate && selectedDate.getMinutes() === minute
                          ? "default"
                          : "ghost"
                      }
                      className="sm:w-full shrink-0 aspect-square"
                      onClick={() =>
                        handleTimeChange("minute", minute.toString())
                      }
                    >
                      {minute.toString().padStart(2, "0")}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
