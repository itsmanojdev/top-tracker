import { createIcons, Settings, House, TextAlignJustify } from "lucide";
import { getConfig, logStorage, setConfig } from "./utils";
import type { Config, Records } from "../types/common";
import { toastify } from "./toastify";

// Icons Config
createIcons({
    icons: {
        Settings,
        House,
        TextAlignJustify,
    },
});

// Switch tab
const switchTab = async (tab: string) => {
    document.querySelectorAll("section").forEach((s) => s.classList.add("hidden"));
    document.getElementById(tab + "-content")?.classList.remove("hidden");

    if (tab == "list") {
        const allRecords = ((await getConfig("records")).records ?? {}) as Records;
        console.log("allRecords", allRecords);
        const listContainer = document.getElementById("list-container");
        if (listContainer) {
            listContainer.innerHTML = "";
            Object.keys(allRecords).forEach((dateKey) => {
                const dayRecord = allRecords[dateKey];
                const dayRecordElement = document.createElement("div");
                dayRecordElement.innerHTML = `
                    <div class="mb-4">
                        <h5 class="mb-2">${dateKey}</h5>
                        <div class="flex gap-4">
                            <div class="flex-1">
                                <h5 class="mb-2">10:00-14:00</h5>
                                <ul class="list-disc pl-5">
                                    ${dayRecord.slot1?.map((item: string) => `<li>${item}</li>`).join("")}
                                </ul>
                            </div>
                            <div class="flex-1">
                                <h5 class="mb-2">15:00-19:00</h5>
                                <ul class="list-disc pl-5">
                                    ${dayRecord.slot2?.map((item: string) => `<li>${item}</li>`).join("")}
                                </ul>
                            </div>
                        </div>
                    </div>
                `;
                listContainer.appendChild(dayRecordElement);
            });
        }
    } else if (tab == "settings") {
        const config: Partial<Config> = (await getConfig("config")).config ?? {};
        const projectNameInput: HTMLInputElement | null = document.getElementById("project_name") as HTMLInputElement;
        if (projectNameInput) projectNameInput.value = config.project_name ?? "";
    }
};

document.getElementById("icon-home")?.addEventListener("click", () => switchTab("home"));
document.getElementById("icon-list")?.addEventListener("click", () => switchTab("list"));
document.getElementById("icon-settings")?.addEventListener("click", () => switchTab("settings"));

// Add Entry Form Submit
const addEntry = async (e: Event) => {
    e.preventDefault();
    console.log("entry form submit init");

    const formData = new FormData(e.target as HTMLFormElement);
    const timeSlot = formData.get("time-slot");
    const description = formData.get("description");
    if (!timeSlot || !description) {
        toastify("Please fill all the fields", "error");
        return;
    }

    // Get Records
    const allRecords = ((await getConfig("records")).records ?? {}) as Records;
    console.log("data mk1 ", allRecords);

    // Format Date Key
    const dateKey = new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
    });

    const todayRecords = allRecords[dateKey] ?? {};

    if (timeSlot == "10:00-14:00") {
        const slot1 = todayRecords.slot1 ?? [];
        console.log("slot 1", slot1);

        await setConfig("records", {
            ...allRecords,
            [dateKey]: {
                ...todayRecords,
                slot1: [description, ...slot1],
            },
        });
    } else if (timeSlot == "15:00-19:00") {
        const slot2 = todayRecords.slot2 ?? [];
        await setConfig("records", {
            ...allRecords,
            [dateKey]: {
                ...todayRecords,
                slot2: [description, ...slot2],
            },
        });
    }

    // Clear Input fields
    (e.target as HTMLFormElement).reset();

    // show success notification
    toastify("Record added successfully", "success");

    logStorage();
};

document.getElementById("form-add-entry")?.addEventListener("submit", async (e) => {
    await addEntry(e);
});

// Settings Form Submit
const updateSettings = async (e: Event) => {
    e.preventDefault();
    console.log("settings form");
    const formData = new FormData(e.target as HTMLFormElement);
    const projectName = formData.get("project_name");
    if (!projectName) {
        toastify("Please enter project name", "error");
        return;
    }

    const configSettings = (await getConfig("config")).config ?? {};

    await setConfig("config", { ...configSettings, project_name: projectName });
    toastify("Settings updated successfully", "success");

    logStorage();
};

document.getElementById("form-settings")?.addEventListener("submit", (e) => {
    updateSettings(e);
});

document.getElementById("btn-fill-tracker")?.addEventListener("click", () => {
    chrome.runtime.sendMessage({ action: "open_and_fill_tracker" });
});

window.onload = () => {
    const dateInput: HTMLInputElement | null = document.querySelector("#form-add-entry #date") as HTMLInputElement;
    dateInput.value = new Date().toISOString().split('T')[0];
};
