import { computed, onMounted, Ref, ref, UnwrapRef, watch } from 'vue';
import { CalendarProps, ICalendarDay, InternalModuleValue, VueEmit } from '../../interfaces';
import {
    getDateHours,
    getDateMinutes,
    getDateMonth,
    getDateYear,
    getWeekNumber,
    isDateAfter,
    isDateBefore,
    isDateEqual,
    setDateMonthOrYear,
    setDateTime,
} from '../date-utils';
import { isModelValueRange, isNumberArray, isRange, isTimeArr } from '../type-guard';

interface IUseCalendar {
    isDisabled: (date: Date) => boolean;
    isActiveDate: (day: ICalendarDay) => boolean;
    rangeActive: (day: ICalendarDay) => boolean;
    selectDate: (day: UnwrapRef<ICalendarDay>) => void;
    getWeekDay: (days: UnwrapRef<ICalendarDay[]>) => string | number;
    setHoverDate: (day: UnwrapRef<ICalendarDay>) => void;
    updateTime: (value: number | number[], isHours?: boolean) => void;
    updateMonthYear: (value: number, isMonth?: boolean) => void;
    today: Ref<Date>;
    month: Ref<number>;
    year: Ref<number>;
    hours: Ref<number | number[]>;
    minutes: Ref<number | number[]>;
}

export const useCalendar = (props: CalendarProps, emit: VueEmit): IUseCalendar => {
    const today = ref<Date>(new Date());
    const hoveredDate = ref<Date>();
    const month = ref<number>(getDateMonth(new Date()));
    const year = ref<number>(getDateYear(new Date()));
    const hours = ref<number | number[]>(props.range ? [getDateHours(), getDateHours()] : getDateHours());
    const minutes = ref<number | number[]>(props.range ? [getDateMinutes(), getDateMinutes()] : getDateMinutes());

    onMounted(() => {
        mapInternalModuleValues();

        if (!modelValue.value) {
            if (props.startDate) {
                month.value = getDateMonth(new Date(props.startDate));
                year.value = getDateYear(new Date(props.startDate));
            }
            if (props.startTime) {
                assignStartTime();
            }
        }
    });

    /**
     * If start time is provided, assign data.
     * Note: data is sanitized from the parent component with all parameters since props
     * can be provided partially
     */
    const assignStartTime = (): void => {
        if (isTimeArr(props.startTime)) {
            hours.value = [+props.startTime[0].hours, +props.startTime[1].hours];
            minutes.value = [+props.startTime[0].minutes, +props.startTime[1].minutes];
        } else {
            hours.value = +props.startTime.hours;
            minutes.value = +props.startTime.minutes;
        }
    };

    /**
     * Model binding, removes the need for watches, sync data between components
     */
    const modelValue = computed({
        get: (): InternalModuleValue => {
            return props.internalModelValue;
        },
        set: (value: InternalModuleValue): void => {
            emit('update:internalModelValue', value);
        },
    });

    watch(modelValue, () => mapInternalModuleValues());

    /**
     * Check if date is between max and min date, or if it is included in filters
     */
    const isDisabled = (date: Date): boolean => {
        const aboveMax = props.maxDate ? isDateAfter(date, props.maxDate) : false;
        const bellowMin = props.minDate ? isDateBefore(date, props.minDate) : false;
        const inDisableArr = props.disabledDates.some((disabledDate: Date | string) => isDateEqual(disabledDate, date));
        const disabledMonths = props.filters.months.length ? props.filters.months.map((month) => +month) : [];
        const inDisabledMonths = disabledMonths.includes(getDateMonth(date));

        const dateYear = getDateYear(date);

        const outOfYearRange = dateYear < +props.yearRange[0] || dateYear > +props.yearRange[1];

        return aboveMax || bellowMin || inDisableArr || inDisabledMonths || outOfYearRange;
    };

    /**
     * Check if some date is active, in case of range, it will have two dates
     */
    const isActiveDate = (calendarDay: ICalendarDay): boolean => {
        if (!modelValue.value) return false;
        if (!props.range) {
            return isDateEqual(calendarDay.value, modelValue.value ? (modelValue.value as Date) : today.value);
        }
        return (
            isDateEqual(
                calendarDay.value,
                isModelValueRange(modelValue.value) && modelValue.value[0] ? modelValue.value[0] : null,
            ) ||
            isDateEqual(
                calendarDay.value,
                isModelValueRange(modelValue.value) && modelValue.value[1] ? modelValue.value[1] : null,
            )
        );
    };

    /**
     * If range mode used, this will check if the calendar day is between 2 active dates
     */
    const rangeActive = (calendarDay: ICalendarDay): boolean => {
        if (isModelValueRange(modelValue.value) && modelValue.value[0] && modelValue.value[1]) {
            return (
                isDateAfter(calendarDay.value, modelValue.value[0]) &&
                isDateBefore(calendarDay.value, modelValue.value[1])
            );
        }
        if (isModelValueRange(modelValue.value) && modelValue.value[0] && hoveredDate.value) {
            return (
                (isDateAfter(calendarDay.value, modelValue.value[0]) &&
                    isDateBefore(calendarDay.value, hoveredDate.value)) ||
                (isDateBefore(calendarDay.value, modelValue.value[0]) &&
                    isDateAfter(calendarDay.value, hoveredDate.value))
            );
        }
        return false;
    };

    /**
     * Extracted method to map month and year
     */
    const assignMonthAndYear = (date: Date): void => {
        month.value = getDateMonth(date);
        year.value = getDateYear(date);
    };

    /**
     * Values for times, month and year are managed separately, here we map those values from passed v-model
     */
    const mapInternalModuleValues = (): void => {
        if (modelValue.value) {
            if (isModelValueRange(modelValue.value)) {
                if (modelValue.value.length === 2) {
                    assignMonthAndYear(modelValue.value[0]);
                    hours.value = [getDateHours(modelValue.value[0]), getDateHours(modelValue.value[1])];
                    minutes.value = [getDateMinutes(modelValue.value[0]), getDateMinutes(modelValue.value[1])];
                }
            } else {
                assignMonthAndYear(modelValue.value);
                hours.value = getDateHours(modelValue.value);
                minutes.value = getDateMinutes(modelValue.value);
            }
        }
    };

    /**
     * Called when the date in the calendar is clicked
     * Do a necessary formatting and assign value to internal
     */
    const selectDate = (day: UnwrapRef<ICalendarDay>): void => {
        if (isDisabled(day.value)) {
            return;
        }
        if (!props.range && !isNumberArray(hours.value) && !isNumberArray(minutes.value)) {
            modelValue.value = setDateTime(new Date(day.value), hours.value, minutes.value);
            if (props.autoApply) {
                emit('autoApply');
            }
        } else if (isNumberArray(hours.value) && isNumberArray(minutes.value)) {
            let rangeDate = modelValue.value ? (modelValue.value as Date[]).slice() : [];
            if (rangeDate.length === 2) {
                rangeDate = [];
            }
            if (!rangeDate[0]) {
                rangeDate[0] = new Date(day.value);
            } else {
                if (isDateBefore(new Date(day.value), new Date(rangeDate[0]))) {
                    rangeDate.unshift(new Date(day.value));
                } else {
                    rangeDate[1] = new Date(day.value);
                }
            }
            if (rangeDate[0] && !rangeDate[1]) {
                rangeDate[0] = setDateTime(rangeDate[0], hours.value[0], minutes.value[0]);
            } else {
                rangeDate[0] = setDateTime(rangeDate[0], hours.value[0], minutes.value[0]);
                rangeDate[1] = setDateTime(rangeDate[1], hours.value[1], minutes.value[1]);
            }
            modelValue.value = rangeDate;
            if (rangeDate[0] && rangeDate[1] && props.autoApply) {
                emit('autoApply');
            }
        }
    };

    /**
     * Get week number if enabled
     */
    const getWeekDay = (days: UnwrapRef<ICalendarDay[]>): string | number => {
        const firstCurrentData = days.find((day) => day.current);
        if (firstCurrentData) {
            return getWeekNumber(firstCurrentData.value);
        }
        return '';
    };

    /**
     * When using range picker keep track of hovered value in the calendar
     */
    const setHoverDate = (day: UnwrapRef<ICalendarDay>): void => {
        hoveredDate.value = day.value;
    };

    const updateMonthYear = (value: number, isMonth = true): void => {
        if (isMonth) {
            month.value = value;
        } else {
            year.value = value;
        }
        if (props.monthPicker) {
            if (modelValue.value) {
                modelValue.value = setDateMonthOrYear(modelValue.value as Date, month.value, year.value);
            } else {
                modelValue.value = setDateMonthOrYear(new Date(), month.value, year.value);
            }
        }
    };

    /**
     * Same logic done twice with the time update, however some checks before applying are done
     */
    const handleTimeUpdate = (dateValue: Date | Date[]): void => {
        if (isRange(dateValue) && isNumberArray(hours.value) && isNumberArray(minutes.value)) {
            modelValue.value = [
                setDateTime(dateValue[0], hours.value[0], minutes.value[0]),
                setDateTime(dateValue[1], hours.value[1], minutes.value[1]),
            ];
        } else if (!props.range && !isRange(dateValue)) {
            modelValue.value = setDateTime(dateValue as Date, hours.value as number, minutes.value as number);
        }
    };

    /**
     * Called on event when time value is changed
     */
    const updateTime = (value: number | number[], isHours = true) => {
        if (isHours) {
            hours.value = value;
        } else {
            minutes.value = value;
        }
        if (modelValue.value) {
            handleTimeUpdate(modelValue.value);
        } else if (props.timePicker) {
            handleTimeUpdate(props.range ? [new Date(), new Date()] : new Date());
        }
    };

    return {
        today,
        hours,
        month,
        year,
        minutes,
        isDisabled,
        updateTime,
        setHoverDate,
        getWeekDay,
        selectDate,
        rangeActive,
        isActiveDate,
        updateMonthYear,
    };
};