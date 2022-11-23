import { ref, toRef, watch } from 'vue';

import { OpenPosition } from '@/interfaces';
import { unrefElement } from '@/utils/util';

import type { ComponentRef, VueEmit } from '@/interfaces';
import type { AllPropsType } from '@/utils/props';

/**
 * Extracted code from the main component, used for calculating the position of the menu
 */
export const usePosition = (menuRef: ComponentRef, inputRef: ComponentRef, emit: VueEmit, props: AllPropsType) => {
    const menuPosition = ref<{ top: string; left: string; transform: string; position?: string }>({
        top: '0',
        left: '0',
        transform: 'none',
    });
    const openOnTop = ref(false);
    const maxHeight = 390;
    const centered = toRef(props, 'teleportCenter');

    watch(centered, () => {
        setMenuPosition();
    });

    /**
     * Get correct offset of an element
     */
    const getOffset = (el: HTMLElement): { top: number; left: number } => {
        const rect = el.getBoundingClientRect();
        return {
            left: rect.left + window.scrollX,
            top: rect.top + window.scrollY,
        };
    };

    /**
     * Use alternative position calculation, for specific cases on nested relative elements
     */
    const getOffsetAlt = (el: HTMLElement): { top: number; left: number } => {
        const rect = el.getBoundingClientRect();
        let x = 0;
        let y = 0;
        while (el && !isNaN(el.offsetLeft) && !isNaN(el.offsetTop)) {
            x += el.offsetLeft - el.scrollLeft;
            y = rect.top + el.scrollTop;
            el = el.offsetParent as HTMLElement;
        }
        return { top: y, left: x };
    };

    const setPositionRight = (left: number, width: number): void => {
        menuPosition.value.left = `${left + width}px`;
        menuPosition.value.transform = `translateX(-100%)`;
    };

    const setPositionLeft = (left: number): void => {
        menuPosition.value.left = `${left}px`;
        menuPosition.value.transform = `translateX(0)`;
    };

    const setPositioning = (left: number, width: number): void => {
        if (props.position === OpenPosition.left) {
            setPositionLeft(left);
        }

        if (props.position === OpenPosition.right) {
            setPositionRight(left, width);
        }

        if (props.position === OpenPosition.center) {
            menuPosition.value.left = `${left + width / 2}px`;
            menuPosition.value.transform = `translateX(-50%)`;
        }
    };

    const setInitialPosition = () => {
        const inputEl = unrefElement(inputRef);
        if (inputEl) {
            const fullHeight = window.innerHeight;
            const { top: offset, left } = props.altPosition ? getOffsetAlt(inputEl) : getOffset(inputEl);
            const { width, top, height } = inputEl.getBoundingClientRect();
            const freeBottom = fullHeight - top - height;
            menuPosition.value.top = top > freeBottom ? `${offset - maxHeight}px` : `${offset}px`;
            setPositioning(left, width);
        }
    };

    const teleportCenter = () => {
        menuPosition.value.left = `50%`;
        menuPosition.value.top = `50%`;
        menuPosition.value.transform = `translate(-50%, -50%)`;
        menuPosition.value.position = `fixed`;
    };

    /**
     * Main call, when input is clicked, opens the menu on the first entry
     * Recalculate param is added when the menu component is mounted so that we can check the correct space
     */
    const setMenuPosition = (recalculate = true): void => {
        if (!props.inline) {
            if (centered.value) return teleportCenter();
            const el = unrefElement(inputRef);
            if (props.altPosition && typeof props.altPosition !== 'boolean') {
                menuPosition.value = props.altPosition(el);
            } else if (el) {
                const { width, height } = el.getBoundingClientRect();
                const { top: offset, left } = props.altPosition ? getOffsetAlt(el) : getOffset(el);
                menuPosition.value.top = `${height + offset + +props.offset}px`;
                setPositioning(left, width);
                // todo - rewrite
                if (recalculate && props.autoPosition) {
                    recalculatePosition();
                }
            }
        }
    };

    const positionTopBottom = (
        height: number,
        inputHeight: number,
        freeSpaceBottom: number,
        top: number,
        offset: number,
    ) => {
        const menuHeight = height + inputHeight;
        if (menuHeight > top && menuHeight > freeSpaceBottom) {
            if (top < freeSpaceBottom) {
                setMenuPosition(false);
                openOnTop.value = false;
            } else {
                menuPosition.value.top = `${offset - height - +props.offset}px`;
                openOnTop.value = true;
            }
        } else {
            if (menuHeight > freeSpaceBottom) {
                menuPosition.value.top = `${offset - height - +props.offset}px`;
                openOnTop.value = true;
            } else {
                setMenuPosition(false);
                openOnTop.value = false;
            }
        }
    };
    /**
     * When the menu is mounted, it calls position check again, and checks if there is a free space on top or bottom
     * of the input field to place the menu
     */
    const recalculatePosition = (): void => {
        const el = unrefElement(inputRef);

        if (el && props.autoPosition && !props.inline) {
            const { height: inputHeight, top, width } = el.getBoundingClientRect();
            const { top: offset, left: inputLeft } = props.altPosition ? getOffsetAlt(el) : getOffset(el);
            const fullHeight = window.innerHeight;
            const freeSpaceBottom = fullHeight - top - inputHeight;

            const menuEl = unrefElement(menuRef);
            if (menuEl) {
                const { height, left, right } = menuEl.getBoundingClientRect();
                positionTopBottom(height, inputHeight, freeSpaceBottom, top, offset);

                if (left < 0) {
                    setPositionLeft(inputLeft);
                } else if (right > document.documentElement.clientWidth) {
                    setPositionRight(inputLeft, width);
                }
            }
        }
        emit('recalculate-position');
    };

    return { openOnTop, menuPosition, setMenuPosition, setInitialPosition, recalculatePosition };
};
