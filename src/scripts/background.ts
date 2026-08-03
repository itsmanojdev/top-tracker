import emailjs from "@emailjs/browser";

console.log("Background service worker loaded");

// EmailJS Hardcoded Config
const EMAILJS_SERVICE_ID = "service_808qiob";
const EMAILJS_TEMPLATE_ID = "template_u88irnm";
const EMAILJS_PUBLIC_KEY = "Yz2xe_qDRAi-lyZEx";
const REPORT_EMAIL_TO = "manoj.kumar@zethic.com";

// Initialization: schedule the daily alarm at 11:00 PM
chrome.runtime.onInstalled.addListener(() => {
    scheduleNextAlarm();
});

function scheduleNextAlarm() {
    const now = new Date();
    const target = new Date(now);
    target.setHours(23, 0, 0, 0); // 11:00 PM today

    // If it's already past 11:00 PM today, schedule for 11:00 PM tomorrow
    if (now.getTime() > target.getTime()) {
        target.setDate(target.getDate() + 1);
    }

    const delayInMinutes = (target.getTime() - now.getTime()) / 60000;

    // Period of 1440 minutes = 24 hours.
    chrome.alarms.create("fill-top-tracker", { delayInMinutes, periodInMinutes: 1440 });
    console.log(`Next alarm scheduled in ${delayInMinutes.toFixed(2)} minutes.`);
}

// Alarm Listener
chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === "fill-top-tracker") {
        runTopTrackerAutomation();
    }
});

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
    if (request.action === "getTabInfo") {
        chrome.tabs.query({ url: request.url }).then((tabs) => {
            sendResponse(tabs[0]);
        });
        return true; // Indicates we will respond asynchronously
    }

    if (request.action === "open_and_fill_tracker") {
        runTopTrackerAutomation();
        return true;
    }
});

async function runTopTrackerAutomation() {
    try {
        const storageData = await chrome.storage.local.get(["records", "config"]);
        const allRecords: any = storageData.records || {};
        const config: any = storageData.config || {};

        const dateKey = new Date().toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
        const todayRecords = allRecords[dateKey] || {};

        // Open TopTracker
        const tab = await chrome.tabs.create({ url: "https://tracker.toptal.com/app/my-activities" });

        // Wait for tab to finish loading
        chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
            if (tabId === tab.id && info.status === "complete") {
                chrome.tabs.onUpdated.removeListener(listener); // cleanup

                setTimeout(() => {
                    if (tab.id) {
                        chrome.tabs.sendMessage(
                            tab.id,
                            {
                                action: "fill-form",
                                project: config.project_name || "",
                                date: dateKey,
                                slot1: todayRecords.slot1 || [],
                                slot2: todayRecords.slot2 || [],
                            },
                            async (response) => {
                                await handlePostExecution(response, dateKey);
                            },
                        );
                    }
                }, 3000); // Wait for SPA to render
            }
        });
    } catch (e) {
        console.error("TopTracker Automation failed:", e);
    }
}

async function handlePostExecution(contentResponse: any, dateKey: string) {
    // 1. Data Cleanup
    const deletedList: string[] = [];
    const storageData = await chrome.storage.local.get(["records"]);
    const records: any = storageData.records || {};

    for (const key in records) {
        if (key !== dateKey) {
            deletedList.push(`${key} | 10:00-14:00 | ` + (records[key].slot1 || []).join(", "));
            deletedList.push(`${key} | 15:00-19:00 | ` + (records[key].slot2 || []).join(", "));
            delete records[key]; // Delete yesterday's data
        }
    }
    await chrome.storage.local.set({ records });
    console.log("contentResponse", contentResponse);

    const insertedText = contentResponse?.inserted?.map((arr: string[]) => arr.join(" | ")).join("\n") || "None";
    const failedText = contentResponse?.failed?.map((arr: string[]) => arr.join(" | ")).join("\n") || "None";
    const deletedText = deletedList.join("\n") || "None";

    // 2. EmailJS Report
    try {
        const templateParams = {
            to_email: REPORT_EMAIL_TO,
            date: dateKey,
            name: "its me",
            email: "manoj.kumar@zethic.com",
            inserted_records: insertedText,
            failed_records: failedText,
            deleted_records: deletedText,
        };

        console.error("MK Temp", templateParams);

        await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams, {
            publicKey: EMAILJS_PUBLIC_KEY,
        });
        console.log("Email report sent successfully via EmailJS.");
    } catch (e) {
        console.error("Failed to send EmailJS report:", e);
    }

    // 3. System Notification
    chrome.notifications.create({
        type: "basic",
        iconUrl: "/images/toptal.png",
        title: "TopTracker Automation Complete",
        message: `Inserted ${contentResponse?.inserted?.length || 0} tasks! Report emailed to ${REPORT_EMAIL_TO}.`,
    });
}
