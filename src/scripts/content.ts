import { PROJECT } from "../constants";

const entryRecordInTT = async (data: any) => {
    const report = { inserted: [] as string[][], failed: [] as string[][] };
    console.log("Entry in TT with true data", data);

    const modalOpened = await openModal();
    if (!modalOpened) {
        if (data.slot1) report.failed.push([data.date, "10:00-14:00", data.slot1]);
        if (data.slot2) report.failed.push([data.date, "15:00-19:00", data.slot2]);
        return report;
    }

    const activity: HTMLInputElement | null = document.querySelector("#description");
    const date: HTMLInputElement | null = document.querySelector(".edit_activity_modal-date input");
    const timeFrom: HTMLInputElement | null = document.querySelector(".time_range_picker-wrapper #from");
    const timeTo: HTMLInputElement | null = document.querySelector(".time_range_picker-wrapper #to");
    const submitBtn: HTMLButtonElement | null = document.querySelector(
        ".edit_activity_modal-footer button[type='submit']",
    );

    if (!data.project || !activity || !date || !timeFrom || !timeTo || !submitBtn) {
        console.log(activity, date, timeFrom, timeTo, submitBtn);
        console.error("One or more elements not found");
        if (data.slot1) report.failed.push([data.date, "10:00-14:00", data.slot1]);
        if (data.slot2) report.failed.push([data.date, "15:00-19:00", data.slot2]);
        return report;
    }

    const setReactInputValue = (element: Element | null, value: string) => {
        if (!element) return;

        let nativeInputValueSetter;
        if (element instanceof HTMLInputElement) {
            nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;
        } else if (element instanceof HTMLTextAreaElement) {
            nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value")?.set;
        } else if (element instanceof HTMLSelectElement) {
            nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, "value")?.set;
        }

        if (nativeInputValueSetter) {
            nativeInputValueSetter.call(element, value);
            element.dispatchEvent(new Event("input", { bubbles: true }));
            element.dispatchEvent(new Event("change", { bubbles: true }));
        } else {
            (element as HTMLElement).innerHTML = value;
        }
    };

    if (data.project) {
        const projectNativeSelect = document.querySelector(".edit_activity_modal-project-native");
        setReactInputValue(projectNativeSelect, PROJECT[data.project as keyof typeof PROJECT]);
    }
    if (data.date) setReactInputValue(date, data.date);

    // Slot 1
    if (data.slot1 && data.slot1.length > 0) {
        setReactInputValue(activity, data.slot1.join(", "));
        setReactInputValue(timeFrom, "10:00");
        setReactInputValue(timeTo, "14:00");
        await new Promise((resolve) => setTimeout(resolve, 1000));
        submitBtn.click();
        report.inserted.push([data.date, "10:00-14:00", data.slot1]);
    }

    // Delay between submissions for SPA
    return new Promise((resolve) => {
        setTimeout(async () => {
            const modalOpened = await openModal();
            if (!modalOpened) {
                if (data.slot2) report.failed.push([data.date, "15:00-19:00", data.slot2]);
                return report;
            }

            // Find elements again after first submit (if they detached)
            const newActivity: HTMLInputElement | null = document.querySelector("#description");
            const newDate: HTMLInputElement | null = document.querySelector(".edit_activity_modal-date input");
            const newTimeFrom: HTMLInputElement | null = document.querySelector(".time_range_picker-wrapper #from");
            const newTimeTo: HTMLInputElement | null = document.querySelector(".time_range_picker-wrapper #to");
            const newSubmitBtn: HTMLButtonElement | null = document.querySelector(
                ".edit_activity_modal-footer button[type='submit']",
            );

            if (
                data.project &&
                newActivity &&
                newDate &&
                newTimeFrom &&
                newTimeTo &&
                newSubmitBtn &&
                data.slot2 &&
                data.slot2.length > 0
            ) {
                if (data.project) {
                    const newProjectNativeSelect = document.querySelector(".edit_activity_modal-project-native");
                    setReactInputValue(newProjectNativeSelect, PROJECT[data.project as keyof typeof PROJECT]);
                }
                if (data.date) setReactInputValue(newDate, data.date);

                setReactInputValue(newActivity, data.slot2.join(", "));
                setReactInputValue(newTimeFrom, "15:00");
                setReactInputValue(newTimeTo, "19:00");

                await new Promise((resolve) => setTimeout(resolve, 1000));
                newSubmitBtn.click();
                report.inserted.push([data.date, "15:00-19:00", data.slot2]);
            } else if (data.slot2 && data.slot2.length > 0) {
                report.failed.push([data.date, "15:00-19:00", data.slot2]);
            }
            console.log(report);

            resolve(report);
        }, 1000);
    });
};

const openModal = async () => {
    const addBtn: HTMLButtonElement | null = document.querySelector(".bg-clip-content .base-Button-root");
    let modal: HTMLDivElement | null = document.querySelector(".edit_activity_modal");

    if (addBtn) {
        addBtn.click();
        while (!modal) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
            modal = document.querySelector(".edit_activity_modal");
        }
        return true;
    }
    return false;
};

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
    if (request.action === "fill-form") {
        entryRecordInTT(request).then((result) => {
            sendResponse(result);
        });
        return true; // Keep message channel open for async execution
    }
});
