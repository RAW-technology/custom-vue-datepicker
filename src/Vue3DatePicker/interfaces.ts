export type DynamicClass = Record<string, boolean>;

export interface IDefaultSelect<T = number> {
    value: T;
    text: string;
    className?: DynamicClass;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type VueEmit = (event: any, ...args: any[]) => void;

export enum OpenPosition {
    center = 'center',
    left = 'left',
    right = 'right',
}

export type IFormat = string | ((date: Date | Date[] | ITimeValue | ITimeValue[] | IMonthValue) => string);

export type InternalModuleValue = Date | Date[] | null;

export interface IDateFilter {
    months: number[];
    years: number[];
    times: { hours: number[]; minutes: number[] };
}

export interface ICalendarDay {
    text: number;
    value: Date;
    current: boolean;
    classData?: DynamicClass;
}

export interface ICalendarDate {
    days: ICalendarDay[];
}

export interface IMonthYearHook {
    onNext(): void;
    onPrev(): void;
}

export interface IHoursMinutes {
    hours: IDefaultSelect[];
    minutes: IDefaultSelect[];
}

export interface TimeGridValues {
    value: '';
    text: '';
}

export interface TimeGridProps {
    values: TimeGridValues;
}

export interface IMaskProps {
    pattern: string;
    mask: string;
    format: string;
}

export interface ITextInputOptions {
    placeholder?: string;
    enterSubmit: boolean;
    openMenu: boolean;
    freeInput: boolean;
}

export interface IMonthValue {
    month: number | string;
    year: number | string;
}

export interface ITimeValue {
    hours: number | string;
    minutes: number | string;
}

export type ModelValue = Date | Date[] | string | string[] | ITimeValue | ITimeValue[] | IMonthValue | null;

export type UseCalendar = {
    range: boolean;
    startDate: Date | string;
    startTime: ITimeValue | ITimeValue[] | null;
    internalModelValue: InternalModuleValue;
    maxDate: Date | string;
    minDate: Date | string;
    filters: IDateFilter;
    yearRange: number[];
    disabledDates: string[] | Date[];
    autoApply: boolean;
    monthPicker: boolean;
    timePicker: boolean;
} & { [key: string]: any };

export interface UseMonthYearPick {
    months: IDefaultSelect[];
    years: IDefaultSelect[];
    filters: IDateFilter;
    year: number;
    month: number;
}
